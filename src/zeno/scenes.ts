// Os roteiros do Zeno, os mesmos do laboratório: cada cena é uma função curta que espera em tempo de cena e pode
// ser interrompida por uma cena nova (a espera rejeita com Cancel). A fala só mexe a boca: o texto fica no balão
// de quem conduz. As coisinhas à toa (IDLE) rodam sozinhas entre uma cena e outra, para ele nunca ficar encarando.
import * as THREE from 'three';
import { L, NEAR, R, type Hand } from './character';
import { BOOP_LINES, ZENO_LINES } from './lines';
import type { Side, Spot } from './place';
import { clamp, easeIn, easeInOut, easeOut, FACE, lerp, rand, REST, type ParamName, type Pose } from './springs';
import type { Look, Run, ZenoRuntime } from './zeno3d';
import type { ZenoScene } from './types';

export const CAMERA: Look = { type: 'camera' };
export const NONE: Look = { type: 'none' };

const k = (s: Hand, n: string) => (n + (s > 0 ? 'L' : 'R')) as ParamName;

export function armPose(s: Hand, a: number, gOut: number, ex = -0.2, ezOut = 0, f = 0): Pose {
  return { [k(s, 'a')]: a, [k(s, 'g')]: gOut * s, [k(s, 'ex')]: ex, [k(s, 'ez')]: ezOut * s, [k(s, 'f')]: f };
}
export const restArms = (): Pose => ({
  ...armPose(L, REST.aL, REST.gL, REST.exL),
  ...armPose(R, REST.aR, -REST.gR, REST.exR),
});
export const sitArms = (): Pose => ({ ...armPose(L, -0.5, 0.22, -0.55), ...armPose(R, -0.5, 0.22, -0.55) });

const seatedNow = (z: ZenoRuntime) => z.P.sit.t > 0.5;
const restNow = (z: ZenoRuntime): Pose => (seatedNow(z) ? { ...REST, sit: 1, ...sitArms() } : { ...REST });

/* ---------- braços: apontar e alcançar ---------- */
function aimDir(d: THREE.Vector3): { a: number; g: number } {
  d.normalize();
  let a = Math.atan2(-d.z, -d.y);
  if (a > 0.6) a -= Math.PI * 2;
  return { a, g: Math.asin(clamp(d.x, -1, 1)) };
}
const aimLocal = (s: Hand, x: number, y: number, z: number) =>
  aimDir(new THREE.Vector3(x - s * 0.36, y - 0.62, z - 0.12));

/* alcançar um ponto do corpo com a mão: ombro e cotovelo achados por busca, com o cotovelo dobrando só para a frente */
const _ik = {
  q1: new THREE.Quaternion(),
  q2: new THREE.Quaternion(),
  e: new THREE.Euler(),
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  h: new THREE.Vector3(),
};
function handAt(s: Hand, a: number, g: number, ex: number): THREE.Vector3 {
  _ik.q1.setFromEuler(_ik.e.set(a, 0, g, 'XZY'));
  _ik.q2.setFromEuler(_ik.e.set(ex, 0, 0, 'XZY'));
  _ik.a.set(0, -0.21, 0).applyQuaternion(_ik.q1);
  _ik.b.set(0, -0.2, 0).applyQuaternion(_ik.q2).applyQuaternion(_ik.q1);
  return _ik.h
    .set(s * 0.36, 0.62, 0.12)
    .add(_ik.a)
    .add(_ik.b);
}
export function reach(s: Hand, x: number, y: number, z: number): Pose {
  const T = new THREE.Vector3(x, y, z);
  const K = s > 0 ? 'L' : 'R';
  let { a, g } = aimLocal(s, x, y, z);
  let ex = -0.6;
  let step = 0.3;
  const err = (a2: number, g2: number, e2: number) => handAt(s, a2, g2, e2).distanceTo(T);
  let best = err(a, g, ex);
  for (let i = 0; i < 120 && step > 0.004; i++) {
    let moved = false;
    for (const [da, dg, de] of [
      [step, 0, 0],
      [-step, 0, 0],
      [0, step, 0],
      [0, -step, 0],
      [0, 0, step],
      [0, 0, -step],
    ]) {
      const e2 = clamp(ex + de, -2.2, 0);
      const v = err(a + da, g + dg, e2);
      if (v < best) {
        best = v;
        a += da;
        g += dg;
        ex = e2;
        moved = true;
      }
    }
    if (!moved) step /= 2;
  }
  return { [`a${K}`]: a, [`g${K}`]: g, [`ex${K}`]: ex, [`ez${K}`]: 0 } as Pose;
}
function aimWorld(z: ZenoRuntime, s: Hand, T: THREE.Vector3): { a: number; g: number } {
  z.rig.zeno.updateMatrixWorld(true);
  const S = z.rig.arms[s].sh.getWorldPosition(new THREE.Vector3());
  return aimDir(T.clone().sub(S).applyQuaternion(z.rig.body.getWorldQuaternion(new THREE.Quaternion()).invert()));
}

/* ---------- andar ---------- */
/** Velocidade do passo entre dois lugares (unidades por segundo): a mesma da entrada do laboratório. */
const WALK_SPEED = 1.4;

/** Entra andando pela borda do lado do lugar (o lugar já está marcado em z.spot). */
export async function walkIn(z: ZenoRuntime, run: Run, side: Side = z.spot.side, ms = 2000): Promise<void> {
  z.showUp();
  z.sleeping = null;
  z.resetEyes();
  if (z.reduced()) {
    z.snapAll({ ...REST, rootX: 0, rootY: 0, walk: 0, glideX: 0, glideY: 0 });
    z.lookAt(CAMERA, 0, false);
    await z.fadeStage(true);
    return;
  }
  const from = z.offset(side);
  z.snapAll({
    ...REST,
    rootX: from,
    rootY: 0,
    glideX: 0,
    glideY: 0,
    rootYaw: side === 'left' ? Math.PI / 2 : -Math.PI / 2,
    walk: 1,
  });
  z.lookAt(NONE);
  z.tween('rootX', (u) => from * (1 - easeOut(u)), ms);
  await run.wait(ms - 250);
  z.set({ walk: 0 }, 'calma');
  await run.wait(200);
  z.set({ rootYaw: FACE }, 'toque');
  z.lookAt(CAMERA);
  await run.wait(320);
}

/** Sai andando pela borda de um lado. Com hide (o padrão), sai de cena no fim. */
export async function walkOut(z: ZenoRuntime, run: Run, side: Side = z.spot.side, ms = 1900, hide = true) {
  z.lookAt(NONE);
  if (z.reduced()) {
    if (hide) {
      await z.fadeStage(false);
      z.hideAway();
    }
    return;
  }
  z.set({ rootYaw: side === 'left' ? -Math.PI / 2 : Math.PI / 2 }, 'calma');
  await run.wait(260);
  z.set({ walk: 1 }, 'calma');
  const from = z.P.rootX.v;
  const to = z.offset(side);
  z.tween('rootX', (u) => from + (to - from) * easeIn(u), ms);
  await run.wait(ms);
  if (hide) z.hideAway();
}

/** Anda até outro lugar. Na mesma fileira, atravessa a tela; noutra, sai pela borda e entra na fileira nova. */
export async function walkTo(z: ZenoRuntime, run: Run, spot: Spot): Promise<void> {
  if (z.reduced()) {
    z.crossfade();
    z.setHome(spot);
    z.snapAll({ rootX: 0, glideX: 0, glideY: 0, walk: 0 });
    return;
  }
  if (spot.row !== z.spot.row) {
    await walkOut(z, run, spot.side, 1200, false);
    z.setHome(spot);
    await walkIn(z, run, spot.side, 1300);
    return;
  }
  const target = z.spotWorld(spot);
  const dx = target.x - (z.home.x + z.P.rootX.v + z.P.glideX.v);
  if (Math.abs(dx) < 0.03) {
    z.setHome(spot, true);
    return;
  }
  z.lookAt(NONE);
  z.set({ rootYaw: dx > 0 ? Math.PI / 2 : -Math.PI / 2 }, 'calma');
  await run.wait(260);
  z.set({ walk: 1 }, 'calma');
  const from = z.P.rootX.v;
  const to = from + dx;
  const ms = clamp((Math.abs(dx) / WALK_SPEED) * 1000, 700, 2400);
  z.tween('rootX', (u) => lerp(from, to, easeInOut(u)), ms);
  await run.wait(ms - 250);
  z.set({ walk: 0 }, 'calma');
  await run.wait(250);
  z.setHome(spot, true);
  z.set({ rootYaw: FACE }, 'toque');
  z.lookAt(CAMERA);
  await run.wait(320);
}

/* ---------- gestos ---------- */
export async function sitDown(z: ZenoRuntime, run: Run): Promise<void> {
  z.set({ squash: 0.07 }, 'rapido');
  z.set({ sit: 1, ...sitArms() }, 'leve');
  await run.wait(380);
  z.set({ squash: 0 }, 'toque');
  await run.wait(120);
}

/** Volta ao normal de onde estiver (deitado, recolhido, de touca, sentado). Com { sit: true }, termina sentado. */
export async function standUp(z: ZenoRuntime, run: Run, o: { sit?: boolean } = {}): Promise<void> {
  const P = z.P;
  if (!z.present) {
    await walkIn(z, run);
    if (o.sit) await sitDown(z, run);
    return;
  }
  const seated = P.sit.t > 0.5;
  const down = !!z.sleeping || P.limbs.t < 0.99 || P.cap.t > 0.01 || P.book.t > 0.01 || P.flip.t > 0.01;
  z.popSnot();
  z.sleeping = null;
  z.eyesTo('open');
  z.lookAt(CAMERA);
  const keep = !!o.sit && seated && !down;
  if (down) {
    z.set({ cap: 0, book: 0, eyeOpen: 1, gazeX: 0, gazeY: 0, flip: 0 }, 'calma');
    z.set({ limbs: 1, hipsY: 0, neck: 0.2, headPitch: 0, headRoll: 0, ...restArms() }, 'toque');
    await run.wait(280);
  }
  z.set(keep ? { ...REST, sit: 1, ...sitArms() } : { ...REST }, 'calma');
  if (down || (seated && !keep)) await run.wait(260);
  if (o.sit && !keep) await sitDown(z, run);
}

export async function hop(z: ZenoRuntime, run: Run, h = 0.22, ms = 360): Promise<void> {
  if (z.reduced()) return;
  z.set({ squash: 0.13 }, 'rapido');
  await run.wait(80);
  z.set({ squash: -0.08 }, 'rapido');
  z.tween('rootY', (u) => h * 4 * u * (1 - u), ms);
  await run.wait(ms - 30);
  z.set({ squash: 0.1 }, 'rapido');
  await run.wait(90);
  z.set({ squash: 0 }, 'toque');
}

export async function nod(z: ZenoRuntime, run: Run, times = 1, amp = 0.2, spring: 'toque' | 'leve' = 'toque') {
  for (let i = 0; i < times; i++) {
    z.set({ headPitch: amp }, spring);
    await run.wait(spring === 'leve' ? 260 : 170);
    z.set({ headPitch: 0 }, spring);
    await run.wait(spring === 'leve' ? 280 : 190);
  }
}

export async function wave(z: ZenoRuntime, run: Run, text: string | null = null, s: Hand = NEAR, times = 3) {
  z.lookAt(CAMERA);
  z.set({ ...armPose(s, -2.75, 0.5, -0.3), bodyTilt: s * 0.06, headRoll: -s * 0.1 }, 'toque');
  if (text) z.say(text);
  await run.wait(220);
  if (z.reduced()) await run.wait(1000);
  else
    for (let i = 0; i < times; i++) {
      z.set({ [k(s, 'ez')]: s * 0.55 }, 'rapido');
      await run.wait(170);
      z.set({ [k(s, 'ez')]: -s * 0.25 }, 'rapido');
      await run.wait(170);
    }
  z.set({ ...restArms(), bodyTilt: 0, headRoll: 0 }, 'calma');
}

/**
 * Olha e aponta para um ponto do mundo. armed avisa quando o braço chegou; depois ele volta a olhar para quem vê,
 * sem baixar o braço (quem baixa é rest()).
 */
export async function pointAt(z: ZenoRuntime, run: Run, T: THREE.Vector3, armed?: () => void): Promise<void> {
  z.lookAt({ type: 'point', v: T });
  z.set({ rootYaw: FACE + 0.1, bodyLean: 0.04 }, 'calma');
  await run.wait(300);
  const side: Hand =
    T.clone()
      .sub(z.rig.zeno.position)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), -z.P.rootYaw.v).x >= 0
      ? L
      : R;
  const { a, g } = aimWorld(z, side, T);
  z.set(
    {
      [k(side, 'a')]: a,
      [k(side, 'g')]: g,
      [k(side, 'ex')]: 0,
      [k(side, 'ez')]: 0,
      [k(side, 'f')]: 1,
      bodyTilt: side * 0.05,
    },
    'toque',
  );
  z.hold = { v: T.clone() };
  await run.wait(400);
  armed?.();
  await run.wait(600);
  z.lookAt(CAMERA);
}

export function lowerArms(z: ZenoRuntime): void {
  z.hold = null;
  z.set({ ...(seatedNow(z) ? sitArms() : restArms()), bodyLean: 0, bodyTilt: 0, rootYaw: FACE }, 'calma');
}

export async function cheer(z: ZenoRuntime, run: Run, text: string | null = null): Promise<void> {
  z.eyesTo('happy');
  if (text) z.say(text);
  await nod(z, run, 1, 0.2);
  await run.wait(500);
  z.eyesTo('open');
}

async function thanks(z: ZenoRuntime, run: Run, text: string | null): Promise<void> {
  if (text) z.say(text);
  z.eyesTo('happy');
  await nod(z, run, 2, 0.16, 'leve');
  await run.wait(500);
  z.eyesTo('open');
}

/** Pulinho e aceno pequeno: o degrau médio da escada de celebração (dia fechado). */
export async function dayClosed(z: ZenoRuntime, run: Run, text: string | null): Promise<void> {
  await standUp(z, run);
  z.eyesTo('happy');
  if (text) z.say(text);
  await hop(z, run, 0.16, 330);
  z.set({ ...armPose(NEAR, -2.2, 0.75, -0.5) }, 'toque');
  await run.wait(200);
  if (!z.reduced())
    for (let i = 0; i < 2; i++) {
      z.set({ [k(NEAR, 'ez')]: NEAR * 0.45 }, 'rapido');
      await run.wait(170);
      z.set({ [k(NEAR, 'ez')]: -NEAR * 0.2 }, 'rapido');
      await run.wait(170);
    }
  else await run.wait(700);
  z.set({ ...restArms() }, 'calma');
  await run.wait(400);
  z.eyesTo('open');
}

/** Dá as costas para mostrar as placas do casco e olha por cima do ombro. */
export async function showShell(z: ZenoRuntime, run: Run, text: string | null): Promise<void> {
  await standUp(z, run);
  z.set({ rootYaw: FACE + 1.9 }, 'leve');
  await run.wait(380);
  if (text) z.say(text);
  await run.wait(1700);
  z.set({ rootYaw: FACE }, 'leve');
  await run.wait(250);
  await cheer(z, run, null);
}

/* ---------- as cenas prontas (os momentos ao longo do uso) ---------- */
type Scene = (z: ZenoRuntime, run: Run) => Promise<void>;
const line = (id: ZenoScene) => ZENO_LINES[id];

export const SCENES: Record<ZenoScene, Scene> = {
  async acenar(z, run) {
    await standUp(z, run);
    await wave(z, run, line('acenar'));
  },
  casco: (z, run) => showShell(z, run, line('casco')),
  async checkin(z, run) {
    await standUp(z, run, { sit: true }); // senta para conversar
    z.set({ headRoll: -0.16, rootYaw: FACE - 0.1 }, 'leve');
    z.say(line('checkin')!);
    await run.wait(1200);
  },
  async obrigado(z, run) {
    if (z.sleeping) await standUp(z, run);
    z.set({ headRoll: 0, rootYaw: FACE }, 'calma');
    await thanks(z, run, line('obrigado'));
  },
  dia: (z, run) => dayClosed(z, run, line('dia')),
  async fase(z, run) {
    await standUp(z, run);
    z.eyesTo('happy');
    z.say(line('fase')!);
    const up = { ...armPose(L, -2.95, 0.35, -0.1), ...armPose(R, -2.95, 0.35, -0.1) };
    z.set(up, 'festa');
    await run.wait(260);
    if (z.reduced()) {
      await run.wait(1600);
      z.set({ ...restArms() }, 'calma');
      z.eyesTo('open');
      return;
    }
    const P = z.P;
    // pula e cai de costas, com o casco no chão
    z.lookAt(NONE);
    z.set({ squash: 0.14 }, 'rapido');
    await run.wait(90);
    z.set({ squash: -0.06, ...armPose(L, -1.6, 0.9, -0.4), ...armPose(R, -1.6, 0.9, -0.4) }, 'toque');
    z.tween('rootY', (u) => 0.42 * 4 * u * (1 - u), 480);
    z.tween('flip', (u) => easeInOut(u), 480);
    await run.wait(470);
    z.set({ squash: 0.12 }, 'rapido');
    await run.wait(100);
    z.set({ squash: 0 }, 'toque');
    // gira no casco, esperneando
    const y0 = P.rootYaw.v;
    z.tween('rootYaw', (u) => y0 + Math.PI * 4 * easeInOut(u), 1800);
    for (let i = 0; i < 5; i++) {
      z.set({ legL: -0.7, legR: 0.3, ezL: 0.5, ezR: -0.5 }, 'rapido');
      await run.wait(170);
      z.set({ legL: 0.3, legR: -0.7, ezL: -0.5, ezR: 0.5 }, 'rapido');
      await run.wait(170);
    }
    await run.wait(120);
    P.rootYaw.v -= Math.PI * 4;
    P.rootYaw.t -= Math.PI * 4;
    // levanta num pulo e fecha de braços para cima
    z.set({ legL: 0, legR: 0, ezL: 0, ezR: 0 }, 'calma');
    z.tween('rootY', (u) => 0.45 * 4 * u * (1 - u), 500);
    z.tween('flip', (u) => 1 - easeInOut(u), 500);
    await run.wait(490);
    z.set({ squash: 0.13 }, 'rapido');
    await run.wait(100);
    z.set({ squash: 0, ...up }, 'festa');
    z.lookAt(CAMERA);
    await run.wait(700);
    z.set({ ...restArms() }, 'calma');
    await run.wait(500);
    z.eyesTo('open');
  },
  async pausa(z, run) {
    if (!z.present) await walkIn(z, run);
    else if (z.sleeping || z.P.sit.t > 0.5 || z.P.flip.t > 0.01) await standUp(z, run);
    z.say(line('pausa')!);
    await run.wait(900);
    z.eyesTo('sleep');
    z.lookAt(NONE);
    z.sleeping = 'pausa';
    z.set(
      { ...restArms(), limbs: 0, neck: -1, hipsY: -0.28, headPitch: 0.12, rootYaw: FACE - 0.15, bodyLean: 0 },
      'lento',
    );
  },
  async noite(z, run) {
    await standUp(z, run);
    // perto do horário de telas desligadas da pessoa (Ajustes › Horários; 21h no plano base)
    z.say(line('noite')!);
    await run.wait(1200);
    z.set({ cap: 1 }, 'festa');
    await run.wait(600);
    z.lookAt(NONE);
    z.eyesTo('sleep');
    z.set(
      {
        ...armPose(L, -2.9, 0.5, -0.1),
        ...armPose(R, -2.9, 0.5, -0.1),
        bodyLean: -0.08,
        headPitch: -0.22,
        squash: -0.05,
        mouth: 0.9,
      },
      'lento',
    );
    await run.wait(1150);
    z.set({ mouth: 0, squash: 0, bodyLean: 0, headPitch: 0, ...restArms() }, 'leve');
    z.eyesTo('open');
    z.set({ eyeOpen: 0.55 }, 'lento');
    z.lookAt(CAMERA);
    await run.wait(300);
    await sitDown(z, run); // senta para ler
    z.set({ book: 1 }, 'leve');
    z.set({ ...reach(L, 0.16, 0.5, 0.48), ...reach(R, -0.16, 0.5, 0.48) }, 'calma');
    z.lookAt(NONE);
    z.set({ headPitch: 0.3, gazeY: -0.7 }, 'lento');
    z.sleeping = 'noite';
    await run.wait(3400);
    z.eyesTo('sleep');
    z.set({ headPitch: 0.46, headRoll: 0.1, bodyLean: 0.04, gazeY: 0, eyeOpen: 1 }, 'lento');
  },
  async cochilo(z, run) {
    if (z.sleeping) return;
    if (!seatedNow(z)) await sitDown(z, run);
    z.lookAt(NONE);
    z.set({ eyeOpen: 0.5 }, 'lento');
    await run.wait(1200);
    z.set({ headPitch: 0.3 }, 'lento'); // cabeceia...
    await run.wait(900);
    z.set({ headPitch: 0.05, eyeOpen: 0.8 }, 'toque'); // ...acorda um pouco...
    await run.wait(700);
    z.set({ headPitch: 0.36, headRoll: 0.08, eyeOpen: 1 }, 'lento'); // ...e dorme
    z.eyesTo('sleep');
    z.sleeping = 'tedio';
  },
  async acordar(z, run) {
    // acorda do cochilo com um susto pequeno; a bolha estoura no standUp
    await standUp(z, run);
    z.set({ squash: -0.08, eyeOpen: 1.2 }, 'rapido');
    await run.wait(140);
    z.set({ squash: 0 }, 'toque');
    z.say(line('acordar')!);
    await run.wait(500);
    z.set({ eyeOpen: 1 }, 'calma');
    z.eyesTo('happy');
    await run.wait(500);
    z.eyesTo('open');
  },
  async sair(z, run) {
    await standUp(z, run);
    await wave(z, run, line('sair'));
    await run.wait(500);
    await walkOut(z, run);
  },
};

/** Tocaram nele: um "oi". Dormindo na pausa ou à noite, a bolha estoura, ele se mexe e volta a dormir. */
export async function boop(z: ZenoRuntime, run: Run, text: string | null): Promise<void> {
  if (z.sleeping) {
    z.popSnot();
    z.set({ headRoll: 0.16 }, 'toque');
    await run.wait(200);
    z.set({ headRoll: z.sleeping === 'noite' ? 0.1 : 0 }, 'leve');
    return;
  }
  z.eyesTo('happy');
  if (text) z.say(text);
  z.set({ squash: 0.12 }, 'rapido');
  await run.wait(110);
  z.set({ squash: 0, headRoll: 0.12 }, 'toque');
  await run.wait(220);
  z.set({ headRoll: -0.08 }, 'toque');
  await run.wait(200);
  z.set({ headRoll: 0 }, 'calma');
  await run.wait(400);
  z.eyesTo('open');
}

export const pickBoopLine = () => BOOP_LINES[Math.floor(Math.random() * BOOP_LINES.length)];

/* ---------- à toa: coisinhas calmas enquanto ele espera, para nunca ficar encarando ---------- */
export const IDLE = {
  async olhar(z: ZenoRuntime, run: Run) {
    z.lookAt(z.glance());
    z.set({ rootYaw: FACE + rand(-0.15, 0.12) }, 'leve');
    await run.wait(rand(1300, 2100));
    z.lookAt(z.glance());
    await run.wait(rand(900, 1600));
    z.set({ rootYaw: FACE }, 'leve');
  },
  async cachecol(z: ZenoRuntime, run: Run) {
    // pega a ponta do cachecol e dá dois puxõezinhos
    const s = NEAR;
    const hold = reach(s, -0.13, 0.72, 0.36);
    const tug = reach(s, -0.14, 0.64, 0.38);
    z.lookAt(NONE);
    z.set({ ...hold, headPitch: 0.22, gazeY: -0.6, gazeX: -0.3 }, 'calma');
    await run.wait(420);
    for (let i = 0; i < 2; i++) {
      z.set({ squash: 0.05, ...tug }, 'rapido');
      await run.wait(150);
      z.set({ squash: 0, ...hold }, 'rapido');
      await run.wait(170);
    }
    z.set({ ...restNow(z) }, 'calma');
    z.lookAt(CAMERA);
    z.eyesTo('happy');
    await run.wait(600);
    z.eyesTo('open');
  },
  async cocar(z: ZenoRuntime, run: Run) {
    // os braços são curtos: ele coça a bochecha, olhando para cima, pensativo
    const s = NEAR;
    const up = reach(s, -0.4, 1.0, 0.16);
    const down = reach(s, -0.4, 0.95, 0.18);
    z.lookAt(NONE);
    z.set({ ...up, headRoll: -s * 0.12, gazeY: 0.6, gazeX: 0.3 }, 'calma');
    await run.wait(380);
    for (let i = 0; i < 3; i++) {
      z.set({ ...down }, 'rapido');
      await run.wait(120);
      z.set({ ...up }, 'rapido');
      await run.wait(120);
    }
    await run.wait(300);
    z.set({ ...restNow(z) }, 'calma');
    z.lookAt(z.glance());
  },
  async cantarolar(z: ZenoRuntime, run: Run) {
    z.eyesTo('happy');
    z.lookAt(NONE);
    for (let i = 0; i < 4; i++) {
      z.set({ headRoll: (i % 2 ? -1 : 1) * 0.12, bodyTilt: (i % 2 ? 1 : -1) * 0.04 }, 'leve');
      if (i === 0 || i === 2) z.note();
      await run.wait(440);
    }
    z.set({ headRoll: 0, bodyTilt: 0 }, 'leve');
    await run.wait(300);
    z.eyesTo('open');
    z.lookAt(z.glance());
  },
  async casco(z: ZenoRuntime, run: Run) {
    z.set({ rootYaw: FACE + 0.75 }, 'leve');
    z.lookAt({ type: 'point', v: z.rig.shell.localToWorld(new THREE.Vector3(0, 0.3, -1.2)) });
    await run.wait(1300);
    z.set({ rootYaw: FACE }, 'leve');
    z.lookAt(CAMERA);
    await run.wait(400);
  },
  async pedrinha(z: ZenoRuntime, run: Run) {
    // apoia no outro pé, balança a perna para trás e chuta uma pedrinha imaginária
    const s = NEAR;
    z.lookAt({ type: 'point', v: z.groundAt(z.headTop().x + 30) });
    z.set({ bodyTilt: s * 0.06 }, 'calma');
    await run.wait(300);
    z.set({ [k(s, 'leg')]: 0.5 }, 'calma');
    await run.wait(260);
    z.set({ [k(s, 'leg')]: -0.75 }, 'rapido');
    await run.wait(180);
    z.lookAt({ type: 'point', v: z.groundAt(z.W * 0.85) });
    z.set({ [k(s, 'leg')]: 0, bodyTilt: 0 }, 'calma');
    await run.wait(1100);
    z.lookAt(CAMERA);
  },
  async espreguicar(z: ZenoRuntime, run: Run) {
    z.eyesTo('sleep');
    z.lookAt(NONE);
    z.set(
      {
        ...armPose(L, -2.9, 0.45, -0.1),
        ...armPose(R, -2.9, 0.45, -0.1),
        bodyLean: -0.07,
        squash: -0.04,
        headPitch: -0.15,
      },
      'leve',
    );
    await run.wait(900);
    z.set({ ...restNow(z), squash: 0 }, 'leve');
    await run.wait(300);
    z.eyesTo('open');
    z.lookAt(CAMERA);
  },
  async sentar(z: ZenoRuntime, run: Run) {
    await sitDown(z, run);
    await IDLE.olhar(z, run);
    await run.wait(rand(1500, 3000));
    await IDLE.olhar(z, run);
    z.set({ ...REST }, 'leve'); // o laboratório pede squash -0.05, mas o REST vem depois e vale 0
    await run.wait(250);
    z.set({ squash: 0 }, 'toque');
  },
  async tedio(z: ZenoRuntime, run: Run) {
    // muito tempo sem ninguém: senta e fica
    await sitDown(z, run);
    z.lookAt(z.glance());
  },
} as const;

export type IdleName = keyof typeof IDLE;

/** O peso de cada coisinha no sorteio (nunca a mesma duas vezes seguidas). */
export const IDLE_WEIGHTS: Partial<Record<IdleName, number>> = {
  olhar: 3,
  cachecol: 2,
  cocar: 1.4,
  cantarolar: 2,
  casco: 1.5,
  pedrinha: 1.4,
  espreguicar: 0.8,
  sentar: 1,
};
/** As que só fazem sentido em pé. */
export const ONLY_STANDING = new Set<IdleName>(['pedrinha', 'sentar']);

/** Sorteia a próxima coisinha à toa. */
export function pickIdle(last: string, seated: boolean): IdleName {
  const opts = (Object.keys(IDLE_WEIGHTS) as IdleName[]).filter((n) => n !== last && !(seated && ONLY_STANDING.has(n)));
  let r = Math.random() * opts.reduce((a, n) => a + (IDLE_WEIGHTS[n] ?? 0), 0);
  return opts.find((o) => (r -= IDLE_WEIGHTS[o] ?? 0) <= 0) ?? opts[0];
}

export { seatedNow };

// O boneco do Zeno, montado em código a partir de esferas, cápsulas e cones (o mesmo do laboratório).
// Estilo argila: sombreamento suave, sem contorno. As texturas do casco, da barriga e do cachecol são desenhadas
// em canvas na hora. Cabeça, olhos e braços são peças separadas: olhar e apontar viram conta.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  cssColor,
  oklchLinear,
  plateEdge,
  SHELL_ROWS,
  shellPlates,
  ZENO_COLORS,
  type Oklch,
  type ZenoColor,
} from './color';
import { clamp } from './springs';

/** Lado do Zeno: esquerdo em +x, direito em −x. */
export type Hand = 1 | -1;
export const L: Hand = 1;
export const R: Hand = -1;
/** o braço do lado da câmera */
export const NEAR: Hand = R;

/** O centro do casco: virar de costas no chão gira em torno dele. */
export const SHELL_C = new THREE.Vector3(0, 0.78, -0.1);
/** Para onde a bolha de dormir cresce, a partir da narina do lado da câmera. */
export const SNOT_DIR = new THREE.Vector3(-0.45, -0.2, 0.87).normalize();

export function setColor(color: THREE.Color, c: Oklch): THREE.Color {
  const [r, g, b] = oklchLinear(c);
  return color.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
}

type Vec3 = [number, number, number];

interface PaintOpts {
  map?: THREE.Texture | null;
  /** sem luz: olhos, boca, bochechas */
  flat?: boolean;
  /** a sombra no chão */
  shadow?: boolean;
  /** a bolha de dormir */
  glass?: boolean;
}

function makeMat(color: ZenoColor, o: PaintOpts): THREE.Material {
  let m: THREE.MeshBasicMaterial | THREE.MeshLambertMaterial;
  if (o.shadow)
    m = new THREE.MeshBasicMaterial({ map: o.map ?? null, transparent: true, depthWrite: false, opacity: 0.2 });
  else if (o.glass) m = new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.45, depthWrite: false });
  else if (o.flat) m = new THREE.MeshBasicMaterial({ map: o.map ?? null });
  else m = new THREE.MeshLambertMaterial({ map: o.map ?? null });
  if (o.map && !o.shadow) m.color.setRGB(1, 1, 1);
  else setColor(m.color, ZENO_COLORS[color]);
  return m;
}

/* ---------- texturas desenhadas em canvas ---------- */
function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function canvasTex(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const ctx2d = (c: HTMLCanvasElement) => c.getContext('2d') as CanvasRenderingContext2D;

/** O casco: as placas de cima nas cores dos pilares, a margem embaixo. */
export function paintShell(cv: HTMLCanvasElement, cols: readonly Oklch[]): void {
  const g = ctx2d(cv);
  const W = cv.width;
  const H = cv.height;
  const gap = 9;
  const plates = shellPlates(cols);
  g.globalAlpha = 1;
  g.fillStyle = cssColor(ZENO_COLORS.casco);
  g.fillRect(0, 0, W, H);
  SHELL_ROWS.forEach((row, ri) => {
    const y0 = (row.t0 / 180) * H;
    const y1 = (row.t1 / 180) * H;
    const w = ((row.u1 - row.u0) * W) / row.n;
    for (let i = 0; i < row.n; i++) {
      const x = row.u0 * W + i * w;
      const c = plates[ri][i];
      rr(g, x + gap / 2, y0 + gap / 2, w - gap, y1 - y0 - gap, 20);
      g.fillStyle = cssColor(c);
      g.fill();
      if (!row.margin) {
        rr(g, x + gap / 2 + 15, y0 + gap / 2 + 13, w - gap - 30, y1 - y0 - gap - 26, 12);
        g.lineWidth = 5;
        g.strokeStyle = cssColor(plateEdge(c));
        g.stroke();
      }
    }
  });
}

function bellyTex(): THREE.CanvasTexture {
  const c = makeCanvas(512, 256);
  const g = ctx2d(c);
  g.fillStyle = cssColor(ZENO_COLORS.barriga);
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = cssColor(ZENO_COLORS.linhaBarriga);
  g.lineWidth = 4;
  g.lineCap = 'round';
  const y = (t: number) => (t / 180) * 256;
  const x = (u: number) => u * 512;
  for (const t of [64, 90, 116, 140]) {
    g.beginPath();
    g.moveTo(x(0.175), y(t));
    g.lineTo(x(0.325), y(t));
    g.stroke();
  }
  g.beginPath();
  g.moveTo(x(0.25), y(44));
  g.lineTo(x(0.25), y(156));
  g.stroke();
  return canvasTex(c);
}

function stripeTex(): THREE.CanvasTexture {
  const c = makeCanvas(64, 8);
  const g = ctx2d(c);
  g.fillStyle = cssColor(ZENO_COLORS.cachecol);
  g.fillRect(0, 0, 64, 8);
  g.fillStyle = cssColor(ZENO_COLORS.cachecolListra);
  g.fillRect(40, 0, 24, 8);
  const t = canvasTex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(7, 1);
  return t;
}

function shadowTex(): THREE.CanvasTexture {
  const c = makeCanvas(128, 128);
  const g = ctx2d(c);
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.55, 'rgba(255,255,255,.55)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ---------- pontas que balançam: um pêndulo amortecido puxado pela aceleração ---------- */
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();

interface DangleOpts {
  /** o balanço é no espaço do mundo (as pontas do cachecol caem para baixo) ou no do pai (a ponta da touca) */
  world: boolean;
  restX: number;
  restZ: number;
  k: number;
  c: number;
  gain: number;
  maxBack?: number;
}

export class Dangle {
  ax = 0;
  az = 0;
  vx = 0;
  vz = 0;
  private p: THREE.Vector3 | null = null;
  private vel = new THREE.Vector3();
  private acc = new THREE.Vector3();
  private readonly o: Required<DangleOpts>;

  constructor(
    readonly obj: THREE.Object3D,
    o: DangleOpts,
  ) {
    this.o = { maxBack: 9, ...o };
  }

  reset(): void {
    this.ax = this.az = this.vx = this.vz = 0;
    this.p = null;
    this.vel.set(0, 0, 0);
    this.acc.set(0, 0, 0);
  }

  step(dt: number, yaw: number, still: boolean, fix = 0): void {
    const o = this.o;
    const p = this.obj.getWorldPosition(_v);
    if (!this.p) this.p = p.clone();
    if (dt > 0) {
      const vel = _v2.copy(p).sub(this.p).divideScalar(dt);
      const acc = _v3.copy(vel).sub(this.vel).divideScalar(dt);
      if (acc.length() > 60) acc.setLength(60);
      this.acc.lerp(acc, 0.5);
      this.vel.copy(vel);
      this.p.copy(p);
    }
    if (still) {
      this.ax = this.az = this.vx = this.vz = 0;
    } else if (dt > 0) {
      const a = _v2.copy(this.acc);
      const sg = o.world ? 1 : -1;
      if (o.world) a.applyAxisAngle(Y_AXIS, -yaw);
      else {
        this.obj.parent!.getWorldQuaternion(_q).invert();
        a.applyQuaternion(_q);
      }
      const n = Math.max(1, Math.ceil(dt * 240));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        this.vx += (-o.k * this.ax - o.c * this.vx + sg * o.gain * a.z) * h;
        this.vz += (-o.k * this.az - o.c * this.vz - sg * o.gain * a.x) * h;
        this.ax += this.vx * h;
        this.az += this.vz * h;
      }
      this.ax = clamp(this.ax, -1.2, o.maxBack);
      this.az = clamp(this.az, -1.2, 1.2);
      if (Math.abs(this.ax) + Math.abs(this.az) + Math.abs(this.vx) + Math.abs(this.vz) < 1e-4)
        this.ax = this.az = this.vx = this.vz = 0;
    }
    _e.set(o.restX + this.ax, 0, o.restZ + this.az, 'XYZ');
    if (o.world) {
      _q2.setFromAxisAngle(Y_AXIS, yaw).multiply(_q.setFromEuler(_e));
      this.obj.parent!.getWorldQuaternion(_q).invert();
      this.obj.quaternion.copy(_q).multiply(_q2);
      // deitado, a ponta acompanha o corpo em vez de cair no chão através da barriga
      if (fix > 0) this.obj.quaternion.slerp(_q.setFromEuler(_e), fix);
    } else this.obj.quaternion.setFromEuler(_e);
  }

  moving(): boolean {
    return this.ax !== 0 || this.az !== 0 || this.vx !== 0 || this.vz !== 0;
  }
}

/* ---------- o boneco ---------- */
export interface Arm {
  sh: THREE.Group;
  el: THREE.Group;
  finger: THREE.Group;
}

export interface Eye {
  g: THREE.Group;
  lid: THREE.Group;
  happy: THREE.Mesh;
  sleep: THREE.Mesh;
}

export interface Rig {
  scene: THREE.Scene;
  amb: THREE.AmbientLight;
  key: THREE.DirectionalLight;
  back: THREE.DirectionalLight;
  /** raiz: posição, giro e achatamento */
  zeno: THREE.Group;
  flipG: THREE.Group;
  hips: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  shell: THREE.Mesh;
  shellCanvas: HTMLCanvasElement;
  shellTex: THREE.CanvasTexture;
  tail: THREE.Mesh;
  legs: Record<Hand, THREE.Group>;
  arms: Record<Hand, Arm>;
  neckPivot: THREE.Group;
  neckMesh: THREE.Mesh;
  head: THREE.Group;
  eyes: Record<Hand, Eye>;
  smile: THREE.Mesh;
  mouthOpen: THREE.Mesh;
  snot: THREE.Group;
  snotBall: THREE.Mesh;
  cap: THREE.Group;
  book: THREE.Group;
  shadow: THREE.Mesh;
  dangles: Dangle[];
  triangles: number;
}

/** Monta o Zeno inteiro (touca, livro e bolha de dormir já vêm escondidos). */
export function buildRig(shellCols: readonly Oklch[]): Rig {
  const scene = new THREE.Scene();
  const amb = new THREE.AmbientLight(0xffffff, 1);
  const key = new THREE.DirectionalLight(0xffffff, 1);
  key.position.set(-3, 6, 6);
  const back = new THREE.DirectionalLight(0xffffff, 0);
  back.position.set(4, 1.5, -3);
  scene.add(amb, key, back);

  const SPH = new THREE.SphereGeometry(1, 40, 28);
  const SPH_HI = new THREE.SphereGeometry(1, 64, 40);
  const SPH_LO = new THREE.SphereGeometry(1, 18, 12);
  const ARC = new THREE.TorusGeometry(1, 0.27, 8, 22, Math.PI);

  function mesh(
    geo: THREE.BufferGeometry,
    parent: THREE.Object3D,
    color: ZenoColor,
    pos: Vec3 = [0, 0, 0],
    scale: Vec3 | null = null,
    o: PaintOpts = {},
  ): THREE.Mesh {
    const m = new THREE.Mesh(geo, makeMat(color, o));
    m.position.set(...pos);
    if (scale) m.scale.set(...scale);
    parent.add(m);
    return m;
  }
  const group = (parent: THREE.Object3D, pos: Vec3 = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    parent.add(g);
    return g;
  };

  const zeno = group(scene);
  // virar de costas no chão: gira em torno do centro do casco e assenta o casco no chão, bem em cima da raiz
  const flipG = group(zeno, SHELL_C.toArray());
  const flipIn = group(flipG, SHELL_C.clone().negate().toArray());
  const hips = group(flipIn, [0, 0.4, 0]); // quadril: desce quando ele se recolhe ou senta
  const body = group(hips); // inclinação do corpo
  const torso = group(body); // respiração

  mesh(SPH, torso, 'barriga', [0, 0.34, 0.08], [0.39, 0.45, 0.31], { map: bellyTex() });
  const shellCanvas = makeCanvas(1024, 512);
  paintShell(shellCanvas, shellCols);
  const shellTex = canvasTex(shellCanvas);
  const shell = mesh(SPH_HI, torso, 'casco', [0, 0.38, -0.1], [0.4, 0.55, 0.52], { map: shellTex });
  shell.rotation.y = Math.PI / 2; // a emenda da textura fica na frente, escondida pela barriga
  const tail = mesh(new THREE.ConeGeometry(0.07, 0.17, 14), torso, 'pele', [0, 0.06, -0.38]);
  tail.rotation.x = -2.2;

  const legs = {} as Record<Hand, THREE.Group>;
  for (const s of [L, R]) {
    const pv = group(hips, [s * 0.2, 0, 0.06]);
    mesh(new THREE.CapsuleGeometry(0.11, 0.12, 6, 16), pv, 'pele', [0, -0.15, 0]);
    mesh(SPH, pv, 'pele', [0, -0.31, 0.05], [0.13, 0.075, 0.17]);
    legs[s] = pv;
  }

  const arms = {} as Record<Hand, Arm>;
  for (const s of [L, R]) {
    const sh = group(body, [s * 0.36, 0.62, 0.12]);
    sh.rotation.order = 'XZY';
    mesh(SPH_LO, sh, 'pele', [0, 0, 0], [0.088, 0.088, 0.088]);
    mesh(new THREE.CapsuleGeometry(0.075, 0.12, 6, 14), sh, 'pele', [0, -0.11, 0]);
    const el = group(sh, [0, -0.21, 0]);
    el.rotation.order = 'XZY';
    mesh(new THREE.CapsuleGeometry(0.07, 0.09, 6, 14), el, 'pele', [0, -0.09, 0]);
    mesh(SPH_LO, el, 'pele', [0, -0.2, 0], [0.085, 0.09, 0.08]);
    const finger = group(el, [0, -0.255, 0.01]);
    mesh(new THREE.CapsuleGeometry(0.03, 0.05, 4, 10), finger, 'pele', [0, -0.035, 0]);
    arms[s] = { sh, el, finger };
  }

  const neckPivot = group(body, [0, 0.8, 0.04]);
  neckPivot.rotation.order = 'YXZ';
  const neckMesh = mesh(new THREE.CapsuleGeometry(0.13, 0.16, 6, 16), neckPivot, 'pele', [0, 0.14, 0.02]);
  const head = group(neckPivot, [0, 0.28, 0.04]);
  mesh(SPH, head, 'pele', [0, 0, 0], [0.39, 0.34, 0.36]);
  mesh(SPH, head, 'focinho', [0, -0.09, 0.2], [0.24, 0.165, 0.18]);
  for (const s of [L, R]) {
    mesh(SPH_LO, head, 'tinta', [s * 0.04, -0.025, 0.362], [0.011, 0.009, 0.006], { flat: true });
    const ck = mesh(SPH_LO, head, 'bochecha', [s * 0.235, -0.075, 0.272], [0.062, 0.04, 0.02], { flat: true });
    ck.rotation.y = s * 0.7;
  }
  const eyes = {} as Record<Hand, Eye>;
  for (const s of [L, R]) {
    const g = group(head, [s * 0.135, 0.05, 0.322]);
    g.rotation.set(-0.1, s * 0.38, 0);
    const lid = group(g);
    mesh(SPH_LO, lid, 'tinta', [0, 0, 0], [0.053, 0.074, 0.028], { flat: true });
    mesh(SPH_LO, lid, 'branco', [-0.017, 0.028, 0.022], [0.016, 0.016, 0.01], { flat: true });
    const happy = mesh(ARC, g, 'tinta', [0, -0.02, 0.012], [0.046, 0.046, 0.046], { flat: true });
    const sleep = mesh(ARC, g, 'tinta', [0, 0.012, 0.012], [0.046, 0.046, 0.046], { flat: true });
    sleep.rotation.z = Math.PI;
    happy.visible = sleep.visible = false;
    eyes[s] = { g, lid, happy, sleep };
  }
  const mouthG = group(head, [0, -0.118, 0.37]);
  mouthG.rotation.x = -0.2;
  const smile = mesh(ARC, mouthG, 'tinta', [0, 0.02, 0.004], [0.05, 0.05, 0.05], { flat: true });
  smile.rotation.z = Math.PI;
  const mouthOpen = mesh(SPH_LO, mouthG, 'boca', [0, -0.004, 0], [0.045, 0.03, 0.02], { flat: true });

  // bolha de dormir, como nos animes: sai da narina do lado da câmera, enche ao soltar o ar e murcha ao puxar
  const snot = group(head, [-0.04, -0.03, 0.362]);
  const snotBall = mesh(SPH, snot, 'bolha', [0, 0, 0], null, { glass: true });
  snotBall.renderOrder = 2;
  mesh(SPH_LO, snotBall, 'branco', [-0.38, 0.42, 0.8], [0.2, 0.2, 0.1], { flat: true });
  snot.visible = false;

  // touca de dormir: a ponta é mole e balança
  const cap = group(head, [0, 0.2, -0.02]);
  cap.rotation.set(-0.25, 0, 0.16);
  mesh(new THREE.CylinderGeometry(0.15, 0.3, 0.22, 24, 1, true), cap, 'touca', [0, 0.11, 0]);
  const band = mesh(new THREE.TorusGeometry(0.29, 0.055, 10, 32), cap, 'toucaBorda', [0, 0, 0]);
  band.rotation.x = Math.PI / 2;
  const capTip = group(cap, [0, 0.21, 0]);
  mesh(new THREE.ConeGeometry(0.15, 0.32, 20), capTip, 'touca', [0, 0.15, 0]);
  mesh(SPH_LO, capTip, 'toucaBorda', [0, 0.32, 0], [0.07, 0.07, 0.07]);

  // livrinho aberto, com as páginas viradas para ele
  const book = group(body, [0, 0.5, 0.5]);
  book.rotation.x = 0.6;
  for (const s of [L, R]) {
    const half = group(book);
    half.rotation.y = s * 0.38;
    mesh(new RoundedBoxGeometry(0.17, 0.22, 0.018, 2, 0.008), half, 'capa', [s * 0.085, 0, 0]);
    mesh(new THREE.BoxGeometry(0.155, 0.2, 0.02), half, 'papel', [s * 0.08, 0, -0.012]);
  }

  // cachecol: anel listrado e duas pontas que balançam
  const scarf = group(body, [0, 0.79, 0.03]);
  const ring = mesh(new THREE.TorusGeometry(0.245, 0.075, 12, 40), scarf, 'cachecol', [0, 0, 0], [1.08, 1, 1], {
    map: stripeTex(),
  });
  ring.rotation.x = Math.PI / 2;
  const tail1 = group(scarf, [-0.14, -0.03, 0.25]);
  mesh(new RoundedBoxGeometry(0.13, 0.19, 0.045, 3, 0.02), tail1, 'cachecol', [0, -0.085, 0]);
  const tail2 = group(tail1, [0, -0.17, 0]);
  mesh(new RoundedBoxGeometry(0.13, 0.16, 0.045, 3, 0.02), tail2, 'cachecol', [0, -0.07, 0]);
  for (const x of [-0.04, 0, 0.04])
    mesh(new THREE.CapsuleGeometry(0.013, 0.02, 3, 8), tail2, 'cachecolListra', [x, -0.162, 0]);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 0.24),
    makeMat('tinta', { shadow: true, map: shadowTex() }),
  );
  shadow.renderOrder = -1;
  scene.add(shadow);

  const dangles = [
    new Dangle(tail1, { world: true, restX: -0.5, restZ: 0, k: 70, c: 7, gain: 1.1, maxBack: 0.12 }),
    new Dangle(tail2, { world: true, restX: -0.12, restZ: 0, k: 55, c: 5, gain: 1.5, maxBack: 0.2 }),
    new Dangle(capTip, { world: false, restX: -0.35, restZ: 0.95, k: 45, c: 4.5, gain: 1.0 }),
  ];

  let triangles = 0;
  zeno.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const g = o.geometry as THREE.BufferGeometry;
      triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
  });

  return {
    scene,
    amb,
    key,
    back,
    zeno,
    flipG,
    hips,
    body,
    torso,
    shell,
    shellCanvas,
    shellTex,
    tail,
    legs,
    arms,
    neckPivot,
    neckMesh,
    head,
    eyes,
    smile,
    mouthOpen,
    snot,
    snotBall,
    cap,
    book,
    shadow,
    dangles,
    triangles: Math.round(triangles),
  };
}

/** A luz da argila; no escuro, um pouco mais baixa. */
export function applyLights(rig: Rig, dark: boolean): void {
  const d = dark ? 0.86 : 1;
  rig.amb.intensity = 0.52 * Math.PI * d;
  rig.key.intensity = 0.56 * Math.PI * d;
  rig.back.intensity = 0.14 * Math.PI * d;
}

/** Solta da GPU tudo o que o boneco usa (geometrias, materiais, texturas). Os objetos continuam valendo: na próxima
 *  vez que forem desenhados, sobem de novo. */
export function releaseGpu(rig: Rig): void {
  rig.scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    (o.geometry as THREE.BufferGeometry).dispose();
    const mat = o.material as THREE.MeshBasicMaterial;
    mat.map?.dispose();
    mat.dispose();
  });
}

// Os parâmetros do corpo do Zeno e as molas que os movem. As molas usam os mesmos parâmetros do Motion
// (visualDuration e bounce), com as mesmas calma, toque e festa do app (movimento.md), e mais algumas só dele.
// Tudo aqui é conta pura, sem three.js: os testes rodam sem desenho.

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
export const easeOut = (u: number) => 1 - (1 - u) ** 2;
export const easeIn = (u: number) => u * u;

export interface Spring {
  /** rigidez */
  k: number;
  /** amortecimento */
  c: number;
}

/** Mola a partir de visualDuration (s) e bounce (0 a 1), como no Motion e no laboratório de movimento. */
export function springFrom(visualDuration: number, bounce: number): Spring {
  const w = (2 * Math.PI) / (visualDuration * 1.2);
  const z = clamp(1 - bounce, 0.05, 1);
  return { k: w * w, c: 2 * z * w };
}

export const SPRINGS = {
  calma: springFrom(0.35, 0),
  toque: springFrom(0.25, 0.25),
  festa: springFrom(0.6, 0.35),
  /** só do Zeno: deitar, cochilar, bocejar */
  lento: springFrom(0.9, 0),
  /** só do Zeno: inclinar, girar o corpo devagar */
  leve: springFrom(0.5, 0.12),
  /** só do Zeno: achatar no pulo, balançar a mão */
  rapido: springFrom(0.15, 0.08),
  /** os olhos vão na frente da cabeça */
  olho: springFrom(0.11, 0),
} as const satisfies Record<string, Spring>;

export type SpringName = keyof typeof SPRINGS;

export interface Tween {
  fn: (u: number) => number;
  t0: number;
  dur: number;
}

/** Um número do corpo: valor, alvo, velocidade, a mola que o leva até o alvo, ou uma curva no tempo. */
export interface Param {
  v: number;
  t: number;
  vel: number;
  k: number;
  c: number;
  tw: Tween | null;
}

export function makeParam(v: number): Param {
  return { v, t: v, vel: 0, k: SPRINGS.calma.k, c: SPRINGS.calma.c, tw: null };
}

/** Passos pequenos (240 por segundo), para a mola ficar estável mesmo num quadro longo. */
const SUBSTEPS = 240;

/**
 * Anda um parâmetro dt segundos. simTime é o tempo de cena já com o dt somado (a curva lê dele).
 * Perto do alvo, assenta de vez: o laço só para quando tudo assentou.
 */
export function stepParam(p: Param, dt: number, simTime: number): void {
  if (p.tw) {
    const u = clamp((simTime - p.tw.t0) / p.tw.dur, 0, 1);
    p.v = p.tw.fn(u);
    p.vel = 0;
    if (u >= 1) {
      p.v = p.t;
      p.tw = null;
    }
    return;
  }
  if (p.v === p.t && p.vel === 0) return;
  const n = Math.max(1, Math.ceil(dt * SUBSTEPS));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    p.vel += (-p.k * (p.v - p.t) - p.c * p.vel) * h;
    p.v += p.vel * h;
  }
  if (Math.abs(p.v - p.t) < 1e-4 && Math.abs(p.vel) < 1e-3) {
    p.v = p.t;
    p.vel = 0;
  }
}

export const isSettled = (p: Param) => !p.tw && p.v === p.t && p.vel === 0;

/** Leva o parâmetro ao alvo com a mola; com snap (movimento reduzido), vai direto. */
export function aim(p: Param, target: number, spring: Spring, snap = false): void {
  p.tw = null;
  p.t = target;
  p.k = spring.k;
  p.c = spring.c;
  if (snap) {
    p.v = target;
    p.vel = 0;
  }
}

/** O corpo de três quartos, para o casco aparecer; o rosto vira para quem vê. */
export const FACE = 0.68;

/** A pose de descanso: em pé, braços baixos, olhando para quem vê. */
export const REST = {
  rootYaw: FACE,
  bodyLean: 0,
  bodyTilt: 0,
  bodyTwist: 0,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  neck: 0,
  aR: -0.2,
  gR: -0.3,
  exR: -0.35,
  ezR: 0,
  fR: 0,
  aL: -0.2,
  gL: 0.3,
  exL: -0.35,
  ezL: 0,
  fL: 0,
  legR: 0,
  legL: 0,
  limbs: 1,
  hipsY: 0,
  squash: 0,
  eyeOpen: 1,
  mouth: 0,
  cap: 0,
  book: 0,
  gazeX: 0,
  gazeY: 0,
  sit: 0,
  flip: 0,
} as const;

/** Os que não têm pose de descanso: posição (em relação ao lugar), passo, olhar e o deslize entre lugares. */
const EXTRA = ['rootX', 'rootY', 'walk', 'lookYaw', 'lookPitch', 'eyeX', 'eyeY', 'glideX', 'glideY'] as const;

export type ParamName = keyof typeof REST | (typeof EXTRA)[number];
export type Pose = Partial<Record<ParamName, number>>;
export type Params = Record<ParamName, Param>;

export function makeParams(): Params {
  const out = {} as Params;
  for (const [n, v] of Object.entries(REST)) out[n as ParamName] = makeParam(v);
  for (const n of EXTRA) out[n] = makeParam(0);
  return out;
}

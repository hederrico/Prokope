// As cores do Zeno, em OKLCH como no design system. A cara dele não muda com o tema nem com os pilares:
// só as placas de cima do casco mudam, no papel fill da paleta de 12 cores (as cores chegam prontas de shell.ts).
// Este arquivo vai no pedaço do desenho e não importa nada do app.

/** [L, C, h] em OKLCH: L e C de 0 a 1, h em graus. */
export type Oklch = readonly [number, number, number];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** OKLCH para RGB linear (de 0 a 1), cortado na borda do sRGB. */
export function oklchLinear([L, C, h]: Oklch): [number, number, number] {
  const r = (h * Math.PI) / 180;
  const a = C * Math.cos(r);
  const b = C * Math.sin(r);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    clamp01(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp01(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp01(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const toSrgb = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

/** A cor como texto do canvas ("rgb(…)"), para as texturas desenhadas na hora. */
export function cssColor(c: Oklch): string {
  const [r, g, b] = oklchLinear(c).map((v) => Math.round(toSrgb(v) * 255));
  return `rgb(${r}, ${g}, ${b})`;
}

/** O corpo do Zeno: fixo, igual nos dois temas e para todo mundo. */
export const ZENO_COLORS = {
  pele: [0.83, 0.08, 128],
  focinho: [0.9, 0.055, 112],
  barriga: [0.93, 0.045, 88],
  linhaBarriga: [0.85, 0.05, 80],
  casco: [0.7, 0.065, 62],
  margem: [0.84, 0.055, 74],
  tinta: [0.27, 0.02, 60],
  boca: [0.4, 0.07, 25],
  branco: [0.995, 0, 0],
  bochecha: [0.81, 0.085, 10],
  bolha: [0.88, 0.06, 220],
  cachecol: [0.66, 0.09, 230],
  cachecolListra: [0.94, 0.03, 85],
  touca: [0.8, 0.07, 285],
  toucaBorda: [0.95, 0.02, 85],
  capa: [0.64, 0.085, 150],
  papel: [0.965, 0.015, 85],
} as const satisfies Record<string, Oklch>;

export type ZenoColor = keyof typeof ZENO_COLORS;

/**
 * As fileiras do casco. Na esfera, x do canvas é a volta (o meio é as costas) e y vai do topo (0°) ao fundo (180°).
 * As duas de cima alternam as cores dos pilares; a de baixo é a margem, sempre igual.
 */
export const SHELL_ROWS = [
  { t0: 5, t1: 45, n: 5, u0: 0.11, u1: 0.89, off: 0, margin: false },
  { t0: 47, t1: 88, n: 6, u0: 0.1, u1: 0.9, off: 2, margin: false },
  { t0: 90, t1: 116, n: 10, u0: 0.08, u1: 0.92, off: 0, margin: true },
] as const;

/** A cor de cada placa, fileira por fileira. */
export function shellPlates(cols: readonly Oklch[]): Oklch[][] {
  return SHELL_ROWS.map((row) =>
    Array.from({ length: row.n }, (_, i) => (row.margin ? ZENO_COLORS.margem : cols[(i + row.off) % cols.length])),
  );
}

/** O contorno de dentro de cada placa: um pouco mais escuro e mais saturado. */
export function plateEdge([L, C, h]: Oklch): Oklch {
  return [L - 0.07, C + 0.015, h];
}

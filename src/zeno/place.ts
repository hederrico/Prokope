// Onde o Zeno fica na tela e o pedaço da tela que o canvas cobre. Conta pura, em pixels da coluna do app
// (0,0 no canto de cima à esquerda do .sh-app), sem three.js.

/** A altura do Zeno em pé, em unidades do mundo (do pé ao topo da cabeça). */
export const ZENO_UNITS = 1.84;

/** Altura do Zeno na tela: 22% da altura do app, entre 104 e 164 px (o mesmo do laboratório). */
export function zenoPx(appHeight: number): number {
  return Math.min(164, Math.max(104, appHeight * 0.22));
}

/** Pixels por unidade do mundo, no plano do Zeno. */
export function unitPx(appHeight: number): number {
  return zenoPx(appHeight) / ZENO_UNITS;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface StageMetrics {
  width: number;
  height: number;
  /** o que fica embaixo: a barra de abas (com a área segura) ou só a área segura */
  bottomInset: number;
  /** o que fica em cima: o fim do cabeçalho da tela, ou a área segura */
  topInset: number;
}

export type Side = 'left' | 'right';
export type Row = 'bottom' | 'top';

/** Um lugar: o ponto do chão debaixo dos pés dele, em pixels do app. */
export interface Spot {
  side: Side;
  row: Row;
  x: number;
  y: number;
}

/** Distância da borda até o meio dele (a mesma do laboratório). */
export function sideInset(appHeight: number): number {
  return Math.max(zenoPx(appHeight) * 0.62, 70);
}

export function spotFor(side: Side, row: Row, m: StageMetrics): Spot {
  const inset = sideInset(m.height);
  const x = side === 'left' ? inset : m.width - inset;
  // embaixo, os pés ficam 4 px acima da barra de abas; em cima, a cabeça fica logo abaixo do cabeçalho
  const y = row === 'bottom' ? m.height - m.bottomInset - 4 : m.topInset + zenoPx(m.height) + 10;
  return { side, row, x, y };
}

/** O que o corpo dele cobre na tela, num lugar (sem os braços esticados). */
export function footprint(spot: Pick<Spot, 'x' | 'y'>, appHeight: number): Rect {
  const z = zenoPx(appHeight);
  return { left: spot.x - z * 0.55, top: spot.y - z * 1.05, width: z * 1.1, height: z * 1.1 };
}

function overlapArea(a: Rect, b: Rect, pad = 0): number {
  const w = Math.min(a.left + a.width, b.left + b.width + pad) - Math.max(a.left, b.left - pad);
  const h = Math.min(a.top + a.height, b.top + b.height + pad) - Math.max(a.top, b.top - pad);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Longe do alvo: o lado oposto ao alvo, sem cobrir o alvo. Prefere embaixo (o lugar de sempre); se cobrir,
 * vai para cima do mesmo lado; depois tenta o outro lado. Se tudo cobre, fica onde cobre menos.
 */
export function spotAwayFrom(target: Rect, m: StageMetrics): Spot {
  const cx = target.left + target.width / 2;
  const far: Side = cx < m.width / 2 ? 'right' : 'left';
  const near: Side = far === 'left' ? 'right' : 'left';
  const order: [Side, Row][] = [
    [far, 'bottom'],
    [far, 'top'],
    [near, 'bottom'],
    [near, 'top'],
  ];
  let best: Spot | null = null;
  let bestArea = Infinity;
  for (const [side, row] of order) {
    const s = spotFor(side, row, m);
    const area = overlapArea(footprint(s, m.height), target, 8);
    if (area === 0) return s;
    if (area < bestArea) {
      best = s;
      bestArea = area;
    }
  }
  return best ?? spotFor(far, 'bottom', m);
}

/** Até onde o desenho dele vai, em unidades, a partir do ponto do chão: braços para cima, touca, pulo, giro no casco. */
export const CANVAS_UNITS = { side: 1.35, up: 2.75, down: 0.3 } as const;

/**
 * O pedaço da tela que o canvas cobre, em volta do ponto do chão dele (já com o pulo e o passo).
 * Inteiro em pixels: o canvas nunca cai entre dois pixels, e o desenho fica nítido.
 */
export function canvasBox(rootX: number, rootY: number, appHeight: number): Rect {
  const u = unitPx(appHeight);
  return {
    left: Math.round(rootX - CANVAS_UNITS.side * u),
    top: Math.round(rootY - CANVAS_UNITS.up * u),
    width: Math.ceil(2 * CANVAS_UNITS.side * u),
    height: Math.ceil((CANVAS_UNITS.up + CANVAS_UNITS.down) * u),
  };
}

/** Densidade de pixels do desenho: a da tela, no máximo 2 (no iPhone, 3 custaria o dobro e não se vê). */
export function drawRatio(devicePixelRatio: number | undefined): number {
  return Math.min(Math.max(devicePixelRatio || 1, 1), 2);
}

/** O centro de um retângulo da tela (um botão), para mirar. */
export function centerOf(r: Rect): { x: number; y: number } {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

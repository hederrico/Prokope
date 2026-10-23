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
  /** só a área segura de cima (o entalhe): num canto com borda, a cabeça dele não passa daqui. Padrão: 0 */
  safeTop?: number;
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
 * No canto, o meio dele fica mais perto da borda que nos lugares de sempre: o corpo inteiro na tela, com 8 px de
 * folga, e o resto da largura livre para o balão ao lado da cabeça dele.
 */
export function cornerInset(appHeight: number): number {
  return Math.round(unitPx(appHeight) * 0.55) + 8;
}

/**
 * Num canto: encostado na borda do lado, embaixo (acima da barra de abas) ou em cima (abaixo do cabeçalho).
 * Em cima, com `ledge` (o fim de baixo de um elemento, como o título de um passo do Começar), os pés ficam nessa
 * borda e a cabeça sobe até a área segura: ele fica ao lado do título, sem descer sobre o que vem depois.
 */
export function cornerSpot(side: Side, row: Row, m: StageMetrics, ledge?: number | null): Spot {
  const inset = cornerInset(m.height);
  const x = side === 'left' ? inset : m.width - inset;
  const y =
    row === 'top' && ledge != null
      ? Math.max(ledge, (m.safeTop ?? 0) + zenoPx(m.height) + 4)
      : spotFor(side, row, m).y;
  return { side, row, x, y };
}

/**
 * A faixa da tela que ele e o balão ao lado dele ocupam num canto, de borda a borda: a altura dele, ou `room` (a do
 * balão), se for maior. Em cima, o balão começa na altura da cabeça e desce; embaixo, termina nos pés e sobe.
 */
export function cornerBand(spot: Pick<Spot, 'row' | 'y'>, m: StageMetrics, room: number): Rect {
  const z = zenoPx(m.height) * 1.05;
  const h = Math.max(z, room) + 4;
  const top = spot.row === 'bottom' ? spot.y - h : spot.y - z;
  return { left: 0, top, width: m.width, height: h };
}

/**
 * Longe do alvo: o lado oposto ao alvo, sem cobrir o alvo. Prefere embaixo (o lugar de sempre); se cobrir,
 * vai para cima do mesmo lado; depois tenta o outro lado. Se tudo cobre, fica onde cobre menos.
 *
 * Com `room` (o tutorial, com o balão ao lado dele), ele vai para um canto, e quem não pode cobrir o alvo é a faixa
 * inteira dele com o balão (cornerBand, com `room` px de altura). Aí ele fica onde está (`current`), se dali a faixa
 * não cobre o alvo: anda só quando precisa.
 */
export function spotAwayFrom(
  target: Rect,
  m: StageMetrics,
  room?: number,
  current?: Pick<Spot, 'side' | 'row'> | null,
): Spot {
  const cx = target.left + target.width / 2;
  const far: Side = cx < m.width / 2 ? 'right' : 'left';
  const near: Side = far === 'left' ? 'right' : 'left';
  const order: [Side, Row][] = [
    [far, 'bottom'],
    [far, 'top'],
    [near, 'bottom'],
    [near, 'top'],
  ];
  const corner = room !== undefined;
  if (corner && current) order.unshift([current.side, current.row]);
  let best: Spot | null = null;
  let bestArea = Infinity;
  for (const [side, row] of order) {
    const s = corner ? cornerSpot(side, row, m) : spotFor(side, row, m);
    const area = overlapArea(corner ? cornerBand(s, m, room) : footprint(s, m.height), target, 8);
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

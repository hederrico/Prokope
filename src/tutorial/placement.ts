// Contas do balão e do véu, sem DOM (testadas em __tests__/placement.test.ts).
// Com o Zeno em cena, ele fica num canto e o balão fica ao lado da cabeça dele (placeBeside); sem ele, o balão fica
// perto do alvo (placeBalloon). Nos dois casos, sem cobrir o alvo, dentro da área segura.
// O véu é um retângulo com um furo arredondado em volta do alvo.

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const boxRight = (b: Box) => b.left + b.width;
export const boxBottom = (b: Box) => b.top + b.height;

/** Duas caixas se cruzam (encostar não conta). */
export function intersects(a: Box, b: Box): boolean {
  return a.left < boxRight(b) && b.left < boxRight(a) && a.top < boxBottom(b) && b.top < boxBottom(a);
}

/** A caixa crescida de `by` px para cada lado. */
export function inflate(b: Box, by: number): Box {
  return { left: b.left - by, top: b.top - by, width: b.width + by * 2, height: b.height + by * 2 };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

export interface BalloonInput {
  /** largura e altura do balão já desenhado */
  size: { width: number; height: number };
  /** a área onde ele pode ficar: a tela visível sem as áreas seguras, a barra de abas, o pé preso e o teclado */
  bounds: Box;
  /** perto de quem: a cabeça do Zeno ou o alvo. Sem âncora, o balão fica encostado embaixo (ou em cima) */
  anchor?: Box | null;
  /** o que ele não cobre: o alvo do passo (com o Zeno, a âncora é outra) */
  avoid?: Box | null;
  /** o lado preferido em volta da âncora. Padrão: embaixo */
  prefer?: 'above' | 'below';
  /** sem âncora: encostado embaixo (onde o Zeno fica) ou em cima */
  dock?: 'bottom' | 'top';
  /** sem âncora: para onde a ponta aponta (o alvo), se ele estiver inteiro acima ou abaixo do balão */
  pointTo?: Box | null;
  /** distância da âncora até o balão (px). Padrão: 12 */
  gap?: number;
}

export interface BalloonPlacement {
  left: number;
  top: number;
  /**
   * em cima ou embaixo da âncora, encostado na borda (sem âncora), ou à esquerda e à direita da cabeça do Zeno (a
   * ponta fica na borda do lado dele)
   */
  side: 'above' | 'below' | 'dock' | 'left' | 'right';
  /**
   * onde fica a ponta do balão, em px a partir da borda esquerda dele (em cima e embaixo) ou do topo dele (dos lados);
   * null sem ponta
   */
  tail: number | null;
  /** não coube sem cobrir o alvo (alvo maior que a tela) */
  covers: boolean;
}

/**
 * A altura que o balão pede ao lado do Zeno, num canto: umas quatro linhas e os botões. A faixa dele com o balão
 * (cornerBand, em src/zeno/place.ts) não cobre o alvo do passo, e o alvo revelado fica abaixo dela (revealTarget).
 */
export const ZENO_ROOM = 200;

/** A ponta fica longe dos cantos arredondados (raio 20 + metade da ponta). */
export const TAIL_MARGIN = 28;

export function placeBalloon(input: BalloonInput): BalloonPlacement {
  const { size, bounds } = input;
  const gap = input.gap ?? 12;
  const w = Math.min(size.width, bounds.width);
  const h = size.height;
  const minTop = bounds.top;
  const maxTop = boxBottom(bounds) - h;
  const anchor = input.anchor && intersects(input.anchor, bounds) ? input.anchor : null;
  const avoid = input.avoid ?? null;

  const centered = (cx: number) => clamp(Math.round(cx - w / 2), bounds.left, boxRight(bounds) - w);
  const at = (left: number, top: number): Box => ({ left, top, width: w, height: h });
  const round = (p: BalloonPlacement): BalloonPlacement => ({ ...p, left: Math.round(p.left), top: Math.round(p.top) });

  if (!anchor) {
    const left = centered(bounds.left + bounds.width / 2);
    // encostado, a ponta aponta para o alvo quando ele está inteiro acima ou abaixo do balão
    const docked = (top: number, covers: boolean): BalloonPlacement => {
      const p = input.pointTo;
      if (p && !covers) {
        const tail = clamp(Math.round(p.left + p.width / 2 - left), TAIL_MARGIN, w - TAIL_MARGIN);
        if (p.top >= top + h - 0.5) return round({ left, top, side: 'above', tail, covers });
        if (boxBottom(p) <= top + 0.5) return round({ left, top, side: 'below', tail, covers });
      }
      return round({ left, top, side: 'dock', tail: null, covers });
    };
    const docks: ('bottom' | 'top')[] = input.dock === 'top' ? ['top', 'bottom'] : ['bottom', 'top'];
    for (const d of docks) {
      const top = d === 'top' ? minTop : maxTop;
      if (!avoid || !intersects(at(left, top), avoid)) return docked(top, false);
    }
    return docked(docks[0] === 'top' ? minTop : maxTop, true);
  }

  const cx = anchor.left + anchor.width / 2;
  const left = centered(cx);
  const below = boxBottom(anchor) + gap;
  const above = anchor.top - gap - h;
  const sides: ('above' | 'below')[] = input.prefer === 'above' ? ['above', 'below'] : ['below', 'above'];
  const topOf = (s: 'above' | 'below') => (s === 'below' ? below : above);
  const fits = (s: 'above' | 'below') => {
    const top = topOf(s);
    if (top < minTop - 0.5 || top > maxTop + 0.5) return false;
    return !avoid || !intersects(at(left, top), avoid);
  };
  const tailAt = () => clamp(Math.round(cx - left), TAIL_MARGIN, w - TAIL_MARGIN);

  for (const s of sides) if (fits(s)) return round({ left, top: topOf(s), side: s, tail: tailAt(), covers: false });

  // não coube perto da âncora sem cobrir o alvo: encostado na borda longe da âncora (a cabeça do Zeno), se ali não
  // cobre
  if (avoid) {
    const away = anchor.top + anchor.height / 2 > bounds.top + bounds.height / 2 ? 'top' : 'bottom';
    const docked = placeBalloon({ ...input, anchor: null, dock: away, pointTo: input.pointTo ?? avoid });
    if (!docked.covers) return docked;
  }

  // não coube inteiro de nenhum lado: o lado com mais espaço, preso na área segura
  const room = { below: boxBottom(bounds) - below, above: above + h - bounds.top };
  const side = room.below >= room.above ? 'below' : 'above';
  const top = clamp(topOf(side), minTop, maxTop);
  const covers = intersects(at(left, top), avoid ?? anchor);
  return round({ left, top, side, tail: covers ? null : tailAt(), covers });
}

export interface BesideInput {
  /** a largura já é a que sobra ao lado dele (besideWidth); a altura é a do balão desenhado */
  size: { width: number; height: number };
  bounds: Box;
  /** a cabeça do Zeno (zeno.anchor()) */
  head: Box;
  /** a altura dele em px (do topo da cabeça aos pés) */
  height: number;
  /** o que ele não cobre: o alvo do passo, com a região em volta */
  avoid?: Box | null;
  /** encostado em cima da área (o Começar: o balão cobre o título do passo) */
  pinTop?: boolean;
  /** distância entre o corpo dele e o balão (px). Padrão: 8 */
  gap?: number;
}

/** De que lado da tela ele está, e se em cima ou embaixo, pela cabeça. */
export function zenoCorner(head: Box, app: Box): { side: 'left' | 'right'; row: 'top' | 'bottom' } {
  return {
    side: head.left + head.width / 2 > app.left + app.width / 2 ? 'right' : 'left',
    row: head.top + head.height / 2 < app.top + app.height / 2 ? 'top' : 'bottom',
  };
}

/** O casco passa da cabeça para o lado de dentro (a fração da cabeça); o balão começa depois dele. */
const SHELL_PAST_HEAD = 0.2;

/**
 * A largura que sobra para o balão ao lado dele, do lado de dentro da tela, até `max`. A conta é pela cabeça, que
 * não treme com a respiração nem com o olhar.
 */
export function besideWidth(bounds: Box, head: Box, app: Box, max: number, gap = 8): number {
  const { side } = zenoCorner(head, app);
  const free =
    side === 'right'
      ? head.left - head.width * SHELL_PAST_HEAD - gap - bounds.left
      : boxRight(bounds) - (boxRight(head) + gap);
  return Math.max(0, Math.min(max, free));
}

/**
 * O balão ao lado da cabeça do Zeno, que está num canto: do lado de dentro da tela, colado nele. Em cima, o topo do
 * balão fica na altura da cabeça (ou encostado no topo da área, com `pinTop`); embaixo, o fim do balão fica nos pés.
 * A ponta sai da borda do lado dele, na altura da cabeça. Devolve null se o balão cobriria o alvo: quem chama encosta
 * o balão longe dele (placeBalloon).
 */
export function placeBeside(input: BesideInput, app: Box): BalloonPlacement | null {
  const { size, bounds, head } = input;
  const gap = input.gap ?? 8;
  const w = Math.min(size.width, bounds.width);
  const h = size.height;
  const { side, row } = zenoCorner(head, app);
  const left =
    side === 'right'
      ? clamp(head.left - head.width * SHELL_PAST_HEAD - gap - w, bounds.left, boxRight(bounds) - w)
      : clamp(boxRight(head) + gap, bounds.left, boxRight(bounds) - w);
  const feet = head.top + input.height;
  const want = input.pinTop ? bounds.top : row === 'top' ? head.top : feet - h;
  const top = clamp(want, bounds.top, boxBottom(bounds) - h);
  const box: Box = { left, top, width: w, height: h };
  if (input.avoid && intersects(box, input.avoid)) return null;
  const tail = clamp(Math.round(head.top + head.height / 2 - top), TAIL_MARGIN, h - TAIL_MARGIN);
  return { left: Math.round(left), top: Math.round(top), side: side === 'right' ? 'left' : 'right', tail, covers: false };
}

/** O furo do véu em volta do alvo: a caixa crescida de `pad` e o raio do alvo mais o mesmo `pad`. */
export function holeFor(target: Box, radius: number, pad = 6): Box & { radius: number } {
  const b = inflate(target, pad);
  return { ...b, radius: Math.max(0, Math.min(radius + pad, b.width / 2, b.height / 2)) };
}

/** O furo dentro da área (um alvo da largura da tela não deixa o anel cortado na borda). */
export function clampHole(
  hole: Box & { radius: number },
  area: { width: number; height: number },
  inset = 3,
): Box & { radius: number } {
  const left = Math.max(hole.left, inset);
  const top = Math.max(hole.top, inset);
  const width = Math.max(0, Math.min(boxRight(hole), area.width - inset) - left);
  const height = Math.max(0, Math.min(boxBottom(hole), area.height - inset) - top);
  return { left, top, width, height, radius: Math.max(0, Math.min(hole.radius, width / 2, height / 2)) };
}

/** O caminho do véu: a área inteira, menos o furo (preenchido com fill-rule="evenodd"). */
export function veilPath(area: { width: number; height: number }, hole: (Box & { radius: number }) | null): string {
  const outer = `M0 0H${area.width}V${area.height}H0Z`;
  if (!hole) return outer;
  const { left: x, top: y, width: w, height: h } = hole;
  const r = hole.radius;
  const n = (v: number) => Math.round(v * 10) / 10;
  return (
    outer +
    `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)}` +
    `V${n(y + h - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(y + h)}` +
    `H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y + h - r)}` +
    `V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)}Z`
  );
}

/**
 * As quatro faixas em volta do furo que seguram o toque no passo de fazer (só o alvo responde).
 * Faixas vazias saem.
 */
export function blockersAround(area: { width: number; height: number }, hole: Box): Box[] {
  const top = Math.max(0, hole.top);
  const bottom = Math.min(area.height, boxBottom(hole));
  const left = Math.max(0, hole.left);
  const right = Math.min(area.width, boxRight(hole));
  const bands: Box[] = [
    { left: 0, top: 0, width: area.width, height: top },
    { left: 0, top: bottom, width: area.width, height: area.height - bottom },
    { left: 0, top, width: left, height: bottom - top },
    { left: right, top, width: area.width - right, height: bottom - top },
  ];
  return bands.filter((b) => b.width > 0 && b.height > 0);
}

/** Interpolação de duas caixas (o furo desliza de um alvo para o outro). */
export function mixBox<T extends Box & { radius?: number }>(a: T, b: T, t: number): T {
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    ...b,
    left: mix(a.left, b.left),
    top: mix(a.top, b.top),
    width: mix(a.width, b.width),
    height: mix(a.height, b.height),
    ...(a.radius !== undefined && b.radius !== undefined ? { radius: mix(a.radius, b.radius) } : {}),
  };
}

/**
 * Para onde rolar para o alvo ficar à vista com lugar para o balão: nada, se ele já está inteiro na faixa visível
 * com folga em cima e `room` px livres embaixo; senão, o topo do alvo a 25% da faixa (ou o centro, se ele for maior
 * que a faixa). Com `above` (o canto de cima do Zeno com o balão), o topo do alvo desce até lá, e um alvo alto
 * continua para baixo da tela em vez de subir para baixo do Zeno. A rolagem para no fim da lista.
 */
export function scrollTopFor(opts: {
  target: Box;
  /** a faixa visível do rolador, na tela */
  band: { top: number; bottom: number };
  scrollTop: number;
  maxScroll: number;
  margin?: number;
  /** o espaço que o balão pede embaixo do alvo. Padrão: 200 (ou 35% da faixa, o que for menor) */
  room?: number;
  /** o espaço que o Zeno e o balão pedem em cima do alvo, no canto de cima (px a partir do topo da faixa) */
  above?: number;
}): number | null {
  const { target, band, scrollTop, maxScroll } = opts;
  const margin = opts.margin ?? 24;
  const bandH = band.bottom - band.top;
  const room = opts.room ?? Math.min(200, bandH * 0.35);
  if (target.top >= band.top + margin && boxBottom(target) <= band.bottom - Math.max(margin, room)) return null;
  const above = opts.above ?? 0;
  const want =
    above > 0
      ? band.top + Math.max(bandH * 0.25, above)
      : target.height > bandH - margin * 2
        ? band.top + (bandH - target.height) / 2
        : band.top + bandH * 0.25;
  const next = clamp(Math.round(scrollTop + (target.top - want)), 0, maxScroll);
  return Math.abs(next - scrollTop) < 2 ? null : next;
}

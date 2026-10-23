// As contas do balão e do véu (placement.ts): perto da âncora sem cobrir o alvo, dentro da área segura.
import {
  besideWidth,
  blockersAround,
  boxBottom,
  clampHole,
  holeFor,
  intersects,
  placeBalloon,
  placeBeside,
  scrollTopFor,
  TAIL_MARGIN,
  veilPath,
  zenoCorner,
  type Box,
} from '../placement';

// a tela do iPhone (390 × 844), com 16 px de cada lado e a barra de abas embaixo
const bounds: Box = { left: 16, top: 60, width: 358, height: 700 };
const size = { width: 340, height: 140 };
const box = (left: number, top: number, width: number, height: number): Box => ({ left, top, width, height });

describe('placeBalloon', () => {
  it('fica embaixo do alvo quando cabe, com a ponta no meio dele', () => {
    const target = box(40, 120, 200, 80);
    const p = placeBalloon({ size, bounds, anchor: target, avoid: target });
    expect(p.side).toBe('below');
    expect(p.top).toBe(120 + 80 + 12);
    expect(intersects({ ...p, ...size }, target)).toBe(false);
    expect(p.tail).toBe(Math.round(140 - p.left));
    expect(p.covers).toBe(false);
  });

  it('sobe para cima do alvo quando não cabe embaixo', () => {
    const target = box(40, 600, 200, 80);
    const p = placeBalloon({ size, bounds, anchor: target, avoid: target });
    expect(p.side).toBe('above');
    expect(p.top + size.height).toBe(600 - 12);
  });

  it('respeita o lado preferido e a distância pedida', () => {
    const target = box(40, 380, 200, 60);
    const p = placeBalloon({ size, bounds, anchor: target, avoid: target, prefer: 'above', gap: 20 });
    expect(p.side).toBe('above');
    expect(p.top).toBe(380 - 20 - size.height);
  });

  it('não sai da área segura: preso nas bordas de lado, e a ponta longe dos cantos', () => {
    const target = box(330, 120, 40, 40);
    const p = placeBalloon({ size, bounds, anchor: target, avoid: target });
    expect(p.left).toBe(16 + 358 - 340);
    expect(p.left + size.width).toBeLessThanOrEqual(16 + 358);
    expect(p.tail).toBe(size.width - TAIL_MARGIN);
  });

  it('com o Zeno, fica perto da cabeça dele e não cobre o alvo', () => {
    const head = box(280, 600, 60, 60);
    const free = placeBalloon({ size, bounds, anchor: head, avoid: box(20, 100, 350, 60), prefer: 'above' });
    expect(free.side).toBe('above');
    expect(free.top).toBe(600 - 12 - size.height);
    expect(free.covers).toBe(false);
    // o alvo logo acima da cabeça, e embaixo não cabe: encosta na borda de cima, longe da cabeça, sem cobrir o alvo
    const tight = placeBalloon({ size, bounds, anchor: head, avoid: box(20, 470, 350, 60), prefer: 'above' });
    expect(tight.top).toBe(bounds.top);
    expect(tight.covers).toBe(false);
    // nem encostado cabe: fica no lado com mais espaço e avisa que cobre
    const none = placeBalloon({ size, bounds, anchor: head, avoid: box(20, 100, 350, 560), prefer: 'above' });
    expect(none.covers).toBe(true);
  });

  it('um alvo maior que a tela: o balão fica dentro da área e avisa que cobre', () => {
    const target = box(16, 40, 358, 760);
    const p = placeBalloon({ size, bounds, anchor: target, avoid: target });
    expect(p.top).toBeGreaterThanOrEqual(bounds.top);
    expect(p.top + size.height).toBeLessThanOrEqual(boxBottom(bounds));
    expect(p.covers).toBe(true);
    expect(p.tail).toBeNull();
  });

  it('sem âncora, encosta embaixo (onde o Zeno fica), ou em cima se embaixo cobre o alvo', () => {
    const p = placeBalloon({ size, bounds });
    expect(p.side).toBe('dock');
    expect(p.top).toBe(boxBottom(bounds) - size.height);
    expect(p.left).toBe(Math.round(16 + (358 - 340) / 2));
    const low = box(30, 700, 300, 40);
    const q = placeBalloon({ size, bounds, avoid: low });
    expect(q.top).toBe(bounds.top);
  });

  it('encostado em cima, a ponta aponta para o alvo que está embaixo', () => {
    const target = box(40, 300, 100, 40);
    const p = placeBalloon({ size, bounds, dock: 'top', avoid: target, pointTo: target });
    expect(p.top).toBe(bounds.top);
    expect(p.side).toBe('above');
    expect(p.tail).toBe(Math.max(TAIL_MARGIN, Math.round(90 - p.left)));
  });

  it('o teclado aberto encolhe a área: o balão sobe junto', () => {
    const withKeyboard: Box = { ...bounds, height: 380 };
    const target = box(40, 300, 200, 50);
    const p = placeBalloon({ size, bounds: withKeyboard, anchor: target, avoid: target });
    expect(p.top + size.height).toBeLessThanOrEqual(boxBottom(withKeyboard));
    expect(intersects({ ...p, ...size }, target)).toBe(false);
  });
});

describe('ao lado do Zeno', () => {
  // o app inteiro (390 × 844) e a cabeça dele num canto: em cima à direita, ou embaixo à esquerda
  const app: Box = { left: 0, top: 0, width: 390, height: 844 };
  const topRight = box(298, 10, 71, 68);
  const bottomLeft = box(22, 616, 71, 68);

  it('sabe o canto pela cabeça', () => {
    expect(zenoCorner(topRight, app)).toEqual({ side: 'right', row: 'top' });
    expect(zenoCorner(bottomLeft, app)).toEqual({ side: 'left', row: 'bottom' });
  });

  it('o balão fica do lado de dentro, com a largura que sobra até o casco', () => {
    const w = besideWidth(bounds, topRight, app, 340);
    expect(16 + w).toBeLessThanOrEqual(topRight.left - 8);
    expect(besideWidth(bounds, bottomLeft, app, 340)).toBe(Math.min(340, 16 + 358 - (22 + 71 + 8)));
  });

  it('em cima, o topo do balão fica na altura da cabeça; embaixo, o fim fica nos pés; a ponta sai do lado dele', () => {
    const h = 164;
    const top = placeBeside({ size: { width: 240, height: 150 }, bounds, head: box(298, 120, 71, 68), height: h }, app);
    expect(top).toMatchObject({ top: 120, side: 'left' });
    expect(top!.left + 240).toBeLessThanOrEqual(298);
    expect(top!.tail).toBe(Math.round(120 + 34 - 120));
    const low = placeBeside({ size: { width: 240, height: 150 }, bounds, head: bottomLeft, height: h }, app);
    // os pés passam do fim da área (a barra de abas): o balão para no fim da área
    expect(low).toMatchObject({ side: 'right', top: Math.min(616 + h, boxBottom(bounds)) - 150 });
    expect(low!.left).toBeGreaterThanOrEqual(22 + 71);
  });

  it('encostado em cima (o Começar), e null quando cobriria o alvo', () => {
    const pinned = placeBeside(
      { size: { width: 240, height: 120 }, bounds, head: topRight, height: 164, pinTop: true },
      app,
    );
    expect(pinned!.top).toBe(bounds.top);
    // a cabeça fica acima do balão: a ponta sai perto do topo, longe do canto
    expect(pinned!.tail).toBe(TAIL_MARGIN);
    const blocked = placeBeside(
      {
        size: { width: 240, height: 120 },
        bounds,
        head: topRight,
        height: 164,
        pinTop: true,
        avoid: box(16, 150, 358, 60),
      },
      app,
    );
    expect(blocked).toBeNull();
  });
});

describe('o véu', () => {
  it('o furo cresce em volta do alvo, com o raio do alvo', () => {
    const hole = holeFor(box(20, 100, 200, 60), 20);
    expect(hole).toMatchObject({ left: 14, top: 94, width: 212, height: 72, radius: 26 });
    expect(holeFor(box(0, 0, 10, 10), 99).radius).toBe(11);
  });

  it('um alvo da largura da tela não deixa o anel cortado na borda', () => {
    const hole = clampHole(holeFor(box(0, 100, 390, 60), 0), { width: 390, height: 844 });
    expect(hole.left).toBe(3);
    expect(hole.left + hole.width).toBe(387);
  });

  it('o caminho tem a área inteira e o furo', () => {
    expect(veilPath({ width: 390, height: 844 }, null)).toBe('M0 0H390V844H0Z');
    const d = veilPath({ width: 390, height: 844 }, { ...box(10, 10, 100, 50), radius: 8 });
    expect(d.startsWith('M0 0H390V844H0Z')).toBe(true);
    expect(d.match(/A/g)).toHaveLength(4);
  });

  it('no passo de fazer, as faixas seguram o toque em volta do furo, e o furo fica livre', () => {
    const area = { width: 390, height: 844 };
    const hole = box(20, 200, 300, 60);
    const bands = blockersAround(area, hole);
    expect(bands).toHaveLength(4);
    for (const b of bands) expect(intersects(b, hole)).toBe(false);
    const total = bands.reduce((s, b) => s + b.width * b.height, 0);
    expect(total).toBe(area.width * area.height - hole.width * hole.height);
  });
});

describe('scrollTopFor', () => {
  const band = { top: 0, bottom: 780 };
  it('não rola quando o alvo está à vista com lugar para o balão', () => {
    expect(scrollTopFor({ target: box(16, 100, 358, 120), band, scrollTop: 0, maxScroll: 2000 })).toBeNull();
  });

  it('rola até o alvo ficar no alto da faixa, sem passar do fim', () => {
    const next = scrollTopFor({ target: box(16, 1200, 358, 60), band, scrollTop: 0, maxScroll: 2000 });
    expect(next).toBe(Math.round(1200 - 780 * 0.25));
    expect(scrollTopFor({ target: box(16, 1200, 358, 60), band, scrollTop: 0, maxScroll: 500 })).toBe(500);
  });

  it('com o Zeno no canto de cima, o alvo fica abaixo dele, e um alvo alto continua para baixo da tela', () => {
    const next = scrollTopFor({ target: box(16, 1200, 358, 60), band, scrollTop: 0, maxScroll: 2000, above: 220 });
    expect(next).toBe(1200 - 220);
    const tall = scrollTopFor({ target: box(16, 900, 358, 640), band, scrollTop: 0, maxScroll: 2000, above: 220 });
    expect(tall).toBe(900 - 220);
  });

  it('um alvo perto da barra de abas sobe para o balão caber embaixo', () => {
    const next = scrollTopFor({ target: box(16, 690, 358, 64), band, scrollTop: 400, maxScroll: 2000 });
    expect(next).not.toBeNull();
    expect(next!).toBeGreaterThan(400);
  });
});

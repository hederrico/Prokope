// @vitest-environment node
import { stripTargets, stripTicks, stripX } from './stripLayout';

// a faixa do iPhone de 390: 358 px, das 6h às 23h
const G = { start: 360, end: 1380, width: 358 };

describe('faixa do dia (Resumo)', () => {
  it('cada horário tem o seu lugar na faixa, sem encostar na borda', () => {
    expect(stripX(360, G)).toBe(10);
    expect(stripX(1380, G)).toBe(348);
    expect(stripX(870, G)).toBeCloseTo(179);
    // fora do trecho, fica preso na borda
    expect(stripX(200, G)).toBe(10);
  });

  it('pontos longe uns dos outros têm cada um a sua área de toque de 44 px', () => {
    const t = stripTargets(
      [
        { id: 'wake', minutes: 410 },
        { id: 'lunch', minutes: 760 },
      ],
      G,
    );
    expect(t.map((x) => x.ids)).toEqual([['wake'], ['lunch']]);
    for (const x of t) expect(x.x1 - x.x0).toBeGreaterThanOrEqual(44);
  });

  it('pontos no mesmo horário ficam lado a lado e viram um alvo só', () => {
    const t = stripTargets(
      [
        { id: 'checkin', minutes: 1230 },
        { id: 'dishes', minutes: 1230 },
        { id: 'trash', minutes: 1230 },
        { id: 'screens', minutes: 1260 },
        { id: 'bed', minutes: 1320 },
      ],
      G,
    );
    expect(t).toHaveLength(1);
    const [only] = t;
    expect(only!.ids).toEqual(['checkin', 'dishes', 'trash', 'screens', 'bed']);
    const xs = only!.dots.map((d) => d.x);
    // nenhum ponto em cima do outro: 18 px entre centros, na ordem do horário
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeCloseTo(18);
    // e todos dentro da faixa
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...xs)).toBeLessThanOrEqual(348);
  });

  it('as áreas de toque nunca se sobrepõem', () => {
    const minutes = [400, 420, 470, 520, 600, 700, 760, 900, 1000, 1100, 1180, 1230, 1300, 1370];
    const t = stripTargets(
      minutes.map((m, i) => ({ id: String(i), minutes: m })),
      G,
    );
    for (let i = 1; i < t.length; i++) expect(t[i]!.x0).toBeGreaterThanOrEqual(t[i - 1]!.x1 - 0.01);
    for (const x of t) expect(x.x1 - x.x0).toBeGreaterThanOrEqual(44);
    expect(t.flatMap((x) => x.ids)).toHaveLength(minutes.length);
  });

  it('na borda, a área de toque cresce para dentro', () => {
    const [first] = stripTargets([{ id: 'early', minutes: 360 }], G);
    expect(first!.x0).toBe(-12);
    expect(first!.x1).toBe(32);
  });

  it('marcas de 3 em 3 horas', () => {
    expect(stripTicks(360, 1380)).toEqual([360, 540, 720, 900, 1080, 1260]);
    expect(stripTicks(300, 1440)).toEqual([360, 540, 720, 900, 1080, 1260, 1440]);
  });
});

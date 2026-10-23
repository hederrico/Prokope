// As partes puras do Zeno (sem three.js): as molas, o lugar na tela e as cores do casco.
import { describe, expect, it } from 'vitest';
import { cssColor, shellPlates, ZENO_COLORS } from '../color';
import { talkSeconds } from '../lines';
import {
  canvasBox,
  drawRatio,
  footprint,
  spotAwayFrom,
  spotFor,
  unitPx,
  zenoPx,
  ZENO_UNITS,
  type Rect,
  type StageMetrics,
} from '../place';
import { DEFAULT_SHELL, pillarFill, shellColors } from '../shell';
import { aim, makeParam, makeParams, REST, springFrom, SPRINGS, stepParam, type Param } from '../springs';

/** Anda a mola em quadros de 60 por segundo e devolve os valores. */
function run(p: Param, seconds: number, fps = 60): number[] {
  const out: number[] = [];
  let t = 0;
  const dt = 1 / fps;
  for (let i = 0; i < seconds * fps; i++) {
    t += dt;
    stepParam(p, dt, t);
    out.push(p.v);
  }
  return out;
}

describe('molas do Zeno', () => {
  it('usam visualDuration e bounce como o Motion: bounce 0 é amortecimento crítico', () => {
    const s = springFrom(0.35, 0);
    expect(s.c * s.c).toBeCloseTo(4 * s.k, 6);
    // quanto mais bounce, menos amortecimento
    expect(springFrom(0.35, 0.25).c).toBeLessThan(s.c);
    expect(SPRINGS.calma).toEqual(springFrom(0.35, 0));
    expect(SPRINGS.toque).toEqual(springFrom(0.25, 0.25));
    expect(SPRINGS.festa).toEqual(springFrom(0.6, 0.35));
  });

  it('a mola calma chega ao alvo sem passar dele e assenta de vez', () => {
    const p = makeParam(0);
    aim(p, 1, SPRINGS.calma);
    const vs = run(p, 1);
    expect(Math.max(...vs)).toBeLessThanOrEqual(1);
    expect(p.v).toBe(1);
    expect(p.vel).toBe(0);
  });

  it('a mola do toque passa um pouco do alvo e volta', () => {
    const p = makeParam(0);
    aim(p, 1, SPRINGS.toque);
    const vs = run(p, 1.5);
    expect(Math.max(...vs)).toBeGreaterThan(1);
    expect(Math.max(...vs)).toBeLessThan(1.2);
    expect(p.v).toBe(1);
  });

  it('um quadro longo não desanda a mola (passos pequenos por dentro)', () => {
    const p = makeParam(0);
    aim(p, 2, SPRINGS.rapido);
    const vs = run(p, 1, 20);
    expect(vs.every(Number.isFinite)).toBe(true);
    expect(Math.max(...vs)).toBeLessThan(2.5);
    expect(p.v).toBe(2);
  });

  it('a curva no tempo segue a função e termina no alvo', () => {
    const p = makeParam(0);
    p.t = 1;
    p.tw = { fn: (u) => u, t0: 0, dur: 0.5 };
    stepParam(p, 0.25, 0.25);
    expect(p.v).toBeCloseTo(0.5);
    stepParam(p, 0.3, 0.55);
    expect(p.v).toBe(1);
    expect(p.tw).toBeNull();
  });

  it('com movimento reduzido, vai direto para o alvo', () => {
    const p = makeParam(0);
    aim(p, 0.7, SPRINGS.lento, true);
    expect(p.v).toBe(0.7);
    expect(p.vel).toBe(0);
  });

  it('começa na pose de descanso', () => {
    const P = makeParams();
    expect(P.rootYaw.v).toBe(REST.rootYaw);
    expect(P.limbs.v).toBe(1);
    expect(P.rootX.v).toBe(0);
    expect(P.glideY.v).toBe(0);
  });
});

describe('o lugar na tela', () => {
  const m: StageMetrics = { width: 390, height: 844, bottomInset: 84, topInset: 98 };

  it('o tamanho dele: 22% da altura do app, entre 104 e 164 px', () => {
    expect(zenoPx(844)).toBe(164);
    expect(zenoPx(400)).toBe(104);
    expect(zenoPx(600)).toBeCloseTo(132);
    expect(unitPx(844) * ZENO_UNITS).toBeCloseTo(164);
  });

  it('embaixo: os pés logo acima da barra de abas (e da área segura); em cima: abaixo do cabeçalho', () => {
    const b = spotFor('left', 'bottom', m);
    expect(b.y).toBe(844 - 84 - 4);
    expect(b.x).toBeCloseTo(164 * 0.62);
    expect(spotFor('right', 'bottom', m).x).toBeCloseTo(390 - 164 * 0.62);
    const t = spotFor('left', 'top', m);
    expect(t.y).toBe(98 + 164 + 10);
    // a cabeça não sobe no cabeçalho
    expect(footprint(t, m.height).top).toBeGreaterThanOrEqual(98);
  });

  it('longe do alvo: o lado oposto, sem cobrir o alvo', () => {
    const intersects = (a: Rect, b: Rect) =>
      a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;
    // alvo embaixo à esquerda: ele vai para baixo à direita
    const left: Rect = { left: 16, top: 700, width: 120, height: 44 };
    const s1 = spotAwayFrom(left, m);
    expect(s1).toMatchObject({ side: 'right', row: 'bottom' });
    expect(intersects(footprint(s1, m.height), left)).toBe(false);
    // alvo à direita: ele fica à esquerda
    const right: Rect = { left: 300, top: 300, width: 60, height: 44 };
    expect(spotAwayFrom(right, m).side).toBe('left');
    // uma faixa larga embaixo cobre os dois cantos de baixo: ele sobe
    const band: Rect = { left: 0, top: 620, width: 390, height: 140 };
    const s3 = spotAwayFrom(band, m);
    expect(s3.row).toBe('top');
    expect(intersects(footprint(s3, m.height), band)).toBe(false);
  });

  it('o canvas: inteiro em pixels, só em volta dele, com folga para os braços, a touca e o pulo', () => {
    const b = canvasBox(101.68, 756.3, 844);
    for (const v of Object.values(b)) expect(Number.isInteger(v)).toBe(true);
    expect(b.width).toBeLessThan(390 * 0.75);
    expect(b.height).toBeLessThan(844 / 2);
    const f = footprint({ x: 101.68, y: 756.3 }, 844);
    expect(b.left).toBeLessThanOrEqual(f.left);
    expect(b.top).toBeLessThanOrEqual(f.top - unitPx(844) * 0.5);
    expect(b.left + b.width).toBeGreaterThanOrEqual(f.left + f.width);
    expect(b.top + b.height).toBeGreaterThanOrEqual(f.top + f.height);
    // o mesmo tamanho em qualquer lugar: só a posição muda
    const c = canvasBox(300.2, 200.7, 844);
    expect([c.width, c.height]).toEqual([b.width, b.height]);
  });

  it('a densidade do desenho é no máximo 2', () => {
    expect(drawRatio(3)).toBe(2);
    expect(drawRatio(2)).toBe(2);
    expect(drawRatio(1.5)).toBe(1.5);
    expect(drawRatio(undefined)).toBe(1);
  });
});

describe('as cores do casco', () => {
  it('o fill da paleta, o mesmo da classe .hued, com o ajuste de Damasco e Sálvia', () => {
    expect(pillarFill('mel', false)).toEqual([0.85, 0.075, 90]);
    expect(pillarFill('mel', true)).toEqual([0.78, 0.08, 90]);
    expect(pillarFill('salvia', false)).toEqual([0.905, 0.075, 150]);
    expect(pillarFill('salvia', true)).toEqual([0.82, 0.08, 150]);
    expect(pillarFill('damasco', false)).toEqual([0.815, 0.075, 60]);
    expect(pillarFill('damasco', true)).toEqual([0.73, 0.08, 60]);
  });

  it('segue os pilares ativos, na ordem; sem pilar, as cores do plano base', () => {
    expect(shellColors(['rosa', 'ceu'], false)).toEqual([pillarFill('rosa', false), pillarFill('ceu', false)]);
    // uma cor que não existe fica de fora
    expect(shellColors(['rosa', 'turquesa'], false)).toEqual([pillarFill('rosa', false)]);
    expect(shellColors([], true)).toEqual(DEFAULT_SHELL.map((k) => pillarFill(k, true)));
  });

  it('as placas de cima alternam os pilares; a margem é sempre igual', () => {
    const cols = shellColors(['lavanda', 'salvia', 'damasco'], false);
    const [top, middle, margin] = shellPlates(cols);
    expect(top).toHaveLength(5);
    expect(middle).toHaveLength(6);
    expect(margin).toHaveLength(10);
    expect(top.slice(0, 3)).toEqual(cols);
    expect(top[3]).toEqual(cols[0]);
    // a segunda fileira começa duas cores adiante, para as placas não ficarem em coluna
    expect(middle[0]).toEqual(cols[2]);
    expect(margin.every((c) => c === ZENO_COLORS.margem)).toBe(true);
    // um pilar só: o casco inteiro numa cor
    expect(new Set(shellPlates([cols[0]]).slice(0, 2).flat())).toEqual(new Set([cols[0]]));
  });

  it('OKLCH vira a cor do canvas', () => {
    expect(cssColor([1, 0, 0])).toBe('rgb(255, 255, 255)');
    expect(cssColor([0, 0, 0])).toBe('rgb(0, 0, 0)');
    expect(cssColor(ZENO_COLORS.pele)).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it('a boca mexe pelo tempo da fala, no máximo 2,2 s', () => {
    expect(talkSeconds('Oi!')).toBeCloseTo(0.35 + 3 * 0.045);
    expect(talkSeconds('Daqui a pouco é hora de desligar as telas, e amanhã tem mais.')).toBe(2.2);
  });
});

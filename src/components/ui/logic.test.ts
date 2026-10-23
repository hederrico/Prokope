// Lógica dos componentes: escala da GoalBar, nomes lidos pelo VoiceOver e formatos.
import { describe, expect, it } from 'vitest';
import { ease } from '@/motion/tokens';
import { daysSinceLabel } from './DaysSinceTile';
import { goalBarLabel, goalBarScale } from './GoalBar';
import { bezierTimeFor, fmtNumber, nodeText, spellUnits } from './lib';
import { pillarAttrs } from './pillar';
import { numberParts } from './RollingNumber';
import { formatShortDate } from './TimeValue';
import { WeekDots } from './WeekDots';
import { dayParts, weekDayLabel } from './WeekStrip';
import { createElement } from 'react';

describe('goalBarScale', () => {
  it('termina em 1,5 × a meta, como no quadro (80 g → 120 g)', () => {
    expect(goalBarScale(0, 80)).toBe(120);
    expect(goalBarScale(46, 80)).toBe(120);
    expect(goalBarScale(120, 80)).toBe(120);
    expect(goalBarScale(1.5, 3)).toBe(4.5);
  });

  it('cresce quando o total passa do fim, com folga, em passos de um quarto da meta', () => {
    expect(goalBarScale(136, 80)).toBe(160);
    expect(goalBarScale(121, 80)).toBe(140);
    const s = goalBarScale(300, 80);
    expect(s % 20).toBe(0);
    expect(300 / s).toBeLessThanOrEqual(0.9);
  });

  it('nunca deixa a barra vazar e nunca encolhe quando o total sobe', () => {
    let prev = 0;
    for (let total = 0; total <= 400; total += 3) {
      const s = goalBarScale(total, 80);
      expect(s).toBeGreaterThanOrEqual(total);
      expect(s).toBeGreaterThanOrEqual(120);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it('aguenta meta zero', () => {
    expect(goalBarScale(0, 0)).toBeGreaterThan(0);
    expect(goalBarScale(50, 0)).toBeGreaterThanOrEqual(50);
  });
});

describe('nomes lidos', () => {
  it('GoalBar: "46 de 80 gramas" e decimais com vírgula', () => {
    expect(goalBarLabel(46, 80, 'gramas')).toBe('46 de 80 gramas');
    expect(goalBarLabel(1.5, 3, 'litros')).toBe('1,5 de 3 litros');
  });

  it('dias da semana: passado com a porcentagem, futuro só o nome', () => {
    expect(weekDayLabel({ date: '2026-10-22', value: 0.25, state: 'done' }, '2026-10-22')).toBe('Quinta, 22, hoje. 25% do dia feito.');
    expect(weekDayLabel({ date: '2026-10-21', value: 0.6, state: 'done' }, '2026-10-22')).toBe('Quarta, 21. 60% do dia feito.');
    expect(weekDayLabel({ date: '2026-10-20', value: 0, state: 'paused' }, '2026-10-22')).toBe('Terça, 20. Pausado.');
    expect(weekDayLabel({ date: '2026-10-23', value: 0, state: 'future' }, '2026-10-22')).toBe('Sexta, 23');
  });

  it('dias sem: recorde ou "seu recorde"', () => {
    expect(daysSinceLabel('Zero refrigerante', 12, 21)).toBe('Zero refrigerante, 12 dias sem, recorde 21');
    expect(daysSinceLabel('Sem Shorts e TikTok', 32, 32)).toBe('Sem Shorts e TikTok, 32 dias sem, seu recorde');
    expect(daysSinceLabel('Zero refrigerante', 1, 21)).toBe('Zero refrigerante, 1 dia sem, recorde 21');
  });

  it('unidades por extenso', () => {
    expect(spellUnits('500 ml')).toBe('500 mililitros');
    expect(spellUnits('1 L')).toBe('1 litro');
    expect(spellUnits('1,5 L')).toBe('1,5 litros');
    expect(spellUnits('6 g')).toBe('6 gramas');
    expect(spellUnits('meta 80 g')).toBe('meta 80 gramas');
    expect(spellUnits('Leite')).toBe('Leite');
  });

  it('o subtítulo vira texto sem as bolinhas decorativas', () => {
    const sub = [createElement(WeekDots, { key: 'd', total: 7, done: 2 }), createElement('span', { key: 't' }, '2 de 7 · meta 6')];
    expect(nodeText(sub)).toBe('2 de 7 · meta 6');
  });
});

describe('formatos', () => {
  it('data curta em português', () => {
    expect(formatShortDate('2026-12-24')).toBe('qui, 24 dez');
  });
  it('partes da data sem fuso', () => {
    expect(dayParts('2026-10-19')).toEqual({ weekday: 1, day: 19 });
  });
  it('número com vírgula', () => {
    expect(fmtNumber(83.6)).toBe('83,6');
    expect(fmtNumber(1000)).toBe('1.000');
  });
  it('algarismos do número que rola, da unidade para a esquerda', () => {
    expect(numberParts(32)).toEqual([
      { key: 'i1', d: 3 },
      { key: 'i0', d: 2 },
    ]);
    expect(numberParts(0)).toEqual([{ key: 'i0', d: 0 }]);
  });
});

describe('curva e cor', () => {
  it('a linha da meta acende cedo com --ease-out (40% do caminho em bem menos de 40% do tempo)', () => {
    expect(bezierTimeFor(ease.out, 0)).toBe(0);
    expect(bezierTimeFor(ease.out, 1)).toBe(1);
    const t = bezierTimeFor(ease.out, 0.4);
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(0.25);
    expect(bezierTimeFor(ease.out, 0.8)).toBeGreaterThan(t);
  });
  it('cor do pilar: tom nomeado ou chave da paleta', () => {
    expect(pillarAttrs('familia')).toEqual({ 'data-pillar': 'familia' });
    expect(pillarAttrs('mel')).toEqual({ className: 'hued', 'data-hue': 'mel' });
    expect(pillarAttrs(undefined)).toEqual({});
  });
});

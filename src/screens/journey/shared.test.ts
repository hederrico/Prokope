// Textos da Jornada e da revisão: os rótulos do plano de corrida e as linhas do resumo, como no quadro.
import { describe, expect, it } from 'vitest';
import { RUN_PLAN } from '@/data';
import type { Habit } from '@/types';
import { joinNames, runLegend, runWeekLabel, scheduleLabel } from './shared';
import { lineDots, splitLine } from '@/screens/review/lines';

describe('plano de corrida', () => {
  it('rotula as semanas como o quadro', () => {
    expect(RUN_PLAN.map(runWeekLabel)).toEqual([
      '8 × (1 + 1,5)',
      '8 × (1 + 1)',
      '6 × (1,5 + 1,5)',
      '5 × (2 + 1,5)',
      '4 × (3 + 1,5)',
      '3 × (4 + 1,5)',
      '3 × (5 + 2)',
      '2 × (8 + 2)',
      '2 × (10 + 2)',
      '15 + 2 + 8',
      '20 min contínuos',
      '25 min contínuos',
      '30 min contínuos',
    ]);
  });

  it('monta a legenda do treino da semana 1', () => {
    expect(runLegend(RUN_PLAN[0]).map((r) => `${r.label}: ${r.value}`)).toEqual([
      'Aquecimento caminhando: 5 min',
      'Trote: 8 × 1 min',
      'Caminhada: 8 × 1,5 min',
      'Volta à calma: 5 min',
    ]);
    // semana contínua: sem caminhada no meio
    expect(runLegend(RUN_PLAN[12]).map((r) => r.label)).toEqual(['Aquecimento caminhando', 'Trote', 'Volta à calma']);
  });

  it('escreve os dias de treino', () => {
    expect(scheduleLabel([2, 0], '07:10')).toBe('Seg e qua · 7h10');
    expect(scheduleLabel([0, 2, 4], null)).toBe('Seg, qua e sex');
    expect(joinNames(['a'])).toBe('a');
  });
});

describe('linhas da revisão', () => {
  const habit = (name: string) => ({ name }) as Habit;
  it('separa título e legenda', () => {
    expect(splitLine({ habitId: 'a', text: 'Telas desligadas em 7 de 7 noites', done: 7, of: 7, ratio: 1 }, habit('Telas desligadas'))).toEqual({
      title: 'Telas desligadas',
      sub: '7 de 7 noites',
    });
    expect(splitLine({ habitId: 'b', text: 'Proteína acima de 80 g em 5 dias', done: 5, of: 7, ratio: 0.7 }, habit('Proteína'))).toEqual({
      title: 'Proteína acima de 80 g',
      sub: 'em 5 dias',
    });
    expect(splitLine({ habitId: 'c', text: 'Zero refrigerante a semana toda', done: 7, of: 7, ratio: 1 }, habit('Zero refrigerante'))).toEqual({
      title: 'Zero refrigerante',
      sub: 'a semana toda',
    });
    expect(splitLine({ habitId: 'd', text: 'Acordar às 6h50 aconteceu em 5 de 7 dias', done: 5, of: 7, ratio: 0.7 }, habit('Acordar'))).toEqual({
      title: 'Acordar às 6h50',
      sub: '5 de 7 dias',
    });
  });

  it('limita as bolinhas a 7', () => {
    expect(lineDots({ habitId: 'a', text: '', done: 9, of: 10, ratio: 0.9 })).toEqual({ total: 7, on: 7 });
    expect(lineDots({ habitId: 'a', text: '', done: 1, of: 2, ratio: 0.5 })).toEqual({ total: 2, on: 1 });
  });
});

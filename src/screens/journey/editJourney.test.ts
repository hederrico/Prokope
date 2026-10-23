// Editar jornada: as linhas (acordar e deitar juntos), quem pode entrar numa fase e os textos de cada estado.
import { describe, expect, it } from 'vitest';
import type { HabitListItem, PhaseHabit, PhaseView } from '@/data';
import type { Habit } from '@/types';
import {
  addCandidates,
  candidateSubtitle,
  fromPhases,
  journeyRows,
  participle,
  rowSubtitle,
  stopText,
  verb,
} from './editJourney';

const TODAY = '2026-10-22';

function h(id: string, patch: Partial<Habit> = {}): Habit {
  return {
    id,
    name: id,
    type: 'check',
    icon: 'circle',
    pillarId: 'p1',
    alsoIn: [],
    phase: 1,
    startDay: '2026-09-21',
    goal: {},
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'day' },
    quickAdds: [],
    checklist: [],
    order: 0,
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  };
}

function ph(habit: Habit, patch: Partial<PhaseHabit> = {}): PhaseHabit {
  return { habit, from: habit.phase, until: habit.untilPhase ?? null, stopDay: null, stopped: false, ...patch };
}

function item(habit: Habit, status: HabitListItem['status']): HabitListItem {
  return { habit, pillar: null, alsoIn: [], status, pausedUntil: null, startsOn: null };
}

const phase = (number: number, status: PhaseView['status']) => ({ number, status }) as PhaseView;

describe('linhas de uma fase', () => {
  it('o deitar vai junto do acordar quando os dois têm a mesma origem e a mesma parada', () => {
    const wake = h('wake', { name: 'Acordar', role: 'wake' });
    const bed = h('bed', { name: 'Deitar', role: 'bed' });
    const walk = h('walk', { name: 'Caminhada' });
    const rows = journeyRows([ph(wake), ph(walk), ph(bed)]);
    expect(rows.map((r) => [r.name, r.habits.map((x) => x.id)])).toEqual([
      ['Acordar e deitar', ['wake', 'bed']],
      ['Caminhada', ['walk']],
    ]);
    expect(rows[0].plural).toBe(true);
    // parados em fases diferentes: cada um na sua linha
    const apart = journeyRows([ph(wake, { until: 3 }), ph(bed)]);
    expect(apart.map((r) => r.name)).toEqual(['Acordar', 'Deitar']);
  });

  it('os textos da parada e da origem', () => {
    const row = journeyRows([ph(h('weight', { name: 'Peso' }), { until: 3 })])[0];
    expect(rowSubtitle(row, 'carried', 2, TODAY)).toBe('da fase 1 · para na fase 3');
    expect(rowSubtitle(row, 'carried', 3, TODAY)).toBe('da fase 1 · para nesta fase');
    expect(rowSubtitle(row, 'entering', 1, TODAY)).toBe('para na fase 3');
    expect(stopText({ until: 2, stopped: true, stopDay: TODAY }, 2, TODAY)).toBe('sai do dia a dia hoje');
    expect(stopText({ until: 2, stopped: true, stopDay: '2026-10-20' }, 2, TODAY)).toBe(
      'fora do dia a dia desde 20 out',
    );
    expect(rowSubtitle(journeyRows([ph(h('a'))])[0], 'entering', 1, TODAY)).toBeUndefined();
  });

  it('concordância e de onde vêm', () => {
    expect(participle({ name: 'Proteína', pair: false }, 'movid')).toBe('movida');
    expect(participle({ name: 'Peso', pair: false }, 'arquivad')).toBe('arquivado');
    expect(participle({ name: 'Telas desligadas', pair: false }, 'movid')).toBe('movidas');
    expect(participle({ name: 'Refeições livres', pair: false }, 'movid')).toBe('movidos');
    expect(participle({ name: 'Acordar e deitar', pair: true }, 'movid')).toBe('movidos');
    const [telas, futebol] = journeyRows([ph(h('t', { name: 'Telas desligadas' })), ph(h('f', { name: 'Futebol' }))]);
    expect([verb(telas, 'segue', 'seguem'), verb(futebol, 'segue', 'seguem')]).toEqual(['seguem', 'segue']);
    expect(fromPhases([1, 1])).toBe('da fase 1');
    expect(fromPhases([2, 1, 3])).toBe('das fases 1, 2 e 3');
  });
});

describe('quem pode entrar numa fase', () => {
  const p1 = h('p1');
  const p2 = h('p2', { phase: 2, startDay: '2026-10-12' });
  const p3 = h('p3', { phase: 3, startDay: null });
  const p4 = h('p4', { phase: 4, startDay: null });
  const loose = h('loose', { phase: null, startDay: '2026-09-01' });
  const archived = h('old', { phase: 4, startDay: null, archived: true });
  const stopping = h('stop', { phase: 3, startDay: null, untilPhase: 4 });
  const items = [
    item(p1, 'active'),
    item(p2, 'active'),
    item(p3, 'upcoming'),
    item(p4, 'upcoming'),
    item(loose, 'active'),
    item(archived, 'archived'),
    item(stopping, 'upcoming'),
  ];

  it('na fase de agora: os sem fase e os que esperam fases seguintes', () => {
    expect(addCandidates(items, phase(2, 'current')).map((i) => i.habit.id)).toEqual(['loose', 'p3', 'p4']);
  });

  it('numa fase futura: só os que ainda esperam (os do dia a dia já seguem nela)', () => {
    expect(addCandidates(items, phase(3, 'future')).map((i) => i.habit.id)).toEqual(['p4']);
    expect(addCandidates(items, phase(4, 'future')).map((i) => i.habit.id)).toEqual(['p3']);
  });

  it('cada um diz o que muda', () => {
    expect(candidateSubtitle({ from: null }, phase(2, 'current'))).toBe('sem fase · fica nesta fase');
    expect(candidateSubtitle({ from: 4 }, phase(3, 'future'))).toBe('da fase 4 · entra mais cedo');
    expect(candidateSubtitle({ from: 3 }, phase(2, 'current'))).toBe('da fase 3 · entra hoje');
    expect(candidateSubtitle({ from: 3 }, phase(4, 'future'))).toBe('da fase 3 · passa para esta fase');
  });
});

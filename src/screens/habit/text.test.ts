// Textos do hábito montados a partir dos dados (nada fixo por nome) e as células do calendário.
import type { Habit } from '@/types';
import type { CalendarCell } from '@/data';
import { habitCells, sheetForDay } from './cells';
import { agree, article, countNoun, habitSubtitle, onDay, pluralNoun, relativeDay, shortOf, waitingSentence } from './text';

function habit(patch: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Caminhada com o cachorro',
    shortName: 'caminhada',
    type: 'check',
    icon: 'salsicha',
    pillarId: 'p1',
    alsoIn: [],
    phase: 1,
    startDay: '2026-09-21',
    description: '20 min ou mais',
    goal: { value: 20, unit: 'min', partialMin: 10, perWeek: 6 },
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'morning' },
    quickAdds: [],
    checklist: [],
    order: 0,
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  };
}

describe('textos do hábito', () => {
  it('nome curto, plural e concordância', () => {
    expect(shortOf(habit())).toBe('caminhada');
    expect(shortOf(habit({ shortName: undefined, name: 'Leitura' }))).toBe('leitura');
    expect(pluralNoun('caminhada')).toBe('caminhadas');
    expect(pluralNoun('telas desligadas')).toBeNull();
    expect(countNoun(24, 'caminhada')).toBe('caminhadas');
    expect(countNoun(3, 'acordar')).toBe('dias feitos');
    expect(agree('Caminhada', 'marcado')).toBe('marcada');
    expect(agree('Acordar', 'marcado')).toBe('marcado');
    expect(agree('Telas desligadas', 'marcado')).toBe('marcadas');
    expect(article('caminhada')).toBe('a');
    expect(article('acordar')).toBe('o');
  });

  it('dias relativos para o toast e a folha', () => {
    expect(onDay('2026-10-21', '2026-10-22')).toBe('na quarta');
    expect(onDay('2026-10-18', '2026-10-22')).toBe('no domingo');
    expect(onDay('2026-10-22', '2026-10-22')).toBe('hoje');
    expect(onDay('2026-10-01', '2026-10-22')).toBe('em 1 de outubro');
    expect(relativeDay('2026-10-21', '2026-10-22')).toBe('ontem');
  });

  it('a linha de baixo do título e a espera dos padrões', () => {
    const h = habit();
    const goal = { value: 20, unit: 'min', partialMin: 10, direction: 'atLeast' as const, toleranceMin: 15, perWeek: 6, measuring: false };
    expect(habitSubtitle(h, goal)).toBe('20 min ou mais · meta 6 de 7 dias');
    expect(waitingSentence(4, 6, 'caminhada')).toBe(
      'Os padrões aparecem com 7 dias com e 7 sem. Faltam 4 dias com caminhada.',
    );
    expect(waitingSentence(0, 3, 'caminhada')).toBe(
      'Os padrões aparecem com 7 dias com e 7 sem. Os dias sem chegam no tempo deles.',
    );
  });

  it('células do calendário e a folha de cada dia', () => {
    const h = habit();
    const base = { habitId: 'h1', registered: false, value: null, goal: { direction: 'atLeast' as const, toleranceMin: 15, measuring: false } };
    const week: CalendarCell[] = [
      { ...base, day: '2026-09-30', state: 'done', isToday: false, inMonth: false },
      { ...base, day: '2026-10-21', state: 'notDone', isToday: false, inMonth: true },
      { ...base, day: '2026-10-22', state: 'done', isToday: true, inMonth: true },
      { ...base, day: '2026-10-23', state: 'future', isToday: false, inMonth: true },
    ];
    const [cells] = habitCells([week], h, '2026-10-22');
    expect(cells.map((c) => c.state)).toEqual(['e', 'n', 'd', 'f']);
    expect(cells[1].label).toBe('21 de outubro, sem caminhada');
    expect(cells[2].label).toBe('22 de outubro, hoje, caminhada feita');
    expect(cells[3].tappable).toBe(false);
    expect(sheetForDay(h, '2026-10-21')).toEqual({ name: 'corrigir', args: { habito: 'h1', dia: '2026-10-21' } });
    expect(sheetForDay(habit({ role: 'wake', type: 'time' }), '2026-10-21').name).toBe('acordar');
    expect(sheetForDay(habit({ role: 'bed', type: 'time' }), '2026-10-21').args.dia).toBe('2026-10-22');
  });
});

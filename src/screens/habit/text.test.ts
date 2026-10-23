// Textos do hábito montados a partir dos dados (nada fixo por nome) e as células do calendário.
import type { Habit } from '@/types';
import type { CalendarCell } from '@/data';
import { habitCells, sheetForDay } from './cells';
import {
  agree,
  article,
  countNoun,
  dayStateWords,
  habitSubtitle,
  onDay,
  patternWords,
  pluralNoun,
  relativeDay,
  shortOf,
  waitingSentence,
} from './text';

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
    expect(waitingSentence(4, 6, patternWords(h))).toBe(
      'Os padrões aparecem com 7 dias com e 7 sem. Faltam 4 dias com caminhada.',
    );
    expect(waitingSentence(0, 3, patternWords(h))).toBe(
      'Os padrões aparecem com 7 dias com e 7 sem. Os dias sem chegam no tempo deles.',
    );
  });

  it('padrões de um hábito comum: "com" e "sem" (como antes)', () => {
    const w = patternWords(habit());
    expect(w.sentence('mood', 4.1, 3.4)).toBe('Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4.');
    expect(w.basis({ withDays: 24, withoutDays: 8 })).toBe('24 dias com · 8 dias sem');
    expect(w.basis({ withDays: 14, withoutDays: 1 }, 'noite')).toBe('14 noites com · 1 noite sem');
    expect([w.withLabel, w.withoutLabel]).toEqual(['com caminhada', 'sem caminhada']);
    expect(w.almostAll).toBe('Você caminhou em quase todos os dias');
    expect(w.neverTwo).toBe('você nunca ficou dois dias seguidos sem caminhar');
    expect(w.similar('energy')).toBe('Por enquanto, a energia fica parecida nos dias com e sem caminhada.');
  });
});

describe('hábitos de horário: "no horário", "após o horário" e "sem registro" (nunca "sem acordar")', () => {
  const time = (name: string, shortName?: string) =>
    habit({ name, shortName, type: 'time', goal: { time: '06:50', toleranceMin: 15 }, description: undefined });
  const wake = time('Acordar', 'acordar');
  const bed = time('Deitar', 'deitar');
  // um hábito de horário cujo nome não é verbo
  const pill = time('Remédio');

  it('o dia: no horário, após o horário (anotado depois da meta) ou sem registro', () => {
    expect(dayStateWords('done', wake)).toBe('no horário');
    expect(dayStateWords('notDone', wake, { registered: true })).toBe('após o horário');
    expect(dayStateWords('notDone', wake, { registered: false })).toBe('sem registro');
    expect(dayStateWords('notDone', pill)).toBe('sem registro');
    expect(dayStateWords('paused', bed)).toBe('dia pausado');
    // os outros tipos seguem como antes
    expect(dayStateWords('notDone', habit(), { registered: false })).toBe('sem caminhada');
  });

  it('acordar: o pretérito do verbo ("Nos dias em que você acordou no horário")', () => {
    const w = patternWords(wake);
    expect(w.sentence('mood', 4.1, 3.4)).toBe(
      'Nos dias em que você acordou no horário, seu humor médio foi 4,1. Nos outros, 3,4.',
    );
    expect(w.basis({ withDays: 24, withoutDays: 8 })).toBe('24 dias no horário · 8 após o horário');
    expect(w.basis({ withDays: 1, withoutDays: 1 })).toBe('1 dia no horário · 1 após o horário');
    expect([w.withLabel, w.withoutLabel]).toEqual(['no horário', 'após o horário']);
    expect(w.almostAll).toBe('Você acordou no horário em quase todos os dias');
    expect(w.neverTwo).toBe('você nunca acordou após o horário dois dias seguidos');
    expect(w.similar('mood')).toBe('Por enquanto, o humor fica parecido nos dias em que você acordou no horário e nos outros.');
    expect(waitingSentence(4, 6, w)).toBe(
      'Os padrões aparecem com 7 dias no horário e 7 após o horário. Faltam 4 dias no horário.',
    );
    expect(waitingSentence(0, 1, w)).toBe(
      'Os padrões aparecem com 7 dias no horário e 7 após o horário. Os outros dias chegam no tempo deles.',
    );
    // nada de "com acordar" nem "sem acordar" em lugar nenhum
    const all = [w.days, w.withLabel, w.withoutLabel, w.rule(7), w.missing(1), w.othersLater, w.almostAll, w.neverTwo];
    expect(all.join(' ')).not.toMatch(/(com|sem) acordar/);
  });

  it('deitar: "deitou"; nas noites, a base conta noites', () => {
    const w = patternWords(bed);
    expect(w.days).toBe('dias em que você deitou no horário');
    expect(w.sentence('energy', 3.6, 2.8)).toBe(
      'Nos dias em que você deitou no horário, sua energia média foi 3,6. Nos outros, 2,8.',
    );
    expect(w.basis({ withDays: 14, withoutDays: 14 }, 'noite')).toBe('14 noites no horário · 14 após o horário');
  });

  it('um nome que não é verbo: "Nos dias com remédio no horário"', () => {
    const w = patternWords(pill);
    expect(w.sentence('mood', 4, 3)).toBe('Nos dias com remédio no horário, seu humor médio foi 4,0. Nos outros, 3,0.');
    expect(w.almostAll).toBe('O remédio ficou no horário em quase todos os dias');
    expect(w.neverTwo).toBe('você nunca ficou dois dias seguidos após o horário');
    // um nome derivado ("caminhada") também fica como nome: o verbo só vale quando o nome já é o verbo
    expect(patternWords(time('Caminhada', 'caminhada')).days).toBe('dias com caminhada no horário');
  });

  it('dias sem registro não viram "após o horário"', () => {
    const w = patternWords(wake, { noRecord: 2 });
    expect(w.basis({ withDays: 24, withoutDays: 8, noRecord: 2 })).toBe(
      '24 dias no horário · 6 após o horário · 2 sem registro',
    );
    expect(w.withoutLabel).toBe('nos outros dias');
    expect(w.rule(7)).toBe('Os padrões aparecem com 7 dias no horário e 7 nos outros.');
  });

  it('o calendário: hoje com horário depois da meta já é "após o horário", e não "ainda sem registro"', () => {
    const base = { habitId: 'h1', value: null, goal: { direction: 'atLeast' as const, toleranceMin: 15, measuring: false } };
    const week: CalendarCell[] = [
      { ...base, registered: true, day: '2026-10-20', state: 'done', isToday: false, inMonth: true },
      { ...base, registered: true, day: '2026-10-21', state: 'notDone', isToday: false, inMonth: true },
      { ...base, registered: false, day: '2026-10-19', state: 'notDone', isToday: false, inMonth: true },
      { ...base, registered: true, day: '2026-10-22', state: 'notDone', isToday: true, inMonth: true },
    ];
    const [cells] = habitCells([week], wake, '2026-10-22');
    expect(cells.map((c) => c.label)).toEqual([
      '20 de outubro, no horário',
      '21 de outubro, após o horário',
      '19 de outubro, sem registro',
      '22 de outubro, hoje, após o horário',
    ]);
    expect(cells.map((c) => c.state)).toEqual(['d', 'n', 'n', 'n']);
    // hoje sem nada anotado continua "ainda sem registro", com o contorno de por vir
    const [[todayBlank]] = habitCells([[{ ...week[3], registered: false }]], wake, '2026-10-22');
    expect(todayBlank.label).toBe('22 de outubro, hoje, ainda sem registro');
    expect(todayBlank.state).toBe('f');
  });
});

describe('o calendário e as folhas', () => {
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

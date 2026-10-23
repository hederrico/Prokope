// @vitest-environment node
// "Parar nesta fase": um hábito vale da fase em que entra até antes da fase em que para (untilPhase). A partir do
// primeiro dia da fase de parada (ou do dia gravado, quando a parada foi escolhida com a fase em curso), ele é como
// um hábito arquivado naquela data: some do Hoje e das contas, e os dias antes ficam no histórico.
import { correlation, topCorrelations, waitingPatterns } from '@/domain/correlation';
import { addDays, daysBetween } from '@/domain/day';
import { daysSince } from '@/domain/daysSince';
import { endDayOf, habitDay, isActiveOn, isInPlan, stopDayOf } from '@/domain/habitState';
import { phaseTimeline } from '@/domain/phases';
import { reviewSummary } from '@/domain/review';
import { constancy, dayCount, habitStrength, habitTotals } from '@/domain/stats';
import { todayItems } from '@/domain/today';
import { habitStatsView, habitsList, habitView, journeyView, reviewView } from '@/domain/views';
import { instantAt, DEFAULT_CLOCK } from '@/domain/day';
import { checkin, data, habit, mark, phase, slip } from './fixtures';

const TODAY = '2026-10-22';

/** As fases da história: 1 concluída, 2 em curso desde 12 out, 3 e 4 futuras. */
function phases(patch3: { start?: string | null } = {}) {
  return [
    phase(1, { start: '2026-09-21', end: '2026-10-11', closedAt: 1 }),
    phase(2, { start: '2026-10-12', end: '2026-11-01' }),
    phase(3, { start: patch3.start ?? null }),
    phase(4, { weeks: null }),
  ];
}

describe('parar numa fase: o dia em que o hábito sai', () => {
  it('documento antigo, sem o campo: segue como antes', () => {
    const walk = habit({ id: 'walk', type: 'check', phase: 1, startDay: '2026-09-21' });
    expect('untilPhase' in walk).toBe(false);
    const d = data({ habits: [walk], phases: phases() });
    expect(stopDayOf(walk, d)).toBeNull();
    expect(endDayOf(walk, d)).toBeNull();
    expect(isActiveOn(walk, TODAY, d)).toBe(true);
    expect(isInPlan(walk, TODAY, d)).toBe(true);
  });

  it('para numa fase futura: nada muda até ela começar; depois, sai no primeiro dia dela', () => {
    const weight = habit({ id: 'weight', type: 'check', phase: 1, startDay: '2026-09-21', untilPhase: 3 });
    const waiting = data({ habits: [weight], phases: phases() });
    expect(stopDayOf(weight, waiting)).toBeNull();
    expect(habitDay(weight, TODAY, waiting, TODAY).state).toBe('notDone');

    // a fase 3 começa amanhã: hoje ainda vale, amanhã já não
    const tomorrow = addDays(TODAY, 1);
    const scheduled = data({ habits: [weight], phases: phases({ start: tomorrow }) });
    expect(stopDayOf(weight, scheduled)).toBe(tomorrow);
    expect(isActiveOn(weight, TODAY, scheduled)).toBe(true);
    expect(isInPlan(weight, TODAY, scheduled)).toBe(true);
    expect(isActiveOn(weight, tomorrow, scheduled)).toBe(false);

    // a fase 3 começou em 20 out: dali em diante é como arquivado; os dias antes continuam
    const started = data({
      habits: [weight],
      phases: phases({ start: '2026-10-20' }),
      marks: [mark('weight', '2026-10-19'), mark('weight', '2026-10-20'), mark('weight', '2026-10-21')],
    });
    expect(habitDay(weight, '2026-10-19', started, TODAY).state).toBe('done');
    expect(habitDay(weight, '2026-10-20', started, TODAY).state).toBe('inactive');
    expect(habitDay(weight, TODAY, started, TODAY).state).toBe('inactive');
    expect(isInPlan(weight, TODAY, started)).toBe(false);
  });

  it('parar na fase em curso: sai a partir do dia gravado, sem mexer no começo da fase', () => {
    const walk = habit({
      id: 'walk',
      type: 'check',
      phase: 1,
      startDay: '2026-09-21',
      untilPhase: 2,
      untilDay: TODAY,
    });
    const d = data({ habits: [walk], phases: phases(), marks: [mark('walk', '2026-10-15')] });
    expect(stopDayOf(walk, d)).toBe(TODAY);
    expect(habitDay(walk, '2026-10-15', d, TODAY).state).toBe('done');
    expect(habitDay(walk, '2026-10-21', d, TODAY).state).toBe('notDone');
    expect(habitDay(walk, TODAY, d, TODAY).state).toBe('inactive');
  });

  it('arquivado antes da parada: vale o que vier primeiro', () => {
    const h = habit({
      id: 'h',
      type: 'check',
      phase: 1,
      startDay: '2026-09-21',
      untilPhase: 3,
      archived: true,
      archivedDay: '2026-10-18',
    });
    const d = data({ habits: [h], phases: phases({ start: '2026-10-20' }) });
    expect(endDayOf(h, d)).toBe('2026-10-18');
  });
});

describe('parar numa fase: as contas respeitam o dia da saída', () => {
  // caminhada feita todos os dias de 12 a 21 out; a fase 3 (de parada) começou em 18 out
  const walk = habit({ id: 'walk', type: 'check', phase: 1, startDay: '2026-09-21', untilPhase: 3 });
  const dishes = habit({ id: 'dishes', type: 'check', phase: 1, startDay: '2026-09-21' });
  const done = daysBetween('2026-10-01', '2026-10-21').map((d) => mark('walk', d));
  const d = data({
    habits: [walk, dishes],
    phases: phases({ start: '2026-10-18' }),
    marks: [...done, mark('dishes', '2026-10-20')],
  });

  it('Hoje e a conta do dia: some a partir do dia da saída', () => {
    expect(todayItems(d, TODAY, TODAY).map((i) => i.habit.id)).toEqual(['dishes']);
    expect(dayCount(d, '2026-10-20', TODAY)).toMatchObject({ done: 1, total: 1 });
    expect(dayCount(d, '2026-10-17', TODAY)).toMatchObject({ done: 1, total: 2 });
  });

  it('constância, força e totais: só os dias antes da saída', () => {
    expect(constancy(d, '2026-10-12', '2026-10-21', TODAY, { habitId: 'walk' })).toMatchObject({ points: 6, slots: 6 });
    const strength = habitStrength(walk, TODAY, d, TODAY);
    expect(strength.occurrences).toBe(daysBetween('2026-09-21', '2026-10-17').length);
    expect(habitTotals(walk, TODAY, d, TODAY)).toMatchObject({ withDays: 17 });
  });

  it('calendário do hábito: os dias depois da saída ficam como inativos', () => {
    const st = habitStatsView(d, 'walk', TODAY)!;
    const cells = st.month.weeks.flat();
    expect(cells.find((c) => c.day === '2026-10-17')?.state).toBe('done');
    expect(cells.find((c) => c.day === '2026-10-19')?.state).toBe('inactive');
  });

  it('Ajustes e o hábito: depois da saída, aparece como arquivado', () => {
    expect(habitView(d, 'walk', TODAY)?.status).toBe('archived');
    expect(habitsList(d, TODAY).find((h) => h.habit.id === 'walk')?.status).toBe('archived');
    expect(habitsList(d, TODAY).find((h) => h.habit.id === 'dishes')?.status).toBe('active');
    // antes de a fase de parada começar, segue ativo
    const before = data({ habits: [walk, dishes], phases: phases() });
    expect(habitView(before, 'walk', TODAY)?.status).toBe('active');
  });

  it('revisão: a semana da saída conta só os dias antes', () => {
    const summary = reviewSummary(d, '2026-10-12', TODAY);
    const line = summary.highlights.find((l) => l.habitId === 'walk');
    expect(line).toMatchObject({ done: 6, of: 6 });
    const after = reviewSummary(d, '2026-10-19', TODAY);
    expect(after.highlights.find((l) => l.habitId === 'walk')).toBeUndefined();
  });
});

describe('parar numa fase: correlações e dias sem', () => {
  it('as correlações usam só os dias antes; o hábito parado sai dos padrões', () => {
    const walk = habit({ id: 'walk', type: 'check', phase: 1, startDay: '2026-09-01', untilPhase: 3 });
    const days = daysBetween('2026-09-01', '2026-10-21');
    const marks = days.filter((_, i) => i % 2 === 0).map((day) => mark('walk', day));
    const checkins = days.map((day, i) => checkin(day, i % 2 === 0 ? 5 : 3));
    const going = data({ habits: [walk], phases: phases(), marks, checkins });
    expect(topCorrelations(going, TODAY).map((c) => c.habitId)).toEqual(['walk']);
    const stopped = data({ habits: [walk], phases: phases({ start: '2026-10-10' }), marks, checkins });
    expect(topCorrelations(stopped, TODAY)).toEqual([]);
    expect(waitingPatterns(stopped, TODAY)).toEqual([]);
    const c = correlation(walk, stopped, TODAY);
    expect(c.withDays + c.withoutDays).toBe(daysBetween('2026-09-01', '2026-10-09').length);
  });

  it('dias sem: a contagem fica no último dia em que o hábito valia', () => {
    const soda = habit({ id: 'soda', type: 'daysSince', phase: 1, startDay: '2026-10-01', untilPhase: 3 });
    const d = data({ habits: [soda], phases: phases({ start: '2026-10-11' }), slips: [slip('soda', '2026-10-05')] });
    const ds = daysSince(soda, d, TODAY);
    // 1 a 4 out, deslize no dia 5, e 6 a 10 out
    expect(ds.current).toBe(5);
    expect(ds.total).toBe(9);
  });
});

describe('Editar jornada: quem continua em cada fase', () => {
  const a = habit({ id: 'a', type: 'check', phase: 1, startDay: '2026-09-21' });
  const weight = habit({
    id: 'weight',
    type: 'number',
    phase: 1,
    startDay: '2026-09-21',
    goal: { measuring: true },
    untilPhase: 3,
  });
  const protein = habit({ id: 'protein', type: 'counter', phase: 2, startDay: '2026-10-12', goal: { value: 80 } });
  const run = habit({ id: 'run', type: 'weekly', phase: 3, startDay: null });
  const gone = habit({
    id: 'gone',
    type: 'check',
    phase: 1,
    startDay: '2026-09-21',
    archived: true,
    archivedDay: '2026-10-01',
  });
  const loose = habit({ id: 'loose', type: 'check', phase: null, startDay: '2026-09-01' });
  const d = data({ habits: [a, weight, protein, run, gone, loose], phases: phases() });

  it('as duas partes de cada fase, com a origem e a parada (as medições entram; arquivados não)', () => {
    const [p1, p2, p3, p4] = phaseTimeline(d, TODAY);
    expect(p1.entering.map((x) => x.habit.id)).toEqual(['a', 'weight']);
    expect(p1.carried).toEqual([]);
    // o resumo da fase (Jornada) continua sem as medições
    expect(p1.habits.map((h) => h.id)).toEqual(['a']);
    expect(p2.carried.map((x) => [x.habit.id, x.from])).toEqual([
      ['a', 1],
      ['weight', 1],
    ]);
    expect(p2.entering.map((x) => x.habit.id)).toEqual(['protein']);
    // a fase 3 mostra quem para nela (para o "Voltar a seguir" ficar no mesmo lugar)
    expect(p3.carried.map((x) => [x.habit.id, x.until])).toEqual([
      ['a', null],
      ['weight', 3],
      ['protein', null],
    ]);
    expect(p3.carried.find((x) => x.habit.id === 'weight')).toMatchObject({ stopped: false, stopDay: null });
    expect(p4.carried.map((x) => x.habit.id)).toEqual(['a', 'protein', 'run']);
    expect(journeyView(d, instantAt(TODAY, '12:00', DEFAULT_CLOCK)).loose.map((x) => x.habit.id)).toEqual(['loose']);
  });

  it('com a fase de parada já começada, a linha sabe que ele saiu', () => {
    const started = data({ habits: [a, weight], phases: phases({ start: '2026-10-20' }) });
    const p3 = phaseTimeline(started, TODAY)[2];
    expect(p3.carried.find((x) => x.habit.id === 'weight')).toMatchObject({ stopped: true, stopDay: '2026-10-20' });
  });

  it('revisão: a cintura parada não é pedida', () => {
    const waist = habit({
      id: 'waist',
      type: 'number',
      role: 'waist',
      phase: 1,
      startDay: '2026-09-21',
      untilPhase: 2,
      untilDay: '2026-10-15',
    });
    const d2 = data({ habits: [waist], phases: phases() });
    expect(reviewView(d2, TODAY, instantAt(TODAY, '12:00', DEFAULT_CLOCK)).waist).toBeNull();
  });
});

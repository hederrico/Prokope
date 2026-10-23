// @vitest-environment node
import { budgetWeek } from '@/domain/budget';
import { correlation } from '@/domain/correlation';
import { daysSince } from '@/domain/daysSince';
import { addDays, daysBetween, instantAt, DEFAULT_CLOCK } from '@/domain/day';
import { goalOn, habitDay } from '@/domain/habitState';
import { phaseSuggestion, phaseTimeline } from '@/domain/phases';
import { pillarExitPlan } from '@/domain/pillars';
import { reviewWindow } from '@/domain/review';
import { nextSession, RUN_PLAN, runElapsed, runPosition } from '@/domain/runPlan';
import { constancy, dayCount, ema, habitStrength, weekProgress } from '@/domain/stats';
import { gentleNudge, isDayClosed, todayItems, todayLayout, todayMode } from '@/domain/today';
import { weightTrend } from '@/domain/weight';
import { checkin, data, entry, habit, mark, pause, phase, pillar, profile, slip } from './fixtures';

const TODAY = '2026-10-22';

describe('estado do hábito num dia', () => {
  const walk = habit({ id: 'walk', type: 'check', goal: { value: 20, partialMin: 10, perWeek: 6 } });
  const trash = habit({
    id: 'trash',
    type: 'check',
    role: 'trash',
    schedule: { days: [], moment: 'evening', useCollectionDays: true },
  });
  const later = habit({ id: 'later', type: 'check', startDay: null, phase: 3 });

  it('feito, parcial, não feito, não conta hoje, pausado, fora da agenda, futuro e inativo', () => {
    const d = data({
      habits: [walk, trash, later],
      marks: [
        mark('walk', '2026-10-19'),
        mark('walk', '2026-10-20', { status: 'partial' }),
        mark('walk', '2026-10-18', { skipped: true, status: 'logged' }),
      ],
      pauses: [pause('2026-10-10', '2026-10-12')],
    });
    expect(habitDay(walk, '2026-10-19', d, TODAY).state).toBe('done');
    expect(habitDay(walk, '2026-10-20', d, TODAY).state).toBe('partial');
    expect(habitDay(walk, '2026-10-21', d, TODAY).state).toBe('notDone');
    expect(habitDay(walk, '2026-10-18', d, TODAY).state).toBe('skipped');
    expect(habitDay(walk, '2026-10-11', d, TODAY).state).toBe('paused');
    expect(habitDay(trash, '2026-10-21', d, TODAY).state).toBe('offSchedule'); // quarta
    expect(habitDay(trash, '2026-10-22', d, TODAY).state).toBe('notDone'); // quinta, dia de coleta
    expect(habitDay(walk, '2026-10-23', d, TODAY).state).toBe('future');
    expect(habitDay(later, TODAY, d, TODAY).state).toBe('inactive');
    expect(habitDay(walk, '2026-09-30', d, TODAY).state).toBe('inactive');
  });

  it('horário: tolerância de 15 min, 1h no fim de semana, e a meta da época', () => {
    const wake = habit({ id: 'wake', type: 'time', role: 'wake', goal: { timeKey: 'wake', toleranceMin: 15 } });
    const p = profile({
      weekendTolerance: true,
      scheduleLog: [
        { key: 'wake', time: '07:30', since: '2026-10-01' },
        { key: 'wake', time: '06:50', since: '2026-10-15' },
      ],
    });
    const d = data({ profile: p, habits: [wake] });
    expect(goalOn(wake, '2026-10-10', d).time).toBe('07:30');
    expect(goalOn(wake, '2026-10-22', d).time).toBe('06:50');
    expect(goalOn(wake, '2026-10-22', d).toleranceMin).toBe(15);
    expect(goalOn(wake, '2026-10-24', d).toleranceMin).toBe(60); // sábado
  });

  it('contador: feito na meta, parcial a partir do mínimo', () => {
    const water = habit({ id: 'water', type: 'counter', goal: { value: 3000, unit: 'ml', partialMin: 2000 } });
    const d = data({
      habits: [water],
      entries: [entry('water', '2026-10-20', 3000), entry('water', '2026-10-21', 2500)],
    });
    expect(habitDay(water, '2026-10-20', d, TODAY).state).toBe('done');
    expect(habitDay(water, '2026-10-21', d, TODAY).state).toBe('partial');
    expect(habitDay(water, '2026-10-19', d, TODAY).state).toBe('notDone');
  });
});

describe('a conta do dia', () => {
  it('conta marcar, horário, nota e dias sem; deixa fora contador, limite e medida', () => {
    const habits = [
      habit({ id: 'a', type: 'check' }),
      habit({ id: 'b', type: 'time', goal: { time: '06:50' } }),
      habit({ id: 'c', type: 'rating' }),
      habit({ id: 'd', type: 'daysSince' }),
      habit({ id: 'e', type: 'counter', goal: { value: 80 } }),
      habit({ id: 'f', type: 'budget', goal: { perWeek: 2 } }),
      habit({ id: 'g', type: 'number', role: 'weight', goal: { measuring: true } }),
      habit({ id: 'h', type: 'weekly', goal: { perWeek: 1 }, schedule: { days: [3], moment: 'day' } }),
      habit({ id: 'i', type: 'weekly', goal: { perWeek: 2 } }),
      habit({ id: 'j', type: 'check' }),
    ];
    const d = data({
      habits,
      marks: [mark('a', TODAY, { status: 'partial' }), mark('j', TODAY, { skipped: true, status: 'logged' })],
    });
    const c = dayCount(d, TODAY, TODAY);
    // a, b, c, d, h (futebol na quinta); j não conta hoje; i (sem dia fixo) fica fora
    expect(c.total).toBe(5);
    // parcial conta como feito; dias sem conta enquanto não há deslize
    expect(c.done).toBe(2);
  });
});

describe('constância e força', () => {
  const h = habit({ id: 'h', type: 'check', startDay: '2026-10-12' });
  it('parcial vale meio; pausas ficam fora; hoje entra só com o feito', () => {
    const d = data({
      habits: [h],
      marks: [mark('h', '2026-10-19'), mark('h', '2026-10-20', { status: 'partial' })],
      pauses: [pause('2026-10-21', '2026-10-21')],
    });
    // seg 1, ter 0,5, qua pausada, qui (hoje) sem registro não entra
    expect(constancy(d, '2026-10-19', '2026-10-25', TODAY).ratio).toBeCloseTo(0.75);
    const withToday = data({ ...{ habits: [h] }, marks: [mark('h', '2026-10-19'), mark('h', TODAY)] });
    // seg 1, ter 0, qua 0, qui 1
    expect(constancy(withToday, '2026-10-19', '2026-10-25', TODAY).ratio).toBeCloseTo(0.5);
  });

  it('a força pesa mais os dias recentes e pede 7 dias', () => {
    expect(ema([1, 1, 1, 1], 13)).toBe(1);
    expect(ema([1, 0], 13)!).toBeLessThan(ema([0, 1], 13)!);
    const young = habit({ id: 'y', type: 'check', startDay: '2026-10-20' });
    const d = data({ habits: [young], marks: [mark('y', '2026-10-20')] });
    expect(habitStrength(young, TODAY, d, TODAY).value).toBeNull();
    const old = habit({ id: 'o', type: 'check', startDay: '2026-10-01' });
    const marks = daysBetween('2026-10-01', '2026-10-21').map((day) => mark('o', day));
    const full = data({ habits: [old], marks });
    expect(habitStrength(old, TODAY, full, TODAY).value).toBeCloseTo(1);
    const paused = data({ habits: [old], marks, pauses: [pause('2026-10-05', '2026-10-09')] });
    expect(habitStrength(old, TODAY, paused, TODAY).value).toBeCloseTo(1);
  });

  it('semana do hábito: "3 de 7 · meta 6"', () => {
    const walk = habit({ id: 'w', type: 'check', goal: { perWeek: 6 } });
    const d = data({ habits: [walk], marks: ['2026-10-19', '2026-10-20', TODAY].map((x) => mark('w', x)) });
    const wp = weekProgress(walk, TODAY, d, TODAY);
    expect(wp.done).toBe(3);
    expect(wp.target).toBe(6);
  });
});

describe('dias sem', () => {
  it('atual, recorde e total; o dia do deslize sai do total', () => {
    const soda = habit({ id: 'soda', type: 'daysSince', startDay: '2026-09-19' });
    const d = data({ habits: [soda], slips: [slip('soda', '2026-10-10')] });
    const ds = daysSince(soda, d, TODAY);
    expect(ds.current).toBe(12);
    expect(ds.record).toBe(21);
    expect(ds.total).toBe(33);
    expect(ds.ifSlipToday).toEqual({ current: 0, record: 21, total: 32 });
    const after = daysSince(
      soda,
      data({ habits: [soda], slips: [slip('soda', '2026-10-10'), slip('soda', TODAY)] }),
      TODAY,
    );
    expect(after.current).toBe(0);
    expect(after.total).toBe(32);
    expect(after.record).toBe(21);
  });

  it('fica parado na pausa', () => {
    const h = habit({ id: 'x', type: 'daysSince', startDay: '2026-10-13' });
    const d = data({ habits: [h], pauses: [pause('2026-10-15', '2026-10-18')] });
    const ds = daysSince(h, d, TODAY);
    expect(ds.current).toBe(10 - 4);
    expect(ds.total).toBe(6);
  });
});

describe('limites, correlações e peso', () => {
  it('limite da semana conta por dias quando a unidade é dias', () => {
    const junk = habit({ id: 'j', type: 'budget', goal: { perWeek: 2, unit: 'dias' } });
    const d = data({
      habits: [junk],
      entries: [
        entry('j', '2026-10-20', 1),
        entry('j', '2026-10-20', 1),
        entry('j', '2026-10-22', 1),
        entry('j', '2026-10-18', 1),
      ],
    });
    const b = budgetWeek(junk, TODAY, d, TODAY);
    expect(b.used).toBe(2);
    expect(b.full).toBe(true);
    expect(b.over).toBe(false);
  });

  it('correlação só com 7 dias com e 7 sem', () => {
    const h = habit({ id: 'c', type: 'check', startDay: '2026-10-01' });
    const days = daysBetween('2026-10-01', '2026-10-21');
    const marks = days.filter((_, i) => i % 2 === 0).map((day) => mark('c', day)); // 11 com, 10 sem
    const checkins = days.map((day, i) => checkin(day, i % 2 === 0 ? 4 : 3));
    const ready = correlation(h, data({ habits: [h], marks, checkins }), TODAY);
    expect(ready.ready).toBe(true);
    expect(ready.withAvg).toBe(4);
    expect(ready.withoutAvg).toBe(3);
    const few = correlation(h, data({ habits: [h], marks, checkins: checkins.slice(0, 12) }), TODAY);
    expect(few.ready).toBe(false);
    expect(few.missingWithout).toBe(1);
  });

  it('tendência do peso com média de 7 dias e frase neutra', () => {
    const list = daysBetween('2026-09-24', TODAY).map((day, i) => ({
      id: `${day}_weight`,
      kind: 'weight' as const,
      day,
      value: 85 - i * 0.0525,
      unit: 'kg' as const,
      at: 0,
    }));
    const t = weightTrend(list, TODAY);
    expect(t.ready).toBe(true);
    expect(t.direction).toBe('down');
    expect(t.delta).toBeCloseTo(-1.1);
    expect(t.title).toBe('Tendência −1,1 kg em 3 semanas');
    expect(weightTrend(list.slice(0, 2), TODAY).ready).toBe(false);
  });
});

describe('fases, revisão e corrida', () => {
  it('progresso da fase e sugestão aos 70%', () => {
    const habits = [habit({ id: 'a', type: 'check', startDay: '2026-10-12', phase: 2 })];
    const marks = daysBetween('2026-10-12', '2026-10-21').map((d) => mark('a', d));
    const d = data({
      habits,
      marks,
      phases: [
        phase(1, { start: '2026-09-21', end: '2026-10-11', closingConstancy: 0.81 }),
        phase(2, { start: '2026-10-12', end: '2026-11-01' }),
        phase(3, { weeks: 3 }),
        phase(4, { weeks: null }),
      ],
    });
    const tl = phaseTimeline(d, TODAY);
    expect(tl.map((p) => p.status)).toEqual(['done', 'current', 'future', 'future']);
    expect(tl[1].weekIndex).toBe(2);
    expect(tl[2].start).toBe('2026-11-02');
    expect(tl[3].start).toBe('2026-11-23');
    expect(tl[0].constancy).toBe(0.81);
    expect(phaseSuggestion(d, TODAY).suggestAdvance).toBe(true);
  });

  it('a revisão abre no dia e na hora escolhidos e fica até 2 dias depois', () => {
    const p = profile();
    const clock = DEFAULT_CLOCK;
    const sunday1759 = instantAt('2026-10-25', '17:59', clock);
    const sunday18 = instantAt('2026-10-25', '18:00', clock);
    const tuesdayNight = instantAt('2026-10-27', '23:59', clock);
    const wednesday = instantAt('2026-10-28', '04:00', clock);
    expect(reviewWindow(p, sunday1759, clock).open).toBe(false);
    expect(reviewWindow(p, sunday18, clock)).toMatchObject({ open: true, week: '2026-10-19', day: '2026-10-25' });
    expect(reviewWindow(p, tuesdayNight, clock)).toMatchObject({ open: true, week: '2026-10-19' });
    expect(reviewWindow(p, wednesday, clock).open).toBe(false);
  });

  it('plano de corrida de 13 semanas', () => {
    expect(RUN_PLAN).toHaveLength(13);
    expect(RUN_PLAN.map((w) => w.label)).toEqual([
      '8× (1 + 1,5)',
      '8× (1 + 1)',
      '6× (1,5 + 1,5)',
      '5× (2 + 1,5)',
      '4× (3 + 1,5)',
      '3× (4 + 1,5)',
      '3× (5 + 2)',
      '2× (8 + 2)',
      '2× (10 + 2)',
      '15 + 2 + 8',
      '20 contínuos',
      '25 contínuos',
      '30 contínuos',
    ]);
    const w1 = RUN_PLAN[0];
    expect(w1.totalSeconds).toBe(30 * 60);
    expect(w1.intervals).toBe(8);
    // 10:42 de treino: aquecimento (5 min), 2 intervalos completos (5 min), 42 s no 3º trote
    const pos = runPosition(w1, 10 * 60 + 42);
    expect(pos.block.kind).toBe('run');
    expect(pos.interval).toBe(3);
    expect(Math.round(pos.inBlock)).toBe(42);
    expect(runElapsed({ startedAt: 0, pauses: [{ from: 60_000, to: 120_000 }], endedAt: null }, 300_000)).toBe(240);
    expect(nextSession(0)).toEqual({ week: 1, session: 1 });
    expect(nextSession(3)).toEqual({ week: 2, session: 2 });
  });
});

describe('regras do Hoje', () => {
  it('a Noite abre às 18h e o check-in sobe às 20h30', () => {
    expect(todayMode(17 * 60 + 59, 20 * 60 + 30, false)).toBe('day');
    expect(todayMode(18 * 60, 20 * 60 + 30, false)).toBe('evening');
    expect(todayMode(20 * 60 + 30, 20 * 60 + 30, false)).toBe('night');
    expect(todayMode(21 * 60, 20 * 60 + 30, true)).toBe('closed');
  });

  it('o dia fecha no último hábito do dia; o deitar fica para a manhã', () => {
    const habits = [
      habit({ id: 'telas', type: 'check', schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'evening' } }),
      habit({
        id: 'bed',
        type: 'time',
        role: 'bed',
        goal: { time: '22:00' },
        schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'evening' },
      }),
    ];
    const open = todayItems(data({ habits }), TODAY, TODAY);
    expect(isDayClosed(open)).toBe(false);
    const closed = todayItems(data({ habits, marks: [mark('telas', TODAY)] }), TODAY, TODAY);
    expect(isDayClosed(closed)).toBe(true);
    const layout = todayLayout(data({ habits, marks: [mark('telas', TODAY)] }), TODAY, TODAY, 21 * 60 + 4);
    expect(layout.mode).toBe('closed');
    expect(layout.stillToday.map((i) => i.habit.id)).toEqual(['bed']);
  });

  it('a Noite fica recolhida antes das 18h; o momento completo recolhe', () => {
    const habits = [
      habit({ id: 'm', type: 'check', schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'morning' } }),
      habit({ id: 'n', type: 'check', schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'evening' } }),
    ];
    const l = todayLayout(data({ habits, marks: [mark('m', TODAY)] }), TODAY, TODAY, 12 * 60);
    expect(l.groups.find((g) => g.key === 'morning')).toMatchObject({ folded: true, foldReason: 'complete' });
    expect(l.groups.find((g) => g.key === 'evening')).toMatchObject({ folded: true, foldReason: 'far' });
  });

  it('convite gentil: o hábito mais firme sem registro ontem, no máximo um', () => {
    const strong = habit({ id: 'strong', type: 'check', startDay: '2026-10-01' });
    const weak = habit({ id: 'weak', type: 'check', startDay: '2026-10-01' });
    const days = daysBetween('2026-10-01', '2026-10-20');
    const marks = [
      ...days.map((d) => mark('strong', d)),
      ...days.filter((_, i) => i % 3 === 0).map((d) => mark('weak', d)),
    ];
    const n = gentleNudge(data({ habits: [strong, weak], marks }), TODAY);
    expect(n).toEqual({ habitId: 'strong', day: '2026-10-21', doneToday: false });
    // com o hábito marcado ontem, ninguém mais é convidado... a não ser o outro
    const n2 = gentleNudge(data({ habits: [strong, weak], marks: [...marks, mark('strong', '2026-10-21')] }), TODAY);
    expect(n2?.habitId).toBe('weak');
    // em pausa, nada
    expect(
      gentleNudge(data({ habits: [strong], marks, pauses: [pause('2026-10-21', '2026-10-21')] }), TODAY),
    ).toBeNull();
  });
});

describe('pilares', () => {
  it('ao sair, o hábito só do pilar vai junto e o compartilhado passa para o extra', () => {
    const pillars = [pillar('familia'), pillar('corpo')];
    const walk = habit({ id: 'walk', type: 'check', pillarId: 'familia', alsoIn: ['corpo'] });
    const dishes = habit({ id: 'dishes', type: 'check', pillarId: 'familia' });
    const football = habit({ id: 'football', type: 'weekly', pillarId: 'corpo' });
    const plan = pillarExitPlan('familia', [walk, dishes, football], pillars);
    expect(plan).toEqual([
      { kind: 'moves', habit: walk, to: 'corpo' },
      { kind: 'goes', habit: dishes },
    ]);
    expect(pillarExitPlan('corpo', [walk, dishes, football], pillars)).toEqual([
      { kind: 'stays', habit: walk },
      { kind: 'goes', habit: football },
    ]);
  });

  it('dias fora da conta não pesam na semana (addDays de apoio)', () => {
    expect(addDays(TODAY, 1)).toBe('2026-10-23');
  });
});

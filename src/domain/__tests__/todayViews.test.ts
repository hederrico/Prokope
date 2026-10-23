// @vitest-environment node
// Os três jeitos de ver o Hoje: o horário de cada hábito, a Linha do tempo, o trecho da faixa do Resumo e a leitura
// da preferência (documento antigo sem o campo = Resumo).
import { DEFAULT_PREFS } from '@/domain/planTemplate';
import { dayStripRange, dayTimeline, habitTime, logicalMinutes, todayItems, todayViewOf } from '@/domain/today';
import { data, habit, profile } from './fixtures';

const TODAY = '2026-10-22'; // quinta
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6] as const;

function plan() {
  const wake = habit({
    id: 'wake',
    type: 'time',
    role: 'wake',
    goal: { timeKey: 'wake' },
    schedule: { days: [...EVERY_DAY], moment: 'morning', timeKey: 'wake' },
  });
  const weight = habit({
    id: 'weight',
    type: 'number',
    goal: { measuring: true },
    schedule: { days: [...EVERY_DAY], moment: 'morning' },
  });
  const walk = habit({ id: 'walk', type: 'check', schedule: { days: [...EVERY_DAY], moment: 'morning' } });
  const water = habit({
    id: 'water',
    type: 'counter',
    goal: { value: 3000, unit: 'ml' },
    schedule: { days: [...EVERY_DAY], moment: 'free' },
  });
  const lunch = habit({ id: 'lunch', type: 'rating', schedule: { days: [...EVERY_DAY], moment: 'day' } });
  const dinner = habit({ id: 'dinner', type: 'rating', schedule: { days: [...EVERY_DAY], moment: 'evening' } });
  const dishes = habit({
    id: 'dishes',
    type: 'check',
    schedule: { days: [...EVERY_DAY], moment: 'evening', timeKey: 'chores' },
  });
  const checkin = habit({
    id: 'checkin',
    type: 'check',
    role: 'checkin',
    schedule: { days: [...EVERY_DAY], moment: 'evening', timeKey: 'checkin' },
  });
  const screens = habit({
    id: 'screens',
    type: 'check',
    schedule: { days: [...EVERY_DAY], moment: 'evening', time: '21:00' },
  });
  const bed = habit({
    id: 'bed',
    type: 'time',
    role: 'bed',
    goal: { timeKey: 'bed' },
    schedule: { days: [...EVERY_DAY], moment: 'evening', timeKey: 'bed' },
  });
  const sweets = habit({ id: 'sweets', type: 'budget', goal: { perWeek: 2 } });
  return [wake, weight, walk, water, lunch, dinner, dishes, checkin, screens, bed, sweets];
}

describe('os três jeitos de ver o Hoje', () => {
  it('o horário de um hábito: a meta de horário vence a agenda, e o horário do perfil vale o da época', () => {
    const habits = plan();
    const d = data({
      habits,
      profile: profile({
        schedule: { ...profile().schedule, chores: '20:30', wake: '06:50' },
        scheduleLog: [
          { key: 'chores', time: '20:00', since: '2026-10-01' },
          { key: 'chores', time: '20:30', since: '2026-10-22' },
        ],
      }),
    });
    const by = (id: string) => habits.find((h) => h.id === id)!;
    expect(habitTime(by('wake'), TODAY, d)).toBe('06:50');
    expect(habitTime(by('screens'), TODAY, d)).toBe('21:00');
    expect(habitTime(by('walk'), TODAY, d)).toBeNull();
    // a louça usa o horário das tarefas do perfil; antes da mudança, valia o horário antigo
    expect(habitTime(by('dishes'), TODAY, d)).toBe('20:30');
    expect(habitTime(by('dishes'), '2026-10-21', d)).toBe('20:00');
  });

  it('minutos no dia lógico: depois da meia-noite conta no mesmo dia', () => {
    expect(logicalMinutes('20:30')).toBe(1230);
    expect(logicalMinutes('00:30')).toBe(1470);
    expect(logicalMinutes('04:00')).toBe(240);
    expect(logicalMinutes('05:30', 6)).toBe(1770);
  });

  it('linha do tempo: horários em ordem, os sem horário pelo momento, limites fora', () => {
    const d = data({
      habits: plan(),
      profile: profile({
        schedule: { ...profile().schedule, wake: '06:50', chores: '20:30', checkin: '20:30', bed: '22:00' },
      }),
    });
    const slots = dayTimeline(todayItems(d, TODAY, TODAY));
    expect(slots.map((s) => s.key)).toEqual(['t-410', 'm-morning', 'm-day', 'm-evening', 't-1230', 't-1260', 't-1320']);
    expect(slots.map((s) => s.items.map((i) => i.habit.id))).toEqual([
      ['wake'],
      ['weight', 'walk'],
      ['water', 'lunch'],
      ['dinner'],
      ['dishes', 'checkin'],
      ['screens'],
      ['bed'],
    ]);
    // a manhã sem horário fica logo depois do acordar (7h, ou o minuto seguinte a um acordar mais tarde)
    expect(slots[1]).toMatchObject({ kind: 'moment', moment: 'morning', minutes: 420 });
    const late = data({ habits: plan(), profile: profile({ schedule: { ...profile().schedule, wake: '08:15' } }) });
    const lateSlots = dayTimeline(todayItems(late, TODAY, TODAY));
    expect(lateSlots.slice(0, 2).map((s) => [s.key, s.minutes])).toEqual([
      ['t-495', 495],
      ['m-morning', 496],
    ]);
  });

  it('linha do tempo: um horário depois da meia-noite fica no fim do dia', () => {
    const owl = habit({
      id: 'owl',
      type: 'time',
      role: 'bed',
      goal: { time: '00:30' },
      schedule: { days: [...EVERY_DAY], moment: 'evening' },
    });
    const early = habit({
      id: 'early',
      type: 'check',
      schedule: { days: [...EVERY_DAY], moment: 'morning', time: '06:00' },
    });
    const slots = dayTimeline(todayItems(data({ habits: [owl, early] }), TODAY, TODAY));
    expect(slots.map((s) => [s.key, s.minutes])).toEqual([
      ['t-360', 360],
      ['t-1470', 1470],
    ]);
  });

  it('faixa do Resumo: das 6h às 23h, alargada em horas cheias', () => {
    expect(dayStripRange([])).toEqual({ start: 360, end: 1380 });
    expect(dayStripRange([410, 1230, 1320])).toEqual({ start: 360, end: 1380 });
    // às 6h em ponto, o ponto não fica colado na borda
    expect(dayStripRange([360, 1380])).toEqual({ start: 300, end: 1440 });
    expect(dayStripRange([330, 1470])).toEqual({ start: 300, end: 1500 });
  });

  it('a preferência: documento antigo sem o campo, ou valor desconhecido, é o Resumo', () => {
    expect(todayViewOf(undefined)).toBe('summary');
    expect(todayViewOf('timeline')).toBe('timeline');
    expect(todayViewOf('full')).toBe('full');
    expect(todayViewOf('agenda')).toBe('summary');
    expect(todayViewOf(DEFAULT_PREFS.todayView)).toBe('summary');
  });
});

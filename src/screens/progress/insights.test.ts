// @vitest-environment node
// A base dos padrões no Progresso e no hábito: "24 dias com · 8 dias sem" e, no horário, "no horário" e "após o horário",
// com os dias sem registro à parte (não dá para dizer que passaram da hora).
import { checkin, data, habit, mark } from '@/domain/__tests__/fixtures';
import { daysBetween } from '@/domain/day';
import { habitHistory, moodInsights, totalsBasis } from './insights';

const TODAY = '2026-10-22';

describe('a base dos padrões', () => {
  const wake = habit({
    id: 'wake',
    name: 'Acordar',
    shortName: 'acordar',
    type: 'time',
    goal: { time: '06:50', toleranceMin: 15 },
    startDay: '2026-10-01',
  });
  const walk = habit({ id: 'walk', name: 'Caminhada', shortName: 'caminhada', type: 'check', startDay: '2026-10-01' });
  const days = daysBetween('2026-10-01', '2026-10-21');

  it('no horário: dias no horário, após o horário e sem registro', () => {
    // 14 no horário, 5 anotados depois da meta e 2 sem nada anotado
    const marks = days.flatMap((d, i) => {
      if (i < 14) return [mark('wake', d, { time: '06:48' })];
      if (i < 19) return [mark('wake', d, { status: 'logged', time: '07:40' })];
      return [];
    });
    const d = data({ habits: [wake], marks });
    expect(habitHistory(wake, d, TODAY)).toEqual({ withDays: 14, withoutDays: 7, noRecord: 2 });
    expect(totalsBasis(wake, d, TODAY)).toBe('14 dias no horário · 5 após o horário · 2 sem registro');
    // tudo anotado: a base de sempre, sem o pedaço "sem registro"
    const all = data({
      habits: [wake],
      marks: days.map((d, i) => mark('wake', d, i < 14 ? { time: '06:48' } : { status: 'logged', time: '07:40' })),
    });
    expect(totalsBasis(wake, all, TODAY)).toBe('14 dias no horário · 7 após o horário');
  });

  it('os outros hábitos: "dias com" e "dias sem", como antes', () => {
    const d = data({ habits: [walk], marks: days.slice(0, 15).map((day) => mark('walk', day)) });
    expect(totalsBasis(walk, d, TODAY)).toBe('15 dias com · 6 dias sem');
  });

  it('a frase da correlação no horário: "Nos dias em que você acordou no horário"', () => {
    // humor 4 nos dias no horário e 3 nos outros (todos com horário anotado)
    const marks = days.map((d, i) => mark('wake', d, i % 2 ? { time: '06:48' } : { status: 'logged', time: '07:40' }));
    const checkins = days.map((d, i) => checkin(d, i % 2 ? 4 : 3));
    const d = data({ habits: [wake], marks, checkins });
    const list = moodInsights(
      d,
      TODAY,
      [],
      [
        {
          habitId: 'wake',
          text: '',
          correlation: {
            habitId: 'wake',
            metric: 'mood',
            withDays: 10,
            withoutDays: 11,
            needed: 7,
            ready: true,
            withAvg: 4,
            withoutAvg: 3,
            diff: 1,
            missingWith: 0,
            missingWithout: 0,
          },
        },
      ],
    );
    const corr = list.find((x) => x.key === 'corr:wake');
    expect(corr?.text).toBe('Nos dias em que você acordou no horário, seu humor médio foi 4,0. Nos outros, 3,0.');
    expect(corr?.basis).toBe('10 dias no horário · 11 após o horário');
  });
});

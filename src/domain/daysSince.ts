// Dias sem: a contagem atual (desde o último deslize, contando hoje), o recorde e o total.
// O dia de um deslize sai do total, e os dias pausados não contam nem quebram a contagem (ela fica parada).
// Arquivado ou parado numa fase, a contagem fica no último dia em que o hábito valia.
import type { DayKey, Habit, Slip } from '@/types';
import type { DomainData } from './context';
import { addDays, daysBetween } from './day';
import { endDayOf, pauseOn } from './habitState';

export interface DaysSincePeriod {
  /** primeiro dia sem (depois do deslize anterior ou do começo) */
  start: DayKey;
  /** último dia sem (o dia antes do deslize, ou hoje no período atual) */
  end: DayKey;
  /** dias sem contados (pausas fora) */
  days: number;
  /** o deslize que fechou o período (null no atual) */
  slipId: string | null;
  slipDay: DayKey | null;
  current: boolean;
  record: boolean;
}

export interface DaysSince {
  current: number;
  record: number;
  total: number;
  /** a contagem atual é o recorde (e há mais de um período ou ela passou de zero) */
  isRecord: boolean;
  /** houve deslize hoje */
  slipToday: boolean;
  /** os dias pausados de agora (a contagem está parada) */
  paused: boolean;
  /** períodos do mais recente para o mais antigo */
  periods: DaysSincePeriod[];
  /** prévia de um deslize hoje: a contagem vai a 0 e o total perde hoje */
  ifSlipToday: { current: number; record: number; total: number };
}

export function daysSince(habit: Habit, data: DomainData, now: DayKey): DaysSince {
  const start = habit.startDay;
  // o último dia que conta: hoje, ou a véspera do dia em que o hábito saiu do dia a dia
  const end = endDayOf(habit, data);
  const today = end && end <= now ? addDays(end, -1) : now;
  const slips: Slip[] = (data.slipsByHabit.get(habit.id) ?? []).filter((s) => !start || s.day >= start);
  const slipDays = new Map<DayKey, Slip>();
  for (const s of slips) if (s.day <= today) slipDays.set(s.day, s);
  const periods: DaysSincePeriod[] = [];
  let total = 0;
  if (start && start <= today) {
    let pStart: DayKey = start;
    let count = 0;
    for (const d of daysBetween(start, today)) {
      const slip = slipDays.get(d);
      if (slip) {
        periods.push({
          start: pStart,
          end: addDays(d, -1),
          days: count,
          slipId: slip.id,
          slipDay: d,
          current: false,
          record: false,
        });
        pStart = addDays(d, 1);
        count = 0;
        continue;
      }
      if (pauseOn(data, d, habit.id)) continue;
      count++;
      total++;
    }
    const slipToday = slipDays.has(today);
    if (!slipToday) {
      periods.push({
        start: pStart,
        end: today,
        days: count,
        slipId: null,
        slipDay: null,
        current: true,
        record: false,
      });
    } else {
      periods.push({
        start: addDays(today, 1),
        end: today,
        days: 0,
        slipId: null,
        slipDay: null,
        current: true,
        record: false,
      });
    }
  }
  const record = periods.reduce((m, p) => Math.max(m, p.days), 0);
  const currentPeriod = periods[periods.length - 1];
  const current = currentPeriod?.days ?? 0;
  // o selo de recorde fica no período mais antigo que chegou ao recorde, até o atual passar dele
  let recordIdx = -1;
  for (let i = 0; i < periods.length; i++)
    if (periods[i].days === record && record > 0 && recordIdx === -1) recordIdx = i;
  if (current > 0 && current >= record) recordIdx = periods.length - 1;
  if (recordIdx >= 0) periods[recordIdx].record = true;
  const slipToday = slipDays.has(today);
  const todayCounts = !slipToday && !!start && start <= today && !pauseOn(data, today, habit.id);
  return {
    current,
    record,
    total,
    isRecord: current > 0 && current >= record,
    slipToday,
    paused: !!pauseOn(data, today, habit.id),
    periods: periods.reverse(),
    ifSlipToday: {
      current: 0,
      record: slipToday
        ? record
        : Math.max(...periods.filter((p) => !p.current).map((p) => p.days), todayCounts ? current - 1 : current, 0),
      total: todayCounts ? total - 1 : total,
    },
  };
}

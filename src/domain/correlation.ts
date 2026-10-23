// Correlações: o humor (ou a energia) nos dias com o hábito e nos dias sem.
// Só aparecem com 7 dias com e 7 sem, contando os dias que têm check-in.
import type { DayKey, Habit } from '@/types';
import type { DomainData } from './context';
import { daysBetween } from './day';
import { habitDay, isDoneLike } from './habitState';

export const CORRELATION_NEEDED = 7;

export type CorrelationMetric = 'mood' | 'energy';

export interface Correlation {
  habitId: string;
  metric: CorrelationMetric;
  /** dias com check-in em que o hábito foi feito */
  withDays: number;
  /** dias com check-in em que o hábito contava e não foi feito */
  withoutDays: number;
  needed: number;
  /** já tem 7 e 7 */
  ready: boolean;
  /** média nos dias com (null sem dias) */
  withAvg: number | null;
  withoutAvg: number | null;
  /** withAvg − withoutAvg (null antes de ficar pronto) */
  diff: number | null;
  /** quanto falta de cada lado */
  missingWith: number;
  missingWithout: number;
}

export function correlation(
  habit: Habit,
  data: DomainData,
  today: DayKey,
  metric: CorrelationMetric = 'mood',
  from?: DayKey,
): Correlation {
  const start = from ?? habit.startDay;
  let withN = 0;
  let withoutN = 0;
  let withSum = 0;
  let withoutSum = 0;
  if (start) {
    for (const d of daysBetween(start, today)) {
      const c = data.checkins.get(d);
      if (!c) continue;
      const v = metric === 'mood' ? c.mood : c.energy;
      if (!v) continue;
      const hd = habitDay(habit, d, data, today);
      if (isDoneLike(hd.state)) {
        withN++;
        withSum += v;
      } else if (hd.state === 'notDone' && d < today) {
        withoutN++;
        withoutSum += v;
      }
    }
  }
  const ready = withN >= CORRELATION_NEEDED && withoutN >= CORRELATION_NEEDED;
  const withAvg = withN ? withSum / withN : null;
  const withoutAvg = withoutN ? withoutSum / withoutN : null;
  return {
    habitId: habit.id,
    metric,
    withDays: withN,
    withoutDays: withoutN,
    needed: CORRELATION_NEEDED,
    ready,
    withAvg,
    withoutAvg,
    diff: ready && withAvg !== null && withoutAvg !== null ? withAvg - withoutAvg : null,
    missingWith: Math.max(0, CORRELATION_NEEDED - withN),
    missingWithout: Math.max(0, CORRELATION_NEEDED - withoutN),
  };
}

/** Quanto falta para o padrão aparecer (cartão "em formação"). */
export function correlationProgress(habit: Habit, data: DomainData, today: DayKey) {
  const c = correlation(habit, data, today);
  return { withDays: c.withDays, withoutDays: c.withoutDays, needed: c.needed, ready: c.ready };
}

/** Correlações prontas dos hábitos ativos em que os dias com o hábito foram melhores, da maior diferença para a menor. */
export function topCorrelations(data: DomainData, today: DayKey, metric: CorrelationMetric = 'mood', limit = 3) {
  const out: Correlation[] = [];
  for (const h of data.habits) {
    if (h.archived || !h.startDay) continue;
    if (h.type === 'budget' || h.type === 'number' || h.role === 'checkin') continue;
    const c = correlation(h, data, today, metric);
    if (c.ready && c.diff !== null && c.diff >= 0.2) out.push(c);
  }
  return out.sort((a, b) => (b.diff ?? 0) - (a.diff ?? 0)).slice(0, limit);
}

/** O padrão mais perto de ficar pronto (cartão de espera do Progresso). */
export function nearestCorrelation(data: DomainData, today: DayKey): Correlation | null {
  let best: Correlation | null = null;
  for (const h of data.habits) {
    if (h.archived || !h.startDay || h.type === 'budget' || h.type === 'number' || h.role === 'checkin') continue;
    const c = correlation(h, data, today);
    if (c.ready) continue;
    const missing = c.missingWith + c.missingWithout;
    if (!best || missing < best.missingWith + best.missingWithout) best = c;
  }
  return best;
}

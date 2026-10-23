// A conta do dia, a constância (semana, pilar, período), a força do hábito e o progresso da semana.
import type { DayKey, Habit } from '@/types';
import type { DomainData } from './context';
import { addDays, daysBetween, diffDays, weekDays, weekStart } from './day';
import {
  countsInConstancy,
  countsInDay,
  habitDay,
  inPillar,
  isCountable,
  isDoneLike,
  isFlexibleWeekly,
  points,
  type HabitDay,
} from './habitState';

// ---------- a conta do dia ----------

export interface DayCount {
  day: DayKey;
  /** feitos (parcial conta como feito) */
  done: number;
  /** quantos contam no dia */
  total: number;
  /** done / total (0 quando não há nada) */
  ratio: number;
  items: HabitDay[];
}

/**
 * "x de N feitos hoje". Contam: marcar, horário, nota, lista, dias sem (feitos enquanto não há deslize)
 * e vezes por semana com dia fixo (futebol na quinta). Ficam fora: contadores, limites e medidas.
 * Saem da conta: pausados, fora da agenda e "hoje não se aplica".
 */
export function dayCount(data: DomainData, day: DayKey, today: DayKey, filter?: (h: Habit) => boolean): DayCount {
  const items: HabitDay[] = [];
  let done = 0;
  for (const h of data.habits) {
    if (!countsInDay(h, data.profile)) continue;
    if (filter && !filter(h)) continue;
    const hd = habitDay(h, day, data, today);
    if (!isCountable(hd.state)) continue;
    items.push(hd);
    if (isDoneLike(hd.state)) done++;
  }
  return { day, done, total: items.length, ratio: items.length ? done / items.length : 0, items };
}

// ---------- constância ----------

export interface Constancy {
  /** 0..1, ou null quando não há nada para contar */
  ratio: number | null;
  points: number;
  slots: number;
}

export interface ConstancyOptions {
  pillarId?: string;
  habitId?: string;
  /** hoje entra só com o que já foi feito (padrão); 'none' ignora hoje */
  today?: 'doneOnly' | 'none';
}

/**
 * Constância de um período: pontos / dias que contavam. Feito vale 1, parcial 0,5.
 * Pausas, dias fora da agenda e "hoje não se aplica" ficam fora. Hoje entra só com o que já foi feito,
 * para o dia em andamento nunca puxar a conta para baixo. Contadores contam quando batem a meta.
 * Vezes por semana sem dia fixo contam pela semana (até a meta), e a semana em curso só com o feito.
 */
export function constancy(
  data: DomainData,
  from: DayKey,
  to: DayKey,
  today: DayKey,
  opts: ConstancyOptions = {},
): Constancy {
  let pts = 0;
  let slots = 0;
  // "dias sem" de hoje contam sozinhos (sem deslize, feito): não bastam para dar uma constância ao período
  let passive = 0;
  const end = to > today ? today : to;
  const habits = data.habits.filter(
    (h) =>
      countsInConstancy(h, data.profile) &&
      (!opts.habitId || h.id === opts.habitId) &&
      (!opts.pillarId || inPillar(h, opts.pillarId)),
  );
  for (const h of habits) {
    if (isFlexibleWeekly(h, data.profile)) {
      const target = h.goal.perWeek ?? 1;
      for (let w = weekStart(from); w <= end; w = addDays(w, 7)) {
        const days = weekDays(w).filter((d) => d >= from && d <= end);
        if (!days.length) continue;
        let done = 0;
        let counted = 0;
        for (const d of days) {
          const hd = habitDay(h, d, data, today);
          if (hd.state === 'paused' || hd.state === 'inactive' || hd.state === 'skipped') continue;
          counted++;
          done += points(hd.state === 'offSchedule' ? 'notDone' : hd.state);
        }
        if (!counted) continue;
        const capped = Math.min(done, target);
        const closed = addDays(w, 6) < today;
        if (closed) {
          pts += capped;
          slots += target;
        } else if (opts.today !== 'none') {
          pts += capped;
          slots += capped;
        }
      }
      continue;
    }
    for (const d of daysBetween(from, end)) {
      const hd = habitDay(h, d, data, today);
      if (!isCountable(hd.state)) continue;
      if (d === today) {
        if (opts.today === 'none') continue;
        // hoje: só o que já foi feito; o contador conta quando bate a meta
        if (h.type === 'counter' ? hd.state !== 'done' : !isDoneLike(hd.state)) continue;
        if (h.type === 'daysSince') passive++;
      }
      pts += points(hd.state);
      slots += 1;
    }
  }
  // primeiro dia de uma semana ou fase, sem nada feito ainda: sem número (e não 100%)
  if (slots === passive) return { ratio: null, points: 0, slots: 0 };
  return { ratio: slots ? pts / slots : null, points: pts, slots };
}

/** Constância da semana do dia (segunda a domingo). */
export function weekConstancy(data: DomainData, day: DayKey, today: DayKey, opts: ConstancyOptions = {}): Constancy {
  const days = weekDays(day);
  return constancy(data, days[0], days[6], today, opts);
}

export interface PillarConstancy {
  pillarId: string;
  ratio: number | null;
  points: number;
  slots: number;
}

/** Constância por pilar (ativos), do maior para o menor. */
export function pillarConstancies(data: DomainData, from: DayKey, to: DayKey, today: DayKey): PillarConstancy[] {
  return data.pillars
    .filter((p) => !p.archived)
    .map((p) => ({ pillarId: p.id, ...constancy(data, from, to, today, { pillarId: p.id }) }))
    .sort((a, b) => (b.ratio ?? -1) - (a.ratio ?? -1));
}

// ---------- força do hábito ----------

export interface Strength {
  /** 0..1, ou null com menos de 7 dias desde o começo */
  value: number | null;
  /** dias (ou semanas) que entraram na conta */
  occurrences: number;
  /** precisa de 7 dias para aparecer */
  needed: number;
}

/** Meia-vida da força: 13 ocorrências (como no Loop Habit Tracker). */
const HALF_LIFE = 13;
const HALF_LIFE_WEEKS = 4;

/**
 * Força do hábito, no estilo do Loop: uma média que pesa mais os dias recentes (meia-vida de 13 dias
 * agendados), sem começar do zero. Feito vale 1, parcial 0,5; pausas, dias fora da agenda e "hoje não se aplica"
 * ficam fora. Hoje entra só se já foi feito. Vezes por semana sem dia fixo contam por semana.
 */
export function habitStrength(habit: Habit, day: DayKey, data: DomainData, today: DayKey): Strength {
  const start = habit.startDay;
  if (!start || start > day) return { value: null, occurrences: 0, needed: 7 };
  const values: number[] = [];
  const end = day > today ? today : day;
  if (isFlexibleWeekly(habit, data.profile)) {
    const target = habit.goal.perWeek ?? 1;
    for (let w = weekStart(start); w <= end; w = addDays(w, 7)) {
      let done = 0;
      let counted = 0;
      for (const d of weekDays(w)) {
        if (d < start || d > end) continue;
        const hd = habitDay(habit, d, data, today);
        if (hd.state === 'paused' || hd.state === 'inactive' || hd.state === 'skipped') continue;
        counted++;
        done += points(hd.state === 'offSchedule' ? 'notDone' : hd.state);
      }
      if (!counted) continue;
      const closed = addDays(w, 6) < today;
      if (!closed && done < target) continue;
      values.push(Math.min(1, done / target));
    }
    const enough = diffDays(end, start) + 1 >= 7;
    return { value: enough ? ema(values, HALF_LIFE_WEEKS) : null, occurrences: values.length, needed: 7 };
  }
  for (const d of daysBetween(start, end)) {
    const hd = habitDay(habit, d, data, today);
    if (!isCountable(hd.state)) continue;
    if (d === today && !isDoneLike(hd.state)) continue;
    values.push(points(hd.state));
  }
  const enough = diffDays(end, start) + 1 >= 7 && values.length > 0;
  return { value: enough ? ema(values, HALF_LIFE) : null, occurrences: values.length, needed: 7 };
}

/** Média com pesos que caem pela metade a cada `halfLife` posições, a partir do valor mais recente. */
export function ema(values: number[], halfLife: number): number | null {
  if (!values.length) return null;
  const m = Math.pow(0.5, 1 / halfLife);
  let num = 0;
  let den = 0;
  let w = 1;
  for (let i = values.length - 1; i >= 0; i--) {
    num += values[i] * w;
    den += w;
    w *= m;
  }
  return num / den;
}

// ---------- a semana de um hábito ----------

export interface WeekProgress {
  week: DayKey;
  /** dias feitos ou parciais na semana */
  done: number;
  /** meta da semana (6 de 7, 2 por semana) ou os dias da agenda */
  target: number;
  /** dias agendados na semana (fora pausas e "não conta") */
  scheduled: number;
  days: HabitDay[];
}

/** "3 de 7 · meta 6", "1 de 2 na semana". */
export function weekProgress(habit: Habit, day: DayKey, data: DomainData, today: DayKey): WeekProgress {
  const days = weekDays(day).map((d) => habitDay(habit, d, data, today));
  const done = days.filter((d) => isDoneLike(d.state)).length;
  const scheduled = days.filter(
    (d) => d.state !== 'offSchedule' && d.state !== 'paused' && d.state !== 'skipped' && d.state !== 'inactive',
  ).length;
  const target = habit.goal.perWeek ?? scheduled;
  return { week: weekStart(day), done, target, scheduled, days };
}

/** Totais desde o começo: dias com, dias sem (passados) e o total feito. */
export function habitTotals(habit: Habit, day: DayKey, data: DomainData, today: DayKey) {
  let withDays = 0;
  let withoutDays = 0;
  let partialDays = 0;
  const start = habit.startDay;
  if (start) {
    for (const d of daysBetween(start, day > today ? today : day)) {
      const hd = habitDay(habit, d, data, today);
      if (isDoneLike(hd.state)) {
        withDays++;
        if (hd.state === 'partial') partialDays++;
      } else if (hd.state === 'notDone' && d < today) withoutDays++;
    }
  }
  return { withDays, withoutDays, partialDays };
}

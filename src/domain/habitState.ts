// Estado de um hábito num dia: feito, parcial, não feito, não conta hoje, pausado, fora da agenda, futuro
// ou ainda inativo. Também resolve a meta do dia (horários do perfil, tolerância do fim de semana, escada).
import type { DayKey, Habit, Mark, Pause, Profile, ScheduleKey, TimeHM } from '@/types';
import type { DomainData } from './context';
import { markId } from './context';
import { addDays, diffDays, isWeekend, logicalDay, timeDiffMinutes, weekdayOf } from './day';

export type HabitDayState =
  | 'done'
  | 'partial'
  | 'notDone'
  | 'skipped' // "hoje não se aplica"
  | 'paused'
  | 'offSchedule'
  | 'future'
  | 'inactive'; // antes de começar (fase futura) ou depois de arquivado

export interface ResolvedGoal {
  value?: number;
  unit?: string;
  partialMin?: number;
  direction: 'atLeast' | 'atMost';
  /** meta de horário do dia ('06:50') */
  time?: TimeHM;
  toleranceMin: number;
  perWeek?: number;
  /** só medindo, sem meta */
  measuring: boolean;
}

export interface HabitDay {
  habitId: string;
  day: DayKey;
  state: HabitDayState;
  /** há registro do dia (marca, soma, check-in, medida ou deslize) */
  registered: boolean;
  mark?: Mark;
  /** valor do dia: total do contador, número, nota, horário em minutos, passos feitos */
  value: number | null;
  goal: ResolvedGoal;
}

// ---------- pausas ----------

/** A pausa do app inteiro que cobre o dia. */
export function appPauseOn(data: DomainData, day: DayKey): Pause | null {
  return data.pauses.find((p) => p.habitIds === null && p.start <= day && p.end >= day) ?? null;
}

/** A pausa que cobre o dia para este hábito (a do app ou a dele). */
export function pauseOn(data: DomainData, day: DayKey, habitId?: string): Pause | null {
  return (
    data.pauses.find(
      (p) => p.start <= day && p.end >= day && (p.habitIds === null || (!!habitId && p.habitIds.includes(habitId))),
    ) ?? null
  );
}

/** Pausa ativa hoje ou a próxima marcada (Ajustes › Pausar). */
export function currentOrNextPause(data: DomainData, today: DayKey): Pause | null {
  const active = data.pauses.find((p) => p.start <= today && p.end >= today);
  if (active) return active;
  return data.pauses.filter((p) => p.start > today).sort((a, b) => (a.start < b.start ? -1 : 1))[0] ?? null;
}

// ---------- agenda ----------

/** Dia em que o hábito foi arquivado (ou null). */
export function archivedDayOf(habit: Habit, data: DomainData): DayKey | null {
  if (!habit.archived) return null;
  if (habit.archivedDay) return habit.archivedDay;
  if (habit.archivedAt) return logicalDay(habit.archivedAt, data.clock);
  return '0000-01-01';
}

/** O hábito existe neste dia (começou e não foi arquivado antes). */
export function isActiveOn(habit: Habit, day: DayKey, data: DomainData): boolean {
  if (!habit.startDay || habit.startDay > day) return false;
  const arch = archivedDayOf(habit, data);
  return !(arch && arch <= day);
}

/** Dias da agenda do hábito (os de coleta para o lixo). */
export function scheduleDays(habit: Habit, profile: Profile): number[] {
  if (habit.schedule.useCollectionDays || habit.role === 'trash') return profile.collectionDays ?? [];
  return habit.schedule.days?.length ? habit.schedule.days : [0, 1, 2, 3, 4, 5, 6];
}

/** O hábito tem agenda de dias fixos (não é todo dia). */
export function hasFixedDays(habit: Habit, profile: Profile): boolean {
  return scheduleDays(habit, profile).length < 7;
}

/** O hábito está na agenda deste dia. */
export function isScheduledOn(habit: Habit, day: DayKey, data: DomainData): boolean {
  const planned = habit.planned?.some((p) => p.day === day);
  if (planned) return true;
  return scheduleDays(habit, data.profile).includes(weekdayOf(day));
}

/** O horário do perfil que valia neste dia (scheduleLog), ou o atual. */
export function scheduleTimeOn(key: ScheduleKey, day: DayKey, profile: Profile): TimeHM {
  let best: { since: DayKey; time: TimeHM } | null = null;
  for (const c of profile.scheduleLog ?? []) {
    if (c.key === key && c.since <= day && (!best || c.since >= best.since)) best = c;
  }
  return best?.time ?? profile.schedule?.[key] ?? '00:00';
}

/** Meta do contador com a escada (sem "perguntar antes", ela sobe sozinha a cada intervalo). */
export function rampValueOn(habit: Habit, day: DayKey): number | undefined {
  const base = habit.goal.value;
  const ramp = habit.goal.ramp;
  if (base === undefined || !ramp || ramp.ask) return base;
  const steps = Math.floor(Math.max(0, diffDays(day, ramp.since)) / (ramp.everyWeeks * 7));
  return Math.min(ramp.max, base + steps * ramp.step);
}

/** A próxima subida da escada: quando e para quanto (a Revisão da semana pergunta antes). */
export function nextRampStep(habit: Habit, day: DayKey): { due: boolean; from: number; to: number; on: DayKey } | null {
  const ramp = habit.goal.ramp;
  const value = habit.goal.value;
  if (!ramp || value === undefined || value >= ramp.max) return null;
  const elapsed = Math.max(0, diffDays(day, ramp.since));
  const period = ramp.everyWeeks * 7;
  const nextIn = period - (elapsed % period);
  const to = Math.min(ramp.max, value + ramp.step);
  const due = elapsed >= period;
  const on = due ? day : addDays(day, nextIn);
  return { due, from: value, to, on };
}

/** A meta do hábito neste dia. */
export function goalOn(habit: Habit, day: DayKey, data: DomainData, mark?: Mark): ResolvedGoal {
  const g = habit.goal ?? {};
  const profile = data.profile;
  let time = g.time;
  if (g.timeKey) time = scheduleTimeOn(g.timeKey, day, profile);
  if (mark?.goal?.time) time = mark.goal.time;
  let tolerance = mark?.goal?.toleranceMin ?? g.toleranceMin ?? 15;
  if (habit.type === 'time' && profile.weekendTolerance && isWeekend(day)) tolerance = Math.max(tolerance, 60);
  const value = mark?.goal?.value ?? (habit.type === 'counter' ? rampValueOn(habit, day) : g.value);
  return {
    value,
    unit: g.unit,
    partialMin: g.partialMin,
    direction: g.direction ?? 'atLeast',
    time,
    toleranceMin: tolerance,
    perWeek: g.perWeek,
    measuring: !!g.measuring || (habit.type === 'number' && value === undefined),
  };
}

/** Um horário registrado conta como feito? (até a tolerância depois da meta; antes da meta sempre conta) */
export function timeMeetsGoal(
  time: TimeHM,
  goalTime: TimeHM | undefined,
  toleranceMin: number,
  dayStartHour = 4,
): boolean {
  if (!goalTime) return true;
  return timeDiffMinutes(time, goalTime, dayStartHour) <= toleranceMin;
}

/** Estado de um valor contra a meta (contadores, números, minutos). */
export function valueStatus(value: number | null, goal: ResolvedGoal): 'done' | 'partial' | 'notDone' {
  if (value === null) return 'notDone';
  if (goal.measuring || goal.value === undefined) return 'done';
  if (goal.direction === 'atMost') return value <= goal.value ? 'done' : 'notDone';
  if (value >= goal.value) return 'done';
  if (goal.partialMin !== undefined && value >= goal.partialMin) return 'partial';
  return 'notDone';
}

// ---------- valores ----------

export function counterTotal(data: DomainData, habitId: string, day: DayKey): number {
  const list = data.entriesByKey.get(markId(day, habitId));
  if (!list) return 0;
  let total = 0;
  for (const e of list) total += e.amount;
  return total;
}

export function entriesOn(data: DomainData, habitId: string, day: DayKey) {
  return data.entriesByKey.get(markId(day, habitId)) ?? [];
}

/** Valor de um hábito de número no dia (peso, cintura, minutos de tela ou o valor da marca). */
export function numberValue(habit: Habit, day: DayKey, data: DomainData, mark?: Mark): number | null {
  if (habit.role === 'weight' || habit.role === 'waist') {
    const kind = habit.role;
    const m = data.measurementById.get(`${day}_${kind}`);
    return m ? m.value : null;
  }
  if (habit.role === 'screenTime') {
    const v = data.checkins.get(day)?.screenMinutes;
    if (v !== undefined && v !== null) return v;
  }
  if (habit.role === 'youtube') {
    const v = data.checkins.get(day)?.youtubeMinutes;
    if (v !== undefined && v !== null) return v;
  }
  return mark?.value ?? null;
}

export function slipsOn(data: DomainData, habitId: string, day: DayKey) {
  return (data.slipsByHabit.get(habitId) ?? []).filter((s) => s.day === day);
}

// ---------- contas ----------

/** Entra no "x de N feitos hoje": marcar, horário, nota, lista, dias sem e vezes por semana com dia fixo. */
export function countsInDay(habit: Habit, profile: Profile): boolean {
  switch (habit.type) {
    case 'check':
    case 'time':
    case 'rating':
    case 'checklist':
    case 'daysSince':
      return true;
    case 'weekly':
      return hasFixedDays(habit, profile);
    default:
      return false;
  }
}

/** Entra na constância e na força: o que conta no dia, mais contadores e números com meta. */
export function countsInConstancy(habit: Habit, profile: Profile): boolean {
  if (countsInDay(habit, profile)) return true;
  if (habit.type === 'counter') return habit.goal.value !== undefined;
  if (habit.type === 'number') return habit.goal.value !== undefined && !habit.goal.measuring;
  if (habit.type === 'weekly') return true; // vezes por semana sem dia fixo: conta por semana
  return false;
}

/** Hábito de vezes por semana sem dia fixo (academia 2× em qualquer dia): conta pela semana. */
export function isFlexibleWeekly(habit: Habit, profile: Profile): boolean {
  return habit.type === 'weekly' && !hasFixedDays(habit, profile);
}

function markState(mark: Mark | undefined): 'done' | 'partial' | 'notDone' {
  if (!mark || mark.skipped) return 'notDone';
  if (mark.status === 'done') return 'done';
  if (mark.status === 'partial') return 'partial';
  return 'notDone';
}

/** O estado do hábito num dia. `today` é o dia lógico de hoje. */
export function habitDay(habit: Habit, day: DayKey, data: DomainData, today: DayKey): HabitDay {
  const mark = data.marks.get(markId(day, habit.id));
  const goal = goalOn(habit, day, data, mark);
  const base = { habitId: habit.id, day, mark, goal };
  if (day > today) return { ...base, state: 'future', registered: false, value: null };
  if (!isActiveOn(habit, day, data)) return { ...base, state: 'inactive', registered: !!mark, value: null };

  // valor e registro de cada tipo
  let value: number | null = null;
  let registered = !!mark && !mark.skipped;
  let state: 'done' | 'partial' | 'notDone';
  switch (habit.type) {
    case 'counter': {
      value = counterTotal(data, habit.id, day);
      registered = value > 0;
      state = registered ? valueStatus(value, goal) : 'notDone';
      break;
    }
    case 'number': {
      value = numberValue(habit, day, data, mark);
      registered = value !== null;
      state = registered ? valueStatus(value, goal) : 'notDone';
      break;
    }
    case 'budget': {
      value = counterTotal(data, habit.id, day);
      registered = value > 0;
      state = registered ? 'done' : 'notDone';
      break;
    }
    case 'daysSince': {
      const slips = slipsOn(data, habit.id, day);
      value = slips.length;
      registered = slips.length > 0;
      state = slips.length ? 'notDone' : 'done';
      break;
    }
    case 'rating': {
      value = mark?.rating ?? null;
      state = mark?.rating ? 'done' : markState(mark);
      break;
    }
    case 'checklist': {
      value = mark?.items?.length ?? null;
      state = markState(mark);
      break;
    }
    case 'time': {
      value = mark?.time ? timeDiffMinutes(mark.time, '00:00', data.clock.dayStartHour) : null;
      state = markState(mark);
      break;
    }
    default: {
      if (habit.role === 'checkin') {
        const c = data.checkins.get(day);
        registered = !!c;
        state = c && c.mood && c.energy ? 'done' : 'notDone';
        break;
      }
      value = mark?.value ?? null;
      state = markState(mark);
    }
  }

  if (mark?.skipped) return { ...base, state: 'skipped', registered: false, value };
  // marcar feito (ou parcial) num dia pausado tira aquele dia da pausa, só para este hábito (habito-progresso.md);
  // o resto (sem marca, horário fora da meta, contadores) continua pausado e fora das contas
  const markedDone = (mark?.status === 'done' || mark?.status === 'partial') && isDoneLike(state);
  if (!markedDone && pauseOn(data, day, habit.id)) return { ...base, state: 'paused', registered, value };
  const scheduled = habit.type === 'budget' || habit.type === 'daysSince' || isScheduledOn(habit, day, data);
  // fora da agenda, um registro feito mesmo assim aparece (futebol num sábado), mas não conta
  if (!scheduled)
    return { ...base, state: registered && state !== 'notDone' ? state : 'offSchedule', registered, value };
  return { ...base, state, registered, value };
}

/** Feito ou parcial. */
export function isDoneLike(state: HabitDayState): boolean {
  return state === 'done' || state === 'partial';
}

/** Pontos na constância e na força: feito 1, parcial 0,5. */
export function points(state: HabitDayState): number {
  return state === 'done' ? 1 : state === 'partial' ? 0.5 : 0;
}

/** O estado entra nas contas (agendado, ativo, sem pausa e sem "não conta hoje"). */
export function isCountable(state: HabitDayState): boolean {
  return state === 'done' || state === 'partial' || state === 'notDone';
}

/** Hábitos que existem no dia (ativos, não arquivados). */
export function habitsActiveOn(data: DomainData, day: DayKey): Habit[] {
  return data.habits.filter((h) => isActiveOn(h, day, data));
}

/** Hábito pertence ao pilar (principal ou extra). */
export function inPillar(habit: Habit, pillarId: string): boolean {
  return habit.pillarId === pillarId || habit.alsoIn.includes(pillarId);
}

// Dia lógico e semana. O dia vira às 4h (ajustável) no fuso do perfil; a semana começa na segunda.
// Os dias são texto 'AAAA-MM-DD'; a conta de dias usa UTC para nunca depender do fuso do aparelho.
import { TZDateMini } from '@date-fns/tz';
import type { DayKey, Millis, TimeHM, WeekKey, Weekday } from '@/types';

export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo';
export const DEFAULT_DAY_START_HOUR = 4;
const DAY_MS = 86_400_000;

export interface Clock {
  timeZone: string;
  dayStartHour: number;
}

export const DEFAULT_CLOCK: Clock = { timeZone: DEFAULT_TIME_ZONE, dayStartHour: DEFAULT_DAY_START_HOUR };

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 'AAAA-MM-DD' a partir de ano, mês (1-12) e dia. */
export function makeDay(year: number, month: number, date: number): DayKey {
  return `${year}-${pad(month)}-${pad(date)}`;
}

export function parseDay(day: DayKey): { year: number; month: number; date: number } {
  const [y, m, d] = day.split('-').map(Number);
  return { year: y, month: m, date: d };
}

export function isDayKey(value: unknown): value is DayKey {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function utcMs(day: DayKey): number {
  const { year, month, date } = parseDay(day);
  return Date.UTC(year, month - 1, date);
}

function fromUtcMs(ms: number): DayKey {
  const d = new Date(ms);
  return makeDay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function addDays(day: DayKey, n: number): DayKey {
  return fromUtcMs(utcMs(day) + n * DAY_MS);
}

/** Dias de b até a (a − b). */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((utcMs(a) - utcMs(b)) / DAY_MS);
}

/** 0 = segunda ... 6 = domingo. */
export function weekdayOf(day: DayKey): Weekday {
  const js = new Date(utcMs(day)).getUTCDay(); // 0 = domingo
  return ((js + 6) % 7) as Weekday;
}

export function isWeekend(day: DayKey): boolean {
  return weekdayOf(day) >= 5;
}

/** A segunda-feira da semana do dia. */
export function weekStart(day: DayKey): WeekKey {
  return addDays(day, -weekdayOf(day));
}

export function weekEnd(day: DayKey): DayKey {
  return addDays(weekStart(day), 6);
}

/** Os 7 dias da semana, de segunda a domingo. */
export function weekDays(weekOrDay: DayKey): DayKey[] {
  const start = weekStart(weekOrDay);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Dias de a até b, inclusive (vazio se b < a). */
export function daysBetween(a: DayKey, b: DayKey): DayKey[] {
  const n = diffDays(b, a);
  if (n < 0) return [];
  return Array.from({ length: n + 1 }, (_, i) => addDays(a, i));
}

export function minDay(a: DayKey, b: DayKey): DayKey {
  return a <= b ? a : b;
}

export function maxDay(a: DayKey, b: DayKey): DayKey {
  return a >= b ? a : b;
}

export function monthDays(year: number, month: number): DayKey[] {
  const first = makeDay(year, month, 1);
  const next = month === 12 ? makeDay(year + 1, 1, 1) : makeDay(year, month + 1, 1);
  return daysBetween(first, addDays(next, -1));
}

// ---------- horários ----------

export function parseTime(time: TimeHM): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

export function makeTime(hours: number, minutes: number): TimeHM {
  const total = (((hours * 60 + minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** Minutos desde a meia-noite. */
export function timeToMinutes(time: TimeHM): number {
  const { hours, minutes } = parseTime(time);
  return hours * 60 + minutes;
}

/**
 * Minutos desde o começo do dia lógico, contados a partir da meia-noite do dia civil:
 * com a virada às 4h, '00:30' vira 24h30 (1470), para ordenar e comparar o deitar.
 */
export function logicalMinutes(time: TimeHM, dayStartHour = DEFAULT_DAY_START_HOUR): number {
  const m = timeToMinutes(time);
  return m < dayStartHour * 60 ? m + 1440 : m;
}

/** Diferença em minutos entre dois horários do mesmo dia lógico (a − b). */
export function timeDiffMinutes(a: TimeHM, b: TimeHM, dayStartHour = DEFAULT_DAY_START_HOUR): number {
  return logicalMinutes(a, dayStartHour) - logicalMinutes(b, dayStartHour);
}

// ---------- instantes e fuso ----------

/** O dia lógico de um instante. */
export function logicalDay(now: Millis, clock: Clock = DEFAULT_CLOCK): DayKey {
  const local = new TZDateMini(now - clock.dayStartHour * 3_600_000, clock.timeZone);
  return makeDay(local.getFullYear(), local.getMonth() + 1, local.getDate());
}

/** O horário 'HH:mm' de um instante, no fuso. */
export function timeOf(now: Millis, clock: Clock = DEFAULT_CLOCK): TimeHM {
  const local = new TZDateMini(now, clock.timeZone);
  return makeTime(local.getHours(), local.getMinutes());
}

/** Minutos desde a meia-noite do dia lógico (24h30 = 1470 para 0h30 da madrugada seguinte). */
export function logicalMinutesOf(now: Millis, clock: Clock = DEFAULT_CLOCK): number {
  return logicalMinutes(timeOf(now, clock), clock.dayStartHour);
}

/** O instante de um horário de um dia lógico (antes da virada, cai na madrugada do dia civil seguinte). */
export function instantAt(day: DayKey, time: TimeHM, clock: Clock = DEFAULT_CLOCK): Millis {
  const { hours, minutes } = parseTime(time);
  const civil = hours < clock.dayStartHour ? addDays(day, 1) : day;
  const { year, month, date } = parseDay(civil);
  return new TZDateMini(year, month - 1, date, hours, minutes, clock.timeZone).getTime();
}

/** Quando começa o dia lógico. */
export function dayStartInstant(day: DayKey, clock: Clock = DEFAULT_CLOCK): Millis {
  return instantAt(day, makeTime(clock.dayStartHour, 0), clock);
}

/** O instante da próxima virada do dia. */
export function nextDayTurn(now: Millis, clock: Clock = DEFAULT_CLOCK): Millis {
  return dayStartInstant(addDays(logicalDay(now, clock), 1), clock);
}

/** Relógio do perfil (ou o padrão). */
export function clockOf(profile: { timeZone?: string; dayStartHour?: number } | null | undefined): Clock {
  return {
    timeZone: profile?.timeZone || DEFAULT_TIME_ZONE,
    dayStartHour: profile?.dayStartHour ?? DEFAULT_DAY_START_HOUR,
  };
}

// Textos curtos em português: horários ("6h52"), números ("83,6"), volumes ("1,5 L"), datas ("22 out").
import type { DayKey, TimeHM } from '@/types';
import { diffDays, parseDay, parseTime, weekdayOf } from './day';

const WEEKDAYS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const WEEKDAYS_SHORT = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const MOOD_WORDS = ['Muito mal', 'Mal', 'Ok', 'Bem', 'Muito bem'] as const;
export const ENERGY_WORDS = ['Esgotado', 'Baixa', 'Ok', 'Boa', 'Alta'] as const;
export const MEAL_WORDS = ['Improvisado', 'Fraco', 'Ok', 'Bom', 'Completo'] as const;

export function capitalize(text: string): string {
  return text ? text[0].toLocaleUpperCase('pt-BR') + text.slice(1) : text;
}

/** "6h52", "22h" (texto corrido). */
export function formatTime(time: TimeHM): string {
  const { hours, minutes } = parseTime(time);
  return minutes ? `${hours}h${minutes < 10 ? `0${minutes}` : minutes}` : `${hours}h`;
}

/** "06h52" (botões que repetem a roda, como "Agora · 06h58"). */
export function formatTimePadded(time: TimeHM): string {
  return time.replace(':', 'h');
}

/** Número com vírgula: formatNumber(83.6) = "83,6"; casas = máximo de casas. */
export function formatNumber(value: number, maxDecimals = 1): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: maxDecimals, minimumFractionDigits: 0 });
}

/** "1,5 L", "2 L", "500 ml". */
export function formatVolume(ml: number): string {
  if (Math.abs(ml) >= 1000) return `${formatNumber(ml / 1000, 2)} L`;
  return `${Math.round(ml)} ml`;
}

/** "1,5" (só o número em litros). */
export function formatLitersValue(ml: number): string {
  return formatNumber(ml / 1000, 2);
}

/** "1h 48min", "35 min", "2h". */
export function formatMinutes(total: number): string {
  const m = Math.round(total);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}min` : `${h}h`;
}

/** "0:42", "10:42" (relógio da corrida). */
export function formatClockSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? `0${r}` : r}`;
}

/** Valor com unidade: "46 g", "1,5 L", "83,6 kg", "20 min". */
export function formatAmount(value: number, unit?: string): string {
  if (unit === 'ml') return formatVolume(value);
  if (unit === 'min') return formatMinutes(value);
  if (!unit) return formatNumber(value);
  return `${formatNumber(value)} ${unit}`;
}

export function weekdayName(day: DayKey): string {
  return WEEKDAYS[weekdayOf(day)];
}

export function weekdayShort(day: DayKey): string {
  return WEEKDAYS_SHORT[weekdayOf(day)];
}

export function weekdayLabel(weekday: number): string {
  return WEEKDAYS[weekday] ?? '';
}

export function weekdayShortLabel(weekday: number): string {
  return WEEKDAYS_SHORT[weekday] ?? '';
}

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? '';
}

/** "22 out". */
export function formatDayShort(day: DayKey): string {
  const { month, date } = parseDay(day);
  return `${date} ${MONTHS_SHORT[month - 1]}`;
}

/** "22 de outubro". */
export function formatDayMonth(day: DayKey): string {
  const { month, date } = parseDay(day);
  return `${date} de ${MONTHS[month - 1]}`;
}

/** "Quinta, 22 de outubro" (cabeçalho do Hoje). */
export function formatDayHeader(day: DayKey): string {
  return `${capitalize(weekdayName(day))}, ${formatDayMonth(day)}`;
}

/** "quinta, 22 de outubro". */
export function formatDayLong(day: DayKey): string {
  return `${weekdayName(day)}, ${formatDayMonth(day)}`;
}

/** "Qua, 21 out". */
export function formatDayCompact(day: DayKey): string {
  return `${capitalize(weekdayShort(day))}, ${formatDayShort(day)}`;
}

/** "19 – 25 de outubro", "28 set – 4 out", "21 set – hoje". */
export function formatRange(a: DayKey, b: DayKey, today?: DayKey): string {
  const pa = parseDay(a);
  const pb = parseDay(b);
  if (today && b === today) return `${formatDayShort(a)} – hoje`;
  if (pa.month === pb.month && pa.year === pb.year) return `${pa.date} – ${pb.date} de ${MONTHS[pb.month - 1]}`;
  return `${formatDayShort(a)} – ${formatDayShort(b)}`;
}

/** "hoje", "ontem", "anteontem" ou "quarta, 21 out". */
export function formatRelativeDay(day: DayKey, today: DayKey): string {
  const d = diffDays(today, day);
  if (d === 0) return 'hoje';
  if (d === 1) return 'ontem';
  if (d === -1) return 'amanhã';
  return `${weekdayName(day)}, ${formatDayShort(day)}`;
}

/** "Bom dia", "Boa tarde" ou "Boa noite" pelos minutos do dia. */
export function greeting(minutesOfDay: number): string {
  const m = minutesOfDay % 1440;
  if (m >= 4 * 60 && m < 12 * 60) return 'Bom dia';
  if (m >= 12 * 60 && m < 18 * 60) return 'Boa tarde';
  return 'Boa noite';
}

export function moodWord(value: number): string {
  return MOOD_WORDS[Math.round(value) - 1] ?? '';
}

export function energyWord(value: number): string {
  return ENERGY_WORDS[Math.round(value) - 1] ?? '';
}

export function mealWord(value: number): string {
  return MEAL_WORDS[Math.round(value) - 1] ?? '';
}

/** 0.76 → "76%". */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** "3 dias", "1 dia". */
export function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n, 0)} ${n === 1 ? one : many}`;
}

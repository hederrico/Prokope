// Regras do Hoje: os grupos por momento do dia, o modo pelo horário, o dia fechado, o convite gentil
// e os botões rápidos da hora. A Noite abre às 18h; o check-in sobe às 20h30 (horário do perfil);
// o dia fecha quando o último hábito do dia é marcado (o deitar fica para a manhã seguinte).
import type { DayKey, DayMoment, Habit, Pillar, QuickAdd, QuickAddSlot, TimeHM, TodayViewPref } from '@/types';
import type { DomainData } from './context';
import { addDays, timeToMinutes } from './day';
import { budgetWeek, type BudgetWeek, compareBudgets } from './budget';
import { daysSince, type DaysSince } from './daysSince';
import {
  appPauseOn,
  countsInDay,
  habitDay,
  isCountable,
  isDoneLike,
  scheduleTimeOn,
  type HabitDay,
} from './habitState';
import { isFirstDay } from './phases';
import { habitStrength, weekProgress, type WeekProgress } from './stats';

export type TodayMode = 'day' | 'evening' | 'night' | 'closed';
export type TodayGroupKey = 'morning' | 'day' | 'evening';

/** A Noite abre às 18h fixas. */
export const EVENING_OPENS_MIN = 18 * 60;

export const GROUP_TITLES: Record<TodayGroupKey, string> = {
  morning: 'Manhã',
  day: 'Ao longo do dia',
  evening: 'Noite',
};

export interface TodayItem extends HabitDay {
  habit: Habit;
  pillar: Pillar | null;
  /** entra no "x de N feitos hoje" */
  counts: boolean;
  /** primeiro dia do hábito (selo "novo"), fora o primeiro dia do plano */
  isNew: boolean;
  /** horário do hábito no dia ('20:30'), quando tem */
  time: string | null;
  /** minutos para ordenar dentro do grupo */
  sortKey: number;
  /** semana do hábito ("2 de 7 · meta 6"), para marcar e vezes por semana */
  week: WeekProgress | null;
  budget: BudgetWeek | null;
  daysSince: DaysSince | null;
  /** o deitar não tem controle à noite: é marcado na manhã seguinte */
  markedNextMorning: boolean;
}

export interface TodayGroup {
  key: TodayGroupKey;
  title: string;
  items: TodayItem[];
  /** tudo feito (ou fora da conta) */
  complete: boolean;
  /** recolhido: a Noite antes das 18h ('far') ou o momento completo ('complete') */
  folded: boolean;
  foldReason: 'far' | 'complete' | null;
}

export interface TodayLayout {
  mode: TodayMode;
  groups: TodayGroup[];
  /** modo noite: Ainda hoje (check-in no topo) e Feitos hoje */
  stillToday: TodayItem[];
  doneToday: TodayItem[];
  /** o check-in vai para o topo (a partir do horário do check-in) */
  checkinOnTop: boolean;
  /** Limites da semana e Dias sem, no fim */
  limits: TodayItem[];
  daysSince: TodayItem[];
  /** contadores (proteína e água) e medidas, para o cartão das metas da noite */
  counters: TodayItem[];
}

const MOMENT_DEFAULT_MIN: Record<DayMoment, number> = {
  morning: 7 * 60,
  day: 12 * 60,
  evening: 19 * 60,
  free: 12 * 60,
};

/** Papéis que não viram linha no Hoje (vêm no check-in ou na revisão). */
const HIDDEN_ROLES = new Set(['screenTime', 'youtube', 'waist']);

export function isHiddenInToday(habit: Habit): boolean {
  return !!habit.role && HIDDEN_ROLES.has(habit.role);
}

function groupOf(habit: Habit): TodayGroupKey | 'limits' | 'daysSince' {
  if (habit.type === 'budget') return 'limits';
  if (habit.type === 'daysSince') return 'daysSince';
  const m = habit.schedule.moment;
  return m === 'morning' ? 'morning' : m === 'evening' ? 'evening' : 'day';
}

/**
 * O horário de um hábito num dia ('20:30'), ou null: a meta de horário (acordar, deitar) vence o horário da agenda;
 * um horário do perfil (timeKey, como `chores`) vale com o valor da época daquele dia.
 */
export function habitTime(habit: Habit, day: DayKey, data: DomainData): string | null {
  if (habit.goal.timeKey) return scheduleTimeOn(habit.goal.timeKey, day, data.profile);
  if (habit.goal.time) return habit.goal.time;
  if (habit.schedule.timeKey) return scheduleTimeOn(habit.schedule.timeKey, day, data.profile);
  return habit.schedule.time ?? null;
}

/** Todos os itens do Hoje de um dia (só os que aparecem: ativos, sem pausa própria, na agenda). */
export function todayItems(data: DomainData, day: DayKey, today: DayKey): TodayItem[] {
  const firstDay = isFirstDay(data, day);
  const items: TodayItem[] = [];
  for (const habit of data.habits) {
    if (isHiddenInToday(habit)) continue;
    const hd = habitDay(habit, day, data, today);
    if (hd.state === 'inactive' || hd.state === 'future') continue;
    // fora da agenda não aparece (a não ser que tenha registro); pausado sozinho sai do Hoje
    if (hd.state === 'offSchedule') continue;
    if (hd.state === 'paused' && !appPauseOn(data, day)) continue;
    const time = habitTime(habit, day, data);
    const moment = habit.schedule.moment;
    const isWeekly = habit.type === 'weekly' || (habit.type === 'check' && habit.goal.perWeek !== undefined);
    items.push({
      ...hd,
      habit,
      pillar: data.pillarById.get(habit.pillarId) ?? null,
      counts: countsInDay(habit, data.profile) && isCountable(hd.state),
      isNew: !firstDay && habit.startDay === day,
      time,
      // uma medida sem horário (o peso) abre o momento do dia, antes do acordar (quadro: "peso, acordar e caminhada")
      sortKey: time ? timeToMinutes(time) : habit.goal.measuring ? 0 : MOMENT_DEFAULT_MIN[moment],
      week: isWeekly ? weekProgress(habit, day, data, today) : null,
      budget: habit.type === 'budget' ? budgetWeek(habit, day, data, today) : null,
      daysSince: habit.type === 'daysSince' ? daysSince(habit, data, day) : null,
      markedNextMorning: habit.role === 'bed',
    });
  }
  return items.sort((a, b) => a.sortKey - b.sortKey || a.habit.order - b.habit.order);
}

/** Um item está resolvido no dia (feito, parcial, "não conta hoje" ou registrado, para medidas). */
export function isSettled(item: TodayItem): boolean {
  if (isDoneLike(item.state) || item.state === 'skipped') return true;
  if (item.habit.type === 'number') return item.registered;
  if (item.habit.type === 'counter') return item.state === 'done';
  return false;
}

/** O dia fechou: todo hábito que conta e se marca no próprio dia está feito (o deitar fica para amanhã). */
export function isDayClosed(items: TodayItem[]): boolean {
  const own = items.filter((i) => i.counts && !i.markedNextMorning);
  return own.length > 0 && own.every((i) => isDoneLike(i.state) || i.state === 'skipped');
}

/** O modo do Hoje pelo horário (calculado quando a tela aparece). */
export function todayMode(minutes: number, checkinMinutes: number, closed: boolean): TodayMode {
  if (closed) return 'closed';
  if (minutes >= checkinMinutes) return 'night';
  if (minutes >= EVENING_OPENS_MIN) return 'evening';
  return 'day';
}

/**
 * Monta o Hoje. `minutes` são os minutos do dia lógico (0h30 = 1470); para um dia passado,
 * use `past: true` (o dia aparece inteiro, com os momentos completos recolhidos e sem modo por horário).
 */
export function todayLayout(
  data: DomainData,
  day: DayKey,
  today: DayKey,
  minutes: number,
  opts: { past?: boolean } = {},
): TodayLayout {
  const items = todayItems(data, day, today);
  const checkinMin = timeToMinutes(scheduleTimeOn('checkin', day, data.profile));
  const closed = !opts.past && isDayClosed(items);
  const mode: TodayMode = opts.past ? 'day' : todayMode(minutes, checkinMin, closed);
  // estável: no empate de folga, fica a ordem dos itens
  const limits = items.filter((i) => groupOf(i.habit) === 'limits').sort((a, b) => compareBudgets(a.budget, b.budget));
  const ds = items.filter((i) => groupOf(i.habit) === 'daysSince');
  const counters = items.filter((i) => i.habit.type === 'counter');
  const groups: TodayGroup[] = (['morning', 'day', 'evening'] as TodayGroupKey[]).map((key) => {
    const list = items.filter((i) => groupOf(i.habit) === key);
    const complete = list.length > 0 && list.every(isSettled);
    const far = !opts.past && key === 'evening' && minutes < EVENING_OPENS_MIN;
    const folded = far || complete;
    return {
      key,
      title: GROUP_TITLES[key],
      items: list,
      complete,
      folded,
      foldReason: far ? 'far' : complete ? 'complete' : null,
    };
  });
  const rows = items.filter((i) => groupOf(i.habit) !== 'limits' && groupOf(i.habit) !== 'daysSince');
  const night = mode === 'night' || mode === 'closed';
  const stillToday = night
    ? rows
        .filter((i) => i.counts && !isDoneLike(i.state) && i.state !== 'skipped')
        .sort((a, b) => (a.habit.role === 'checkin' ? -1 : b.habit.role === 'checkin' ? 1 : a.sortKey - b.sortKey))
    : [];
  // "Feitos hoje" conta também os dias sem (feitos enquanto não há deslize); eles continuam no fim da tela
  const doneToday = night
    ? [...rows, ...ds].filter((i) => i.counts && (isDoneLike(i.state) || i.state === 'skipped'))
    : [];
  return {
    mode,
    groups: groups.filter((g) => g.items.length > 0),
    stillToday,
    doneToday,
    checkinOnTop: !opts.past && minutes >= checkinMin,
    limits,
    daysSince: ds,
    counters,
  };
}

// ---------- os três jeitos de ver o dia (Resumo, Lista completa, Linha do tempo) ----------

/** O jeito guardado no perfil. Documento antigo sem o campo, ou um valor que não conhecemos, vale o Resumo. */
export function todayViewOf(value: unknown): TodayViewPref {
  return value === 'full' || value === 'timeline' ? value : 'summary';
}

/**
 * Minutos de um horário no dia lógico: o que vem depois da meia-noite e antes da virada do dia (4h) conta no
 * mesmo dia, depois das 24h ('00:30' = 1470). Os mesmos minutos do `useNow`.
 */
export function logicalMinutes(time: TimeHM, dayStartHour = 4): number {
  const t = timeToMinutes(time);
  return t < dayStartHour * 60 ? t + 1440 : t;
}

/** Um ponto da Linha do tempo: um horário (os hábitos daquele horário) ou um momento (os sem horário). */
export type TimelineSlot =
  | { key: string; kind: 'time'; minutes: number; time: TimeHM; items: TodayItem[] }
  | { key: string; kind: 'moment'; minutes: number; moment: TodayGroupKey; items: TodayItem[] };

/** Onde entram os sem horário: o "ao longo do dia" no meio do dia e a noite às 19h (a manhã depende do acordar). */
const MOMENT_ANCHOR_MIN: Record<TodayGroupKey, number> = { morning: 7 * 60, day: 12 * 60, evening: 19 * 60 };

/**
 * A Linha do tempo do dia: os hábitos em ordem de horário, os do mesmo horário juntos. Os sem horário entram pelo
 * momento: a manhã logo depois do acordar (7h, ou o minuto seguinte ao horário de acordar, se for mais tarde),
 * o "ao longo do dia" (proteína, água, almoço) no meio do dia e a noite às 19h. Num empate, o horário vem antes do
 * momento. Limites da semana e dias sem não têm hora e ficam fora (vão no fim da tela, como no Resumo).
 */
export function dayTimeline(items: TodayItem[], dayStartHour = 4): TimelineSlot[] {
  const rows = items.filter((i) => {
    const g = groupOf(i.habit);
    return g !== 'limits' && g !== 'daysSince';
  });
  const wake = rows.find((i) => i.habit.role === 'wake' && i.time);
  const anchor: Record<TodayGroupKey, number> = {
    ...MOMENT_ANCHOR_MIN,
    morning: Math.max(MOMENT_ANCHOR_MIN.morning, wake?.time ? logicalMinutes(wake.time, dayStartHour) + 1 : 0),
  };
  const byKey = new Map<string, TimelineSlot>();
  for (const item of rows) {
    if (item.time) {
      const minutes = logicalMinutes(item.time, dayStartHour);
      const key = `t-${minutes}`;
      const slot = byKey.get(key) ?? { key, kind: 'time' as const, minutes, time: item.time, items: [] };
      slot.items.push(item);
      byKey.set(key, slot);
    } else {
      const moment = groupOf(item.habit) as TodayGroupKey;
      const key = `m-${moment}`;
      const slot = byKey.get(key) ?? { key, kind: 'moment' as const, minutes: anchor[moment], moment, items: [] };
      slot.items.push(item);
      byKey.set(key, slot);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => a.minutes - b.minutes || Number(a.kind === 'moment') - Number(b.kind === 'moment'),
  );
}

/**
 * O trecho do dia que a faixa do Resumo mostra, em minutos do dia lógico: das 6h às 23h, alargado em horas cheias
 * para o primeiro e o último horário nunca ficarem colados na borda.
 */
export function dayStripRange(minutes: number[]): { start: number; end: number } {
  if (!minutes.length) return { start: 6 * 60, end: 23 * 60 };
  const first = Math.min(...minutes);
  const last = Math.max(...minutes);
  return {
    start: Math.min(6 * 60, Math.ceil(first / 60) * 60 - 60),
    end: Math.max(23 * 60, Math.floor(last / 60) * 60 + 60),
  };
}

// ---------- convite gentil ----------

export interface Nudge {
  habitId: string;
  /** o dia que ficou sem registro (ontem) */
  day: DayKey;
  /** o hábito já foi feito hoje: a frase vira "De volta hoje." */
  doneToday: boolean;
}

/**
 * O convite gentil: no máximo um por dia, no hábito mais firme que ficou sem registro ontem.
 * Não aparece no primeiro dia, em pausa, no dia da volta de uma pausa, nem para o deitar.
 */
export function gentleNudge(data: DomainData, today: DayKey): Nudge | null {
  const yesterday = addDays(today, -1);
  if (appPauseOn(data, today) || appPauseOn(data, yesterday)) return null;
  if (isFirstDay(data, today)) return null;
  let best: { habit: Habit; strength: number } | null = null;
  for (const habit of data.habits) {
    if (!countsInDay(habit, data.profile) || habit.role === 'bed' || habit.type === 'daysSince') continue;
    if (isHiddenInToday(habit)) continue;
    const y = habitDay(habit, yesterday, data, today);
    if (y.state !== 'notDone' || y.registered) continue;
    const t = habitDay(habit, today, data, today);
    if (t.state === 'inactive' || t.state === 'paused') continue;
    const s = habitStrength(habit, yesterday, data, today).value ?? 0;
    if (!best || s > best.strength) best = { habit, strength: s };
  }
  if (!best) return null;
  const t = habitDay(best.habit, today, data, today);
  return { habitId: best.habit.id, day: yesterday, doneToday: isDoneLike(t.state) };
}

/** O dia depois do fim de uma pausa do app: "Bem-vindo de volta. Comece por um hábito." */
export function isWelcomeBack(data: DomainData, today: DayKey): boolean {
  const yesterday = addDays(today, -1);
  return data.pauses.some((p) => p.habitIds === null && p.end === yesterday);
}

// ---------- botões rápidos da hora ----------

export function quickAddSlot(minutes: number): QuickAddSlot {
  const m = minutes % 1440;
  if (m < 11 * 60) return 'morning';
  if (m < 17 * 60) return 'midday';
  return 'evening';
}

/**
 * Os botões do Hoje para a hora (3 por padrão); a folha mostra todos, na ordem da pessoa.
 * De manhã, na ordem dos botões; no almoço e à noite, do maior para o menor (frango, feijão...).
 */
export function quickAddsFor(habit: Habit, minutes: number, max = 3): QuickAdd[] {
  const slot = quickAddSlot(minutes);
  const matching = habit.quickAdds.filter((q) => q.hours?.includes(slot));
  if (slot !== 'morning') matching.sort((a, b) => b.amount - a.amount);
  const rest = habit.quickAdds.filter((q) => !matching.includes(q) && q.hours?.length !== 0);
  return [...matching, ...rest].slice(0, max);
}

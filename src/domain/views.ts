// Leituras prontas para as telas (puras): o Hoje, a semana, o hábito, o Progresso, a Jornada,
// o plano de corrida e a revisão. Os hooks de '@/data' só chamam estas funções com os dados atuais.
import type {
  Checkin,
  DayKey,
  Habit,
  HabitRole,
  Measurement,
  Millis,
  Pause,
  Pillar,
  QuickAdd,
  Review,
  Run,
  WeekKey,
} from '@/types';
import type { DomainData } from './context';
import { markId } from './context';
import { addDays, daysBetween, diffDays, instantAt, logicalDay, monthDays, parseDay, weekDays, weekStart } from './day';
import { budgetWeek, type BudgetWeek } from './budget';
import { correlation, topCorrelations, waitingPatterns, type Correlation } from './correlation';
import { daysSince, type DaysSince } from './daysSince';
import {
  formatDayHeader,
  formatDayShort,
  formatNumber,
  formatRange,
  greeting,
  monthName,
  weekdayName,
  weekdayShort,
} from './format';
import {
  appPauseOn,
  counterTotal,
  currentOrNextPause,
  entriesOn,
  goalOn,
  habitDay,
  inPillar,
  isDoneLike,
  nextRampStep,
  pauseOn,
  type HabitDay,
} from './habitState';
import { currentPhase, isFirstDay, nextPhase, phaseSuggestion, phaseTimeline, type PhaseView } from './phases';
import {
  currentTweak,
  pendingReview,
  reviewSummary,
  reviewWindow,
  type ReviewSummary,
  type ReviewWindow,
} from './review';
import { nextSession, RUN_PLAN, RUN_SESSIONS_PER_WEEK, type RunWeek } from './runPlan';
import {
  constancy,
  dayCount,
  habitStrength,
  habitTotals,
  pillarConstancies,
  weekConstancy,
  weekProgress,
  type Strength,
  type WeekProgress,
} from './stats';
import {
  gentleNudge,
  isWelcomeBack,
  quickAddsFor,
  todayItems,
  todayLayout,
  type Nudge,
  type TodayItem,
  type TodayLayout,
} from './today';
import { lastBefore, weightTrend, type WeightTrend } from './weight';

// ---------- a semana do topo ----------

export interface WeekDayView {
  day: DayKey;
  /** "qui" */
  weekday: string;
  /** 22 */
  date: number;
  isToday: boolean;
  isFuture: boolean;
  /** antes do começo do plano: sem anel e sem toque */
  beforeStart: boolean;
  paused: boolean;
  /** feitos / que contam no dia */
  done: number;
  total: number;
  ratio: number;
  /** dá para tocar (passado ou hoje, dentro do plano) */
  tappable: boolean;
}

export interface WeekView {
  week: WeekKey;
  days: WeekDayView[];
  /** constância da semana até agora */
  constancy: number | null;
  /** "19 – 25 de outubro" */
  label: string;
  /** a semana anterior, para deslizar (só uma para trás) */
  previous: WeekKey;
  isCurrent: boolean;
}

function planStart(data: DomainData): DayKey | null {
  const p = data.phases.find((x) => x.start)?.start;
  if (p) return p;
  let min: DayKey | null = null;
  for (const h of data.habits) if (h.startDay && (!min || h.startDay < min)) min = h.startDay;
  return min;
}

export function weekView(data: DomainData, day: DayKey, today: DayKey): WeekView {
  const start = planStart(data);
  const days = weekDays(day).map((d) => {
    const c = dayCount(data, d, today);
    const beforeStart = !start || d < start;
    const future = d > today;
    return {
      day: d,
      weekday: weekdayShort(d),
      date: parseDay(d).date,
      isToday: d === today,
      isFuture: future,
      beforeStart,
      paused: !!appPauseOn(data, d),
      done: c.done,
      total: c.total,
      ratio: c.ratio,
      tappable: !future && !beforeStart,
    };
  });
  const w = weekStart(day);
  return {
    week: w,
    days,
    constancy: weekConstancy(data, day, today).ratio,
    label: formatRange(w, addDays(w, 6)),
    previous: addDays(w, -7),
    isCurrent: w === weekStart(today),
  };
}

// ---------- Hoje ----------

export interface TodayView {
  day: DayKey;
  today: DayKey;
  isToday: boolean;
  isPast: boolean;
  /** "Quinta, 22 de outubro" */
  dateLabel: string;
  /** "Bom dia" */
  greeting: string;
  name: string;
  layout: TodayLayout;
  /** "x de N feitos hoje" */
  count: { done: number; total: number };
  week: WeekView;
  phase: { number: number; name: string; weekIndex: number | null; weeks: number | null } | null;
  /** primeiro dia do plano (sem marcas) */
  firstDay: boolean;
  /** pausa do app neste dia */
  pause: Pause | null;
  /** dia seguinte ao fim de uma pausa */
  welcomeBack: boolean;
  nudge: Nudge | null;
  /** convite da revisão (no dia e hora escolhidos, até 2 dias depois), quando ainda não foi feita */
  review: { week: WeekKey; step: number; started: boolean } | null;
  /** ajuste escrito na última revisão, até a próxima */
  tweak: { week: WeekKey; text: string } | null;
  checkin: Checkin | null;
  /** botões rápidos da hora, por hábito contador */
  quickAdds: Record<string, QuickAdd[]>;
  /** "Amanhã cedo", no dia fechado */
  tomorrowMorning: TodayItem[];
  /** treino em andamento (faixa da corrida) */
  activeRun: Run | null;
}

export function activeRun(data: DomainData, now: Millis): Run | null {
  for (let i = data.runs.length - 1; i >= 0; i--) {
    const r = data.runs[i];
    if ((r.status === 'running' || r.status === 'paused') && now - r.startedAt < 2 * 3_600_000) return r;
  }
  return null;
}

export function todayView(data: DomainData, day: DayKey, now: Millis, minutes: number): TodayView {
  const today = logicalDay(now, data.clock);
  const isPast = day < today;
  const layout = todayLayout(data, day, today, minutes, { past: isPast });
  const count = dayCount(data, day, today);
  const phase = currentPhase(data, day);
  const pause = appPauseOn(data, day);
  const win = reviewWindow(data.profile, now, data.clock);
  const reviewDoc = data.reviews.get(win.week);
  const review =
    !isPast &&
    win.open &&
    reviewDoc?.status !== 'done' &&
    !pause &&
    planStart(data) &&
    planStart(data)! <= addDays(win.week, 6)
      ? { week: win.week, step: reviewDoc?.step ?? 1, started: !!reviewDoc }
      : null;
  const quickAdds: Record<string, QuickAdd[]> = {};
  for (const item of layout.counters) quickAdds[item.habit.id] = quickAddsFor(item.habit, minutes);
  const tomorrow = addDays(day, 1);
  const tomorrowMorning =
    layout.mode === 'closed'
      ? todayItems(data, tomorrow, tomorrow).filter(
          (i) => i.habit.schedule.moment === 'morning' && i.habit.type !== 'number',
        )
      : [];
  return {
    day,
    today,
    isToday: day === today,
    isPast,
    dateLabel: formatDayHeader(day),
    greeting: greeting(minutes),
    name: data.profile.name,
    layout,
    count: { done: count.done, total: count.total },
    week: weekView(data, day, today),
    phase: phase ? { number: phase.number, name: phase.name, weekIndex: phase.weekIndex, weeks: phase.weeks } : null,
    firstDay: isFirstDay(data, day),
    pause,
    welcomeBack: !pause && isWelcomeBack(data, day),
    nudge: day === today && !pause ? gentleNudge(data, today) : null,
    review,
    tweak: currentTweak(data, today),
    checkin: data.checkins.get(day) ?? null,
    quickAdds,
    tomorrowMorning,
    activeRun: activeRun(data, now),
  };
}

// ---------- hábito ----------

export interface HabitView {
  habit: Habit;
  pillar: Pillar | null;
  /** pilares extras ativos */
  alsoIn: Pillar[];
  /** estado de hoje */
  today: HabitDay;
  /** pausa que cobre hoje (do hábito ou do app) */
  pause: Pause | null;
  /** "upcoming" = fase futura; "paused" = pausa própria agora */
  status: 'active' | 'upcoming' | 'archived' | 'paused';
  phase: PhaseView | null;
}

export function habitView(data: DomainData, id: string, today: DayKey): HabitView | null {
  const habit = data.habitById.get(id);
  if (!habit) return null;
  const pause = pauseOn(data, today, habit.id);
  const own = data.pauses.find((p) => p.habitIds?.includes(habit.id) && p.start <= today && p.end >= today);
  const status = habit.archived
    ? 'archived'
    : !habit.startDay || habit.startDay > today
      ? 'upcoming'
      : own
        ? 'paused'
        : 'active';
  return {
    habit,
    pillar: data.pillarById.get(habit.pillarId) ?? null,
    alsoIn: habit.alsoIn.map((p) => data.pillarById.get(p)).filter((p): p is Pillar => !!p && !p.archived),
    today: habitDay(habit, today, data, today),
    pause,
    status,
    phase: habit.phase ? (phaseTimeline(data, today).find((p) => p.number === habit.phase) ?? null) : null,
  };
}

export interface CalendarCell extends HabitDay {
  isToday: boolean;
  inMonth: boolean;
}

export interface HabitStatsView {
  strength: Strength;
  week: WeekProgress;
  /** dias com e dias sem desde o começo */
  totals: { withDays: number; withoutDays: number; partialDays: number };
  correlation: Correlation | null;
  /** as últimas 12 semanas (heatmap), de segunda a domingo */
  heatmap: CalendarCell[][];
  /** o mês (semanas de segunda a domingo; dias fora do mês com inMonth false) */
  month: { year: number; month: number; label: string; weeks: CalendarCell[][] };
  /** "nunca dois dias seguidos sem": verdadeiro enquanto for */
  neverTwoInARow: boolean;
  /** contador: totais por dia da semana atual */
  daily: { day: DayKey; total: number; goal: number | undefined; state: HabitDay['state'] }[];
  daysSince: DaysSince | null;
  budget: BudgetWeek | null;
}

function cell(data: DomainData, habit: Habit, d: DayKey, today: DayKey, inMonth = true): CalendarCell {
  return { ...habitDay(habit, d, data, today), isToday: d === today, inMonth };
}

export function habitStatsView(
  data: DomainData,
  id: string,
  today: DayKey,
  monthAnchor?: DayKey,
): HabitStatsView | null {
  const habit = data.habitById.get(id);
  if (!habit) return null;
  const heatStart = addDays(weekStart(today), -11 * 7);
  const heatmap: CalendarCell[][] = [];
  for (let w = 0; w < 12; w++) {
    heatmap.push(weekDays(addDays(heatStart, w * 7)).map((d) => cell(data, habit, d, today)));
  }
  const anchor = monthAnchor ?? today;
  const { year, month } = parseDay(anchor);
  const mdays = monthDays(year, month);
  const mStart = weekStart(mdays[0]);
  const mEnd = addDays(weekStart(mdays[mdays.length - 1]), 6);
  const weeks: CalendarCell[][] = [];
  for (let w = mStart; w <= mEnd; w = addDays(w, 7)) {
    weeks.push(weekDays(w).map((d) => cell(data, habit, d, today, parseDay(d).month === month)));
  }
  // nunca dois dias seguidos sem
  let never = !!habit.startDay && diffDays(today, habit.startDay) >= 6;
  if (never && habit.startDay) {
    let prevMiss = false;
    for (const d of daysBetween(habit.startDay, addDays(today, -1))) {
      const s = habitDay(habit, d, data, today).state;
      const miss = s === 'notDone';
      if (miss && prevMiss) {
        never = false;
        break;
      }
      if (s === 'notDone' || isDoneLike(s)) prevMiss = miss;
    }
  }
  const showCorrelation = habit.type !== 'budget' && habit.type !== 'number' && habit.role !== 'checkin';
  return {
    strength: habitStrength(habit, today, data, today),
    week: weekProgress(habit, today, data, today),
    totals: habitTotals(habit, today, data, today),
    correlation: showCorrelation ? correlation(habit, data, today) : null,
    heatmap,
    month: { year, month, label: `${monthName(month)} de ${year}`, weeks },
    neverTwoInARow: never,
    daily:
      habit.type === 'counter'
        ? weekDays(today).map((d) => {
            const hd = habitDay(habit, d, data, today);
            return { day: d, total: counterTotal(data, habit.id, d), goal: hd.goal.value, state: hd.state };
          })
        : [],
    daysSince: habit.type === 'daysSince' ? daysSince(habit, data, today) : null,
    budget: habit.type === 'budget' ? budgetWeek(habit, today, data, today) : null,
  };
}

// ---------- listas de Ajustes ----------

export interface PillarListItem {
  pillar: Pillar;
  /** hábitos ativos (principal ou extra), sem arquivados */
  habitCount: number;
}

export function pillarsList(data: DomainData, includeArchived = false): PillarListItem[] {
  return data.pillars
    .filter((p) => includeArchived || !p.archived)
    .map((p) => ({ pillar: p, habitCount: data.habits.filter((h) => !h.archived && inPillar(h, p.id)).length }));
}

export interface HabitListItem {
  habit: Habit;
  pillar: Pillar | null;
  alsoIn: Pillar[];
  status: HabitView['status'];
  /** "Pausado até 5 nov" */
  pausedUntil: DayKey | null;
  /** começo previsto (fase futura) */
  startsOn: DayKey | null;
}

export function habitsList(data: DomainData, today: DayKey): HabitListItem[] {
  const timeline = phaseTimeline(data, today);
  return data.habits.map((habit) => {
    const own = data.pauses.find((p) => p.habitIds?.includes(habit.id) && p.end >= today && p.start <= today);
    const status: HabitView['status'] = habit.archived
      ? 'archived'
      : !habit.startDay || habit.startDay > today
        ? 'upcoming'
        : own
          ? 'paused'
          : 'active';
    const ph = habit.phase ? timeline.find((p) => p.number === habit.phase) : null;
    return {
      habit,
      pillar: data.pillarById.get(habit.pillarId) ?? null,
      alsoIn: habit.alsoIn.map((p) => data.pillarById.get(p)).filter((p): p is Pillar => !!p && !p.archived),
      status,
      pausedUntil: own?.end ?? null,
      startsOn: status === 'upcoming' ? (habit.startDay ?? ph?.start ?? null) : null,
    };
  });
}

// ---------- Progresso ----------

export type ProgressPeriod = 'week' | 'month' | 'phase';
export type ProgressTheme = 'overview' | 'mood' | 'measures' | string;

export interface ProgressRange {
  period: ProgressPeriod;
  from: DayKey;
  to: DayKey;
  /** "19 – 25 de outubro", "outubro de 2026", "Fase 1 · Base" */
  label: string;
  sublabel: string | null;
  isCurrent: boolean;
  /** âncoras para as setas (null = desabilitada) */
  prev: DayKey | null;
  next: DayKey | null;
  phase: number | null;
}

export interface Insight {
  habitId: string;
  text: string;
  correlation: Correlation;
}

export interface CounterSection {
  habit: Habit;
  days: {
    day: DayKey;
    total: number;
    goal: number | undefined;
    state: HabitDay['state'];
    isToday: boolean;
    future: boolean;
  }[];
  /** "80 g ou mais em 2 dos 3 dias fechados" */
  summary: string;
}

export interface PillarSections {
  counters: CounterSection[];
  habits: { habit: Habit; week: WeekProgress }[];
  limits: { habit: Habit; budget: BudgetWeek }[];
  daysSince: { habit: Habit; daysSince: DaysSince }[];
  ratings: { habit: Habit; avg: number | null; count: number }[];
}

export interface ProgressView {
  range: ProgressRange;
  chips: { key: string; label: string; pillar: Pillar | null }[];
  constancy: number | null;
  pillars: { pillar: Pillar; ratio: number | null }[];
  insights: Insight[];
  /** o padrão mais perto de aparecer (com menos de 7 e 7) */
  waiting: Correlation | null;
  /** quantos outros padrões estão a caminho, além do `waiting` ("Mais 2 padrões a caminho") */
  waitingMore: number;
  /** "Semana passada ›" (ou a fase anterior) */
  previous: { kind: 'week' | 'phase'; key: DayKey | number; ratio: number | null } | null;
  mood: {
    days: { day: DayKey; mood: number | null; energy: number | null; future: boolean }[];
    avgMood: number | null;
    avgEnergy: number | null;
    insights: Insight[];
  } | null;
  measures: {
    weight: WeightTrend;
    lastWeight: Measurement | null;
    waist: Measurement[];
    numbers: { habit: Habit; days: { day: DayKey; value: number | null }[]; avg: number | null }[];
  } | null;
  pillar: (PillarSections & { pillar: Pillar }) | null;
}

function oneDecimal(v: number): string {
  return v.toFixed(1).replace('.', ',');
}

/** "Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4." */
export function insightText(c: Correlation, habit: Habit): string {
  const name = habit.shortName ?? habit.name.charAt(0).toLowerCase() + habit.name.slice(1);
  const what = c.metric === 'mood' ? 'seu humor médio foi' : 'sua energia média foi';
  return `Nos dias com ${name}, ${what} ${oneDecimal(c.withAvg ?? 0)}. Nos outros, ${oneDecimal(c.withoutAvg ?? 0)}.`;
}

export function progressRange(
  data: DomainData,
  period: ProgressPeriod,
  anchor: DayKey,
  today: DayKey,
  phaseNumber?: number,
): ProgressRange {
  if (period === 'phase') {
    const timeline = phaseTimeline(data, today).filter((p) => p.status !== 'future');
    const cur = timeline.find((p) => p.number === phaseNumber) ?? timeline[timeline.length - 1];
    if (cur?.start) {
      const idx = timeline.indexOf(cur);
      const end = cur.status === 'current' ? today : (cur.end ?? today);
      return {
        period,
        from: cur.start,
        to: end,
        label: `Fase ${cur.number} · ${cur.name}`,
        sublabel: formatRange(cur.start, cur.end ?? today, cur.status === 'current' ? undefined : undefined),
        isCurrent: cur.status === 'current',
        prev: idx > 0 ? String(timeline[idx - 1].number) : null,
        next: idx < timeline.length - 1 ? String(timeline[idx + 1].number) : null,
        phase: cur.number,
      };
    }
  }
  if (period === 'month') {
    const { year, month } = parseDay(anchor);
    const days = monthDays(year, month);
    const prevMonth = addDays(days[0], -1);
    const nextMonth = addDays(days[days.length - 1], 1);
    return {
      period,
      from: days[0],
      to: days[days.length - 1],
      label: `${monthName(month)} de ${year}`,
      sublabel: null,
      isCurrent: today >= days[0] && today <= days[days.length - 1],
      prev: prevMonth,
      next: nextMonth <= today ? nextMonth : null,
      phase: null,
    };
  }
  const w = weekStart(anchor);
  const nextW = addDays(w, 7);
  return {
    period: 'week',
    from: w,
    to: addDays(w, 6),
    label: formatRange(w, addDays(w, 6)),
    sublabel: null,
    isCurrent: w === weekStart(today),
    prev: addDays(w, -7),
    next: nextW <= today ? nextW : null,
    phase: null,
  };
}

function pillarSections(data: DomainData, pillar: Pillar, range: ProgressRange, today: DayKey): PillarSections {
  const habits = data.habits.filter((h) => !h.archived && h.startDay && inPillar(h, pillar.id));
  const days = daysBetween(range.from, range.to);
  const out: PillarSections = { counters: [], habits: [], limits: [], daysSince: [], ratings: [] };
  for (const h of habits) {
    switch (h.type) {
      case 'counter': {
        const list = days.map((d) => {
          const hd = habitDay(h, d, data, today);
          return {
            day: d,
            total: counterTotal(data, h.id, d),
            goal: hd.goal.value,
            state: hd.state,
            isToday: d === today,
            future: d > today,
          };
        });
        const closed = list.filter((x) => x.day < today && x.state !== 'inactive' && x.state !== 'paused');
        const hit = closed.filter((x) => x.state === 'done').length;
        const g = goalOn(h, today, data);
        const goalText =
          g.unit === 'ml' ? `${formatNumber((g.value ?? 0) / 1000, 2)} L` : `${g.value ?? ''} ${g.unit ?? ''}`.trim();
        out.counters.push({
          habit: h,
          days: list,
          summary: `${goalText} ou mais em ${hit} ${closed.length === 1 ? 'do dia fechado' : `dos ${closed.length} dias fechados`}`,
        });
        break;
      }
      case 'budget':
        out.limits.push({ habit: h, budget: budgetWeek(h, range.to > today ? today : range.to, data, today) });
        break;
      case 'daysSince':
        out.daysSince.push({ habit: h, daysSince: daysSince(h, data, today) });
        break;
      case 'rating': {
        let sum = 0;
        let n = 0;
        for (const d of days) {
          const r = data.marks.get(markId(d, h.id))?.rating;
          if (r) {
            sum += r;
            n++;
          }
        }
        out.ratings.push({ habit: h, avg: n ? sum / n : null, count: n });
        break;
      }
      case 'number':
        break;
      default:
        out.habits.push({ habit: h, week: weekProgress(h, range.to > today ? today : range.to, data, today) });
    }
  }
  return out;
}

export function progressView(
  data: DomainData,
  period: ProgressPeriod,
  theme: ProgressTheme,
  anchor: DayKey,
  today: DayKey,
  phaseNumber?: number,
): ProgressView {
  const range = progressRange(data, period, anchor, today, phaseNumber);
  const activePillars = data.pillars.filter((p) => !p.archived);
  const chips = [
    { key: 'overview', label: 'Visão geral', pillar: null },
    { key: 'mood', label: 'Humor', pillar: null },
    { key: 'measures', label: 'Medidas', pillar: null },
    ...activePillars.map((p) => ({ key: p.id, label: p.name, pillar: p })),
  ];
  const c = constancy(data, range.from, range.to, today);
  const closedPhase =
    range.period === 'phase' && !range.isCurrent ? data.phases.find((p) => p.number === range.phase) : null;
  const pillars = pillarConstancies(data, range.from, range.to, today)
    .map((pc) => ({ pillar: data.pillarById.get(pc.pillarId)!, ratio: pc.ratio }))
    .filter((p) => p.ratio !== null);
  const insights = topCorrelations(data, today, 'mood', 2).map((cor) => ({
    habitId: cor.habitId,
    correlation: cor,
    text: insightText(cor, data.habitById.get(cor.habitId)!),
  }));
  const waiting = insights.length ? [] : waitingPatterns(data, today);
  let previous: ProgressView['previous'] = null;
  if (range.period === 'week') {
    const pw = addDays(range.from, -7);
    if (planStart(data) && planStart(data)! <= addDays(pw, 6))
      previous = {
        kind: 'week',
        key: pw,
        ratio: data.reviews.get(pw)?.constancy ?? weekConstancy(data, pw, today).ratio,
      };
  } else if (range.period === 'phase' && range.prev) {
    const n = Number(range.prev);
    const ph = data.phases.find((p) => p.number === n);
    previous = { kind: 'phase', key: n, ratio: ph?.closingConstancy ?? null };
  }
  const view: ProgressView = {
    range,
    chips,
    constancy: closedPhase?.closingConstancy ?? c.ratio,
    pillars,
    insights,
    waiting: waiting[0] ?? null,
    waitingMore: Math.max(0, waiting.length - 1),
    previous,
    mood: null,
    measures: null,
    pillar: null,
  };
  if (theme === 'mood') {
    const days = daysBetween(range.from, range.to).map((d) => {
      const ci = data.checkins.get(d);
      return { day: d, mood: ci?.mood ?? null, energy: ci?.energy ?? null, future: d > today };
    });
    const ms = days.filter((d) => d.mood !== null);
    const es = days.filter((d) => d.energy !== null);
    view.mood = {
      days,
      avgMood: ms.length ? ms.reduce((n, d) => n + d.mood!, 0) / ms.length : null,
      avgEnergy: es.length ? es.reduce((n, d) => n + d.energy!, 0) / es.length : null,
      insights: [...topCorrelations(data, today, 'mood', 1), ...topCorrelations(data, today, 'energy', 1)].map(
        (cor) => ({ habitId: cor.habitId, correlation: cor, text: insightText(cor, data.habitById.get(cor.habitId)!) }),
      ),
    };
  } else if (theme === 'measures') {
    const weights = data.measurementsByKind.weight ?? [];
    const numbers = data.habits
      .filter((h) => h.type === 'number' && !h.archived && h.startDay && h.role !== 'weight' && h.role !== 'waist')
      .map((h) => {
        const days = daysBetween(range.from, range.to > today ? today : range.to).map((d) => ({
          day: d,
          value: habitDay(h, d, data, today).value,
        }));
        const vals = days.map((d) => d.value).filter((v): v is number => v !== null);
        return { habit: h, days, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
      });
    view.measures = {
      weight: weightTrend(weights, today),
      lastWeight: weights[weights.length - 1] ?? null,
      waist: (data.measurementsByKind.waist ?? []).filter((m) => m.day >= addDays(today, -28)),
      numbers,
    };
  } else if (theme !== 'overview') {
    const pillar = data.pillarById.get(theme);
    if (pillar) view.pillar = { pillar, ...pillarSections(data, pillar, range, today) };
  }
  return view;
}

// ---------- um dia (folha do Progresso) ----------

export interface DaySummary {
  day: DayKey;
  label: string;
  checkin: Checkin | null;
  count: { done: number; total: number };
  counters: { habit: Habit; total: number; goal: number | undefined }[];
  weight: Measurement | null;
  pause: Pause | null;
}

export function daySummary(data: DomainData, day: DayKey, today: DayKey): DaySummary {
  const count = dayCount(data, day, today);
  return {
    day,
    label: `${weekdayName(day).charAt(0).toUpperCase()}${weekdayName(day).slice(1)}, ${formatDayShort(day)}`,
    checkin: data.checkins.get(day) ?? null,
    count: { done: count.done, total: count.total },
    counters: data.habits
      .filter((h) => h.type === 'counter' && h.startDay && h.startDay <= day && !h.archived)
      .map((h) => ({ habit: h, total: counterTotal(data, h.id, day), goal: goalOn(h, day, data).value })),
    weight: data.measurementById.get(`${day}_weight`) ?? null,
    pause: appPauseOn(data, day),
  };
}

// ---------- Jornada ----------

export interface ReviewListItem {
  week: WeekKey;
  /** dia da revisão */
  day: DayKey;
  /** "domingo, 18 out" */
  label: string;
  phase: number | null;
  /** "semana 1 da fase 2" ou "fim da fase 1" */
  context: string;
  constancy: number | null;
  status: 'done' | 'pending';
  endOfPhase: boolean;
}

export interface JourneyView {
  phases: PhaseView[];
  current: PhaseView | null;
  next: PhaseView | null;
  run: { habit: Habit | null; startsOn: DayKey | null; available: boolean; weeks: number; perWeek: number };
  reviews: ReviewListItem[];
  /** a primeira revisão (estado vazio "A primeira Revisão da semana é no domingo, 27 set.") */
  firstReviewDay: DayKey | null;
  pause: Pause | null;
}

function reviewDayOf(data: DomainData, week: WeekKey): DayKey {
  return addDays(week, data.profile.weeklyReview?.weekday ?? 6);
}

export function journeyView(data: DomainData, now: Millis): JourneyView {
  const today = logicalDay(now, data.clock);
  const phases = phaseTimeline(data, today);
  const runHabit = data.habits.find((h) => h.role === 'run' && !h.archived) ?? null;
  const runPhase = runHabit?.phase ? phases.find((p) => p.number === runHabit.phase) : null;
  const reviews: ReviewListItem[] = [];
  const done = [...data.reviews.values()].filter((r) => r.status === 'done').sort((a, b) => (a.week < b.week ? 1 : -1));
  const pending = pendingReview(data, now);
  const describe = (r: Pick<Review, 'week' | 'phase' | 'endOfPhase'>): string => {
    const ph = phases.find((p) => p.number === r.phase);
    if (r.endOfPhase && r.phase) return `fim da fase ${r.phase}`;
    if (ph?.start) return `semana ${Math.floor(diffDays(r.week, weekStart(ph.start)) / 7) + 1} da fase ${ph.number}`;
    return '';
  };
  if (pending) {
    const ph = currentPhase(data, reviewDayOf(data, pending.week));
    reviews.push({
      week: pending.week,
      day: pending.day,
      label: `${weekdayName(pending.day)}, ${formatDayShort(pending.day)}`,
      phase: ph?.number ?? null,
      context: describe({
        week: pending.week,
        phase: ph?.number ?? null,
        endOfPhase: !!ph?.end && ph.end <= addDays(pending.week, 6),
      }),
      constancy: null,
      status: 'pending',
      endOfPhase: false,
    });
  }
  for (const r of done) {
    const day = reviewDayOf(data, r.week);
    reviews.push({
      week: r.week,
      day,
      label: `${weekdayName(day)}, ${formatDayShort(day)}`,
      phase: r.phase ?? null,
      context: describe(r),
      constancy: r.constancy ?? null,
      status: 'done',
      endOfPhase: !!r.endOfPhase,
    });
  }
  const start = planStart(data);
  return {
    phases,
    current: phases.find((p) => p.status === 'current') ?? null,
    next: phases.find((p) => p.status === 'future') ?? null,
    run: {
      habit: runHabit,
      startsOn: runHabit?.startDay ?? runPhase?.start ?? null,
      available: !!runHabit?.startDay && runHabit.startDay <= today,
      weeks: RUN_PLAN.length,
      perWeek: RUN_SESSIONS_PER_WEEK,
    },
    reviews,
    firstReviewDay: start ? reviewDayOf(data, weekStart(start)) : null,
    pause: currentOrNextPause(data, today),
  };
}

// ---------- plano de corrida ----------

export interface RunPlanView {
  habit: Habit | null;
  /** o plano já começou (fase da corrida em curso) */
  available: boolean;
  startsOn: DayKey | null;
  weeks: (RunWeek & { current: boolean; sessionsDone: number })[];
  /** o próximo treino */
  next: { week: number; session: number };
  sessionsDone: number;
  schedule: { days: number[]; time: string | null };
  activeRun: Run | null;
  /** treinos feitos, do mais recente para o mais antigo */
  history: Run[];
}

export function runPlanView(data: DomainData, now: Millis): RunPlanView {
  const today = logicalDay(now, data.clock);
  const habit = data.habits.find((h) => h.role === 'run' && !h.archived) ?? null;
  const done = data.runs.filter((r) => r.status === 'done' && (!habit || r.habitId === habit.id));
  const next = nextSession(done.length);
  const ph = habit?.phase ? phaseTimeline(data, today).find((p) => p.number === habit.phase) : null;
  return {
    habit,
    available: !!habit?.startDay && habit.startDay <= today,
    startsOn: habit?.startDay ?? ph?.start ?? null,
    weeks: RUN_PLAN.map((w) => ({
      ...w,
      current: w.week === next.week,
      sessionsDone: done.filter((r) => r.week === w.week).length,
    })),
    next,
    sessionsDone: done.length,
    schedule: { days: habit?.schedule.days ?? [], time: habit?.schedule.time ?? null },
    activeRun: activeRun(data, now),
    history: [...done].reverse(),
  };
}

// ---------- Revisão da semana ----------

export interface ReviewView {
  week: WeekKey;
  window: ReviewWindow;
  review: Review | null;
  step: number;
  /** 3 passos no fim da fase (com o convite), 2 no meio */
  steps: number;
  summary: ReviewSummary;
  suggestion: ReturnType<typeof phaseSuggestion>;
  next: PhaseView | null;
  /** programa a dois ativo (o bloco do passo 2) */
  together: Habit | null;
  /** cintura medida nesta conta */
  waist: Habit | null;
  lastWaist: Measurement | null;
  /** contadores com subida da escada pendente ("subir para 90 g?") */
  ramps: { habit: Habit; from: number; to: number }[];
  readOnly: boolean;
}

export function reviewView(data: DomainData, weekOrDay: DayKey, now: Millis): ReviewView {
  const today = logicalDay(now, data.clock);
  const week = weekStart(weekOrDay);
  const review = data.reviews.get(week) ?? null;
  const summary = reviewSummary(data, week, today);
  const win = reviewWindow(data.profile, now, data.clock);
  const reviewDay = reviewDayOf(data, week);
  const window: ReviewWindow =
    win.week === week
      ? win
      : {
          week,
          day: reviewDay,
          opensAt: instantAt(reviewDay, data.profile.weeklyReview?.time ?? '18:00', data.clock),
          closesAt: instantAt(
            addDays(reviewDay, 3),
            `${String(data.clock.dayStartHour).padStart(2, '0')}:00`,
            data.clock,
          ),
          open: false,
        };
  const role = (r: HabitRole) =>
    data.habits.find((h) => h.role === r && !h.archived && h.startDay && h.startDay <= today) ?? null;
  const ramps = data.habits
    .filter((h) => h.type === 'counter' && !h.archived && h.goal.ramp?.ask)
    .map((h) => ({ h, r: nextRampStep(h, today) }))
    .filter((x) => x.r?.due)
    .map((x) => ({ habit: x.h, from: x.r!.from, to: x.r!.to }));
  return {
    week,
    window,
    review,
    step: review?.step ?? 1,
    steps: summary.endOfPhase ? 3 : 2,
    summary,
    suggestion: phaseSuggestion(data, today),
    next: nextPhase(data, today),
    together: role('together'),
    waist: data.habits.find((h) => h.role === 'waist' && !h.archived) ?? null,
    lastWaist: lastBefore(data.measurementsByKind.waist ?? [], addDays(today, 1)),
    ramps,
    readOnly: review?.status === 'done',
  };
}

// ---------- contadores do dia ----------

export function counterView(data: DomainData, habitId: string, day: DayKey, today: DayKey, minutes: number) {
  const habit = data.habitById.get(habitId);
  if (!habit) return null;
  const hd = habitDay(habit, day, data, today);
  const total = counterTotal(data, habitId, day);
  const goal = hd.goal.value;
  return {
    habit,
    day,
    total,
    goal,
    /** quanto falta (0 depois da meta) */
    left: goal !== undefined ? Math.max(0, goal - total) : null,
    /** quanto passou da meta ("+6 g") */
    over: goal !== undefined ? Math.max(0, total - goal) : null,
    reached: goal !== undefined && total >= goal,
    state: hd.state,
    /** entradas do dia, mais recentes primeiro */
    entries: entriesOn(data, habitId, day),
    /** linhas agrupadas: mesmo item em até 10 min ("Ovo × 4") */
    lines: groupEntries(entriesOn(data, habitId, day)),
    quickAdds: habit.quickAdds,
    quickAddsNow: quickAddsFor(habit, minutes),
    /** escala da barra: o maior entre meta × 1,25 e total × 1,1 */
    scale: Math.max((goal ?? 0) * 1.25, total * 1.1, 1),
  };
}

export interface EntryLine {
  key: string;
  item: string | null;
  count: number;
  amount: number;
  /** a primeira entrada (hora da linha) */
  at: number;
  entryIds: string[];
}

/** Junta entradas do mesmo item com até 10 min de diferença numa linha só. */
export function groupEntries(
  entries: { id: string; item?: string; count: number; amount: number; at: number }[],
  windowMs = 10 * 60_000,
): EntryLine[] {
  const sorted = [...entries].sort((a, b) => b.at - a.at);
  const lines: EntryLine[] = [];
  for (const e of sorted) {
    const last = lines[lines.length - 1];
    if (last && last.item === (e.item ?? null) && last.at - e.at <= windowMs) {
      last.count += e.count;
      last.amount += e.amount;
      last.at = e.at;
      last.entryIds.push(e.id);
    } else {
      lines.push({ key: e.id, item: e.item ?? null, count: e.count, amount: e.amount, at: e.at, entryIds: [e.id] });
    }
  }
  return lines;
}

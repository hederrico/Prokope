// Ponto de entrada dos dados para as telas: import { useToday, useSession } from '@/data'.
// A API inteira está em src/data/README.md.
export { DataProvider, useSession, SIGN_IN_FAILED, FIREBASE_UNAVAILABLE } from './session';
export type { Session, SessionStatus, SessionMode, SessionUser } from './session';
export * from './hooks';
export { onWriteError, WRITE_ERROR_MESSAGE } from './writeErrors';
export { setFixedNow, parseAgora } from '@/stores/clock';
export { useDrafts, wasDayCelebrated, markDayCelebrated } from '@/stores/drafts';
export type { CheckinDraft, ReviewDraft, HabitFormDraft } from '@/stores/drafts';
export { ICON_CATALOG, ICON_CATEGORIES, searchIcons, suggestCategory, suggestIcon, iconLabel } from './icons';
export type { IconEntry, IconCategory } from './icons';
export type {
  TodayView,
  WeekView,
  WeekDayView,
  HabitView,
  HabitStatsView,
  CalendarCell,
  HabitListItem,
  PillarListItem,
  ProgressView,
  ProgressRange,
  ProgressPeriod,
  ProgressTheme,
  CounterSection,
  PillarSections,
  Insight,
  DaySummary,
  JourneyView,
  ReviewListItem,
  RunPlanView,
  ReviewView,
  EntryLine,
} from '@/domain/views';
export type { TodayItem, TodayLayout, TodayGroup, TodayGroupKey, TodayMode, Nudge, TimelineSlot } from '@/domain/today';
export type { HabitDay, HabitDayState, ResolvedGoal } from '@/domain/habitState';
export type { DaysSince, DaysSincePeriod } from '@/domain/daysSince';
export type { BudgetWeek } from '@/domain/budget';
export type { Correlation } from '@/domain/correlation';
export type { WeightTrend, WeightPoint } from '@/domain/weight';
export type { PhaseView, PhaseWeek } from '@/domain/phases';
export type { WeekProgress, Strength } from '@/domain/stats';
export type { RunWeek, RunBlock, RunPosition } from '@/domain/runPlan';
export type { ReviewSummary, ReviewLine, ReviewWindow } from '@/domain/review';
export type { PillarHabitFate } from '@/domain/pillars';

// Ajudantes puros do domínio que as telas costumam usar (textos, datas, plano base, corrida)
export * from '@/domain/format';
export {
  addDays,
  diffDays,
  daysBetween,
  weekStart,
  weekDays,
  weekdayOf,
  isWeekend,
  logicalDay,
  instantAt,
  timeOf,
  timeToMinutes,
  makeTime,
  parseDay,
  monthDays,
} from '@/domain/day';
export {
  TEMPLATE_PILLARS,
  TEMPLATE_HABITS,
  TEMPLATE_PHASES,
  DEFAULT_SCHEDULE,
  defaultPlanDraft,
  planChips,
  toggleChip,
  laterSummary,
  chosenCount,
  planStartDay,
} from '@/domain/planTemplate';
export type { PlanDraft, DraftPillar, PlanChip, TemplateHabit, TemplatePillar } from '@/domain/planTemplate';
export {
  RUN_PLAN,
  RUN_WEEKS,
  runWeek,
  runPosition,
  runElapsed,
  intervalsCompleted,
  nextSession,
} from '@/domain/runPlan';
export {
  quickAddsFor,
  quickAddSlot,
  isHiddenInToday,
  GROUP_TITLES,
  EVENING_OPENS_MIN,
  todayViewOf,
  logicalMinutes,
  dayTimeline,
  dayStripRange,
} from '@/domain/today';
export { groupEntries, insightText } from '@/domain/views';
export { isDoneLike, isCountable, goalOn, nextRampStep, timeMeetsGoal } from '@/domain/habitState';
export { pillarUsingColor, duplicatePillarName, firstFreeColor, pillarExitPlan } from '@/domain/pillars';
export { CORRELATION_NEEDED } from '@/domain/correlation';
export { WEIGHT_NEEDED } from '@/domain/weight';
export { markId, measurementId } from '@/domain/context';

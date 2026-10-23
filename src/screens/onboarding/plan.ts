// Ajudantes puros do primeiro acesso: o que entra no plano, as linhas da rotina e os horários.
// Tudo sai do rascunho e do plano base do domínio (TEMPLATE_*): nenhum hábito ou pilar fixo aqui.
import {
  TEMPLATE_HABITS,
  TEMPLATE_PILLARS,
  defaultPlanDraft,
  formatTime,
  makeTime,
  timeToMinutes,
  type DraftPillar,
  type PlanDraft,
  type TemplateHabit,
} from '@/data';
import type { IconName } from '@/icons';
import type { PaletteKey, ScheduleKey, TimeHM } from '@/types';

/** Nome de cada horário do perfil (os mesmos de Ajustes › Horários). */
export const SCHEDULE_LABELS: Record<ScheduleKey, string> = {
  wake: 'Acordar',
  chores: 'Tarefas da casa',
  checkin: 'Check-in',
  screensOff: 'Telas desligadas',
  bed: 'Deitar',
  caffeine: 'Cafeína',
};

/** A ordem das linhas da rotina: o acordar e depois a noite, do mais cedo ao deitar. */
const ROUTINE_ORDER: ScheduleKey[] = ['wake', 'caffeine', 'chores', 'checkin', 'screensOff', 'bed'];

/** Telas desligadas acompanha o deitar com esta folga (min). */
export const SCREENS_BEFORE_BED = 60;

/** O pilar de um hábito do modelo que fica valendo: o principal, ou o extra quando o principal saiu do plano. */
function livePillar(draft: PlanDraft, h: TemplateHabit): DraftPillar | null {
  const on = (key: string) => draft.pillars.find((p) => p.key === key && p.enabled) ?? null;
  return on(h.pillar) ?? (h.alsoIn ?? []).map(on).find((p) => !!p) ?? null;
}

/** Os hábitos do modelo que começam na fase 1 com este rascunho (ligados e com um pilar no plano). */
export function chosenHabits(draft: PlanDraft): { habit: TemplateHabit; pillar: DraftPillar }[] {
  if (draft.mode !== 'template') return [];
  const out: { habit: TemplateHabit; pillar: DraftPillar }[] = [];
  for (const h of TEMPLATE_HABITS) {
    if (h.phase !== 1 || !draft.habits.includes(h.key)) continue;
    const pillar = livePillar(draft, h);
    if (pillar) out.push({ habit: h, pillar });
  }
  return out;
}

/**
 * "7 hábitos escolhidos": os chips ligados (o acordar e o deitar contam como um), sem as medições.
 * A caminhada conta quando só o pilar extra (Corpo) ficou no plano (igual ao chosenCount do domínio).
 */
export function countChosen(draft: PlanDraft): number {
  const chips = new Set<string>();
  for (const { habit } of chosenHabits(draft)) if (!habit.measurement) chips.add(habit.chip ?? habit.key);
  return chips.size;
}

export interface RoutineRow {
  key: ScheduleKey;
  title: string;
  subtitle: string;
  icon: IconName;
  pillar: PaletteKey;
  value: TimeHM;
}

/** "8h50" (sem o "min"), atravessando a meia-noite. */
export function formatSpan(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m < 10 ? `0${m}` : m}` : `${h}h`;
}

/** Minutos do deitar até o acordar (deitar à 0h30 ainda conta na noite anterior). */
export function sleepSpan(bed: TimeHM, wake: TimeHM): number {
  const d = (timeToMinutes(wake) - timeToMinutes(bed) + 1440) % 1440;
  return d === 0 ? 1440 : d;
}

/** Lista "louça e lixo". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/** As linhas de horário da rotina: só os horários que algum hábito escolhido usa. */
export function routineRows(draft: PlanDraft): RoutineRow[] {
  const byKey = new Map<ScheduleKey, { habit: TemplateHabit; pillar: DraftPillar }[]>();
  for (const c of chosenHabits(draft)) {
    const key = c.habit.goal?.timeKey ?? c.habit.schedule?.timeKey;
    if (!key) continue;
    byKey.set(key, [...(byKey.get(key) ?? []), c]);
  }
  const rows: RoutineRow[] = [];
  for (const key of ROUTINE_ORDER) {
    const list = byKey.get(key);
    if (!list?.length) continue;
    const first = list[0];
    const value = draft.schedule[key];
    let subtitle: string;
    const tolerance = first.habit.goal?.toleranceMin;
    if (key === 'bed' && byKey.has('wake'))
      subtitle = `${formatSpan(sleepSpan(value, draft.schedule.wake))} até acordar`;
    else if (key === 'screensOff')
      subtitle = draft.screensFollowBed
        ? `${formatSpan(SCREENS_BEFORE_BED)} antes de deitar`
        : `às ${formatTime(value)}`;
    else if (tolerance) subtitle = `até ${tolerance} min de diferença conta`;
    else if (list.length > 1) subtitle = joinNames([...new Set(list.map((c) => c.habit.short))]);
    else subtitle = first.habit.description ?? '';
    rows.push({
      key,
      title: SCHEDULE_LABELS[key],
      subtitle,
      icon: first.habit.icon,
      pillar: first.pillar.color,
      value,
    });
  }
  return rows;
}

/** Muda um horário do rascunho. Telas desligadas acompanha o deitar até a pessoa mudar o horário das telas. */
export function withTime(draft: PlanDraft, key: ScheduleKey, value: TimeHM): PlanDraft {
  const schedule = { ...draft.schedule, [key]: value };
  let follow = draft.screensFollowBed;
  if (key === 'screensOff') follow = false;
  if (key === 'bed' && follow) schedule.screensOff = makeTime(0, timeToMinutes(value) - SCREENS_BEFORE_BED);
  return { ...draft, schedule, screensFollowBed: follow };
}

/** O hábito que usa os dias de coleta (o lixo), se ele entrou no plano. */
export function collectionHabit(draft: PlanDraft): { habit: TemplateHabit; pillar: DraftPillar } | null {
  return chosenHabits(draft).find((c) => c.habit.schedule?.useCollectionDays) ?? null;
}

/** Troca entre o plano base e o zero, guardando os horários e os pilares criados pela pessoa. */
export function withMode(draft: PlanDraft, mode: PlanDraft['mode']): PlanDraft {
  if (draft.mode === mode) return draft;
  const base = defaultPlanDraft(mode);
  const templateKeys = new Set(TEMPLATE_PILLARS.map((p) => p.key));
  const own = draft.pillars.filter((p) => !templateKeys.has(p.key));
  return {
    ...base,
    pillars: [...base.pillars, ...own],
    schedule: draft.schedule,
    screensFollowBed: draft.screensFollowBed,
    collectionDays: draft.collectionDays,
    weeklyReview: draft.weeklyReview,
    weekendTolerance: draft.weekendTolerance,
  };
}

/** Os pilares do modelo têm chave fixa; os criados no primeiro acesso, uma chave local. */
export function newPillarKey(): string {
  return `novo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Adiciona ou troca um pilar do rascunho. */
export function withPillar(draft: PlanDraft, pillar: DraftPillar): PlanDraft {
  const exists = draft.pillars.some((p) => p.key === pillar.key);
  return {
    ...draft,
    pillars: exists ? draft.pillars.map((p) => (p.key === pillar.key ? pillar : p)) : [...draft.pillars, pillar],
  };
}

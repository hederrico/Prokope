// Hooks de leitura para as telas: cada um devolve a leitura pronta (nada para recalcular na tela).
// Todos atualizam sozinhos quando os dados mudam (neste aparelho ou em outro) e quando o dia vira.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Checkin, DayKey, Habit, HabitRole, Invite, MeasurementKind, Pause, Pillar, Profile, Run } from '@/types';
import { appPauseOn, currentOrNextPause, habitDay, type HabitDay } from '@/domain/habitState';
import { daysSince, type DaysSince } from '@/domain/daysSince';
import { addDays, weekStart } from '@/domain/day';
import { pillarExitPlan, type PillarHabitFate } from '@/domain/pillars';
import { lastBefore, weightTrend, type WeightTrend } from '@/domain/weight';
import {
  namesOf,
  planWeek,
  runElapsed,
  runPosition,
  trainingOf,
  type RunPosition,
  type RunWeek,
  type TrainingNames,
} from '@/domain/runPlan';
import { reviewWindow, type ReviewWindow } from '@/domain/review';
import {
  counterView,
  daySummary,
  habitStatsView,
  habitView,
  habitsList,
  journeyView,
  pillarsList,
  progressView,
  reviewView,
  runPlanView,
  todayView,
  weekView,
  type DaySummary,
  type HabitListItem,
  type HabitStatsView,
  type HabitView,
  type JourneyView,
  type PillarListItem,
  type ProgressPeriod,
  type ProgressTheme,
  type ProgressView,
  type ReviewView,
  type RunPlanView,
  type TodayView,
  type WeekView,
} from '@/domain/views';
import { DEFAULT_PREFS } from '@/domain/planTemplate';
import { getPreferences } from '@/app/preferences';
import { useDataStore, type ChangeOrigin } from '@/stores/data';
import { nowMs, useClockStore } from '@/stores/clock';
import { useTogetherStore } from '@/stores/together';
import { cached, useDomain, useNow } from './useDomain';
import type { DocCollection } from './source';

export { useDomain, useNow };

// ---------- estado da carga ----------

/** 'loading' até o primeiro snapshot de perfil, hábitos e marcas; pendingWrites = há escrita esperando subir. */
export function useDataStatus() {
  return useDataStore(useShallow((s) => ({ status: s.status, pendingWrites: s.pendingWrites, error: s.error })));
}

/** De onde veio a última mudança (de uma coleção, ou de qualquer uma): só 'local' celebra. */
export function useChangeOrigin(col?: DocCollection): ChangeOrigin {
  return useDataStore((s) => (col ? (s.origins[col] ?? 'initial') : (s.lastChange?.origin ?? 'initial')));
}

/** Conexão: sem internet (navigator.onLine) e quantas escritas esperam subir. */
export function useConnection(): { online: boolean; pending: boolean } {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const pending = useDataStore((s) => s.pendingWrites);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return { online, pending };
}

// ---------- perfil ----------

export function useProfile(): Profile | null {
  return useDataStore((s) => s.profile);
}

/** Preferências (tema, animações, som, só a tendência do peso), com a cópia local antes dos dados chegarem. */
export function usePrefs(): Profile['prefs'] {
  const prefs = useDataStore((s) => s.profile?.prefs);
  return useMemo(() => {
    const local = getPreferences();
    return { ...DEFAULT_PREFS, theme: local.theme, motion: local.animations, sound: local.sound, ...(prefs ?? {}) };
  }, [prefs]);
}

// ---------- pilares e hábitos ----------

export function usePillars(opts: { includeArchived?: boolean } = {}): PillarListItem[] {
  const data = useDomain();
  return cached(data, `pillars:${!!opts.includeArchived}`, () => pillarsList(data, opts.includeArchived));
}

export interface PillarDetail {
  pillar: Pillar;
  habits: Habit[];
  /** o que acontece com cada hábito ao arquivar ou apagar ("Futebol sai do seu dia. A caminhada continua em Família.") */
  exitPlan: PillarHabitFate[];
}

export function usePillar(id: string | undefined): PillarDetail | null {
  const data = useDomain();
  return cached(data, `pillar:${id}`, () => {
    const pillar = id ? data.pillarById.get(id) : undefined;
    if (!pillar) return null;
    const habits = data.habits.filter(
      (h) =>
        (pillar.archived ? h.archivedWith === id || h.pillarId === id : !h.archived) &&
        (h.pillarId === id || h.alsoIn.includes(id!)),
    );
    return { pillar, habits, exitPlan: pillarExitPlan(pillar.id, data.habits, data.pillars) };
  });
}

/** Hábitos para Ajustes › Hábitos: 'active', 'upcoming' (próximas fases), 'archived' ou 'all'. */
export function useHabits(filter: 'active' | 'upcoming' | 'archived' | 'all' = 'all'): HabitListItem[] {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  return cached(data, `habits:${filter}:${today}`, () => {
    const list = habitsList(data, today);
    if (filter === 'all') return list;
    if (filter === 'active') return list.filter((h) => h.status === 'active' || h.status === 'paused');
    return list.filter((h) => h.status === filter);
  });
}

export function useHabit(id: string | undefined): HabitView | null {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  return cached(data, `habit:${id}:${today}`, () => (id ? habitView(data, id, today) : null));
}

/** O hábito de um papel (o Acordar, a Proteína, o Almoço...), ou null. */
export function useHabitByRole(role: HabitRole): Habit | null {
  const data = useDomain();
  return cached(data, `role:${role}`, () => data.habits.find((h) => h.role === role && !h.archived) ?? null);
}

/** Força, semana, totais, correlação, heatmap de 12 semanas e o mês do hábito. */
export function useHabitStats(id: string | undefined, month?: DayKey): HabitStatsView | null {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  return cached(data, `stats:${id}:${today}:${month ?? ''}`, () =>
    id ? habitStatsView(data, id, today, month) : null,
  );
}

export function useDaysSince(id: string | undefined): DaysSince | null {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  return cached(data, `ds:${id}:${today}`, () => {
    const h = id ? data.habitById.get(id) : undefined;
    return h ? daysSince(h, data, today) : null;
  });
}

/** O estado de um hábito num dia (marca, valor, meta do dia), para as folhas de registro. */
export function useHabitDay(habitId: string | undefined, day?: DayKey): HabitDay | null {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  const d = day ?? today;
  return cached(data, `hd:${habitId}:${d}:${today}`, () => {
    const h = habitId ? data.habitById.get(habitId) : undefined;
    return h ? habitDay(h, d, data, today) : null;
  });
}

export interface SleepView {
  /** Acordar de hoje (ou do dia) e Deitar da noite anterior */
  wake: { habit: Habit; day: DayKey; state: HabitDay } | null;
  bed: { habit: Habit; day: DayKey; state: HabitDay } | null;
}

/** A folha "Acordei às": o acordar do dia e o deitar da noite anterior, com as metas e o que já foi registrado. */
export function useSleep(day?: DayKey): SleepView {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  const d = day ?? today;
  return cached(data, `sleep:${d}:${today}`, () => {
    const wake = data.habits.find((h) => h.role === 'wake' && !h.archived);
    const bed = data.habits.find((h) => h.role === 'bed' && !h.archived);
    const bedDay = addDays(d, -1);
    return {
      wake: wake ? { habit: wake, day: d, state: habitDay(wake, d, data, today) } : null,
      bed: bed ? { habit: bed, day: bedDay, state: habitDay(bed, bedDay, data, today) } : null,
    };
  });
}

/** A pausa de agora ou a próxima marcada (Ajustes › Pausar), e a do app hoje. */
export function usePause(): { current: Pause | null; app: Pause | null; isScheduled: boolean } {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  return cached(data, `pause:${today}`, () => {
    const current = currentOrNextPause(data, today);
    return { current, app: appPauseOn(data, today), isScheduled: !!current && current.start > today };
  });
}

// ---------- Hoje e a semana ----------

/** O Hoje (ou outro dia, com `day`): grupos por momento, estados, a conta, a semana, a fase e os convites. */
export function useToday(day?: DayKey): TodayView {
  const data = useDomain();
  const { now, today, minutes } = useNow();
  const d = day ?? today;
  return cached(data, `today:${d}:${today}:${minutes}`, () => todayView(data, d, now, minutes));
}

/** A semana do topo (anéis por dia e a constância), da semana do dia dado. */
export function useWeek(day?: DayKey): WeekView {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  const d = day ?? today;
  return cached(data, `week:${weekStart(d)}:${today}`, () => weekView(data, d, today));
}

/**
 * Congela uma leitura até um evento de aparição (a "arrumação adiada" do Hoje):
 * recalcula quando `refreshKey` muda (ex.: a folha fechou) e quando o app volta para a frente. Trocar a fonte (entrar
 * ou sair do modo exemplo) também recalcula: os dados são outros, com outros ids.
 */
export function useFrozen<T>(value: T, refreshKey: unknown): T {
  const source = useDataStore((s) => s.source);
  const [state, setState] = useState({ value, key: refreshKey, source });
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });
  const stale = state.key !== refreshKey || state.source !== source;
  if (stale) setState({ value, key: refreshKey, source });
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setState((s) => ({ ...s, value: latest.current }));
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);
  return stale ? value : state.value;
}

/** O cartão ou a folha de um contador (proteína, água): total, meta, linhas e botões. */
export function useCounter(habitId: string | undefined, day?: DayKey) {
  const data = useDomain();
  const { today, minutes } = useNow();
  const d = day ?? today;
  return cached(data, `counter:${habitId}:${d}:${today}:${minutes}`, () =>
    habitId ? counterView(data, habitId, d, today, minutes) : null,
  );
}

/** O resumo de um dia (folha "um dia" do Progresso). */
export function useDaySummary(day: DayKey): DaySummary {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  return cached(data, `day:${day}:${today}`, () => daySummary(data, day, today));
}

export function useCheckin(day?: DayKey): Checkin | null {
  const today = useClockStore((s) => s.today);
  const d = day ?? today;
  return useDataStore((s) => s.checkins[d] ?? null);
}

// ---------- Progresso ----------

const PERIODS: Record<string, ProgressPeriod> = {
  semana: 'week',
  mes: 'month',
  fase: 'phase',
  week: 'week',
  month: 'month',
  phase: 'phase',
};
const THEMES: Record<string, ProgressTheme> = {
  visao: 'overview',
  humor: 'mood',
  medidas: 'measures',
  overview: 'overview',
  mood: 'mood',
  measures: 'measures',
};

/**
 * O Progresso. `period`: 'semana' | 'mes' | 'fase' (ou em inglês); `theme`: 'visao' | 'humor' | 'medidas' | id do pilar.
 * `anchor` é um dia do período (padrão: hoje); `phase` é o número da fase para o período 'fase'.
 */
export function useProgress(
  period: string = 'semana',
  theme: string = 'visao',
  opts: { anchor?: DayKey; phase?: number } = {},
): ProgressView {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  const p = PERIODS[period] ?? 'week';
  const t = THEMES[theme] ?? theme;
  const anchor = opts.anchor ?? today;
  return cached(data, `progress:${p}:${t}:${anchor}:${opts.phase ?? ''}:${today}`, () =>
    progressView(data, p, t, anchor, today, opts.phase),
  );
}

/** Pesos ou cinturas, com a média de 7 dias, a frase da tendência e a última medida antes de hoje. */
export function useMeasurements(kind: MeasurementKind = 'weight'): {
  list: ReturnType<typeof useDomain>['measurementsByKind']['weight'];
  trend: WeightTrend;
  today: number | null;
  previous: number | null;
  trendOnly: boolean;
} {
  const data = useDomain();
  const today = useClockStore((s) => s.today);
  return cached(data, `measure:${kind}:${today}`, () => {
    const list = data.measurementsByKind[kind] ?? [];
    return {
      list,
      trend: weightTrend(list, today, 3, kind === 'weight' ? 'kg' : 'cm'),
      today: data.measurementById.get(`${today}_${kind}`)?.value ?? null,
      previous: lastBefore(list, today)?.value ?? null,
      trendOnly: !!data.profile.prefs?.weightTrendOnly,
    };
  });
}

// ---------- Jornada, corrida e revisão ----------

export function useJourney(): JourneyView {
  const data = useDomain();
  const { now, today } = useNow();
  return cached(data, `journey:${today}:${Math.floor(now / 60_000)}`, () => journeyView(data, now));
}

/** O plano de um treino guiado (sem `habitId`, o primeiro que aparece na Jornada: as rotas antigas da corrida). */
export function useRunPlan(habitId?: string | null): RunPlanView {
  const data = useDomain();
  const { now, today } = useNow();
  return cached(data, `run:${habitId ?? ''}:${today}:${Math.floor(now / 60_000)}`, () =>
    runPlanView(data, now, habitId),
  );
}

export interface RunLive {
  run: Run;
  /** o treino guiado do treino (pode faltar num treino antigo sem hábito) */
  habit: Habit | null;
  /** os nomes do esforço e do descanso ("Pedalar", "Pedalar leve") */
  names: TrainingNames;
  week: RunWeek;
  position: RunPosition;
  paused: boolean;
}

/**
 * O treino em andamento, recalculado `fps` vezes por segundo pela hora de início e pelas pausas
 * (a tela bloqueada não desvia o tempo), com os blocos do plano do hábito. Sem `runId`, usa o treino ativo.
 */
export function useRunLive(runId?: string, fps = 4): RunLive | null {
  const run = useDataStore((s) => {
    if (runId) return s.runs[runId] ?? null;
    let best: Run | null = null;
    for (const r of Object.values(s.runs)) {
      if ((r.status === 'running' || r.status === 'paused') && (!best || r.startedAt > best.startedAt)) best = r;
    }
    return best;
  });
  const habit = useDataStore((s) => (run ? (s.habits[run.habitId] ?? null) : null));
  const [now, setNow] = useState(() => nowMs());
  useEffect(() => {
    if (!run) return;
    const first = setTimeout(() => setNow(nowMs()), 0);
    if (run.status !== 'running') return () => clearTimeout(first);
    const id = setInterval(() => setNow(nowMs()), 1000 / fps);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [run, fps]);
  return useMemo(() => {
    if (!run) return null;
    const plan = trainingOf(habit);
    const week = planWeek(plan, run.week);
    const elapsed = runElapsed(run, Math.max(now, run.startedAt));
    return {
      run,
      habit,
      names: namesOf(plan),
      week,
      position: runPosition(week, elapsed),
      paused: run.status === 'paused',
    };
  }, [run, habit, now]);
}

/** A revisão da semana (qualquer dia da semana serve: '2026-10-11' abre a semana de 5 a 11 out). */
export function useReview(weekOrDay: DayKey | undefined): ReviewView | null {
  const data = useDomain();
  const { now, today } = useNow();
  return cached(data, `review:${weekOrDay}:${today}:${Math.floor(now / 60_000)}`, () =>
    weekOrDay ? reviewView(data, weekOrDay, now) : null,
  );
}

/** A janela da revisão agora (aberta do dia e da hora escolhidos até 2 dias depois). */
export function useReviewWindow(): ReviewWindow {
  const data = useDomain();
  const { now } = useNow();
  return cached(data, `rw:${Math.floor(now / 60_000)}`, () => reviewWindow(data.profile, now, data.clock));
}

// ---------- A dois ----------

/** Um convite pelo id (a tela /convite/:id e a folha do convite). `undefined` enquanto carrega. */
export function useInvite(id: string | undefined): Invite | null | undefined {
  const source = useDataStore((s) => s.source);
  const [state, setState] = useState<{ id?: string; invite: Invite | null | undefined }>({ invite: undefined });
  useEffect(() => {
    let alive = true;
    if (!id || !source) return;
    source.together
      .getInvite(id)
      .then((invite) => alive && setState({ id, invite }))
      .catch(() => alive && setState({ id, invite: null }));
    return () => {
      alive = false;
    };
  }, [id, source]);
  if (!id) return null;
  return state.id === id ? state.invite : undefined;
}

export function useTogether() {
  const { link, invites, hugs } = useTogetherStore(
    useShallow((s) => ({ link: s.link, invites: s.invites, hugs: s.hugs })),
  );
  const source = useDataStore((s) => s.source);
  const today = useClockStore((s) => s.today);
  const now = useClockStore((s) => s.now);
  const linkId = useDataStore((s) => s.profile?.linkId ?? null);
  return useMemo(() => {
    const me = source?.uid ?? '';
    const partnerId = link?.members.find((m) => m !== me) ?? null;
    const pending = invites
      .filter((i) => i.status === 'pending' && i.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);
    return {
      linked: !!linkId && !!link,
      linkId,
      link,
      partner: partnerId ? { id: partnerId, name: link?.names?.[partnerId] ?? '' } : null,
      myShare: link?.share?.[me] ?? null,
      partnerShare: partnerId ? (link?.share?.[partnerId] ?? null) : null,
      /** o convite pendente desta pessoa (o mais novo) */
      invite: pending[0] ?? null,
      invites,
      /** carinhos recebidos hoje (vários viram um cartão só) */
      hugsToday: hugs.filter((h) => h.to === me && h.day === today),
    };
  }, [link, invites, hugs, source, today, now, linkId]);
}

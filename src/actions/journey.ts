// Jornada: fases (começar, ficar mais uma semana, editar), Revisão da semana e os treinos guiados.
import type { DayKey, Phase, Review, ReviewDecision, Run, TimeHM, WeekKey, Weekday } from '@/types';
import type { WriteOp } from '@/data/source';
import { markId, measurementId } from '@/domain/context';
import { addDays, weekStart } from '@/domain/day';
import { reviewSummary } from '@/domain/review';
import { intervalsCompleted, runElapsed, sessionStatus, weekOfHabit } from '@/domain/runPlan';
import { constancy } from '@/domain/stats';
import { guidedHabits } from '@/domain/views';
import { useDataStore } from '@/stores/data';
import { commit, mergeOp, newId, noUndo, now, profileMerge, setOp, snapshot, today, withId, type Undo } from './core';

// ---------- fases ----------

/**
 * Começa a fase `number` (a partir de amanhã, por padrão): fecha a atual com a constância de fechamento
 * e põe o dia de começo nos hábitos da fase nova. O desfazer é o "Mudar de ideia" (undoPhaseChoice).
 */
export async function startPhase(number: number, startDay: DayKey = addDays(today(), 1)): Promise<Undo> {
  const data = snapshot();
  const d = today();
  const t = now();
  const target = data.phases.find((p) => p.number === number);
  if (!target) return noUndo();
  const ops: WriteOp[] = [];
  for (const p of data.phases) {
    if (p.number >= number || !p.start) continue;
    if (p.closedAt) continue;
    const end = addDays(startDay, -1);
    ops.push(
      mergeOp('phases', p.id, {
        end,
        closedAt: t,
        closingConstancy: constancy(data, p.start, end < d ? end : d, d).ratio,
      }),
    );
  }
  ops.push(
    mergeOp('phases', target.id, {
      start: startDay,
      end: target.weeks ? addDays(startDay, target.weeks * 7 - 1) : null,
      closedAt: null,
      closingConstancy: null,
    }),
  );
  for (const h of data.habits) {
    if (h.phase === number && !h.archived && !h.startDay) ops.push(mergeOp('habits', h.id, { startDay, updatedAt: t }));
  }
  return commit(ops);
}

/**
 * "Mudar de ideia" (até o fim do domingo): desfaz o começo da fase `number` que ainda não começou (ou começou hoje),
 * mesmo depois de reabrir o app, quando o desfazer do toast já não existe. A fase anterior volta a ser a atual.
 */
export async function undoPhaseChoice(number: number): Promise<Undo> {
  const data = snapshot();
  const d = today();
  const target = data.phases.find((p) => p.number === number);
  if (!target?.start || target.start < d) return noUndo();
  const ops: WriteOp[] = [mergeOp('phases', target.id, { start: null, end: null })];
  const prev = [...data.phases].reverse().find((p) => p.number < number && p.start);
  if (prev) ops.push(mergeOp('phases', prev.id, { closedAt: null, closingConstancy: null }));
  for (const h of data.habits) {
    if (h.phase === number && h.startDay === target.start)
      ops.push(mergeOp('habits', h.id, { startDay: null, updatedAt: now() }));
  }
  return commit(ops);
}

/** "Ficar mais uma semana": a fase atual termina 7 dias depois. */
export async function stayInPhase(number: number, weeks = 1): Promise<Undo> {
  const data = snapshot();
  const p = data.phases.find((x) => x.number === number);
  if (!p?.start) return noUndo();
  const end = p.end ?? (p.weeks ? addDays(p.start, p.weeks * 7 - 1) : today());
  return commit([mergeOp('phases', p.id, { end: addDays(end, weeks * 7) })]);
}

/** Muda nome, duração ou o fim planejado de uma fase (Editar fases). */
export async function updatePhase(
  number: number,
  patch: Partial<Pick<Phase, 'name' | 'weeks' | 'end' | 'description'>>,
): Promise<Undo> {
  const p = snapshot().phases.find((x) => x.number === number);
  if (!p) return noUndo();
  return commit([mergeOp('phases', p.id, patch)]);
}

/**
 * Nova fase no fim do caminho. Numa conta em que nenhuma fase começou (plano do zero sem fases), a nova começa
 * hoje, com os hábitos dela que ainda esperam: sem isso, nenhuma fase viraria a atual.
 */
export async function addPhase(input: { name: string; weeks: number | null }): Promise<Undo> {
  const data = snapshot();
  const phases = data.phases;
  const number = phases.reduce((m, p) => Math.max(m, p.number), 0) + 1;
  const startNow = !phases.some((p) => p.start);
  const start = startNow ? today() : null;
  const p: Phase = {
    id: String(number),
    number,
    name: input.name.trim(),
    weeks: input.weeks,
    start,
    end: start && input.weeks ? addDays(start, input.weeks * 7 - 1) : null,
    closingConstancy: null,
    closedAt: null,
    celebratedAt: null,
  };
  const ops: WriteOp[] = [setOp('phases', p.id, p)];
  if (start) {
    for (const h of data.habits)
      if (h.phase === number && !h.archived && !h.startDay) ops.push(mergeOp('habits', h.id, { startDay: start, updatedAt: now() }));
  }
  return withId(await commit(ops), p.id);
}

/** A celebração da fase desbloqueada aconteceu (uma vez por fase). */
export async function markPhaseCelebrated(number: number): Promise<Undo> {
  return commit([mergeOp('phases', String(number), { celebratedAt: now() })]);
}

/** Sugerir a próxima fase a partir de 60%, 70% ou 80% (null = não sugerir). */
export async function setPhaseThreshold(threshold: number | null): Promise<Undo> {
  return commit([profileMerge({ phaseThreshold: threshold })]);
}

// ---------- Revisão da semana ----------

export interface ReviewStepPatch {
  tweakWorked?: Review['tweakWorked'];
  tweak?: string | null;
  /** cintura de hoje, em cm: grava também a medida */
  waist?: number | null;
  /** programa a dois: o dia e a nota (marca o dia no hábito) */
  together?: { habitId: string; day: DayKey; note?: string } | null;
}

function reviewDoc(week: WeekKey): Review | undefined {
  return useDataStore.getState().reviews[week];
}

/** Guarda o passo da revisão (e o que foi preenchido nele). */
export async function saveReviewStep(weekOrDay: DayKey, step: number, patch: ReviewStepPatch = {}): Promise<Undo> {
  const week = weekStart(weekOrDay);
  const prev = reviewDoc(week);
  const t = now();
  const d = today();
  const { waist, together, ...rest } = patch;
  const ops: WriteOp[] = [
    setOp('reviews', week, {
      ...(prev ?? { id: week, week, status: 'draft' }),
      ...rest,
      ...(waist !== undefined ? { waist } : {}),
      ...(together !== undefined ? { together } : {}),
      step: Math.max(step, prev?.status === 'done' ? (prev.step ?? step) : step),
      status: prev?.status ?? 'draft',
      updatedAt: t,
    } satisfies Review),
  ];
  if (typeof waist === 'number' && waist > 0) {
    const id = measurementId(d, 'waist');
    ops.push(
      setOp('measurements', id, { id, kind: 'waist', day: d, value: Math.round(waist * 10) / 10, unit: 'cm', at: t }),
    );
  }
  if (together?.habitId && together.day) {
    const h = useDataStore.getState().habits[together.habitId];
    if (h) {
      const planned = [
        ...(h.planned ?? []).filter((p) => p.day !== together.day && p.day >= d),
        { day: together.day, ...(together.note ? { note: together.note } : {}) },
      ];
      ops.push(mergeOp('habits', h.id, { planned, updatedAt: t }));
    }
  }
  return commit(ops);
}

/** Conclui a revisão: guarda a constância e o resumo da semana, e a decisão de fase (se houve). */
export async function finishReview(weekOrDay: DayKey, opts: { decision?: ReviewDecision | null } = {}): Promise<Undo> {
  const week = weekStart(weekOrDay);
  const data = snapshot();
  const d = today();
  const summary = reviewSummary(data, week, d);
  const prev = reviewDoc(week);
  const t = now();
  const doc: Review = {
    ...(prev ?? { id: week, week, step: 1 }),
    id: week,
    week,
    step: prev?.step ?? 1,
    status: 'done',
    constancy: summary.constancy,
    phase: summary.phase,
    endOfPhase: summary.endOfPhase,
    highlights: summary.highlights.map((l) => l.text),
    gentle: summary.gentle ? [summary.gentle.text] : [],
    decision: opts.decision ?? prev?.decision ?? null,
    doneAt: t,
    updatedAt: t,
  };
  return commit([setOp('reviews', week, doc)]);
}

// ---------- treino guiado ----------

const RUN_KEY = 'pk-run-active';

function saveRunCopy(run: Run | null) {
  try {
    if (run && (run.status === 'running' || run.status === 'paused'))
      localStorage.setItem(RUN_KEY, JSON.stringify(run));
    else localStorage.removeItem(RUN_KEY);
  } catch {
    /* sem armazenamento */
  }
}

/** A cópia local do treino em andamento (para retomar antes de os dados chegarem). */
export function readRunCopy(): Run | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
    return raw ? (JSON.parse(raw) as Run) : null;
  } catch {
    return null;
  }
}

/** O primeiro treino guiado que aparece (o das rotas antigas /corrida/... e /jornada/corrida). */
export function firstGuidedHabitId(): string | null {
  return guidedHabits(snapshot(), today())[0]?.id ?? null;
}

/** Dias e horário dos treinos de um treino guiado (sem `habitId`, o primeiro). */
export async function setRunSchedule(
  input: { days: Weekday[]; time: TimeHM },
  habitId: string | null = firstGuidedHabitId(),
): Promise<Undo> {
  if (!habitId) return noUndo();
  const h = useDataStore.getState().habits[habitId];
  if (!h) return noUndo();
  return commit([
    mergeOp('habits', habitId, { schedule: { ...h.schedule, days: input.days, time: input.time }, updatedAt: now() }),
  ]);
}

/** Começa um treino de um treino guiado (sem `habitId`, o primeiro). O id vem em `undo.id`. */
export async function startRun(input: { week: number; session: number; habitId?: string | null }): Promise<Undo> {
  const habitId = input.habitId ?? firstGuidedHabitId() ?? '';
  const run: Run = {
    id: newId(),
    habitId,
    day: today(),
    week: input.week,
    session: input.session,
    startedAt: now(),
    pauses: [],
    status: 'running',
    endedAt: null,
    seconds: null,
    intervalsDone: null,
  };
  saveRunCopy(run);
  const undo = await commit([setOp('runs', run.id, run)]);
  const wrapped: Undo = async () => {
    saveRunCopy(null);
    await undo();
  };
  return withId(wrapped, run.id);
}

function runOrNull(id: string): Run | null {
  return useDataStore.getState().runs[id] ?? null;
}

export async function pauseRun(id: string): Promise<Undo> {
  const run = runOrNull(id);
  if (!run || run.status !== 'running') return noUndo();
  const next: Run = { ...run, status: 'paused', pauses: [...run.pauses, { from: now(), to: null }] };
  saveRunCopy(next);
  return commit([setOp('runs', id, next)]);
}

export async function resumeRun(id: string): Promise<Undo> {
  const run = runOrNull(id);
  if (!run || run.status !== 'paused') return noUndo();
  const pauses = run.pauses.map((p, i) => (i === run.pauses.length - 1 && p.to === null ? { ...p, to: now() } : p));
  const next: Run = { ...run, status: 'running', pauses };
  saveRunCopy(next);
  return commit([setOp('runs', id, next)]);
}

/**
 * Termina o treino (no fim do último bloco ou em "Salvar o que fiz") e marca o hábito no dia, pelos blocos do plano
 * dele: o treino inteiro é feito, a partir da metade é parcial, abaixo fica registrado sem contar.
 */
export async function finishRun(id: string, opts: { endedAt?: number } = {}): Promise<Undo> {
  const run = runOrNull(id);
  if (!run) return noUndo();
  const endedAt = opts.endedAt ?? now();
  const closedPauses = run.pauses.map((p) => (p.to === null ? { ...p, to: endedAt } : p));
  const data = snapshot();
  const habit = data.habitById.get(run.habitId);
  const week = weekOfHabit(habit, run.week);
  const seconds = Math.min(
    week.totalSeconds,
    Math.round(runElapsed({ ...run, pauses: closedPauses, endedAt }, endedAt)),
  );
  const next: Run = {
    ...run,
    status: 'done',
    pauses: closedPauses,
    endedAt,
    seconds,
    intervalsDone: intervalsCompleted(week, seconds),
  };
  const ops: WriteOp[] = [setOp('runs', id, next)];
  if (habit) {
    const mid = markId(run.day, habit.id);
    const prev = data.marks.get(mid);
    const t = now();
    ops.push(
      setOp('marks', mid, {
        ...(prev ?? {}),
        id: mid,
        day: run.day,
        habitId: habit.id,
        status: sessionStatus(week, seconds),
        skipped: false,
        value: Math.round(seconds / 60),
        run: { week: run.week, session: run.session, seconds, runId: run.id },
        goal: { value: Math.round(week.totalSeconds / 60) },
        at: prev?.at ?? t,
        updatedAt: t,
      }),
    );
  }
  saveRunCopy(null);
  return commit(ops);
}

/** Descarta o treino ("Treino descartado" com Desfazer). */
export async function discardRun(id: string): Promise<Undo> {
  const run = runOrNull(id);
  if (!run) return noUndo();
  saveRunCopy(null);
  return commit([setOp('runs', id, { ...run, status: 'discarded', endedAt: now() })]);
}

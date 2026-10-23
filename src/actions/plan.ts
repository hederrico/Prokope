// O plano da pessoa: pilares, hábitos e pausas. Tudo é configurável e cada ação devolve o desfazer.
import type { DayKey, Habit, Pause, PauseReason, Pillar } from '@/types';
import type { WriteOp } from '@/data/source';
import { addDays } from '@/domain/day';
import { appPauseOn, scheduleTimeOn } from '@/domain/habitState';
import { ALL_DAYS } from '@/domain/planTemplate';
import { pillarExitPlan } from '@/domain/pillars';
import { runTemplatePlan } from '@/domain/runPlan';
import { timeToMinutes } from '@/domain/day';
import { useClockStore } from '@/stores/clock';
import { useDataStore } from '@/stores/data';
import { commit, deleteOp, mergeOp, newId, noUndo, now, setOp, snapshot, today, withId, type Undo } from './core';
import { markId } from '@/domain/context';

// ---------- pilares ----------

export interface PillarInput {
  name: string;
  color: Pillar['color'];
  icon: Pillar['icon'];
  description?: string;
}

/** Cria um pilar no fim da lista. O id novo vem em `undo.id`. */
export async function createPillar(input: PillarInput): Promise<Undo> {
  const pillars = Object.values(useDataStore.getState().pillars);
  const t = now();
  const p: Pillar = {
    id: newId(),
    name: input.name.trim(),
    color: input.color,
    icon: input.icon,
    ...(input.description ? { description: input.description } : {}),
    order: pillars.reduce((m, x) => Math.max(m, x.order), -1) + 1,
    archived: false,
    archivedAt: null,
    createdAt: t,
    updatedAt: t,
  };
  return withId(await commit([setOp('pillars', p.id, p)]), p.id);
}

export async function updatePillar(id: string, patch: Partial<PillarInput>): Promise<Undo> {
  if (!useDataStore.getState().pillars[id]) return noUndo();
  const clean = { ...patch, ...(patch.name !== undefined ? { name: patch.name.trim() } : {}) };
  return commit([mergeOp('pillars', id, { ...clean, updatedAt: now() })]);
}

/**
 * Arquiva o pilar num lote só: os hábitos só dele saem junto (archivedWith); os que têm um pilar extra
 * ativo passam para ele (a caminhada passa para Corpo); os que tinham o pilar como extra não mudam.
 */
export async function archivePillar(id: string): Promise<Undo> {
  const s = useDataStore.getState();
  const pillar = s.pillars[id];
  if (!pillar) return noUndo();
  const t = now();
  const d = today();
  const ops: WriteOp[] = [mergeOp('pillars', id, { archived: true, archivedAt: t, updatedAt: t })];
  for (const fate of pillarExitPlan(id, Object.values(s.habits), Object.values(s.pillars))) {
    if (fate.kind === 'goes' && !fate.habit.archived) {
      ops.push(
        mergeOp('habits', fate.habit.id, {
          archived: true,
          archivedAt: t,
          archivedDay: d,
          archivedWith: id,
          updatedAt: t,
        }),
      );
    } else if (fate.kind === 'moves') {
      ops.push(
        mergeOp('habits', fate.habit.id, {
          pillarId: fate.to,
          alsoIn: [...fate.habit.alsoIn.filter((x) => x !== fate.to), id],
          primaryFrom: id,
          updatedAt: t,
        }),
      );
    }
  }
  return commit(ops);
}

/** Restaura o pilar e os hábitos que saíram com ele (e devolve o principal a quem tinha passado). */
export async function restorePillar(id: string): Promise<Undo> {
  const s = useDataStore.getState();
  if (!s.pillars[id]) return noUndo();
  const t = now();
  const ops: WriteOp[] = [mergeOp('pillars', id, { archived: false, archivedAt: null, updatedAt: t })];
  for (const h of Object.values(s.habits)) {
    if (h.archived && h.archivedWith === id) {
      ops.push(
        mergeOp('habits', h.id, {
          archived: false,
          archivedAt: null,
          archivedDay: null,
          archivedWith: null,
          updatedAt: t,
        }),
      );
    } else if (h.primaryFrom === id) {
      ops.push(
        mergeOp('habits', h.id, {
          pillarId: id,
          alsoIn: [...h.alsoIn.filter((x) => x !== id), h.pillarId],
          primaryFrom: null,
          updatedAt: t,
        }),
      );
    }
  }
  return commit(ops);
}

/**
 * Apaga o pilar de vez: os hábitos só dele são apagados com marcas, somas e deslizes;
 * os compartilhados perdem o pilar (e passam para o extra, se ele era o principal).
 * Há desfazer (para o pilar sem hábitos, "Finanças apagado · Desfazer"); a folha decide se oferece.
 */
export async function deletePillar(id: string): Promise<Undo> {
  const s = useDataStore.getState();
  if (!s.pillars[id]) return noUndo();
  const t = now();
  const ops: WriteOp[] = [deleteOp('pillars', id)];
  const gone = new Set<string>();
  for (const fate of pillarExitPlan(id, Object.values(s.habits), Object.values(s.pillars))) {
    if (fate.kind === 'goes') {
      gone.add(fate.habit.id);
      ops.push(deleteOp('habits', fate.habit.id));
    } else if (fate.kind === 'moves') {
      ops.push(
        mergeOp('habits', fate.habit.id, {
          pillarId: fate.to,
          alsoIn: fate.habit.alsoIn.filter((x) => x !== fate.to && x !== id),
          updatedAt: t,
        }),
      );
    } else {
      ops.push(mergeOp('habits', fate.habit.id, { alsoIn: fate.habit.alsoIn.filter((x) => x !== id), updatedAt: t }));
    }
  }
  // hábitos arquivados só deste pilar
  for (const h of Object.values(s.habits)) {
    if (!gone.has(h.id) && h.pillarId === id && h.archived) {
      gone.add(h.id);
      ops.push(deleteOp('habits', h.id));
    }
  }
  for (const m of Object.values(s.marks)) if (gone.has(m.habitId)) ops.push(deleteOp('marks', m.id));
  for (const e of Object.values(s.entries)) if (gone.has(e.habitId)) ops.push(deleteOp('entries', e.id));
  for (const sl of Object.values(s.slips)) if (gone.has(sl.habitId)) ops.push(deleteOp('slips', sl.id));
  return commit(ops);
}

/** Nova ordem dos pilares (um lote com o order de cada um). */
export async function reorderPillars(ids: string[]): Promise<Undo> {
  const pillars = useDataStore.getState().pillars;
  const t = now();
  const ops = ids
    .filter((id) => pillars[id] && pillars[id].order !== ids.indexOf(id))
    .map((id) => mergeOp('pillars', id, { order: ids.indexOf(id), updatedAt: t }));
  return commit(ops);
}

// ---------- hábitos ----------

export type HabitDraft = Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>> & {
  name: string;
  type: Habit['type'];
  pillarId: string;
  /** quando começa: 'now' (hoje), o número de uma fase, ou um dia */
  start?: 'now' | number | DayKey;
};

/** Cria um hábito. Numa fase futura, ele espera (startDay null) e entra quando a fase começar. */
export async function createHabit(draft: HabitDraft): Promise<Undo> {
  const data = snapshot();
  const d = today();
  const t = now();
  let phase: number | null = draft.phase ?? null;
  let startDay: DayKey | null = d;
  if (typeof draft.start === 'number') {
    phase = draft.start;
    const ph = data.phases.find((p) => p.number === draft.start);
    startDay = ph?.start && ph.start <= d ? d : null;
  } else if (typeof draft.start === 'string' && draft.start !== 'now') {
    startDay = draft.start;
  } else if (draft.startDay !== undefined) {
    startDay = draft.startDay;
  } else if (phase === null) {
    const cur = [...data.phases].reverse().find((p) => p.start && p.start <= d);
    phase = cur?.number ?? null;
  }
  const moment = draft.schedule?.moment ?? (draft.type === 'budget' || draft.type === 'daysSince' ? 'free' : 'day');
  const sameMoment = data.habits.filter((h) => h.schedule.moment === moment);
  const habit: Habit = {
    id: newId(),
    name: draft.name.trim(),
    type: draft.type,
    icon: draft.icon ?? 'circle-dashed',
    pillarId: draft.pillarId,
    alsoIn: (draft.alsoIn ?? []).filter((p) => p !== draft.pillarId),
    phase,
    startDay,
    role: draft.role ?? null,
    ...(draft.description ? { description: draft.description } : {}),
    goal: { ...(draft.goal ?? {}) },
    schedule: { days: [...ALL_DAYS], ...(draft.schedule ?? {}), moment },
    quickAdds: (draft.quickAdds ?? []).map((q) => ({ ...q, id: q.id || newId() })),
    checklist: (draft.checklist ?? []).map((c) => ({ ...c, id: c.id || newId() })),
    ...(draft.planned ? { planned: draft.planned } : {}),
    ...(draft.type === 'guided' ? { training: draft.training ?? runTemplatePlan() } : {}),
    order: draft.order ?? sameMoment.reduce((m, h) => Math.max(m, h.order), -1) + 1,
    archived: false,
    archivedAt: null,
    archivedDay: null,
    archivedWith: null,
    createdAt: t,
    updatedAt: t,
  };
  return withId(await commit([setOp('habits', habit.id, habit)]), habit.id);
}

/** Muda campos de um hábito (meta, mínimo, horário, dias, pilar, ícone, botões...). */
export async function updateHabit(id: string, patch: Partial<Omit<Habit, 'id' | 'createdAt'>>): Promise<Undo> {
  const h = useDataStore.getState().habits[id];
  if (!h) return noUndo();
  const next: Habit = { ...h, ...patch, updatedAt: now() };
  if (patch.goal) next.goal = { ...patch.goal };
  if (patch.schedule) next.schedule = { ...h.schedule, ...patch.schedule };
  next.alsoIn = next.alsoIn.filter((p) => p !== next.pillarId);
  return commit([setOp('habits', id, next)]);
}

/** Leva o hábito para outra fase ("Proteína movida para a fase 3"). Na fase atual, entra hoje. */
export async function moveHabitToPhase(habitId: string, phaseNumber: number): Promise<Undo> {
  const data = snapshot();
  const h = data.habitById.get(habitId);
  if (!h) return noUndo();
  const d = today();
  const ph = data.phases.find((p) => p.number === phaseNumber);
  const started = !!ph?.start && ph.start <= d;
  return commit([
    mergeOp('habits', habitId, {
      phase: phaseNumber,
      startDay: started ? (h.startDay && h.startDay <= d ? h.startDay : d) : null,
      updatedAt: now(),
    }),
  ]);
}

/** Marca um dia para um hábito de vez na semana (programa a dois no sábado, com a nota). */
export async function scheduleHabit(habitId: string, day: DayKey, note?: string): Promise<Undo> {
  const h = useDataStore.getState().habits[habitId];
  if (!h) return noUndo();
  const planned = [
    ...(h.planned ?? []).filter((p) => p.day !== day && p.day >= today()),
    { day, ...(note ? { note } : {}) },
  ];
  return commit([mergeOp('habits', habitId, { planned, updatedAt: now() })]);
}

// ---------- pausas ----------

export interface PauseInput {
  start: DayKey;
  /** último dia pausado (inclusive) */
  end: DayKey;
  reason?: PauseReason | null;
  /** null = o app inteiro */
  habitIds?: string[] | null;
}

/** Pausa o app ou alguns hábitos. Sempre com data de volta. */
export async function startPause(input: PauseInput): Promise<Undo> {
  const t = now();
  const p: Pause = {
    id: newId(),
    start: input.start,
    end: input.end < input.start ? input.start : input.end,
    reason: input.reason ?? null,
    habitIds: input.habitIds?.length ? input.habitIds : null,
    createdAt: t,
    updatedAt: t,
  };
  return withId(await commit([setOp('pauses', p.id, p)]), p.id);
}

/** Estende ou encurta a pausa (ou muda o motivo). */
export async function updatePause(id: string, patch: Partial<PauseInput>): Promise<Undo> {
  const p = useDataStore.getState().pauses[id];
  if (!p) return noUndo();
  return commit([mergeOp('pauses', id, { ...patch, updatedAt: now() })]);
}

/** Cancela uma pausa marcada (antes de começar). */
export async function cancelPause(id: string): Promise<Undo> {
  if (!useDataStore.getState().pauses[id]) return noUndo();
  return commit([deleteOp('pauses', id)]);
}

/**
 * Encerra a pausa: o fim passa a ser ontem (uma pausa que começou hoje some).
 * Os hábitos de horário que já passaram saem da conta de hoje, como em "hoje não se aplica".
 */
export async function endPause(id: string, day: DayKey = today()): Promise<Undo> {
  const data = snapshot();
  const p = data.pauses.find((x) => x.id === id);
  if (!p) return noUndo();
  const yesterday = addDays(day, -1);
  const t = now();
  const ops: WriteOp[] =
    p.start > yesterday ? [deleteOp('pauses', id)] : [mergeOp('pauses', id, { end: yesterday, updatedAt: t })];
  if (p.start <= day && p.end >= day) {
    const minutes = useClockStore.getState().minutes;
    for (const h of data.habits) {
      if (h.archived || !h.startDay || h.startDay > day) continue;
      if (p.habitIds && !p.habitIds.includes(h.id)) continue;
      if (h.role === 'bed') continue;
      const key = h.goal.timeKey ?? h.schedule.timeKey;
      const time = key ? scheduleTimeOn(key, day, data.profile) : (h.goal.time ?? h.schedule.time);
      if (!time || timeToMinutes(time) + (h.goal.toleranceMin ?? 15) > minutes) continue;
      if (data.marks.has(markId(day, h.id))) continue;
      ops.push(
        setOp('marks', markId(day, h.id), {
          id: markId(day, h.id),
          day,
          habitId: h.id,
          status: 'logged',
          skipped: true,
          at: t,
          updatedAt: t,
        }),
      );
    }
  }
  return commit(ops);
}

/** A pausa do app hoje (atalho para as telas). */
export function activeAppPause(day: DayKey = today()): Pause | null {
  return appPauseOn(snapshot(), day);
}

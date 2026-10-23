// Registros do dia: marcar, horário, sono, nota, somas, deslizes, check-in, medidas, "hoje não se aplica",
// limites da semana e arquivar. Cada ação grava na hora e devolve o desfazer.
import type { Checkin, DayKey, Entry, Habit, Mark, MarkStatus, MeasurementKind, Slip, TimeHM } from '@/types';
import { markId, measurementId } from '@/domain/context';
import { addDays, instantAt, logicalDay, timeOf } from '@/domain/day';
import { goalOn, timeMeetsGoal, valueStatus } from '@/domain/habitState';
import { useDataStore } from '@/stores/data';
import { commit, deleteOp, mergeOp, newId, noUndo, now, setOp, snapshot, today, withId, type Undo } from './core';
import { shareMoodIfLinked } from './together';

function habitOrThrow(habitId: string): Habit {
  const h = useDataStore.getState().habits[habitId];
  if (!h) throw new Error(`Hábito não encontrado: ${habitId}`);
  return h;
}

function existingMark(day: DayKey, habitId: string): Mark | undefined {
  return useDataStore.getState().marks[markId(day, habitId)];
}

export interface MarkOptions {
  /** horário registrado ('06:58'), para hábitos de horário */
  time?: TimeHM;
  /** minutos ou quantidade (caminhada de 12 min conta como parcial se houver mínimo) */
  value?: number;
  /** treino de corrida */
  run?: Mark['run'];
  note?: string;
}

/** Monta a marca de um dia, com o estado calculado contra a meta da época (guardada em mark.goal). */
function buildMark(habit: Habit, day: DayKey, opts: MarkOptions, prev?: Mark): Mark {
  const data = snapshot();
  const goal = goalOn(habit, day, data, prev);
  let status: MarkStatus = 'done';
  if (habit.type === 'time') {
    const time = opts.time ?? prev?.time ?? timeOf(now(), data.clock);
    status = timeMeetsGoal(time, goal.time, goal.toleranceMin, data.clock.dayStartHour) ? 'done' : 'logged';
    opts = { ...opts, time };
  } else if (opts.run) {
    const minutes = opts.run.seconds / 60;
    const s = valueStatus(minutes, goal);
    status = s === 'notDone' ? 'logged' : s;
  } else if (opts.value !== undefined && goal.value !== undefined) {
    const s = valueStatus(opts.value, goal);
    status = s === 'notDone' ? 'logged' : s;
  }
  const t = now();
  return {
    ...(prev ?? {}),
    id: markId(day, habit.id),
    day,
    habitId: habit.id,
    status,
    skipped: false,
    ...(opts.time !== undefined ? { time: opts.time } : {}),
    ...(opts.value !== undefined ? { value: opts.value } : {}),
    ...(opts.run ? { run: opts.run } : {}),
    ...(opts.note !== undefined ? { note: opts.note } : {}),
    goal: { value: goal.value, time: goal.time, toleranceMin: goal.toleranceMin },
    at: prev?.at ?? t,
    updatedAt: t,
  };
}

/** Marca o hábito como feito no dia (idempotente). Para horário, passe { time }; para duração, { value }. */
export async function markHabit(habitId: string, day: DayKey = today(), opts: MarkOptions = {}): Promise<Undo> {
  const habit = habitOrThrow(habitId);
  const mark = buildMark(habit, day, opts, existingMark(day, habitId));
  return commit([setOp('marks', mark.id, mark)]);
}

/** Desmarca (apaga a marca do dia). */
export async function unmarkHabit(habitId: string, day: DayKey = today()): Promise<Undo> {
  if (!existingMark(day, habitId)) return noUndo();
  return commit([deleteOp('marks', markId(day, habitId))]);
}

/** Marca ou desmarca, pelo estado atual (o CheckButton). */
export async function toggleHabit(habitId: string, day: DayKey = today()): Promise<Undo> {
  const m = existingMark(day, habitId);
  if (m && !m.skipped && (m.status === 'done' || m.status === 'partial')) return unmarkHabit(habitId, day);
  return markHabit(habitId, day);
}

/** Corrigir um dia: feito, parcial ou sem ('none' apaga o documento). */
export async function setMark(habitId: string, day: DayKey, status: 'done' | 'partial' | 'none'): Promise<Undo> {
  if (status === 'none') return unmarkHabit(habitId, day);
  const habit = habitOrThrow(habitId);
  const prev = existingMark(day, habitId);
  const mark = buildMark(habit, day, {}, prev);
  mark.status = status;
  return commit([setOp('marks', mark.id, mark)]);
}

/** Registra um horário (hábitos de horário). Fora da tolerância, grava sem contar. */
export async function setTime(habitId: string, day: DayKey, time: TimeHM): Promise<Undo> {
  return markHabit(habitId, day, { time });
}

/**
 * Deitar e acordar, na folha "Acordei às": o deitar conta na noite anterior (ontem, no dia lógico),
 * e o acordar no dia de hoje. Cada um é feito se estiver na tolerância.
 */
export async function logSleep(
  times: { wake?: TimeHM; bed?: TimeHM },
  day: DayKey = today(),
  ids?: { wakeId?: string; bedId?: string },
): Promise<Undo> {
  const habits = Object.values(useDataStore.getState().habits);
  const wake = ids?.wakeId
    ? habits.find((h) => h.id === ids.wakeId)
    : habits.find((h) => h.role === 'wake' && !h.archived);
  const bed = ids?.bedId ? habits.find((h) => h.id === ids.bedId) : habits.find((h) => h.role === 'bed' && !h.archived);
  const ops = [];
  if (times.wake && wake) {
    const m = buildMark(wake, day, { time: times.wake }, existingMark(day, wake.id));
    ops.push(setOp('marks', m.id, m));
  }
  if (times.bed && bed) {
    const bedDay = addDays(day, -1);
    const m = buildMark(bed, bedDay, { time: times.bed }, existingMark(bedDay, bed.id));
    ops.push(setOp('marks', m.id, m));
  }
  return commit(ops);
}

/** Nota de 1 a 5 (almoço, jantar), com os chips do prato. */
export async function rate(
  habitId: string,
  day: DayKey,
  rating: number,
  opts: { tags?: string[] } = {},
): Promise<Undo> {
  const habit = habitOrThrow(habitId);
  const prev = existingMark(day, habitId);
  const mark = buildMark(habit, day, {}, prev);
  mark.status = 'done';
  mark.rating = Math.max(1, Math.min(5, Math.round(rating)));
  if (opts.tags) mark.tags = opts.tags;
  return commit([setOp('marks', mark.id, mark)]);
}

/** Liga ou desliga um passo de uma lista (ritual do sono). Todos = feito; a partir do mínimo = parcial. */
export async function setChecklistItem(habitId: string, day: DayKey, itemId: string, on: boolean): Promise<Undo> {
  const habit = habitOrThrow(habitId);
  const prev = existingMark(day, habitId);
  const items = new Set(prev?.items ?? []);
  if (on) items.add(itemId);
  else items.delete(itemId);
  if (!items.size) return prev ? commit([deleteOp('marks', markId(day, habitId))]) : noUndo();
  const total = habit.checklist.length || 1;
  const min = habit.goal.partialMin;
  const status: MarkStatus =
    items.size >= total ? 'done' : min !== undefined && items.size >= min ? 'partial' : 'logged';
  const mark = buildMark(habit, day, {}, prev);
  mark.items = [...items];
  mark.status = status;
  return commit([setOp('marks', mark.id, mark)]);
}

/** Número livre de um hábito (minutos de leitura, páginas). Peso e cintura usam logMeasurement. */
export async function logNumber(habitId: string, day: DayKey, value: number | null): Promise<Undo> {
  if (value === null) return unmarkHabit(habitId, day);
  const habit = habitOrThrow(habitId);
  if (habit.role === 'weight' || habit.role === 'waist') return logMeasurement(habit.role, day, value);
  const mark = buildMark(habit, day, { value }, existingMark(day, habitId));
  return commit([setOp('marks', mark.id, mark)]);
}

// ---------- somas (contadores e limites) ----------

/** Toques seguidos no mesmo botão em até 1,5 s viram um registro só ("Ovo × 3 · 18 g"). */
export const MERGE_WINDOW_MS = 1500;
let lastEntry: { id: string; habitId: string; key: string; at: number } | null = null;

export interface AddEntryInput {
  /** quantidade de uma porção, na unidade da meta (6 g, 500 ml); para limites, 1 */
  amount: number;
  /** nome do botão ("Ovo") ou "Outro" */
  item?: string;
  quickAddId?: string;
  /** porções de uma vez (padrão 1) */
  count?: number;
}

/** Soma no contador (ou usa um do limite). Toques seguidos no mesmo botão juntam numa entrada. */
export async function addEntry(
  habitId: string,
  input: AddEntryInput,
  day: DayKey = today(),
  opts: { merge?: boolean } = {},
): Promise<Undo> {
  const count = Math.max(1, input.count ?? 1);
  const key = `${day}|${input.quickAddId ?? input.item ?? ''}|${input.amount}`;
  const t = now();
  const entries = useDataStore.getState().entries;
  if (
    opts.merge !== false &&
    lastEntry &&
    lastEntry.habitId === habitId &&
    lastEntry.key === key &&
    t - lastEntry.at <= MERGE_WINDOW_MS
  ) {
    const prev = entries[lastEntry.id];
    if (prev) {
      const merged: Entry = {
        ...prev,
        count: prev.count + count,
        amount: prev.amount + input.amount * count,
        at: prev.at,
      };
      lastEntry = { ...lastEntry, at: t };
      return withId(await commit([setOp('entries', merged.id, merged)]), merged.id);
    }
  }
  const entry: Entry = {
    id: newId(),
    habitId,
    day,
    at: day === today() ? t : instantAt(day, '12:00', snapshot().clock),
    amount: input.amount * count,
    count,
    ...(input.item ? { item: input.item } : {}),
    ...(input.quickAddId ? { quickAddId: input.quickAddId } : {}),
  };
  lastEntry = { id: entry.id, habitId, key, at: t };
  return withId(await commit([setOp('entries', entry.id, entry)]), entry.id);
}

/** Tira porções de uma entrada (o − da linha); sem porções sobrando, apaga a entrada. */
export async function removeEntry(entryId: string, opts: { portions?: number } = {}): Promise<Undo> {
  const e = useDataStore.getState().entries[entryId];
  if (!e) return noUndo();
  const portions = opts.portions ?? e.count;
  if (lastEntry?.id === entryId) lastEntry = null;
  if (e.count > portions) {
    const per = e.amount / e.count;
    const next: Entry = { ...e, count: e.count - portions, amount: Math.round(per * (e.count - portions) * 100) / 100 };
    return commit([setOp('entries', e.id, next)]);
  }
  return commit([deleteOp('entries', e.id)]);
}

/** Apaga várias entradas de uma vez (deslizar a linha "Ovo × 4"). */
export async function removeEntries(entryIds: string[]): Promise<Undo> {
  const entries = useDataStore.getState().entries;
  return commit(entryIds.filter((id) => entries[id]).map((id) => deleteOp('entries', id)));
}

/** Usa um do limite da semana (tranqueira, refeição livre). Também exportado como `useBudget`. */
export async function spendBudget(habitId: string, day: DayKey = today()): Promise<Undo> {
  return addEntry(habitId, { amount: 1 }, day, { merge: false });
}

/** Nome do documento de interação. Prefira `spendBudget` no código de tela (o "use" confunde o lint de hooks). */
export const useBudget = spendBudget;

// ---------- dias sem ----------

/** Registra um deslize: a contagem atual vai a 0, o recorde fica, o dia sai do total. */
export async function logSlip(habitId: string, opts: { day?: DayKey; at?: number; note?: string } = {}): Promise<Undo> {
  const t = opts.at ?? now();
  const day = opts.day ?? logicalDay(t, snapshot().clock);
  const slip: Slip = { id: newId(), habitId, day, at: t, ...(opts.note ? { note: opts.note } : {}) };
  return withId(await commit([setOp('slips', slip.id, slip)]), slip.id);
}

export async function editSlip(slipId: string, patch: { day?: DayKey; note?: string }): Promise<Undo> {
  const s = useDataStore.getState().slips[slipId];
  if (!s) return noUndo();
  return commit([setOp('slips', slipId, { ...s, ...patch })]);
}

export async function deleteSlip(slipId: string): Promise<Undo> {
  if (!useDataStore.getState().slips[slipId]) return noUndo();
  return commit([deleteOp('slips', slipId)]);
}

// ---------- check-in e medidas ----------

export interface CheckinInput {
  mood: number;
  energy: number;
  good?: string[];
  screenMinutes?: number | null;
  youtubeMinutes?: number | null;
}

/** Salva o check-in do dia (humor, energia, 3 coisas boas, minutos de tela e de YouTube). */
export async function saveCheckin(day: DayKey, input: CheckinInput): Promise<Undo> {
  const prev = useDataStore.getState().checkins[day];
  const t = now();
  const c: Checkin = {
    id: day,
    day,
    mood: input.mood,
    energy: input.energy,
    good: (input.good ?? []).map((g) => g.trim()).filter(Boolean),
    screenMinutes: input.screenMinutes ?? null,
    youtubeMinutes: input.youtubeMinutes ?? null,
    at: prev?.at ?? t,
    updatedAt: t,
  };
  const undo = await commit([setOp('checkins', day, c)]);
  void shareMoodIfLinked(day, c.mood);
  return undo;
}

/** Peso ou cintura do dia. Uma segunda medida no mesmo dia substitui a primeira. */
export async function logMeasurement(kind: MeasurementKind, day: DayKey, value: number): Promise<Undo> {
  const id = measurementId(day, kind);
  const m = { id, kind, day, value: Math.round(value * 10) / 10, unit: kind === 'weight' ? 'kg' : 'cm', at: now() };
  return commit([setOp('measurements', id, m)]);
}

export async function deleteMeasurement(kind: MeasurementKind, day: DayKey): Promise<Undo> {
  const id = measurementId(day, kind);
  if (!useDataStore.getState().measurements[id]) return noUndo();
  return commit([deleteOp('measurements', id)]);
}

// ---------- "hoje não se aplica" ----------

/** Tira o hábito só deste dia (a linha fica, com "não conta hoje"). O registro anterior fica guardado. */
export async function skipToday(habitId: string, day: DayKey = today()): Promise<Undo> {
  const prev = existingMark(day, habitId);
  const t = now();
  const mark: Mark = prev
    ? { ...prev, skipped: true, updatedAt: t }
    : { id: markId(day, habitId), day, habitId, status: 'logged', skipped: true, at: t, updatedAt: t };
  return commit([setOp('marks', mark.id, mark)]);
}

/** Volta a contar hoje (o inverso de skipToday). */
export async function unskipToday(habitId: string, day: DayKey = today()): Promise<Undo> {
  const prev = existingMark(day, habitId);
  if (!prev?.skipped) return noUndo();
  const empty =
    prev.status === 'logged' &&
    prev.time === undefined &&
    prev.value === undefined &&
    !prev.rating &&
    !prev.items?.length;
  if (empty) return commit([deleteOp('marks', prev.id)]);
  return commit([mergeOp('marks', prev.id, { skipped: false, updatedAt: now() })]);
}

// ---------- arquivar ----------

export async function archiveHabit(habitId: string): Promise<Undo> {
  habitOrThrow(habitId);
  const t = now();
  return commit([mergeOp('habits', habitId, { archived: true, archivedAt: t, archivedDay: today(), updatedAt: t })]);
}

/** Desarquiva. Os dias em que ficou arquivado entram como pausa do hábito (fora das contas). */
export async function restoreHabit(habitId: string): Promise<Undo> {
  const habit = habitOrThrow(habitId);
  const t = now();
  const d = today();
  const ops = [
    mergeOp('habits', habitId, {
      archived: false,
      archivedAt: null,
      archivedDay: null,
      archivedWith: null,
      updatedAt: t,
    }),
  ];
  const from = habit.archivedDay ?? (habit.archivedAt ? logicalDay(habit.archivedAt, snapshot().clock) : null);
  if (habit.startDay && from && from < d) {
    const id = newId();
    ops.push(
      setOp('pauses', id, {
        id,
        start: from > habit.startDay ? from : habit.startDay,
        end: addDays(d, -1),
        reason: null,
        habitIds: [habitId],
        createdAt: t,
        updatedAt: t,
      }),
    );
  }
  return commit(ops);
}

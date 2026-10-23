// Os dados da pessoa organizados para as contas do domínio (índices por dia e por hábito).
// Monte uma vez por mudança (buildDomainData) e passe para as funções puras.
import type {
  Checkin,
  DayKey,
  Entry,
  Habit,
  Mark,
  Measurement,
  MeasurementKind,
  Pause,
  Phase,
  Pillar,
  Profile,
  Review,
  Run,
  Slip,
  WeekKey,
} from '@/types';
import { clockOf, type Clock } from './day';
import { normalizeHabit } from './normalize';
import { newProfile } from './planTemplate';

export interface RawData {
  profile: Profile | null;
  pillars: Record<string, Pillar> | Pillar[];
  habits: Record<string, Habit> | Habit[];
  marks: Record<string, Mark> | Mark[];
  entries: Record<string, Entry> | Entry[];
  slips: Record<string, Slip> | Slip[];
  checkins: Record<string, Checkin> | Checkin[];
  measurements: Record<string, Measurement> | Measurement[];
  pauses: Record<string, Pause> | Pause[];
  phases: Record<string, Phase> | Phase[];
  reviews: Record<string, Review> | Review[];
  runs: Record<string, Run> | Run[];
}

export interface DomainData {
  profile: Profile;
  /** a conta ainda não tem perfil (primeiro acesso) */
  hasProfile: boolean;
  clock: Clock;
  pillars: Pillar[];
  pillarById: Map<string, Pillar>;
  habits: Habit[];
  habitById: Map<string, Habit>;
  /** por id `${day}_${habitId}` */
  marks: Map<string, Mark>;
  marksByHabit: Map<string, Mark[]>;
  marksByDay: Map<DayKey, Mark[]>;
  /** por `${day}_${habitId}`, mais recentes primeiro */
  entriesByKey: Map<string, Entry[]>;
  entriesByHabit: Map<string, Entry[]>;
  /** deslizes por hábito, em ordem de dia */
  slipsByHabit: Map<string, Slip[]>;
  checkins: Map<DayKey, Checkin>;
  measurementsByKind: Record<MeasurementKind, Measurement[]>;
  measurementById: Map<string, Measurement>;
  pauses: Pause[];
  phases: Phase[];
  reviews: Map<WeekKey, Review>;
  runs: Run[];
}

function list<T>(v: Record<string, T> | T[]): T[] {
  return Array.isArray(v) ? v : Object.values(v);
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
}

export function markId(day: DayKey, habitId: string): string {
  return `${day}_${habitId}`;
}

export function measurementId(day: DayKey, kind: MeasurementKind): string {
  return `${day}_${kind}`;
}

export function buildDomainData(raw: RawData): DomainData {
  const clock = clockOf(raw.profile);
  const profile = raw.profile ?? newProfile('', 0, clock);
  const pillars = list(raw.pillars).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  // documentos antigos chegam no formato de hoje (a corrida de antes vira Treino guiado)
  const habits = list(raw.habits)
    .map(normalizeHabit)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const marks = new Map<string, Mark>();
  const marksByHabit = new Map<string, Mark[]>();
  const marksByDay = new Map<DayKey, Mark[]>();
  for (const m of list(raw.marks)) {
    marks.set(m.id ?? markId(m.day, m.habitId), m);
    push(marksByHabit, m.habitId, m);
    push(marksByDay, m.day, m);
  }
  const entriesByKey = new Map<string, Entry[]>();
  const entriesByHabit = new Map<string, Entry[]>();
  for (const e of list(raw.entries).sort((a, b) => b.at - a.at)) {
    push(entriesByKey, markId(e.day, e.habitId), e);
    push(entriesByHabit, e.habitId, e);
  }
  const slipsByHabit = new Map<string, Slip[]>();
  for (const s of list(raw.slips).sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.at - b.at))) {
    push(slipsByHabit, s.habitId, s);
  }
  const checkins = new Map<DayKey, Checkin>();
  for (const c of list(raw.checkins)) checkins.set(c.day ?? c.id, c);
  const measurementsByKind: Record<MeasurementKind, Measurement[]> = { weight: [], waist: [] };
  const measurementById = new Map<string, Measurement>();
  for (const m of list(raw.measurements).sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.at - b.at))) {
    (measurementsByKind[m.kind] ??= []).push(m);
    measurementById.set(m.id, m);
  }
  const reviews = new Map<WeekKey, Review>();
  for (const r of list(raw.reviews)) reviews.set(r.week ?? r.id, r);
  return {
    profile,
    hasProfile: !!raw.profile,
    clock,
    pillars,
    pillarById: new Map(pillars.map((p) => [p.id, p])),
    habits,
    habitById: new Map(habits.map((h) => [h.id, h])),
    marks,
    marksByHabit,
    marksByDay,
    entriesByKey,
    entriesByHabit,
    slipsByHabit,
    checkins,
    measurementsByKind,
    measurementById,
    pauses: list(raw.pauses).sort((a, b) => (a.start < b.start ? -1 : 1)),
    phases: list(raw.phases).sort((a, b) => a.number - b.number),
    reviews,
    runs: list(raw.runs).sort((a, b) => a.startedAt - b.startedAt),
  };
}

export function emptyRawData(): RawData {
  return {
    profile: null,
    pillars: [],
    habits: [],
    marks: [],
    entries: [],
    slips: [],
    checkins: [],
    measurements: [],
    pauses: [],
    phases: [],
    reviews: [],
    runs: [],
  };
}

// Dados mínimos para os testes do domínio.
import type { Checkin, Entry, Habit, Mark, Pause, Phase, Pillar, Profile, Slip } from '@/types';
import { buildDomainData, emptyRawData, markId, type DomainData, type RawData } from '@/domain/context';
import { DEFAULT_CLOCK } from '@/domain/day';
import { newProfile } from '@/domain/planTemplate';

export function profile(patch: Partial<Profile> = {}): Profile {
  return { ...newProfile('Teste', 0, DEFAULT_CLOCK), scheduleLog: [], ...patch };
}

export function pillar(id: string, patch: Partial<Pillar> = {}): Pillar {
  return {
    id,
    name: id,
    color: 'mel',
    icon: 'circle',
    order: 0,
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  };
}

let n = 0;
export function habit(patch: Partial<Habit> & Pick<Habit, 'type'>): Habit {
  n++;
  return {
    id: patch.id ?? `h${n}`,
    name: patch.name ?? `Hábito ${n}`,
    icon: 'circle',
    pillarId: 'p1',
    alsoIn: [],
    phase: null,
    startDay: '2026-10-01',
    goal: {},
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], moment: 'day' },
    quickAdds: [],
    checklist: [],
    order: 0,
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  };
}

export function mark(habitId: string, day: string, patch: Partial<Mark> = {}): Mark {
  return { id: markId(day, habitId), day, habitId, status: 'done', at: 0, updatedAt: 0, ...patch };
}

export function entry(habitId: string, day: string, amount: number, patch: Partial<Entry> = {}): Entry {
  n++;
  return { id: `e${n}`, habitId, day, at: 0, amount, count: 1, ...patch };
}

export function slip(habitId: string, day: string): Slip {
  n++;
  return { id: `s${n}`, habitId, day, at: 0 };
}

export function pause(start: string, end: string, habitIds: string[] | null = null): Pause {
  n++;
  return { id: `pa${n}`, start, end, reason: 'vacation', habitIds, createdAt: 0, updatedAt: 0 };
}

export function checkin(day: string, mood: number, energy = 3): Checkin {
  return { id: day, day, mood, energy, good: [], at: 0, updatedAt: 0 };
}

export function phase(number: number, patch: Partial<Phase> = {}): Phase {
  return { id: String(number), number, name: `Fase ${number}`, weeks: 3, start: null, end: null, ...patch };
}

export function data(parts: Partial<RawData> & { profile?: Profile | null } = {}): DomainData {
  return buildDomainData({ ...emptyRawData(), profile: profile(), pillars: [pillar('p1')], ...parts });
}

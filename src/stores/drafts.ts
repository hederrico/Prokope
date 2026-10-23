// Rascunhos que sobrevivem a fechar sem querer (localStorage): check-in, revisão, primeiro acesso e o
// formulário de hábito. E o que é só da interface: o brilho do dia fechado, uma vez por dia.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DayKey, Habit, WeekKey } from '@/types';
import type { PlanDraft } from '@/domain/planTemplate';
import type { CheckinInput } from '@/actions/records';

export interface CheckinDraft extends Partial<CheckinInput> {
  day: DayKey;
  updatedAt: number;
}

export interface ReviewDraft {
  week: WeekKey;
  step: number;
  tweakWorked?: 'yes' | 'partly' | 'no' | null;
  tweak?: string;
  waist?: string;
  together?: { habitId: string; day: DayKey; note?: string } | null;
  updatedAt: number;
}

/** Rascunho do formulário de hábito (Novo hábito · tipo e detalhes). */
export type HabitFormDraft = Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>> & {
  start?: 'now' | number | DayKey;
  /** id do hábito sendo editado */
  editingId?: string;
};

export interface DraftsState {
  checkins: Record<DayKey, CheckinDraft>;
  reviews: Record<WeekKey, ReviewDraft>;
  /** primeiro acesso, por conta */
  onboarding: Record<string, { step: number; draft: PlanDraft }>;
  habitForm: HabitFormDraft | null;
  setCheckinDraft(day: DayKey, patch: Partial<CheckinInput>): void;
  clearCheckinDraft(day: DayKey): void;
  setReviewDraft(week: WeekKey, patch: Partial<Omit<ReviewDraft, 'week' | 'updatedAt'>>): void;
  clearReviewDraft(week: WeekKey): void;
  setOnboarding(account: string, step: number, draft: PlanDraft): void;
  clearOnboarding(account: string): void;
  setHabitForm(draft: HabitFormDraft | null): void;
}

const memoryStorage = (() => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
})();

// Modo exemplo: os rascunhos da pessoa ficam guardados à parte, e os do exemplo só na memória (nunca no localStorage).
// Assim o check-in ou a revisão começados no exemplo não aparecem nos dados da pessoa, e recarregar no meio do exemplo
// encontra os rascunhos dela como estavam.
type Kept = Pick<DraftsState, 'checkins' | 'reviews' | 'habitForm'>;
let isolated: { kept: Kept; closed: Set<DayKey> } | null = null;

const draftStorage = {
  getItem: (k: string) => (typeof localStorage !== 'undefined' ? localStorage : memoryStorage).getItem(k),
  setItem: (k: string, v: string) => {
    if (!isolated) (typeof localStorage !== 'undefined' ? localStorage : memoryStorage).setItem(k, v);
  },
  removeItem: (k: string) => {
    if (!isolated) (typeof localStorage !== 'undefined' ? localStorage : memoryStorage).removeItem(k);
  },
};

export const useDrafts = create<DraftsState>()(
  persist(
    (set) => ({
      checkins: {},
      reviews: {},
      onboarding: {},
      habitForm: null,
      setCheckinDraft: (day, patch) =>
        set((s) => ({
          checkins: { ...s.checkins, [day]: { ...s.checkins[day], ...patch, day, updatedAt: Date.now() } },
        })),
      clearCheckinDraft: (day) =>
        set((s) => {
          const next = { ...s.checkins };
          delete next[day];
          return { checkins: next };
        }),
      setReviewDraft: (week, patch) =>
        set((s) => ({
          reviews: {
            ...s.reviews,
            [week]: {
              ...s.reviews[week],
              ...patch,
              step: patch.step ?? s.reviews[week]?.step ?? 1,
              week,
              updatedAt: Date.now(),
            },
          },
        })),
      clearReviewDraft: (week) =>
        set((s) => {
          const next = { ...s.reviews };
          delete next[week];
          return { reviews: next };
        }),
      setOnboarding: (account, step, draft) =>
        set((s) => ({ onboarding: { ...s.onboarding, [account]: { step, draft } } })),
      clearOnboarding: (account) =>
        set((s) => {
          const next = { ...s.onboarding };
          delete next[account];
          return { onboarding: next };
        }),
      setHabitForm: (draft) => set({ habitForm: draft }),
    }),
    {
      name: 'pk-drafts',
      storage: createJSONStorage(() => draftStorage),
      partialize: (s) => ({
        checkins: s.checkins,
        reviews: s.reviews,
        onboarding: s.onboarding,
        habitForm: s.habitForm,
      }),
    },
  ),
);

// ---------- o brilho do dia fechado, uma vez por dia ----------

const closedKey = (day: DayKey) => `pk-dia-fechado-${day}`;

/** O dia fechado já celebrou (o brilho acontece uma vez por dia). No modo exemplo, conta só o do exemplo. */
export function wasDayCelebrated(day: DayKey): boolean {
  if (isolated) return isolated.closed.has(day);
  try {
    return localStorage.getItem(closedKey(day)) === '1';
  } catch {
    return false;
  }
}

export function markDayCelebrated(day: DayKey) {
  if (isolated) {
    isolated.closed.add(day);
    return;
  }
  try {
    localStorage.setItem(closedKey(day), '1');
  } catch {
    /* sem armazenamento */
  }
}

// ---------- modo exemplo ----------

/**
 * Liga (true) ou desliga (false) os rascunhos do modo exemplo. Ao ligar, os da pessoa (check-in, revisão e o
 * formulário de hábito) saem da tela e ficam guardados; nada vai para o localStorage até desligar. Ao desligar, os
 * do exemplo somem e os da pessoa voltam como estavam. O primeiro acesso (por conta) não muda.
 */
export function isolateDrafts(on: boolean): void {
  if (on === !!isolated) return;
  if (on) {
    const { checkins, reviews, habitForm } = useDrafts.getState();
    isolated = { kept: { checkins, reviews, habitForm }, closed: new Set() };
    useDrafts.setState({ checkins: {}, reviews: {}, habitForm: null });
    return;
  }
  const { kept } = isolated!;
  isolated = null;
  useDrafts.setState(kept);
}

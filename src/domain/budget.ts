// Limites da semana (tranqueiras, refeições livres): quanto já foi usado de segunda a domingo.
// Cheio fica neutro ("2 de 2 · a semana recomeça amanhã"); passar mostra "3 de 2", sem cor nova.
import type { DayKey, Entry, Habit } from '@/types';
import type { DomainData } from './context';
import { addDays, weekDays, weekStart } from './day';

export interface BudgetWeek {
  week: DayKey;
  used: number;
  limit: number;
  /** usou tudo */
  full: boolean;
  /** passou do limite */
  over: boolean;
  /** quanto ainda dá */
  left: number;
  /** dias em que usou */
  days: DayKey[];
  entries: Entry[];
  /** a semana recomeça amanhã (hoje é domingo) */
  resetsTomorrow: boolean;
}

/** Conta por dias quando a unidade é 'dias' (tranqueiras: até 2 dias); senão, cada uso conta. */
export function budgetWeek(habit: Habit, day: DayKey, data: DomainData, today: DayKey): BudgetWeek {
  const days = weekDays(day);
  const entries: Entry[] = [];
  for (const d of days) entries.push(...(data.entriesByKey.get(`${d}_${habit.id}`) ?? []));
  const usedDays = [...new Set(entries.map((e) => e.day))].sort();
  const byDays = habit.goal.unit === 'dias';
  const used = byDays ? usedDays.length : entries.reduce((n, e) => n + (e.count || 1), 0);
  const limit = habit.goal.perWeek ?? habit.goal.value ?? 0;
  return {
    week: weekStart(day),
    used,
    limit,
    full: used >= limit,
    over: used > limit,
    left: Math.max(0, limit - used),
    days: usedDays,
    entries,
    resetsTomorrow: addDays(today, 1) === addDays(weekStart(today), 7),
  };
}

/**
 * A ordem dos limites da semana (Hoje e Progresso): o que ainda tem mais folga primeiro, como no quadro
 * ("Refeições livres 0 de 2" antes de "Tranqueiras 1 de 2"); no empate, a ordem da pessoa.
 */
export function compareBudgets(a: BudgetWeek | null | undefined, b: BudgetWeek | null | undefined): number {
  return (b?.left ?? 0) - (a?.left ?? 0);
}

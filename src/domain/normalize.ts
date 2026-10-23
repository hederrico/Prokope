// Migração na leitura: documentos antigos do Firestore viram o formato de hoje quando chegam (o store e o domínio
// chamam normalizeHabit), sem script. A próxima gravação do hábito já sai no formato novo: as ações gravam o
// documento normalizado (set) ou juntam os campos da migração num merge (migrationPatch, em actions/core.ts).
import type { Habit } from '@/types';
import { RUN_TEMPLATE, runTemplatePlan } from './runPlan';

/** Os campos que a migração acrescentou a cada documento normalizado (para o próximo merge gravar junto). */
const patches = new WeakMap<Habit, Partial<Habit>>();

/**
 * O hábito no formato de hoje:
 * - a corrida de antes (type 'weekly', role 'run', sem plano) vira Treino guiado com o plano de 13 semanas,
 *   esforço "Correr" e descanso "Caminhar". Os treinos feitos (runs) continuam ligados pelo id, e o progresso
 *   (semana e treino atuais) sai da contagem deles, então nada se perde;
 * - um Treino guiado sem plano ganha o modelo da corrida.
 * Um documento que já está no formato de hoje volta igual (o mesmo objeto).
 */
export function normalizeHabit(h: Habit): Habit {
  let patch: Partial<Habit> | null = null;
  if (h.type === 'weekly' && h.role === 'run' && !h.training) {
    patch = {
      type: 'guided',
      training: runTemplatePlan(),
      goal: { ...h.goal, perWeek: h.goal?.perWeek ?? RUN_TEMPLATE.perWeek },
    };
  } else if (h.type === 'guided' && (!h.training || typeof h.training !== 'object')) {
    patch = { training: runTemplatePlan() };
  }
  if (!patch) return h;
  const next = { ...h, ...patch } as Habit;
  patches.set(next, patch);
  return next;
}

/** Os campos da migração de um documento normalizado (null quando ele já veio no formato de hoje). */
export function migrationPatch(h: Habit | undefined | null): Partial<Habit> | null {
  return h ? (patches.get(h) ?? null) : null;
}

/** Normaliza uma lista ou um mapa de hábitos (os que já estão no formato de hoje não mudam). */
export function normalizeHabits<T extends Habit[] | Record<string, Habit>>(habits: T): T {
  if (Array.isArray(habits)) return habits.map(normalizeHabit) as T;
  let changed = false;
  const out: Record<string, Habit> = {};
  for (const [id, h] of Object.entries(habits)) {
    const n = normalizeHabit(h);
    if (n !== h) changed = true;
    out[id] = n;
  }
  return (changed ? out : habits) as T;
}

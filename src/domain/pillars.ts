// Regras dos pilares: ao arquivar ou apagar um pilar, o que acontece com cada hábito.
// Hábito só daquele pilar sai junto; hábito com pilar extra ativo continua, e o extra vira o principal.
import type { Habit, Pillar } from '@/types';

export type PillarHabitFate =
  /** sai junto com o pilar (arquivado ou apagado) */
  | { kind: 'goes'; habit: Habit }
  /** o pilar era o principal: o hábito passa para o pilar extra */
  | { kind: 'moves'; habit: Habit; to: string }
  /** o pilar era só um extra: o hábito continua no principal */
  | { kind: 'stays'; habit: Habit };

/** O destino de cada hábito do pilar quando ele sai (arquivar ou apagar). */
export function pillarExitPlan(pillarId: string, habits: Habit[], pillars: Pillar[]): PillarHabitFate[] {
  const active = new Set(pillars.filter((p) => !p.archived && p.id !== pillarId).map((p) => p.id));
  const out: PillarHabitFate[] = [];
  for (const h of habits) {
    if (h.archived && h.archivedWith !== pillarId) continue;
    if (h.pillarId === pillarId) {
      const to = h.alsoIn.find((id) => active.has(id));
      out.push(to ? { kind: 'moves', habit: h, to } : { kind: 'goes', habit: h });
    } else if (h.alsoIn.includes(pillarId)) {
      out.push({ kind: 'stays', habit: h });
    }
  }
  return out;
}

/** Hábitos ativos que aparecem no pilar (principal ou extra), na ordem dos hábitos. */
export function habitsOfPillar(pillarId: string, habits: Habit[], includeArchived = false): Habit[] {
  return habits.filter(
    (h) => (includeArchived || !h.archived) && (h.pillarId === pillarId || h.alsoIn.includes(pillarId)),
  );
}

/** A próxima cor livre da paleta (Novo pilar começa nela). */
export function firstFreeColor<T extends string>(palette: readonly T[], pillars: Pillar[]): T {
  const used = new Set(pillars.filter((p) => !p.archived).map((p) => p.color as string));
  return palette.find((c) => !used.has(c)) ?? palette[0];
}

/** O pilar que já usa a cor ("Damasco · também em Corpo"). */
export function pillarUsingColor(color: string, pillars: Pillar[], exceptId?: string): Pillar | null {
  return pillars.find((p) => !p.archived && p.color === color && p.id !== exceptId) ?? null;
}

/** Nome repetido ("Já existe um pilar Corpo."), sem acento e sem caixa. */
export function duplicatePillarName(name: string, pillars: Pillar[], exceptId?: string): Pillar | null {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const n = norm(name);
  if (!n) return null;
  return pillars.find((p) => !p.archived && p.id !== exceptId && norm(p.name) === n) ?? null;
}

// Ganchos das folhas de registro.
import type { PillarColor } from '@/components/ui';
import { formatDayHeader, useHabit, useNow } from '@/data';
import type { DayKey } from '@/types';

/** O pilar (cor) de um hábito, para pintar a folha. */
export function useHabitPillar(habitId: string | undefined): PillarColor | undefined {
  return (useHabit(habitId)?.pillar?.color ?? undefined) as PillarColor | undefined;
}

export interface SheetDay {
  /** o dia do registro: &dia=AAAA-MM-DD (corrigir um dia, Hoje · outro dia) ou hoje */
  day: DayKey;
  today: DayKey;
  /** dia que passou: grava sem celebrar */
  isPast: boolean;
  /** "Quarta, 21 de outubro" num dia que passou; null hoje */
  label: string | null;
}

/** O dia da folha: &dia= na URL quando é um dia que passou; hoje, quando falta, é inválido ou é no futuro. */
export function useSheetDay(params: URLSearchParams): SheetDay {
  const { today } = useNow();
  const raw = params.get('dia');
  const valid = !!raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today;
  const day = (valid ? raw : today) as DayKey;
  const isPast = day < today;
  return { day, today, isPast, label: isPast ? formatDayHeader(day) : null };
}

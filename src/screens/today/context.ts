// O que as peças do Hoje dividem: o dia mostrado, a hora, o modo e as ações dos controles.
import { createContext, useContext } from 'react';
import type { DayKey, QuickAdd } from '@/types';
import type { TodayItem } from '@/data';

export interface TodayCtx {
  day: DayKey;
  today: DayKey;
  isPast: boolean;
  /** minutos do dia lógico agora (7h42 = 462) */
  minutes: number;
  /** modo noite (Ainda hoje e Feitos hoje): a água fica sem botões */
  night: boolean;
  /** dia pausado do app: registrar não celebra e não conta */
  paused: boolean;
  /** a última mudança veio de outro aparelho: troca em micro, sem mola e sem celebração */
  remote: boolean;
  /** primeiro dia do plano: nada de gráfico vazio (a semana do hábito vira a meta escrita) */
  firstDay: boolean;
  /** hábito em destaque (vindo do "Marcar ontem") */
  highlight: string | null;
  check: (item: TodayItem, on: boolean) => void;
  add: (item: TodayItem, q: Pick<QuickAdd, 'name' | 'amount'> & { id?: string }) => void;
  spend: (item: TodayItem) => void;
  openSheet: (name: string, args?: Record<string, string | number | undefined>) => void;
  openHabit: (habitId: string) => void;
  openMenu: (habitId: string) => void;
  /** o registro do hábito na folha certa (horário, nota, peso, check-in), ou null quando não há folha */
  sheetFor: (item: TodayItem) => [string, Record<string, string>?] | null;
}

export const TodayContext = createContext<TodayCtx | null>(null);

export function useTodayCtx(): TodayCtx {
  const ctx = useContext(TodayContext);
  if (!ctx) throw new Error('useTodayCtx fora do Hoje');
  return ctx;
}

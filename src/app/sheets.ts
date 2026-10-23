// Registro das folhas abertas por ?folha=... sobre qualquer tela (navegacao.md › Rotas e o mapa do app).
// `args` são os parâmetros que pertencem à folha: saem da URL quando ela fecha.
import type { ComponentType } from 'react';
import type { SheetScreenProps } from '@/components/shell/types';

export interface SheetDef {
  args: readonly string[];
  load: () => Promise<{ default: ComponentType<SheetScreenProps> }>;
}

export const SHEETS: Record<string, SheetDef> = {
  proteina: { args: [], load: () => import('@/screens/sheets/ProteinSheet') },
  agua: { args: [], load: () => import('@/screens/sheets/WaterSheet') },
  acordar: { args: [], load: () => import('@/screens/sheets/WakeSheet') },
  nota: { args: ['refeicao'], load: () => import('@/screens/sheets/MealRatingSheet') },
  checkin: { args: ['humor'], load: () => import('@/screens/sheets/CheckinSheet') },
  deslize: { args: ['habito'], load: () => import('@/screens/sheets/SlipSheet') },
  peso: { args: [], load: () => import('@/screens/sheets/WeightSheet') },
  menu: { args: ['habito'], load: () => import('@/screens/today/HabitMenuSheet') },
  corrigir: { args: ['habito', 'dia'], load: () => import('@/screens/habit/FixDaySheet') },
  dia: { args: ['dia'], load: () => import('@/screens/progress/DaySheet') },
  apagar: { args: ['pilar'], load: () => import('@/screens/settings/DeletePillarSheet') },
  convite: { args: ['id'], load: () => import('@/screens/settings/InviteSheet') },
};

export const SHEET_PARAM = 'folha';

/** A busca sem a folha e os parâmetros dela. */
export function withoutSheet(search: string): string {
  const params = new URLSearchParams(search);
  const name = params.get(SHEET_PARAM);
  if (!name) return search;
  params.delete(SHEET_PARAM);
  for (const a of SHEETS[name]?.args ?? []) params.delete(a);
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** A busca com uma folha aberta (troca uma folha que já estava aberta). */
export function withSheet(
  search: string,
  name: string,
  args: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams(withoutSheet(search));
  params.set(SHEET_PARAM, name);
  for (const [k, v] of Object.entries(args)) if (v !== undefined) params.set(k, String(v));
  return `?${params.toString()}`;
}

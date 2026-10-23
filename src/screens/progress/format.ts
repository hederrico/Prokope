// Ajudantes de texto e cor do Progresso (fora dos componentes, para o recarregamento rápido do Vite).
import type { PillarColor } from '@/components/ui';
import type { Pillar } from '@/types';

/** "83,7" (sempre uma casa). */
export function fmt1(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** "2h05", "45 min". */
export function shortMinutes(v: number): string {
  const t = Math.round(v);
  if (t < 60) return `${t} min`;
  const h = Math.floor(t / 60);
  const mm = t % 60;
  return `${h}h${mm < 10 ? `0${mm}` : mm}`;
}

/** A cor de um pilar para os componentes (a chave da paleta que o pilar guarda). */
export function pillarColor(p: Pillar | null | undefined): PillarColor | undefined {
  return (p?.color as PillarColor | undefined) ?? undefined;
}

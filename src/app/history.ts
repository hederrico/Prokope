// Registro do histórico do navegador, para a casca saber de onde veio cada navegação e se "Voltar" pode usar o
// voltar do navegador (history.back) ou precisa trocar a entrada (um link direto não tem uma tela anterior no app).
// O React Router guarda a posição de cada entrada em history.state.idx.
import type { Location } from 'react-router';

/** O tipo da navegação, como texto (o enum do React Router vira estes valores). */
export type HistoryAction = 'POP' | 'PUSH' | 'REPLACE' | 'INIT';

export interface NavigationRecord {
  from: string | null;
  to: string;
  action: HistoryAction;
  /** posição nova menos a anterior: negativo é voltar */
  delta: number;
  /** contador de navegações (muda a cada uma) */
  seq: number;
  state: unknown;
}

const entries: string[] = [];
let index = 0;
let lastKey: string | null = null;
let last: NavigationRecord = { from: null, to: '', action: 'INIT', delta: 0, seq: 0, state: null };

export function pathOf(location: Pick<Location, 'pathname' | 'search'>): string {
  return location.pathname + location.search;
}

function readIdx(): number {
  if (typeof window === 'undefined') return 0;
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === 'number' ? idx : 0;
}

/** Chamado pelo roteador a cada mudança de lugar (router.subscribe), antes de as telas renderizarem. */
export function recordNavigation(location: Location, historyAction: string): void {
  const action = historyAction as HistoryAction;
  if (location.key === lastKey && action !== 'INIT') return;
  lastKey = location.key;
  const to = pathOf(location);
  const idx = readIdx();
  const from = action === 'INIT' ? null : (entries[index] ?? null);
  const delta = action === 'INIT' ? 0 : idx - index;
  if (action === 'PUSH') entries.length = idx;
  entries[idx] = to;
  index = idx;
  last = { from, to, action, delta, seq: last.seq + 1, state: location.state };
}

/** A última navegação registrada. */
export function lastNavigation(): NavigationRecord {
  return last;
}

/** O caminho da entrada anterior do histórico, se for do app nesta sessão. */
export function previousEntry(): string | undefined {
  return index > 0 ? entries[index - 1] : undefined;
}

export function currentEntry(): string | undefined {
  return entries[index];
}

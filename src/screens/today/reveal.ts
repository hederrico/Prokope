// Abrir e recolher dos momentos do Hoje (por dia, só nesta sessão) e o "levar até a linha" da faixa do dia:
// a faixa abre o momento recolhido onde o hábito está (se preciso), rola até a linha e a destaca de leve, sem
// mudar nada de lugar. O destaque é só cor (o fundo do pilar entra em base e sai em fill), então vale também
// com o movimento reduzido; a rolagem vira um salto.
import { useCallback, useSyncExternalStore } from 'react';
import { prefersReducedMotion } from '@/motion/reducedMotion';

const folds = new Map<string, boolean>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function emit() {
  listeners.forEach((l) => l());
}

/** As chaves dos recolhidos: um momento do dia (distante ou completo), os Feitos hoje da noite e a pausa. */
export const foldKey = {
  group: (day: string, group: string, reason: string | null) => `${day}|${group}|${reason}`,
  done: (day: string) => `${day}|done`,
  pause: (day: string) => `${day}|pause`,
};

/** Um momento recolhido aberto ou não. */
export function useFold(id: string): [boolean, () => void] {
  const open = useSyncExternalStore(
    subscribe,
    () => folds.get(id) ?? false,
    () => false,
  );
  const toggle = useCallback(() => {
    folds.set(id, !(folds.get(id) ?? false));
    emit();
  }, [id]);
  return [open, toggle];
}

/** Abre um momento recolhido; devolve true se ele estava fechado (a linha só aparece depois da mola calma). */
export function openFold(id: string): boolean {
  if (folds.get(id)) return false;
  folds.set(id, true);
  emit();
  return true;
}

/** Tempo para a linha de um momento que acabou de abrir chegar ao lugar (mola calma, 0,35 s). */
const AFTER_OPEN_MS = 380;
/** O destaque fica um pouco e sai devagar (a saída é a transição em fill do CSS). */
const HIGHLIGHT_MS = 1400;

const timers = new WeakMap<HTMLElement, number>();

/** A linha de um hábito dentro da raiz, fora do jeito que está saindo (troca de jeito em andamento). */
export function rowOf(root: ParentNode, id: string): HTMLElement | null {
  for (const el of root.querySelectorAll<HTMLElement>(`.td-fl-${CSS.escape(id)}`)) {
    if (!el.closest('[data-leaving]')) return el;
  }
  return null;
}

/** Rola até a primeira linha e destaca todas de leve. `waitOpen`: um momento acabou de abrir. */
export function revealRows(root: HTMLElement | null, ids: string[], waitOpen: boolean): void {
  if (!root || !ids.length) return;
  const go = () => {
    const rows = ids.map((id) => rowOf(root, id)).filter((el): el is HTMLElement => !!el);
    if (!rows.length) return;
    rows[0]!.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    for (const el of rows) {
      window.clearTimeout(timers.get(el));
      // tocar de novo recomeça o destaque
      el.classList.remove('td-hl');
      void el.offsetWidth;
      el.classList.add('td-hl');
      timers.set(
        el,
        window.setTimeout(() => el.classList.remove('td-hl'), HIGHLIGHT_MS),
      );
    }
  };
  if (waitOpen) window.setTimeout(go, prefersReducedMotion() ? 30 : AFTER_OPEN_MS);
  else go();
}

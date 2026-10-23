// Avisa quando o app volta para a frente (comunicacao.md › Ciclo de vida): visibilitychange para "visible"
// e a volta do cache de páginas (pageshow com persisted). O Hoje confere a virada do dia e reorganiza pelo horário.
import { useEffect, useRef } from 'react';

type Listener = () => void;
const listeners = new Set<Listener>();
let bound = false;

function emit() {
  for (const l of [...listeners]) {
    try {
      l();
    } catch (err) {
      console.error(err);
    }
  }
}

function bind() {
  if (bound || typeof document === 'undefined') return;
  bound = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') emit();
  });
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) emit();
  });
}

/** Registra uma função para quando o app volta para a frente. Devolve a função que cancela. */
export function onForeground(listener: Listener): () => void {
  bind();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Hook: chama `callback` toda vez que o app volta para a frente. */
export function useForeground(callback: () => void): void {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  });
  useEffect(() => onForeground(() => ref.current()), []);
}

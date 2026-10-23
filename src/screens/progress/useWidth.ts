// Largura de um elemento (os gráficos desenham em px na largura do cartão: 326 no iPhone de 390).
import { useCallback, useLayoutEffect, useState } from 'react';

/** Devolve um ref de callback e a largura do elemento (atualiza com o ResizeObserver). */
export function useWidth<E extends HTMLElement>(fallback = 326) {
  const [el, setEl] = useState<E | null>(null);
  const ref = useCallback((node: E | null) => setEl(node), []);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    if (!el) return;
    const read = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [ref, width] as const;
}

type CallbackRef<E> = (el: E | null) => void;

/** Junta até três refs de callback num só (estável enquanto eles forem estáveis). */
export function useMergedRef<E>(a: CallbackRef<E>, b: CallbackRef<E>, c?: CallbackRef<E>) {
  return useCallback(
    (el: E | null) => {
      a(el);
      b(el);
      c?.(el);
    },
    [a, b, c],
  );
}

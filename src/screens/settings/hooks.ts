// Hooks das telas de Ajustes: repetir ao segurar (− e +) e um estado que segue a fonte.
import { useCallback, useEffect, useRef, useState } from 'react';

/** Segurar repete o toque: o primeiro na hora, depois de 400 ms a cada 120 ms. */
export function useHoldRepeat(action: () => void, disabled?: boolean) {
  const ref = useRef(action);
  useEffect(() => {
    ref.current = action;
  });
  const timers = useRef<{ start?: ReturnType<typeof setTimeout>; every?: ReturnType<typeof setInterval> }>({});
  const fired = useRef(false);
  const stop = useCallback(() => {
    clearTimeout(timers.current.start);
    clearInterval(timers.current.every);
  }, []);
  useEffect(() => stop, [stop]);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (disabled || e.button !== 0) return;
      fired.current = true;
      ref.current();
      stop();
      timers.current.start = setTimeout(() => {
        timers.current.every = setInterval(() => ref.current(), 120);
      }, 400);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    // teclado e leitor de tela: o clique sem ponteiro
    onClick: () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      if (!disabled) ref.current();
    },
  };
}

/** Um estado que volta a seguir a fonte quando ela muda (e a pessoa ainda não mexeu). */
export function useSynced<T>(source: T): [T, (v: T) => void] {
  const [state, setState] = useState({ source, value: source });
  if (state.source !== source) setState({ source, value: source });
  return [state.source !== source ? source : state.value, (value: T) => setState({ source, value })];
}

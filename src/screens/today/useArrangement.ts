// Arrumação adiada do Hoje (hoje.md › Coreografia de marcar): o agrupamento fica congelado e só é recalculado
// quando o Hoje aparece (uma folha fecha, o app volta para a frente, a aba ganha foco). Diferente do useFrozen
// de '@/data', este diz o motivo, porque a volta para a frente arruma sem animação e a volta da folha anima.
import { useEffect, useRef, useState } from 'react';

export type ArrangeReason = 'mount' | 'sheet' | 'foreground';

export interface Arrangement<T> {
  value: T;
  reason: ArrangeReason;
  /** muda a cada arrumação */
  version: number;
}

export function useArrangement<T>(value: T, refreshKey: string): Arrangement<T> {
  const [state, setState] = useState<Arrangement<T> & { key: string }>(() => ({
    value,
    reason: 'mount',
    version: 0,
    key: refreshKey,
  }));
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  });
  if (state.key !== refreshKey) {
    setState((s) => ({ value, reason: 'sheet', version: s.version + 1, key: refreshKey }));
  }
  useEffect(() => {
    const appear = () => {
      if (document.visibilityState !== 'visible') return;
      setState((s) =>
        s.value === latest.current ? s : { ...s, value: latest.current, reason: 'foreground', version: s.version + 1 },
      );
    };
    document.addEventListener('visibilitychange', appear);
    window.addEventListener('focus', appear);
    window.addEventListener('pageshow', appear);
    return () => {
      document.removeEventListener('visibilitychange', appear);
      window.removeEventListener('focus', appear);
      window.removeEventListener('pageshow', appear);
    };
  }, []);
  if (state.key !== refreshKey) return { value, reason: 'sheet', version: state.version + 1 };
  return state;
}

// Utilidades internas dos componentes: movimento reduzido, guarda de toque duplo, valor atrasado (coreografia),
// primeira montagem e o inverso de uma curva cúbica (para saber quando a barra encosta na linha da meta).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';

/** true quando o movimento deve ser reduzido: o iPhone pediu, ou o app pôs o MotionConfig em "always"
 *  (interruptor "Animações" desligado, data-motion="off" no html). */
export function useReduced(): boolean {
  const fromConfig = useReducedMotionConfig();
  const [off, setOff] = useState(() => readMotionOff());
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const mo = new MutationObserver(() => setOff(readMotionOff()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    return () => mo.disconnect();
  }, []);
  return !!fromConfig || off;
}

function readMotionOff(): boolean {
  return typeof document !== 'undefined' && document.documentElement.getAttribute('data-motion') === 'off';
}

/** Ignora um segundo acionamento em até `ms` (300 ms nos controles; 120 ms nos botões de somar). */
export function useTapGuard<A extends unknown[]>(fn: ((...args: A) => void) | undefined, ms = 300) {
  const last = useRef(-Infinity);
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });
  return useCallback(
    (...args: A) => {
      const now = performance.now();
      if (now - last.current < ms) return;
      last.current = now;
      fnRef.current?.(...args);
    },
    [ms],
  );
}

/** Valor que acompanha `value` com um atraso (coreografia: +60 ms local, +120 ms distante).
 *  A primeira renderização já mostra o valor, sem esperar. */
export function useDelayedValue<T>(value: T, delayMs: number): T {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (delayMs <= 0) return;
    const id = setTimeout(() => setShown(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return delayMs <= 0 ? value : shown;
}

/** Valor anterior ao atual (muda só quando o valor muda). */
export function usePrevious<T>(value: T): T | undefined {
  const [state, setState] = useState<{ value: T; prev: T | undefined }>({ value, prev: undefined });
  if (!Object.is(state.value, value)) setState({ value, prev: state.value });
  return Object.is(state.value, value) ? state.prev : state.value;
}

/** Para a curva cúbica [x1, y1, x2, y2], devolve a fração do tempo em que o progresso chega a `p` (0 a 1). */
export function bezierTimeFor(curve: readonly [number, number, number, number], p: number): number {
  const [x1, y1, x2, y2] = curve;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const bez = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (bez(y1, y2, mid) < p) lo = mid;
    else hi = mid;
  }
  return bez(x1, x2, (lo + hi) / 2);
}

/** Número em português (vírgula decimal, ponto no milhar, como o NumberFlow). */
export function fmtNumber(n: number, maxDecimals = 1): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maxDecimals }).format(n);
}

/** Texto puro de um ReactNode simples (para montar o nome acessível a partir do subtítulo). */
export function nodeText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).filter(Boolean).join(' ');
  if (typeof node === 'object' && 'props' in (node as object)) {
    const el = node as { type?: { decorative?: boolean }; props?: { children?: unknown; 'aria-hidden'?: unknown } };
    const props = el.props;
    if (props?.['aria-hidden'] || el.type?.decorative) return '';
    return nodeText(props?.children);
  }
  return '';
}

const UNIT_NAMES: Record<string, [string, string]> = {
  ml: ['mililitro', 'mililitros'],
  L: ['litro', 'litros'],
  g: ['grama', 'gramas'],
  kg: ['quilo', 'quilos'],
  min: ['minuto', 'minutos'],
  h: ['hora', 'horas'],
};

/** "500 ml" → "500 mililitros", "1 L" → "1 litro", "6 g" → "6 gramas" (unidades por extenso para o VoiceOver). */
export function spellUnits(text: string): string {
  return text.replace(/(\d+(?:[.,]\d+)?)\s*(ml|L|g|kg|min|h)(?!\p{L})/gu, (_m, n: string, u: string) => {
    const [one, many] = UNIT_NAMES[u]!;
    return `${n} ${n === '1' ? one : many}`;
  });
}

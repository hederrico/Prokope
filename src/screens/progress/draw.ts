// Gráficos que se desenham ao aparecer (habito-progresso.md › Regras comuns deste grupo).
// - Desenha uma vez por sessão, por gráfico (a chave), quando 40% dele fica visível.
// - No máximo dois gráficos desenham ao mesmo tempo; o segundo começa 120 ms depois do primeiro.
// - Depois disso vale o "Ao abrir": o gráfico anda do último valor mostrado até o novo, ou fica parado.
// - Movimento reduzido: tudo aparece no valor final (os componentes trocam por opacidade em micro).
import { useCallback, useEffect, useState } from 'react';
import { useReduced } from '@/components/ui';

const drawn = new Set<string>();
const lastShown = new Map<string, unknown>();

// ---------- fila: dois gráficos por vez ----------

const GAP_MS = 120;
let active = 0;
let lastStart = -Infinity;
const queue: (() => void)[] = [];

function release() {
  active = Math.max(0, active - 1);
  const next = queue.shift();
  if (next) next();
}

/** Pede a vez de desenhar. Devolve o cancelamento (sai da fila ou libera a vez). */
function requestSlot(start: () => void, durationMs: number): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let holding = false;
  let done = false;
  const run = () => {
    const now = performance.now();
    const wait = active > 0 ? Math.max(0, lastStart + GAP_MS - now) : 0;
    active++;
    holding = true;
    lastStart = now + wait;
    timer = setTimeout(() => {
      if (done) return;
      start();
      timer = setTimeout(() => {
        holding = false;
        release();
      }, durationMs);
    }, wait);
  };
  if (active < 2) run();
  else queue.push(run);
  return () => {
    done = true;
    const i = queue.indexOf(run);
    if (i >= 0) queue.splice(i, 1);
    if (timer) clearTimeout(timer);
    if (holding) {
      holding = false;
      release();
    }
  };
}

export interface DrawGate<E extends Element> {
  /** ref de callback: o elemento observado (ref={gate.observe}) */
  observe: (el: E | null) => void;
  /** o desenho já começou (ou o gráfico já foi desenhado nesta sessão) */
  started: boolean;
  /** é a primeira vez que este gráfico aparece na sessão */
  first: boolean;
}

/**
 * O portão do desenho de um gráfico: `started` fica verdadeiro quando ele pode desenhar
 * (visível em 40%, com a vez na fila). Na segunda vez na sessão, já começa verdadeiro.
 */
export function useDrawGate<E extends Element = HTMLDivElement>(
  key: string,
  opts: { durationMs?: number; enabled?: boolean } = {},
): DrawGate<E> {
  const reduced = useReduced();
  const [el, setEl] = useState<E | null>(null);
  const observe = useCallback((node: E | null) => setEl(node), []);
  const [first] = useState(() => !drawn.has(key));
  const [started, setStarted] = useState(() => !first || reduced);
  const duration = opts.durationMs ?? 600;
  const enabled = opts.enabled ?? true;

  useEffect(() => {
    if (started || !enabled) return;
    let cancel: (() => void) | null = null;
    const go = () => {
      drawn.add(key);
      setStarted(true);
    };
    if (reduced) {
      go();
      return;
    }
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      cancel = requestSlot(go, duration);
      return () => cancel?.();
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.4)) {
          io.disconnect();
          cancel = requestSlot(go, duration);
        }
      },
      { threshold: [0.4] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancel?.();
    };
  }, [started, enabled, reduced, key, duration, el]);

  return { observe, started, first };
}

/**
 * O valor que o gráfico mostra: `zero` antes do desenho (primeira vez), o último valor mostrado
 * na volta (segunda vez em diante) e o alvo depois que o portão abre. Os componentes animam a troca.
 */
export function useDrawnValue<T>(key: string, target: T, zero: T, started: boolean, delayMs = 0): T {
  const sig = JSON.stringify(target);
  const [shown, setShown] = useState<{ v: T; sig: string }>(() => {
    if (!started) return { v: zero, sig: JSON.stringify(zero) };
    const last = lastShown.get(key) as { v: T; sig: string } | undefined;
    return last ?? { v: target, sig };
  });
  useEffect(() => {
    if (!started || shown.sig === sig) {
      if (started) lastShown.set(key, { v: target, sig });
      return undefined;
    }
    const apply = () => {
      setShown({ v: target, sig });
      lastShown.set(key, { v: target, sig });
    };
    if (delayMs > 0) {
      const t = setTimeout(apply, delayMs);
      return () => clearTimeout(t);
    }
    apply();
    return undefined;
    // `target` muda junto com `sig`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, sig, key, delayMs]);
  return shown.v;
}

/** Só para os testes: esquece o que já foi desenhado. */
export function resetDrawn() {
  drawn.clear();
  lastShown.clear();
}

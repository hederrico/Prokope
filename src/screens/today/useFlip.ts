// A arrumação do Hoje com a mola calma: guarda a posição de cada bloco e de cada linha a cada pintura e,
// quando a arrumação muda, anima do lugar antigo para o novo (FLIP). Linhas que aparecem entram com opacidade
// em base. As linhas são as <li> do HabitRow (componente da base, sem motion), achadas pela classe td-fl-<id>;
// os blocos da tela usam data-flip="<id>".
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { animate } from 'motion/react';
import { spring, tween } from '@/motion/tokens';
import { prefersReducedMotion } from '@/motion/reducedMotion';

const SELECTOR = '[data-flip], .td-fl';

function flipId(el: HTMLElement): string | null {
  if (el.dataset.flip) return el.dataset.flip;
  for (const c of el.classList) if (c.startsWith('td-fl-')) return c.slice(6);
  return null;
}

/** Posição de layout (sem transform) relativa à raiz, pela cadeia de offsetParent. */
function layoutTop(el: HTMLElement, root: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== root) {
    y += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent || !root.contains(parent)) {
      // a raiz não é offsetParent: desconta a posição dela
      if (parent !== root) y -= root.offsetTop;
      break;
    }
    node = parent;
  }
  return y;
}

function measure(root: HTMLElement): Map<string, number> {
  const map = new Map<string, number>();
  root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    const id = flipId(el);
    if (id && el.offsetParent) map.set(id, layoutTop(el, root));
  });
  return map;
}

/**
 * `version` muda a cada arrumação; `animateNow` diz se esta arrumação anima (volta de uma folha)
 * ou acontece parada (volta para a frente, antes da primeira pintura).
 */
export function useFlip(rootRef: RefObject<HTMLElement | null>, version: number, animateNow: boolean): void {
  const last = useRef<Map<string, number>>(new Map());
  const seen = useRef(version);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const now = measure(root);
    if (seen.current !== version) {
      seen.current = version;
      if (animateNow && !prefersReducedMotion()) {
        root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
          const id = flipId(el);
          if (!id) return;
          const before = last.current.get(id);
          const after = now.get(id);
          if (after === undefined) return;
          if (before === undefined) {
            animate(el, { opacity: [0, 1] }, tween.base);
            return;
          }
          const dy = before - after;
          if (Math.abs(dy) > 1) animate(el, { y: [dy, 0] }, spring.calma);
        });
      } else if (animateNow) {
        // reduzido: só a opacidade dos que mudaram de lugar
        root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
          const id = flipId(el);
          if (!id) return;
          const before = last.current.get(id);
          const after = now.get(id);
          if (after !== undefined && (before === undefined || Math.abs(before - after) > 1)) {
            animate(el, { opacity: [0, 1] }, tween.micro);
          }
        });
      }
    }
    last.current = now;
  });
}

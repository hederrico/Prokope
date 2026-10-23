// O lado do DOM do tutorial: achar o alvo de um passo, esperar ele aparecer e assentar, rolar até ele e medir a área
// segura onde o balão pode ficar. As contas puras ficam em placement.ts.
import { prefersReducedMotion } from '@/motion/reducedMotion';
import { boxBottom, scrollTopFor, type Box } from './placement';

/** 'pp-mark' vira [data-tour="pp-mark"]; o resto é um seletor CSS. */
export function selectorOf(target: string): string {
  return /^[\w-]+$/.test(target) ? `[data-tour="${target}"]` : target;
}

export function toBox(r: DOMRect | DOMRectReadOnly): Box {
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Um alvo que dá para mostrar: na página, fora da camada que está saindo (aria-hidden, na passagem entre telas)
 * e com tamanho.
 */
export function isShown(el: Element | null | undefined): el is Element {
  if (!el?.isConnected) return false;
  if (el.closest('[aria-hidden="true"]')) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

/** O primeiro elemento à mostra que casa com o alvo. */
export function queryTarget(target: string): Element | null {
  let list: NodeListOf<Element>;
  try {
    list = document.querySelectorAll(selectorOf(target));
  } catch {
    return null;
  }
  for (const el of list) if (isShown(el)) return el;
  return null;
}

const frame = () =>
  new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 16);
  });

const same = (a: Box, b: Box) =>
  Math.abs(a.left - b.left) < 0.5 &&
  Math.abs(a.top - b.top) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5;

/**
 * Espera o elemento parar de mexer (a passagem da tela, a cascata, a rolagem): a mesma caixa em 4 quadros seguidos,
 * ou até `maxMs`.
 */
export async function waitStill(el: Element, maxMs = 900, isLive: () => boolean = () => true): Promise<void> {
  const start = performance.now();
  let last = toBox(el.getBoundingClientRect());
  let still = 0;
  while (isLive() && performance.now() - start < maxMs && still < 4) {
    await frame();
    if (!el.isConnected) return;
    const now = toBox(el.getBoundingClientRect());
    still = same(now, last) ? still + 1 : 0;
    last = now;
  }
}

/** Espera o alvo existir, até `timeout` ms. Devolve null se ele não apareceu (o passo é pulado). */
export async function waitFor<T>(find: () => T | null, timeout: number, isLive: () => boolean): Promise<T | null> {
  const start = performance.now();
  for (;;) {
    if (!isLive()) return null;
    const found = find();
    if (found) return found;
    if (performance.now() - start > timeout) return null;
    await frame();
  }
}

function scrollerOf(el: Element): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}

/** O topo de tudo o que cobre a parte de baixo da tela: a barra de abas, o pé preso de uma tela cheia, o teclado. */
export function coveredBottom(): number {
  let bottom = window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : innerHeight;
  for (const sel of ['.sh-tb', '.sh-full-foot']) {
    for (const el of document.querySelectorAll(sel)) {
      if (!isShown(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.top > innerHeight * 0.4) bottom = Math.min(bottom, r.top);
    }
  }
  return bottom;
}

/** O fim de cima do que fica preso no topo da tela atual (a barra da tela empurrada, o topo dos passos). */
export function coveredTop(): number {
  let top = window.visualViewport?.offsetTop ?? 0;
  for (const sel of ['.sh-nb', '.sh-steptop']) {
    for (const el of document.querySelectorAll(sel)) {
      if (!isShown(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.3) top = Math.max(top, r.bottom);
    }
  }
  return top;
}

/** Rola o rolador do alvo até ele ficar à vista (sem tocar nas camadas de fora, que têm overflow hidden). */
export async function revealTarget(el: Element, isLive: () => boolean = () => true): Promise<void> {
  const scroller = scrollerOf(el);
  if (scroller) {
    const sr = scroller.getBoundingClientRect();
    const band = { top: Math.max(sr.top, coveredTop()), bottom: Math.min(boxBottom(toBox(sr)), coveredBottom()) };
    const next = scrollTopFor({
      target: toBox(el.getBoundingClientRect()),
      band,
      scrollTop: scroller.scrollTop,
      maxScroll: scroller.scrollHeight - scroller.clientHeight,
    });
    if (next !== null) scroller.scrollTo({ top: next, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
  await waitStill(el, 900, isLive);
}

/** O raio do canto do alvo (px), para o furo do véu acompanhar o desenho. */
export function radiusOf(el: Element): number {
  const v = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius);
  return Number.isFinite(v) ? v : 0;
}

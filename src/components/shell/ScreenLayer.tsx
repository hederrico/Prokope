// Uma camada de tela dentro do AnimatePresence: entra e sai com a passagem certa (navegacao.md › Animação de cada
// passagem), guarda e restaura a rolagem, e congela o lugar da rota que está saindo.
// As animações são feitas nos valores de movimento (xp em % da largura, y em px, opacidade), para o arrasto da borda
// poder segurar a camada no meio do caminho e soltar com a velocidade do dedo.
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { animate, m, usePresence, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { UNSAFE_LocationContext, type Location, type NavigationType } from 'react-router';
import { distance, dur, ease, spring, tween } from '@/motion/tokens';
import { prefersReducedMotion } from '@/motion/reducedMotion';
import type { TransitionType } from './types';

export interface TransitionInfo {
  type: TransitionType;
  /** contador: muda a cada passagem */
  seq: number;
  /** de onde veio (caminho), para devolver o foco ao voltar */
  from?: string | null;
  /** o voltar pelo arrasto já está animando a camada de cima; a saída só espera */
  gesture?: Promise<unknown>;
}

export const TransitionContext = createContext<TransitionInfo>({ type: 'none', seq: 0 });

export interface LayerHandle {
  xp: MotionValue<number>;
  y: MotionValue<number>;
  opacity: MotionValue<number>;
  scroller: () => HTMLElement | null;
}

/** Registro das camadas vivas (o arrasto da borda e o toque na aba ativa mexem nelas). */
export const LayerRegistryContext = createContext<Map<string, LayerHandle> | null>(null);

// rolagem guardada por tela
const scrollMemory = new Map<string, number>();
export function forgetScroll(key: string) {
  scrollMemory.delete(key);
}

type EnterKind = TransitionType | 'preview';

interface Pose {
  xp: number;
  y: number;
  opacity: number;
  z: number;
}

function startPose(enter: EnterKind, reduced: boolean): Pose {
  if (enter === 'preview') return { xp: -distance.pushBack * 100, y: 0, opacity: 1, z: 1 };
  if (enter === 'none' || enter === 'closeFull' || enter === 'pop') {
    return { xp: enter === 'pop' && !reduced ? -distance.pushBack * 100 : 0, y: 0, opacity: 1, z: 1 };
  }
  if (reduced) return { xp: 0, y: 0, opacity: 0, z: 2 };
  switch (enter) {
    case 'push':
      return { xp: 100, y: 0, opacity: 1, z: 2 };
    case 'openFull':
      return { xp: 0, y: distance.screen, opacity: 0, z: 2 };
    default:
      // tab, fade, fadeBase
      return { xp: 0, y: 0, opacity: 0, z: 2 };
  }
}

/** Fornece à rota da camada o lugar dela: a camada que sai continua vendo o lugar antigo. */
export function FrozenLocation({
  location,
  navigationType,
  children,
}: {
  location: Location;
  navigationType: NavigationType;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ location, navigationType }), [location, navigationType]);
  return <UNSAFE_LocationContext.Provider value={value}>{children}</UNSAFE_LocationContext.Provider>;
}

/** A camada que sai não recebe toque nem foco, e sai da árvore do leitor de tela. */
function setLeaving(el: HTMLElement | null, leaving: boolean) {
  if (!el) return;
  el.inert = leaving;
  el.style.pointerEvents = leaving ? 'none' : '';
  if (leaving) el.setAttribute('aria-hidden', 'true');
  else el.removeAttribute('aria-hidden');
}

function focusTitle(root: HTMLElement | null) {
  const h = root?.querySelector<HTMLElement>('h1');
  if (!h) return;
  if (!h.hasAttribute('tabindex')) h.tabIndex = -1;
  h.focus({ preventScroll: true });
}

function focusOpener(root: HTMLElement | null, from: string | null | undefined) {
  if (!root || !from) return;
  const path = from.split('?')[0];
  const link = [...root.querySelectorAll<HTMLElement>('a[href]')].find(
    (a) => a.getAttribute('href')?.split('?')[0] === path,
  );
  link?.focus({ preventScroll: true });
}

export interface ScreenLayerProps {
  id: string;
  level: 'root' | 'tab';
  /** a passagem com que esta camada entrou (lida só ao montar) */
  enter: EnterKind;
  /** a camada tem a própria rolagem (as telas); a camada das abas não tem */
  scrollable?: boolean;
  children: ReactNode;
}

export function ScreenLayer({ id, level, enter, scrollable = true, children }: ScreenLayerProps) {
  const [isPresent, safeToRemove] = usePresence();
  const transition = useContext(TransitionContext);
  const registry = useContext(LayerRegistryContext);
  const [pose] = useState(() => startPose(enter, prefersReducedMotion()));
  const xp = useMotionValue(pose.xp);
  const y = useMotionValue(pose.y);
  const opacity = useMotionValue(pose.opacity);
  const x = useTransform(xp, (v) => `${v}%`);
  const shade = useTransform(xp, (v) => (v < 0 ? Math.min(1, -v / (distance.pushBack * 100)) * distance.pushDim : 0));
  const z = useMotionValue(pose.z);
  const layerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const token = useRef(0);
  const running = useRef<{ stop: () => void }[]>([]);
  const wasAbsent = useRef(false);

  function stopAll() {
    for (const a of running.current) a.stop();
    running.current = [];
  }
  function play<T extends { stop: () => void }>(a: T): T {
    running.current.push(a);
    return a;
  }

  // registro e rolagem
  useLayoutEffect(() => {
    const handle: LayerHandle = { xp, y, opacity, scroller: () => scrollRef.current };
    registry?.set(id, handle);
    const el = scrollRef.current;
    if (el) {
      if (enter === 'push' || enter === 'openFull') {
        scrollMemory.delete(id);
        el.scrollTop = 0;
      } else {
        el.scrollTop = scrollMemory.get(id) ?? 0;
      }
    }
    return () => {
      if (registry?.get(id) === handle) registry.delete(id);
    };
    // só ao montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => scrollMemory.set(id, el.scrollTop));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', onScroll);
    };
  }, [id]);

  // entrada
  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    if (enter === 'none' || enter === 'preview' || enter === 'closeFull') return;
    if (reduced) {
      if (enter !== 'pop') play(animate(opacity, 1, tween.micro));
    } else {
      switch (enter) {
        case 'push':
        case 'pop':
          play(animate(xp, 0, spring.calma));
          break;
        case 'openFull':
          play(animate(y, 0, tween.base));
          play(animate(opacity, 1, tween.base));
          break;
        case 'tab':
        case 'fade':
          play(animate(opacity, 1, tween.micro));
          break;
        case 'fadeBase':
          play(animate(opacity, 1, tween.base));
          break;
      }
    }
    // foco: o título da tela nova (o VoiceOver lê o nome dela); ao voltar, quem abriu
    const root = scrollRef.current;
    if (enter === 'push' || enter === 'openFull' || enter === 'fade' || enter === 'fadeBase') focusTitle(root);
    else if (enter === 'pop') focusOpener(root, transition.from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // saída (e a volta de quem saía, numa navegação rápida)
  useEffect(() => {
    if (isPresent) {
      if (wasAbsent.current) {
        wasAbsent.current = false;
        token.current++;
        stopAll();
        setLeaving(layerRef.current, false);
        const reduced = prefersReducedMotion();
        z.set(transition.type === 'pop' ? 1 : 2);
        play(animate(xp, 0, reduced ? tween.micro : spring.calma));
        play(animate(y, 0, tween.base));
        play(animate(opacity, 1, tween.micro));
      }
      return;
    }
    wasAbsent.current = true;
    setLeaving(layerRef.current, true);
    const el = scrollRef.current;
    if (el) scrollMemory.set(id, el.scrollTop);
    const my = ++token.current;
    const done = () => {
      if (token.current === my) safeToRemove?.();
    };
    stopAll();
    const reduced = prefersReducedMotion();
    const t = transition;
    const onTop =
      t.type === 'pop' || t.type === 'closeFull' || t.type === 'tab' || t.type === 'fade' || t.type === 'fadeBase';
    z.set(onTop ? 2 : 1);

    if (t.type === 'none') {
      done();
      return;
    }
    if (t.gesture) {
      void t.gesture.then(done, done);
      return;
    }
    if (reduced) {
      if (onTop) void play(animate(opacity, 0, tween.micro)).then(done);
      else window.setTimeout(done, dur.micro * 1000);
      return;
    }
    switch (t.type) {
      case 'push':
        void play(animate(xp, -distance.pushBack * 100, spring.calma)).then(done);
        break;
      case 'pop':
        void play(animate(xp, 100, spring.calma)).then(done);
        break;
      case 'openFull':
        // a tela de baixo fica parada enquanto a tela cheia sobe
        window.setTimeout(done, dur.base * 1000);
        break;
      case 'closeFull':
        play(animate(y, distance.screen, { duration: dur.micro, ease: ease.exit }));
        void play(animate(opacity, 0, { duration: dur.micro, ease: ease.exit })).then(done);
        break;
      default:
        void play(animate(opacity, 0, tween.exit)).then(done);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent]);

  useEffect(() => () => stopAll(), []);

  return (
    <m.div ref={layerRef} className="sh-layer" data-level={level} data-screen={id} style={{ x, y, opacity, zIndex: z }}>
      <div
        ref={scrollRef}
        className={scrollable ? 'sh-scroll' : 'sh-noscroll'}
        data-screen-scroll={scrollable || undefined}
      >
        {children}
      </div>
      {level === 'tab' && <m.div className="sh-shade" style={{ opacity: shade }} aria-hidden="true" />}
    </m.div>
  );
}

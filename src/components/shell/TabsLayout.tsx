// As quatro abas: o conteúdo da aba (uma pilha de telas com as passagens) e a barra de abas embaixo.
// Trocar de aba troca só a opacidade em micro; a tela empurrada entra da direita com a mola calma e a anterior recua
// 25% e escurece 6%; voltar faz o inverso, pelo botão ou pelo arrasto da borda esquerda, que segue o dedo.
// A camada que sai fica congelada (o elemento da rota antiga e o lugar antigo).
//
// As refs lidas durante a renderização são de propósito: a pilha da aba e o desenho de cada tela visitada são
// anotações do que já foi mostrado (para o Voltar ter o nome certo e o arrasto mostrar a tela de baixo), e não estado
// que deva causar outra renderização. O app não usa o React Compiler.
/* eslint-disable react-hooks/refs */
import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, animate } from 'motion/react';
import {
  matchRoutes,
  NavigationType,
  UNSAFE_DataRouterContext,
  UNSAFE_RouteContext,
  useLocation,
  useNavigate,
  useNavigationType,
  useOutlet,
  type Location,
} from 'react-router';
import { lastNavigation } from '@/app/history';
import { findScreen, tabOf, tabRoot, type TabId } from '@/app/screens';
import { edgeSwipeEnabled } from '@/app/platform';
import { distance, gesture as limits, spring, tween } from '@/motion/tokens';
import { prefersReducedMotion } from '@/motion/reducedMotion';
import { attachDrag } from './drag';
import { backTargetFor, lastPathOf, resetTabStack, syncTabStack, useGoBack, type NavState } from './navigation';
import {
  FrozenLocation,
  LayerRegistryContext,
  ScreenLayer,
  TransitionContext,
  type LayerHandle,
  type TransitionInfo,
} from './ScreenLayer';
import { TabBar } from './TabBar';
import { tabTransition } from './transitions';

interface Cached {
  element: ReactElement | null;
  location: Location;
  navigationType: NavigationType;
}

interface Preview extends Cached {
  key: string;
}

export function TabsLayout() {
  const outlet = useOutlet();
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const key = location.pathname;
  const tab = (tabOf(key) ?? 'hoje') as TabId;

  // ---------- a passagem: calculada quando a tela muda ----------
  const pendingGesture = useRef<Promise<unknown> | null>(null);
  const [current, setCurrent] = useState<{ key: string; info: TransitionInfo }>(() => ({
    key,
    info: { type: 'none', seq: 0 },
  }));
  let info = current.info;
  const changed = current.key !== key;
  if (changed) {
    const nav = lastNavigation();
    const type = tabTransition(current.key, key, nav);
    info = {
      type,
      seq: current.info.seq + 1,
      from: current.key,
      gesture: type === 'pop' ? (pendingGesture.current ?? undefined) : undefined,
    };
    pendingGesture.current = null;
    setCurrent({ key, info });
  }

  // pilha da aba (antes de a tela nova renderizar, para o Voltar dela já ter o nome certo)
  const synced = useRef<string | null>(null);
  if (synced.current !== location.key) {
    synced.current = location.key;
    const kind =
      changed && (info.type === 'push' || info.type === 'pop' || info.type === 'tab')
        ? info.type
        : changed && navigationType === 'REPLACE'
          ? 'replace'
          : 'none';
    syncTabStack(location.pathname, location.search, kind);
  }

  // desenho de cada tela visitada, para mostrar a anterior por baixo durante o arrasto da borda
  const cache = useRef(new Map<string, Cached>());
  cache.current.set(key, { element: outlet, location, navigationType });

  const registry = useMemo(() => new Map<string, LayerHandle>(), []);
  const [preview, setPreview] = useState<Preview | null>(null);
  const showPreview = preview && preview.key !== key ? preview : null;

  // ---------- abas ----------
  const selectTab = useCallback(
    (next: TabId) => {
      if (next !== tab) {
        void navigate(lastPathOf(next));
        return;
      }
      const root = tabRoot(next);
      if (location.pathname !== root) {
        resetTabStack(next);
        void navigate(root, { state: { transition: 'pop' } satisfies NavState });
        return;
      }
      // já na raiz: rola ao topo com a mola calma
      const el = registry.get(key)?.scroller();
      if (!el || el.scrollTop === 0) return;
      if (prefersReducedMotion()) {
        el.scrollTop = 0;
        return;
      }
      const anim = animate(el.scrollTop, 0, { ...spring.calma, onUpdate: (v) => (el.scrollTop = v) });
      const stop = () => anim.stop();
      el.addEventListener('touchstart', stop, { once: true, passive: true });
      el.addEventListener('wheel', stop, { once: true, passive: true });
    },
    [tab, navigate, location.pathname, registry, key],
  );

  // ---------- voltar pelo arrasto da borda esquerda ----------
  const def = findScreen(key)?.def;
  const back = def?.kind === 'push' ? backTargetFor(key) : null;
  const backPath = back?.path;
  const backKey = backPath?.split('?')[0];
  const swipeOn = edgeSwipeEnabled();
  // num link direto, a tela de cima nunca foi mostrada nesta sessão: o desenho dela é preparado agora (o arquivo
  // carrega e a tela renderiza com o lugar dela), para o arrasto mostrar a tela de baixo como numa pilha aberta
  const dataRouter = useContext(UNSAFE_DataRouterContext);
  const [, setPrepared] = useState(0);
  useEffect(() => {
    if (!swipeOn || !backPath || !backKey || cache.current.has(backKey) || !dataRouter) return;
    const target = findScreen(backKey);
    if (!target || (target.def.kind !== 'tab' && target.def.kind !== 'push')) return;
    let alive = true;
    target.def
      .load()
      .then((mod) => {
        if (!alive || cache.current.has(backKey)) return;
        const matches = matchRoutes(dataRouter.router.routes, backKey);
        if (!matches?.length) return;
        const Screen = mod.default;
        const search = backPath.includes('?') ? backPath.slice(backPath.indexOf('?')) : '';
        const location: Location = {
          pathname: backKey,
          search,
          hash: '',
          state: null,
          key: `preparado-${backKey}`,
        };
        cache.current.set(backKey, {
          element: (
            <UNSAFE_RouteContext.Provider value={{ outlet: null, matches, isDataRoute: true }}>
              <Screen />
            </UNSAFE_RouteContext.Provider>
          ),
          location,
          navigationType: NavigationType.Pop,
        });
        setPrepared((n) => n + 1);
      })
      .catch(() => {
        /* sem o arquivo (sem internet): o arrasto fica desligado nesta tela */
      });
    return () => {
      alive = false;
    };
  }, [swipeOn, backPath, backKey, dataRouter]);
  const canSwipe = !!back && !!backKey && cache.current.has(backKey) && swipeOn;
  const edgeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const swipe = useRef({ key, backKey, goBack });
  swipe.current = { key, backKey, goBack };

  useEffect(() => {
    const edge = edgeRef.current;
    if (!edge) return;
    let W = 1;
    let link: (() => void) | null = null;
    const under = () => (swipe.current.backKey ? registry.get(swipe.current.backKey) : undefined);
    const top = () => registry.get(swipe.current.key);
    // a tela de baixo vai de −25% a 0 enquanto a de cima vai de 0 a 100%
    const follow = (v: number) => under()?.xp.set(-distance.pushBack * (100 - v));
    return attachDrag(edge, {
      axis: 'x',
      filter: () => !!top(),
      begin: () => {
        W = contentRef.current?.offsetWidth || window.innerWidth;
        const bk = swipe.current.backKey;
        const cached = bk ? cache.current.get(bk) : undefined;
        if (bk && cached) setPreview({ key: bk, ...cached });
        const t = top();
        if (t && prefersReducedMotion()) t.opacity.set(1);
      },
      move: (dx) => {
        const t = top();
        if (!t) return;
        const p = (Math.min(W, Math.max(0, dx)) / W) * 100;
        t.xp.set(p);
        follow(p);
      },
      end: (_dx, _dy, vx) => {
        const t = top();
        if (!t) return;
        const p = t.xp.get() / 100;
        link?.();
        link = t.xp.on('change', follow);
        const velocity = (vx / W) * 100;
        const reduced = prefersReducedMotion();
        if (p > limits.backDistance || vx > limits.backVelocity) {
          const anim = reduced ? animate(t.opacity, 0, tween.micro) : animate(t.xp, 100, { ...spring.calma, velocity });
          if (reduced) under()?.xp.set(0);
          const done = Promise.resolve(anim).finally(() => {
            link?.();
            link = null;
            under()?.xp.set(0);
            setPreview(null);
          });
          pendingGesture.current = done;
          swipe.current.goBack();
        } else {
          const anim = animate(t.xp, 0, reduced ? tween.micro : { ...spring.calma, velocity });
          void Promise.resolve(anim).finally(() => {
            link?.();
            link = null;
            setPreview(null);
          });
        }
      },
      tap: (e) => {
        // um toque na faixa da borda vale para o que está embaixo dela
        edge.style.pointerEvents = 'none';
        const below = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        edge.style.pointerEvents = '';
        below?.click();
      },
    });
  }, [canSwipe, registry]);

  return (
    <LayerRegistryContext.Provider value={registry}>
      <TransitionContext.Provider value={info}>
        <div ref={contentRef} className="sh-tabs-content">
          {/* sem initial={false}, que bloquearia a entrada de tudo o que aparece depois dentro das telas;
              a camada da primeira tela já nasce parada pelo enter 'none' */}
          <AnimatePresence>
            {showPreview && (
              <ScreenLayer key={showPreview.key} id={showPreview.key} level="tab" enter="preview">
                <FrozenLocation location={showPreview.location} navigationType={showPreview.navigationType}>
                  {showPreview.element}
                </FrozenLocation>
              </ScreenLayer>
            )}
            <ScreenLayer key={key} id={key} level="tab" enter={info.type}>
              <FrozenLocation location={location} navigationType={navigationType}>
                {outlet}
              </FrozenLocation>
            </ScreenLayer>
          </AnimatePresence>
          {canSwipe && <div ref={edgeRef} className="sh-edge" aria-hidden="true" />}
        </div>
        <TabBar active={tab} onSelect={selectTab} hrefFor={(t) => (t === tab ? tabRoot(t) : lastPathOf(t))} />
      </TransitionContext.Provider>
    </LayerRegistryContext.Provider>
  );
}

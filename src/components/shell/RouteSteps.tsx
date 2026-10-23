// Passos de um fluxo feitos de rotas diferentes (Novo hábito: tipo → detalhes; ajustes-plano.md › O passo entre
// tipo e detalhes). As duas rotas dividem a mesma camada (kind 'flow' com `step` em screens.ts); aqui a troca de
// rota vira o passo de navegacao.md: o conteúdo sai 24 px para a esquerda em micro e o novo entra 24 px pela
// direita em base (voltar faz o inverso). A barra do topo fica parada: só o corpo da FullScreen se move (ele herda
// os rótulos enter/center/exit deste embrulho). Reduzido: só opacidade, em micro.
// Rotas sem `step` passam direto, só com o lugar congelado (a camada que sai continua vendo o lugar antigo).
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m, type Variants } from 'motion/react';
import type { Location, NavigationType } from 'react-router';
import { findScreen } from '@/app/screens';
import { distance, dur, ease, tween } from '@/motion/tokens';
import { usePrefersReducedMotion } from '@/motion/reducedMotion';
import { RouteStepContext } from './routeStep';
import { FrozenLocation } from './ScreenLayer';

const bodyVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * distance.screen }),
  center: { opacity: 1, x: 0, transition: tween.base },
  exit: (dir: number) => ({
    opacity: 0,
    x: -dir * distance.screen,
    transition: { duration: dur.micro, ease: ease.exit },
  }),
};

const reducedBodyVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: tween.micro },
  exit: { opacity: 0, transition: tween.micro },
};

// o embrulho só passa os rótulos para o corpo
const labels: Variants = { enter: {}, center: {}, exit: {} };

/** O passo novo começa do topo da rolagem; o foco vai para o título (a barra foi trocada). */
function StepStart({ first }: { first: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (first) return;
    const scroller = ref.current?.closest<HTMLElement>('[data-screen-scroll]');
    if (scroller) scroller.scrollTop = 0;
    const layer = ref.current?.closest<HTMLElement>('.sh-layer');
    const active = document.activeElement;
    if (!active || active === document.body || !active.isConnected) {
      const h = layer?.querySelector<HTMLElement>('h1');
      if (h) {
        if (!h.hasAttribute('tabindex')) h.tabIndex = -1;
        h.focus({ preventScroll: true });
      }
    }
  }, [first]);
  return <span ref={ref} hidden />;
}

export function RouteSteps({
  location,
  navigationType,
  children,
}: {
  location: Location;
  navigationType: NavigationType;
  children: ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const def = findScreen(location.pathname)?.def;
  const step = def?.step;
  const path = def?.path ?? location.pathname;
  // direção: o passo anterior volta da esquerda; o seguinte vem da direita
  const [seen, setSeen] = useState({ path, step: step ?? 0, dir: 1, changes: 0 });
  let { dir, changes } = seen;
  if (step != null && seen.path !== path) {
    dir = step < seen.step ? -1 : 1;
    changes = seen.changes + 1;
    setSeen({ path, step, dir, changes });
  }

  if (step == null) {
    return (
      <FrozenLocation location={location} navigationType={navigationType}>
        {children}
      </FrozenLocation>
    );
  }

  const first = changes === 0;
  return (
    <RouteStepContext.Provider value={{ variants: reduced ? reducedBodyVariants : bodyVariants, dir }}>
      <AnimatePresence mode="wait" custom={dir}>
        <m.div
          key={path}
          className="sh-rstep"
          custom={dir}
          variants={labels}
          initial={first ? false : 'enter'}
          animate="center"
          exit="exit"
        >
          <FrozenLocation location={location} navigationType={navigationType}>
            <StepStart first={first} />
            {children}
          </FrozenLocation>
        </m.div>
      </AnimatePresence>
    </RouteStepContext.Provider>
  );
}

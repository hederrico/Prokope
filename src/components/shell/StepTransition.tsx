// A troca de conteúdo entre passos de um fluxo (navegacao.md › Passo de um fluxo): o conteúdo novo entra 24 px pela
// direita com opacidade, e voltar faz o inverso. Reduzido: só opacidade em micro. O StepTop fica fora, parado.
// A cada passo, o foco vai para o título do passo.
//   <StepTop step={step} total={3} onBack={...} />
//   <StepTransition step={step}>{conteúdo do passo}</StepTransition>
import { useState, type ReactNode } from 'react';
import { AnimatePresence, m, type Variants } from 'motion/react';
import { distance, dur, ease, tween } from '@/motion/tokens';
import { usePrefersReducedMotion } from '@/motion/reducedMotion';

const variants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * distance.screen }),
  center: { opacity: 1, x: 0, transition: tween.base },
  exit: (dir: number) => ({
    opacity: 0,
    x: -dir * distance.screen,
    transition: { duration: dur.micro, ease: ease.exit },
  }),
};

const reducedVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: tween.micro },
  exit: { opacity: 0, transition: tween.micro },
};

export function StepTransition({
  step,
  children,
  className,
}: {
  step: number | string;
  children: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  // direção: o passo anterior volta da esquerda; o seguinte vem da direita
  const [seen, setSeen] = useState({ step, dir: 1, first: true });
  let dir = seen.dir;
  let first = seen.first;
  if (seen.step !== step) {
    dir = Number(step) < Number(seen.step) ? -1 : 1;
    first = false;
    setSeen({ step, dir, first });
  }
  // o primeiro passo nasce parado pelo initial={false} do próprio passo, e não do AnimatePresence: lá ele passaria
  // a todas as animações de dentro do passo e bloquearia a entrada do que aparece depois
  return (
    <AnimatePresence mode="wait" custom={dir}>
      <m.div
        key={step}
        className={className}
        custom={dir}
        variants={reduced ? reducedVariants : variants}
        initial={first ? false : 'enter'}
        animate="center"
        exit="exit"
        onAnimationComplete={(def) => {
          if (def !== 'center') return;
          // o foco vai para o título do passo novo
          const root = document.querySelector<HTMLElement>(`[data-step="${String(step)}"]`);
          const h = root?.querySelector<HTMLElement>('h1, h2');
          if (h && !root?.contains(document.activeElement)) {
            if (!h.hasAttribute('tabindex')) h.tabIndex = -1;
            h.focus({ preventScroll: true });
          }
        }}
        data-step={String(step)}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

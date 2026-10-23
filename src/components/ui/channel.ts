// Canal de animação: um número que anima e se aplica a um elemento (escala, traço, largura).
// Guarda o valor atual, então uma animação interrompida continua do ponto em que estava, como no laboratório.
import { animate, type AnimationPlaybackControls, type ValueAnimationTransition } from 'motion/react';

export type Chan = {
  v: number;
  ctl: AnimationPlaybackControls | null;
  /** resolve a promessa da animação em andamento (false quando é interrompida) */
  settle: ((completed: boolean) => void) | null;
  apply: (v: number) => void;
};

export function makeChan(v: number, apply: (v: number) => void): Chan {
  apply(v);
  return { v, ctl: null, settle: null, apply };
}

function interrupt(c: Chan) {
  c.ctl?.stop();
  c.ctl = null;
  const s = c.settle;
  c.settle = null;
  s?.(false);
}

/** Vai direto ao valor, parando o que estiver em andamento. */
export function chanSet(c: Chan, v: number) {
  interrupt(c);
  c.v = v;
  c.apply(v);
}

/** Anima do valor atual até `to`. A promessa diz se a animação chegou ao fim (true) ou foi interrompida (false). */
export function chanTo(c: Chan, to: number, transition: ValueAnimationTransition<number>): Promise<boolean> {
  interrupt(c);
  return new Promise<boolean>((resolve) => {
    c.settle = resolve;
    c.ctl = animate(c.v, to, {
      ...transition,
      onUpdate: (v) => {
        c.v = v;
        c.apply(v);
      },
      onComplete: () => {
        c.v = to;
        c.apply(to);
        c.ctl = null;
        if (c.settle === resolve) c.settle = null;
        resolve(true);
      },
    });
  });
}

export function chanStop(c: Chan | null | undefined) {
  if (c) interrupt(c);
}

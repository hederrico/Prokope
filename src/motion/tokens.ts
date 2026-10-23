// Tokens de movimento para o Motion (docs/interacao/movimento.md). Os mesmos valores vivem no CSS em src/styles/tokens.css.
// Durações em segundos (o Motion usa segundos); as molas usam visualDuration e bounce, como no laboratório (mola.js).
import type { TargetAndTransition, Transition, Variants } from 'motion/react';
import type { NumberFlowProps } from '@number-flow/react';

/** Durações (s): press 100 ms, micro 150, base 240, fill 400, ring 600, glow 900, confetti 1.600. */
export const dur = {
  press: 0.1,
  micro: 0.15,
  base: 0.24,
  fill: 0.4,
  ring: 0.6,
  glow: 0.9,
  confetti: 1.6,
  /** intervalo entre itens da cascata */
  cascade: 0.03,
} as const;

/** Curvas cúbicas, no formato do Motion. A saída dura cerca de 70% da entrada. */
export const ease = {
  /** padrão para entrar e preencher (barras, anéis) */
  out: [0.2, 0.8, 0.2, 1],
  /** mover algo que já está na tela */
  inOut: [0.65, 0, 0.35, 1],
  /** sair (toast, item apagado) */
  exit: [0.4, 0, 1, 1],
  /** só no CSS puro, quando não há mola */
  spring: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Molas: visualDuration é o tempo até parecer parado; bounce vai de 0 a 1. Herdam a velocidade do dedo. */
export const spring = {
  /** telas empurradas, mudanças de layout, listas que reordenam */
  calma: { type: 'spring', visualDuration: 0.35, bounce: 0 },
  /** ✓ do hábito, rostinho escolhido, chip selecionado */
  toque: { type: 'spring', visualDuration: 0.25, bounce: 0.25 },
  /** folha abrindo e voltando ao lugar depois de um arrasto */
  folha: { type: 'spring', visualDuration: 0.4, bounce: 0.08 },
  /** título da fase desbloqueada, selo de novo recorde */
  festa: { type: 'spring', visualDuration: 0.6, bounce: 0.35 },
} as const satisfies Record<string, Transition>;

/** Distâncias e escalas. */
export const distance = {
  /** entrada de um elemento: sobe 8 px (nunca mais que 16) */
  rise: 8,
  /** tela cheia e passo de fluxo: 24 px */
  screen: 24,
  /** outro dia na semana do topo: 12 px na direção do tempo */
  day: 12,
  /** cartões e botões pressionados */
  pressScale: 0.97,
  /** círculo do ✓ ao marcar */
  checkScale: 0.9,
  /** a tela anterior recua 25% ao empurrar */
  pushBack: 0.25,
  /** e escurece 6% */
  pushDim: 0.06,
} as const;

/** Transições prontas por duração e curva. */
export const tween = {
  press: { duration: dur.press, ease: ease.out },
  micro: { duration: dur.micro, ease: ease.out },
  base: { duration: dur.base, ease: ease.out },
  fill: { duration: dur.fill, ease: ease.out },
  ring: { duration: dur.ring, ease: ease.out },
  exit: { duration: dur.micro, ease: ease.exit },
} as const satisfies Record<string, Transition>;

/** Entrada padrão de um elemento: <m.div {...fadeUp} />. */
export const fadeUp = {
  initial: { opacity: 0, y: distance.rise },
  animate: { opacity: 1, y: 0, transition: tween.base },
  exit: { opacity: 0, transition: tween.exit },
} as const satisfies Record<'initial' | 'animate' | 'exit', TargetAndTransition>;

/** Atraso da cascata: 30 ms entre itens, no máximo 6 itens (os seguintes entram junto com o sexto). */
export function cascadeDelay(index: number): number {
  return Math.min(index, 5) * dur.cascade;
}

/** Cascata no pai (só na primeira montagem da tela, nunca quando os dados atualizam). Os filhos usam fadeUpItem. */
export const cascade = {
  hidden: {},
  shown: { transition: { delayChildren: (i: number) => cascadeDelay(i) } },
} as const satisfies Variants;

/** Item da cascata: <m.li variants={fadeUpItem}> dentro de <m.ul variants={cascade} initial="hidden" animate="shown">. */
export const fadeUpItem = {
  hidden: { opacity: 0, y: distance.rise },
  shown: { opacity: 1, y: 0, transition: tween.base },
} as const satisfies Variants;

/** Tempos da coreografia (s): do lugar do toque para longe. */
export const choreography = {
  touched: 0,
  local: 0.06,
  distant: 0.12,
  toast: 0.2,
  settled: 0.5,
} as const;

/** NumberFlow com os tokens: <NumberFlow {...numberFlowTiming} value={g} locales="pt-BR" />. */
export const numberFlowTiming = {
  transformTiming: { duration: 400, easing: 'cubic-bezier(.2, .8, .2, 1)' },
  spinTiming: { duration: 400, easing: 'cubic-bezier(.2, .8, .2, 1)' },
  opacityTiming: { duration: 150, easing: 'ease-out' },
} as const satisfies Pick<NumberFlowProps, 'transformTiming' | 'spinTiming' | 'opacityTiming'>;

/** Limites dos gestos (navegacao.md): borda do voltar, quanto arrastar e a que velocidade para completar. */
export const gesture = {
  /** largura da faixa da borda esquerda que começa o voltar (px) */
  edge: 20,
  /** o voltar completa acima de 35% da largura... */
  backDistance: 0.35,
  /** ...ou acima de 500 px/s */
  backVelocity: 500,
  /** a folha fecha acima de 30% da altura... */
  sheetDistance: 0.3,
  /** ...ou acima de 600 px/s */
  sheetVelocity: 600,
  /** o arrasto só começa depois de 5 px na direção certa (os toques nos filhos continuam funcionando) */
  slop: 5,
} as const;

/** Resistência acima do limite (a mesma do iOS e do laboratório): d px de arrasto viram menos que dim px. */
export function rubberband(d: number, dim: number): number {
  return (1 - 1 / ((d * 0.55) / dim + 1)) * dim;
}

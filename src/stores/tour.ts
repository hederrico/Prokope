// O tutorial em andamento (o que é só da interface, nada vai para o Firestore) e os avisos que fazem um passo
// andar quando a pessoa faz a ação de verdade. O condutor dos passos fica em src/tutorial/.
import { create } from 'zustand';
import type { FirstStepRating, TutorialChapter } from '@/types';

/** O que está rodando: um capítulo, o Zeno no Começar, ou a apresentação a uma conta que já existia. */
export type TourRun = TutorialChapter | 'comecar' | 'intro';

export interface TourState {
  run: TourRun | null;
  /** o passo atual dentro do capítulo */
  step: number;
  /** o grupo Primeiros passos aparece no Hoje */
  practice: boolean;
}

export const useTour = create<TourState>(() => ({ run: null, step: 0, practice: false }));

/** Avisos dos Primeiros passos e das ações que um passo pode esperar. O condutor pode juntar outros. */
export type TourEvent =
  | { type: 'pp-mark' }
  | { type: 'pp-unmark' }
  | { type: 'pp-add'; total: number }
  | { type: 'pp-rate'; rating: FirstStepRating }
  | { type: 'undo' }
  | { type: 'custom'; name: string };

type Listener = (event: TourEvent) => void;
const listeners = new Set<Listener>();

export function emitTour(event: TourEvent): void {
  for (const fn of [...listeners]) fn(event);
}

export function onTour(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * O Zeno se oferece sozinho (a apresentação às contas que já existiam e os capítulos ao abrir uma aba)?
 * Os testes desligam com VITE_TOUR_AUTO=off (.env.e2e e .env.test) e ligam o tutorial pela API.
 */
export const tourAuto = import.meta.env.VITE_TOUR_AUTO !== 'off';

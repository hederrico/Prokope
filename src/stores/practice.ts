// Os Primeiros passos do capítulo "O dia" (docs/interacao/telas/tutorial.md › Primeiros passos): o estado das três
// linhas de treino do Hoje. Fica só em memória, fora de marks e entries, e zera cada vez que o grupo aparece
// (o começo do capítulo). O instante da primeira vez de cada gesto vai para o perfil pelas ações de
// src/actions/practice.ts; o resto some quando o grupo sai.
import { create } from 'zustand';
import type { FirstStepRating } from '@/types';
import { useTour } from './tour';

/** O registro de treino vai até 3 toques. */
export const PRACTICE_GOAL = 3;

export interface PracticeState {
  /** "Primeira marcação no app" está marcada */
  marked: boolean;
  /** "Primeiro registro · 0 de 3": quantos toques no + (até PRACTICE_GOAL) */
  added: number;
  /** "Primeira nota": a nota escolhida na folha */
  rating: FirstStepRating | null;
  /** o grupo já entrou nesta vez (com fadeUp): trocar o jeito de ver ou de dia não faz ele entrar de novo */
  entered: boolean;
}

const EMPTY: PracticeState = { marked: false, added: 0, rating: null, entered: false };

export const usePractice = create<PracticeState>(() => ({ ...EMPTY }));

/** Volta as três linhas para o começo. */
export function resetPractice(): void {
  usePractice.setState({ ...EMPTY });
}

// o grupo aparece (o capítulo começa): as linhas zeram
useTour.subscribe((s, prev) => {
  if (s.practice && !prev.practice) resetPractice();
});

/** Mostra ou esconde o grupo no Hoje (o condutor do tutorial faz isso; o gancho abaixo também). */
export function showPractice(on: boolean): void {
  useTour.setState({ practice: on });
}

/**
 * window.__pkPractice.show(true): liga o grupo sem o condutor do tutorial, para os testes e as capturas.
 * Fica sempre ligado: só mexe no que é da interface, nada é gravado por ele.
 */
export function installPracticeHook(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as { __pkPractice: unknown }).__pkPractice = { show: showPractice };
}

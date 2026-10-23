// Tipos compartilhados da casca.
import type { ReactNode } from 'react';
import type { IconName } from '@/icons';
import type { PaletteKey } from '@/styles/palette';

/** O que uma folha registrada em ?folha= recebe da casca. */
export interface SheetScreenProps {
  /** os parâmetros da URL (folha=..., habito=..., dia=...) */
  params: URLSearchParams;
  /** fecha a folha (volta a entrada do histórico que a abriu) */
  close: () => void;
}

/** Cor de um pilar: um tom com tokens próprios (data-pillar) ou uma das 12 cores da paleta (.hued). */
export type PillarColor = 'mente' | 'alim' | 'corpo' | 'familia' | 'accent' | PaletteKey;

/** Passagem entre telas (navegacao.md › Animação de cada passagem). */
export type TransitionType =
  | 'none'
  /** tela empurrada entra da direita; a anterior recua 25% e escurece 6% */
  | 'push'
  /** o inverso do empurrar (Voltar, arrasto da borda) */
  | 'pop'
  /** troca de aba: só opacidade em micro */
  | 'tab'
  /** tela cheia sobe 24 px com opacidade em base */
  | 'openFull'
  /** tela cheia desce 24 px com opacidade em micro */
  | 'closeFull'
  /** troca suave em micro (entrar no app) */
  | 'fade'
  /** troca suave em base (conta sem acesso) */
  | 'fadeBase';

export interface NavAction {
  label: string;
  icon?: IconName;
  onClick: () => void;
  disabled?: boolean;
}

export type Children = { children?: ReactNode };

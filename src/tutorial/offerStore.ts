// As ofertas do Zeno (docs/interacao/telas/tutorial.md › Ofertas): a apresentação às contas que já existiam, no Hoje,
// e cada capítulo na primeira vez que a pessoa abre a aba dele. Aqui ficam a oferta na tela e as contas de quando
// oferecer (puras); quem decide a hora é useAutoOffers (offers.ts), e quem responde é answerOffer (tour.ts).
import { create } from 'zustand';
import { tourAuto, useTour } from '@/stores/tour';
import type { TutorialChapter, TutorialState } from '@/types';

export type OfferKind = 'intro' | TutorialChapter;

export interface OfferView {
  key: string;
  kind: OfferKind;
  text: string;
  yes: string;
  no: string;
  /** a resposta ao "Agora não" da apresentação; sem botões, sai sozinha */
  reply: string | null;
  /** aberta pela API (__pkTour.start('intro')): não some ao trocar de tela */
  forced: boolean;
}

const QUESTIONS: Record<OfferKind, string> = {
  intro: 'Oi, eu sou o Zeno. Vou andar com você por aqui. Quer conhecer o app comigo?',
  hoje: 'Quer que eu mostre o seu dia?',
  habito: 'Quer que eu mostre o hábito e os padrões?',
  progresso: 'Quer que eu mostre o Progresso?',
  jornada: 'Quer que eu mostre a Jornada?',
  ajustes: 'Quer que eu mostre os Ajustes?',
};

export const INTRO_LATER = 'Tudo bem. Fica em Ajustes › Tutorial.';

export const useOffer = create<{ offer: OfferView | null }>(() => ({ offer: null }));

/**
 * Ofertas já resolvidas nesta abertura do app: respondidas (enquanto a gravação chega) ou deixadas sem resposta
 * (a pessoa saiu da tela). Não voltam até o app abrir de novo.
 */
export const settledOffers = new Set<OfferKind>();

let seq = 0;

export function showOffer(kind: OfferKind, opts: { forced?: boolean } = {}): void {
  useOffer.setState({
    offer: {
      key: `offer-${kind}-${++seq}`,
      kind,
      text: QUESTIONS[kind],
      yes: kind === 'intro' ? 'Vamos' : 'Mostrar',
      no: 'Agora não',
      reply: null,
      forced: opts.forced ?? false,
    },
  });
  // a apresentação é o run 'intro' enquanto está na tela
  if (kind === 'intro') useTour.setState({ run: 'intro', step: 0, practice: false });
}

export function hideOffer(): void {
  const offer = useOffer.getState().offer;
  if (!offer) return;
  useOffer.setState({ offer: null });
  if (useTour.getState().run === 'intro') useTour.setState({ run: null, step: 0, practice: false });
}

/** Chave de teste: localStorage['pk-tour-auto'] = 'on' liga as ofertas mesmo com VITE_TOUR_AUTO=off (e2e). */
export const TOUR_AUTO_KEY = 'pk-tour-auto';

/** As ofertas sozinhas estão ligadas: sempre no app de verdade; nos testes, só com a chave. */
export function autoOffersOn(): boolean {
  if (tourAuto) return true;
  try {
    return localStorage.getItem(TOUR_AUTO_KEY) === 'on';
  } catch {
    return false;
  }
}

/** O capítulo oferecido ao abrir este caminho: a raiz de Progresso, Jornada e Ajustes, e a tela de um hábito. */
export function chapterAt(path: string): TutorialChapter | null {
  if (path === '/progresso') return 'progresso';
  if (path === '/jornada') return 'jornada';
  if (path === '/ajustes') return 'ajustes';
  if (/^\/(hoje|progresso)\/habito\/[^/]+$/.test(path)) return 'habito';
  if (/^\/ajustes\/habitos\/[^/]+$/.test(path) && path !== '/ajustes/habitos/novo') return 'habito';
  return null;
}

/**
 * O que oferecer aqui, pelo estado guardado (sem olhar a hora nem o que está aberto):
 * - a apresentação, no Hoje (sem outro dia nem folha), para uma conta com plano que o Zeno ainda não conheceu;
 * - um capítulo, depois da apresentação, se ele não foi visto nem oferecido.
 */
export function offerFor(input: {
  path: string;
  search: string;
  hasPlan: boolean;
  tutorial: Required<TutorialState>;
}): OfferKind | null {
  const { path, search, hasPlan, tutorial } = input;
  if (!hasPlan) return null;
  if (!tutorial.introAt) {
    return path === '/hoje' && !/[?&](dia|folha)=/.test(search) ? 'intro' : null;
  }
  const chapter = chapterAt(path);
  if (!chapter || tutorial.done[chapter] || tutorial.offered[chapter]) return null;
  if (/[?&]folha=/.test(search)) return null;
  return chapter;
}

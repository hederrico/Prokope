// O condutor do app (um só) e o gancho window.__pkTour, sempre ligado, como o window.__pkShell.
// A camada (TourLayer) liga o navigate do router, o Zeno e o modo exemplo de verdade ao montar.
import { markChapterDone, markIntro, markOffered } from '@/actions/tutorial';
import type { ExampleMode } from '@/data/example';
import { useDataStore } from '@/stores/data';
import type { TourRun } from '@/stores/tour';
import type { ZenoController } from '@/zeno';
import { createConductor, type TourState } from './conductor';
import { isShown, queryTarget, revealTarget, waitFor } from './dom';
import { SCRIPTS } from './scripts';
import { INTRO_LATER, hideOffer, settledOffers, showOffer, useOffer, type OfferKind } from './offerStore';

const done = () => Promise.resolve();

/** Antes de a camada montar (e nos testes): sem Zeno e sem exemplo, o tutorial segue só com o balão. */
const noZeno: ZenoController = {
  available: false,
  present: false,
  enter: done,
  leave: done,
  moveTo: done,
  lookAt: () => undefined,
  pointAt: done,
  rest: () => undefined,
  talk: () => undefined,
  wave: done,
  nod: done,
  hop: done,
  sit: done,
  stand: done,
  celebrate: done,
  showShell: done,
  anchor: () => null,
  onMove: () => () => undefined,
};
const noExample: ExampleMode = { active: false, enter: done, leave: done };

let zeno: ZenoController = noZeno;
let example: ExampleMode = noExample;

export const conductor = createConductor({
  scripts: SCRIPTS,
  navigate: () => undefined,
  zeno: () => zeno,
  example: () => example,
  habits: () => Object.values(useDataStore.getState().habits).filter((h) => !h.archived),
  find: (target, ctx) => {
    if (typeof target === 'string') return queryTarget(target);
    const el = target(ctx);
    return isShown(el) ? el : null;
  },
  reveal: revealTarget,
  waitFor,
  markDone: markChapterDone,
});

/** A camada troca o Zeno e o modo exemplo pelos de verdade (hooks), a cada renderização. */
export function bindLive(next: { zeno: ZenoController; example: ExampleMode }) {
  zeno = next.zeno;
  example = next.example;
}

/** Começa um capítulo, o Zeno no Começar ('comecar') ou a oferta de apresentação ('intro'). */
export function startTour(run: TourRun): boolean {
  hideOffer();
  if (run === 'intro') {
    conductor.stop();
    showOffer('intro', { forced: true });
    return true;
  }
  return conductor.start(run);
}

/** "Sair do tutorial": limpa o véu, desliga o practice, sai do exemplo, manda o Zeno embora e fecha a oferta. */
export function stopTour(): void {
  hideOffer();
  conductor.stop();
}

let replyTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * A resposta a uma oferta. As duas gravam: a apresentação grava introAt; um capítulo grava offered.
 * "Vamos" começa "O dia"; "Mostrar" começa o capítulo; o "Agora não" da apresentação responde e sai sozinho.
 */
export function answerOffer(yes: boolean): void {
  const offer = useOffer.getState().offer;
  if (!offer || offer.reply) return;
  const kind = offer.kind;
  settledOffers.add(kind);
  if (kind === 'intro') void markIntro();
  else void markOffered(kind);
  if (yes) {
    hideOffer();
    conductor.start(kind === 'intro' ? 'hoje' : kind);
    return;
  }
  if (kind !== 'intro') {
    hideOffer();
    return;
  }
  useOffer.setState({ offer: { ...offer, reply: INTRO_LATER } });
  clearTimeout(replyTimer);
  replyTimer = setTimeout(() => {
    if (useOffer.getState().offer?.key === offer.key) hideOffer();
  }, 2600);
}

export interface TourHookState extends TourState {
  /** a oferta na tela ('intro' ou o capítulo), ou null */
  offer: OfferKind | null;
  /** a oferta está mostrando a resposta ("Tudo bem. Fica em Ajustes › Tutorial.") */
  offerReply: string | null;
}

export interface TourHook {
  start(run: TourRun): boolean;
  stop(): void;
  readonly state: TourHookState;
}

declare global {
  interface Window {
    __pkTour?: TourHook;
  }
}

if (typeof window !== 'undefined') {
  window.__pkTour = {
    start: startTour,
    stop: stopTour,
    get state() {
      const offer = useOffer.getState().offer;
      return { ...conductor.state, offer: offer?.kind ?? null, offerReply: offer?.reply ?? null };
    },
  };
}

// O tutorial com o Zeno (docs/interacao/telas/tutorial.md): o condutor dos passos, a camada com o véu, o anel e o
// balão, as ofertas e os roteiros. As telas usam startTour e stopTour; a camada fica uma vez só no RootLayout.
export { TourLayer } from './TourLayer';
export { answerOffer, startTour, stopTour } from './tour';
export { TOUR_AUTO_KEY, autoOffersOn, chapterAt, offerFor } from './offerStore';
export type { StepWait, TourContext, TourScript, TourStep, ZenoMove } from './types';

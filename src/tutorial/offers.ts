// Quando o Zeno se oferece sozinho (tutorial.md › Ofertas). Nada é oferecido com as ofertas desligadas (testes), com
// "Mostrar o Zeno" desligado, com uma folha aberta ou com um tutorial rodando. A oferta espera a tela assentar
// (900 ms) e some sem gravar se a pessoa sair dali sem responder: volta numa próxima abertura do app.
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router';
import { useShellState } from '@/components/shell/shellState';
import { usePrefs, useProfile } from '@/data/hooks';
import { useSession } from '@/data/session';
import { tutorialOf, zenoShown } from '@/domain/tutorial';
import { useTour } from '@/stores/tour';
import { autoOffersOn, hideOffer, offerFor, settledOffers, showOffer, useOffer } from './offerStore';

const SETTLE_MS = 900;

export function useAutoOffers(): void {
  const { pathname, search } = useLocation();
  const session = useSession();
  const profile = useProfile();
  const prefs = usePrefs();
  const sheetOpen = useShellState((s) => s.sheetOpen);
  const run = useTour((s) => s.run);
  const offer = useOffer((s) => s.offer);

  const ready = session.status === 'ready' && !session.needsOnboarding && !!profile;
  const tutorial = useMemo(() => tutorialOf(profile), [profile]);
  const allowed = ready && autoOffersOn() && zenoShown(prefs);
  const kind = allowed ? offerFor({ path: pathname, search, hasPlan: !!profile?.planSetupAt, tutorial }) : null;

  // aparece depois de a tela assentar, se nada mais está rodando
  useEffect(() => {
    if (!kind || run || sheetOpen || offer || settledOffers.has(kind)) return;
    const id = window.setTimeout(() => {
      if (useTour.getState().run || useOffer.getState().offer || useShellState.getState().sheetOpen) return;
      showOffer(kind);
    }, SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [kind, run, sheetOpen, offer]);

  // saiu da tela sem responder, ou abriu uma folha: a oferta sai sem gravar
  useEffect(() => {
    if (!offer || offer.forced || offer.reply) return;
    if (offer.kind !== kind) {
      settledOffers.add(offer.kind);
      hideOffer();
    } else if (sheetOpen) hideOffer();
  }, [offer, kind, sheetOpen]);
}

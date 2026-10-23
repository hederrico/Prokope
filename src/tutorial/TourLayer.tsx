// A camada do tutorial, montada uma vez na raiz (RootLayout), por cima do app. Liga o condutor ao router, ao Zeno e
// ao modo exemplo, decide as ofertas, devolve o foco no fim e anuncia o texto do balão numa região viva educada.
// O desenho (o véu com o anel, z-index 60, e o balão, 80) fica em TourScene, que carrega sob demanda: o primeiro
// Hoje não espera por ele, e o CSS dos componentes chega depois das camadas do Tailwind, como nas telas.
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useShellState } from '@/components/shell/shellState';
import { useExample } from '@/data/example';
import { useTour } from '@/stores/tour';
import { useZeno } from '@/zeno';
import { useTourView } from './conductor';
import { queryTarget } from './dom';
import { useAutoOffers } from './offers';
import { useOffer } from './offerStore';
import { answerOffer, bindLive, conductor, stopTour } from './tour';
import type { BalloonModel } from './TourScene';
import './tutorial.css';

const TourScene = lazy(() => import('./TourScene'));

/** O elemento está dentro do balão (tocar nele não recolhe o balão do Começar). */
const inBalloon = (node: EventTarget | Element | null) =>
  node instanceof Element && !!node.closest('.tt-balloon-layer');

export function TourLayer() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const zeno = useZeno();
  const example = useExample();
  const view = useTourView();
  const offer = useOffer((s) => s.offer);
  const run = useTour((s) => s.run);
  const sheetOpen = useShellState((s) => s.sheetOpen);
  const firstOfRunRef = useRef(true);

  // o condutor fala com o router, o Zeno e o exemplo de verdade; o lugar chega antes dos efeitos das telas
  useLayoutEffect(() => {
    bindLive({ zeno, example });
  }, [zeno, example]);
  useLayoutEffect(() => {
    conductor.bind({ navigate: (to) => void navigate(to) });
  }, [navigate]);
  useLayoutEffect(() => {
    conductor.setPath(pathname);
  }, [pathname]);

  useAutoOffers();

  // o foco volta para quem estava com ele quando o tutorial começou
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (run) {
      if (!opener.current) {
        const a = document.activeElement;
        opener.current = a instanceof HTMLElement && a !== document.body ? a : null;
        firstOfRunRef.current = true;
      }
      return;
    }
    const back = opener.current;
    opener.current = null;
    const a = document.activeElement;
    const lost = !a || a === document.body || inBalloon(a);
    if (back && lost && back.isConnected && !back.closest('[aria-hidden="true"]')) back.focus({ preventScroll: true });
  }, [run]);

  // modo acompanhar (Começar): o balão se recolhe quando a pessoa usa a tela, abre uma folha ou o alvo some
  const follow = !!view.balloon?.follow && !view.collapsed;
  useEffect(() => {
    if (!follow) return;
    if (sheetOpen) {
      conductor.collapse();
      return;
    }
    const onDown = (e: Event) => {
      if (!inBalloon(e.target)) conductor.collapse();
    };
    window.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    return () => window.removeEventListener('pointerdown', onDown, { capture: true });
  }, [follow, sheetOpen]);

  // o alvo trocou de elemento (a tela desenhou de novo): acha de novo pelo que o roteiro escreveu
  const [refound, setRefound] = useState<{ from: Element; to: Element | null } | null>(null);
  const viewTarget = view.target;
  const spec = view.targetSpec;
  useEffect(() => {
    if (!viewTarget) return;
    const id = window.setInterval(() => {
      if (viewTarget.isConnected) return;
      const next = spec ? queryTarget(spec) : null;
      if (next) setRefound({ from: viewTarget, to: next });
      else if (useTourView.getState().balloon?.follow) conductor.collapse();
    }, 250);
    return () => window.clearInterval(id);
  }, [viewTarget, spec]);
  const target = viewTarget && refound?.from === viewTarget ? refound.to : viewTarget;

  // ---------- o que desenhar ----------
  const tourBalloon = view.balloon && !view.collapsed ? view.balloon : null;
  let model: BalloonModel | null = null;
  if (tourBalloon) {
    model = {
      key: tourBalloon.key,
      text: tourBalloon.text,
      counter: tourBalloon.counter,
      primary: tourBalloon.next ? { label: tourBalloon.next, onClick: () => conductor.next() } : null,
      secondary: null,
      onExit: tourBalloon.exit ? stopTour : null,
      focus: tourBalloon.focus && !tourBalloon.reply,
      place: tourBalloon.place,
      cover: tourBalloon.cover,
      prefer: 'below',
    };
  } else if (offer && !view.balloon) {
    model = {
      key: offer.key,
      text: offer.reply ?? offer.text,
      counter: null,
      primary: offer.reply ? null : { label: offer.yes, onClick: () => answerOffer(true) },
      secondary: offer.reply ? null : { label: offer.no, onClick: () => answerOffer(false) },
      onExit: null,
      focus: false,
      place: 'near',
      cover: null,
      prefer: 'above',
    };
  }
  const veil = !!run && run !== 'intro' && view.veil !== 'none';

  // o desenho carrega na primeira vez que algo aparece, e fica montado (para as saídas animarem)
  const [wanted, setWanted] = useState(false);
  if (!wanted && (veil || model)) setWanted(true);

  return (
    <>
      {wanted && (
        <Suspense fallback={null}>
          <TourScene
            view={view}
            target={view.balloon || veil ? target : null}
            veil={veil}
            model={model}
            zeno={zeno}
            firstOfRunRef={firstOfRunRef}
          />
        </Suspense>
      )}
      {/* o texto do balão é anunciado aqui (sempre montada, para o leitor de tela ouvir a primeira frase) */}
      <div className="tt-sr" aria-live="polite" aria-atomic="true">
        {model?.text ?? ''}
      </div>
    </>
  );
}

// A camada do tutorial, montada uma vez na raiz (RootLayout), por cima do app. Liga o condutor ao router, ao Zeno e
// ao modo exemplo, decide as ofertas (com o Zeno entrando antes do balão), devolve o foco no fim e anuncia o texto do
// balão numa região viva educada. Também decide quando o corpo do Zeno pega o toque e põe no balão a fala de quando
// tocam nele ("Opa, cochilei.").
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

/** Quanto a fala de quando tocam no Zeno ("Oi!", "Opa, cochilei.") fica no balão antes de o texto do passo voltar. */
const TAP_LINE_MS = 1800;

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

  // ---------- o Zeno nas ofertas ----------
  // a oferta espera o Zeno chegar ao canto de baixo e aparece ao lado dele (na apresentação, com o aceno); sem o
  // Zeno, aparece na hora. "Agora não" ou sair da tela sem responder: ele vai embora; "Vamos" e "Mostrar": ele fica
  const offerKey = offer?.key ?? null;
  const offerKind = offer?.kind ?? null;
  const [offerArrived, setOfferArrived] = useState<string | null>(null);
  useEffect(() => {
    if (!offerKey || !zeno.available) return;
    let live = true;
    void (async () => {
      await zeno.enter({ place: { corner: 'bottom' }, wave: false });
      if (!live) return;
      setOfferArrived(offerKey);
      if (offerKind === 'intro') await zeno.wave();
    })();
    return () => {
      live = false;
    };
  }, [offerKey, offerKind, zeno]);
  const offerReady = !!offer && (!zeno.available || offerArrived === offer.key);
  const offerText = offer ? (offer.reply ?? offer.text) : null;
  useEffect(() => {
    if (!offerReady || !offerText) return;
    zeno.talk(offerText);
    // a resposta ao "Agora não" da apresentação vem com um aceno de cabeça
    if (offer?.reply) void zeno.nod();
  }, [offerReady, offerText, offer?.reply, zeno]);
  const hadOffer = useRef(false);
  useEffect(() => {
    if (offer) {
      hadOffer.current = true;
      return;
    }
    if (!hadOffer.current) return;
    hadOffer.current = false;
    // sem capítulo começando ("Vamos" e "Mostrar" começam um com o Zeno em cena), ele vai embora
    if (!useTour.getState().run && zeno.present) void zeno.leave();
  }, [offer, zeno]);

  // o toque nele: a fala sugerida ("Oi!", "Opa, cochilei.") troca o texto do balão aberto por um instante
  const [tapLine, setTapLine] = useState<{ key: string; text: string } | null>(null);
  const balloonKey = useRef<string | null>(null);
  useEffect(() => {
    let timer: number | undefined;
    const off = zeno.onTap((tap) => {
      const line = tap.type === 'screen' ? null : tap.line;
      const key = balloonKey.current;
      if (!line || !key) return;
      setTapLine({ key, text: line });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTapLine(null), TAP_LINE_MS);
    });
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, [zeno]);

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
  } else if (offer && offerReady && !view.balloon) {
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
  if (model && tapLine?.key === model.key) model = { ...model, text: tapLine.text };
  const veil = !!run && run !== 'intro' && view.veil !== 'none';
  const shownKey = model?.key ?? null;
  useEffect(() => {
    balloonKey.current = shownKey;
  }, [shownKey]);

  // o corpo do Zeno pega o toque só quando nada de verdade fica por baixo dele: com o véu (passos de olhar e de fazer)
  // e no Começar com o balão aberto (ele fica ao lado do título). Com o balão recolhido, numa oferta, ou num passo sem
  // véu, o toque passa para a tela, e ele nunca segura o toque num controle
  const busy = !!run || !!offer;
  const touchable = veil || follow;
  useEffect(() => {
    if (!busy) return;
    zeno.touch?.(touchable);
    return () => zeno.touch?.(true);
  }, [busy, touchable, zeno]);

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

// O desenho do tutorial: o véu do passo (z-index 60), com o furo e o anel no alvo, e o balão (80). O Zeno fica entre
// os dois (70). Carrega sob demanda, na primeira vez que algo do tutorial aparece (TourLayer).
// Tudo é medido na tela a cada rolagem, giro, teclado ou mudança de tamanho, e o furo e o balão acompanham.
import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, animate, m, useIsPresent } from 'motion/react';
import { spring, tween } from '@/motion/tokens';
import { usePrefersReducedMotion } from '@/motion/reducedMotion';
import type { ZenoController } from '@/zeno';
import { zenoPx } from '@/zeno/place';
import { Balloon } from './Balloon';
import type { TourView } from './conductor';
import { coveredBottom, coveredTop, isShown, queryTarget, radiusOf, toBox } from './dom';
import {
  besideWidth,
  blockersAround,
  boxBottom,
  clampHole,
  holeFor,
  inflate,
  mixBox,
  placeBalloon,
  placeBeside,
  veilPath,
  zenoCorner,
  type BalloonPlacement,
  type Box,
} from './placement';

const BALLOON_MAX = 340;
/** abaixo disto, o balão não cabe ao lado do Zeno (texto de três palavras por linha) */
const BESIDE_MIN = 200;

export interface BalloonModel {
  key: string;
  text: string;
  counter: string | null;
  primary: { label: string; onClick: () => void } | null;
  secondary: { label: string; onClick: () => void } | null;
  onExit: (() => void) | null;
  /** o foco vai para o balão ao abrir */
  focus: boolean;
  /**
   * near: perto da âncora (a cabeça do Zeno, ou o alvo), do lado preferido; sem nenhum dos dois, encostado embaixo.
   * top e bottom: encostado em cima (sobre o título) ou embaixo, com a ponta apontando para o alvo. Com o Zeno em
   * cena (num canto), sempre ao lado da cabeça dele.
   */
  place: 'near' | 'top' | 'bottom';
  /** encostado em cima, cobre este elemento por inteiro (o título do passo) */
  cover: string | null;
  /** o lado preferido em volta da âncora */
  prefer: 'above' | 'below';
}

interface Scene {
  /** a coluna do app na tela (no computador, a coluna de 480 px no meio) */
  app: Box;
  /** onde o balão pode ficar */
  bounds: Box;
  /** o alvo e o raio do canto dele */
  target: Box | null;
  radius: number;
  /** a região em volta do alvo que o balão não cobre (o "around" do passo) */
  around: Box | null;
  /** o que o balão encostado em cima cobre por inteiro (o "cover" do Começar) */
  cover: Box | null;
  /** a cabeça do Zeno, quando ele está em cena */
  head: Box | null;
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

function sameScene(a: Scene, b: Scene): boolean {
  return (
    sameBox(a.app, b.app) &&
    sameBox(a.bounds, b.bounds) &&
    sameBox(a.target, b.target) &&
    sameBox(a.around, b.around) &&
    sameBox(a.cover, b.cover) &&
    sameBox(a.head, b.head) &&
    a.radius === b.radius
  );
}

function readSafe(probe: HTMLElement | null) {
  if (!probe) return { top: 0, right: 0, bottom: 0, left: 0 };
  const cs = getComputedStyle(probe);
  const px = (v: string) => Number.parseFloat(v) || 0;
  return { top: px(cs.paddingTop), right: px(cs.paddingRight), bottom: px(cs.paddingBottom), left: px(cs.paddingLeft) };
}

/**
 * Mede a cena enquanto algo do tutorial está na tela: em rajadas de quadros depois de rolar, girar, abrir o teclado,
 * o alvo mudar de tamanho ou o Zeno andar, e a cada 300 ms para o que muda sem aviso (uma linha que entra em cima).
 */
function useScene(
  on: boolean,
  target: Element | null,
  around: Element | null,
  cover: string | null,
  zeno: ZenoController,
  probe: RefObject<HTMLElement | null>,
): Scene | null {
  const [state, setState] = useState<{ target: Element | null; scene: Scene } | null>(null);
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let until = 0;
    const measure = () => {
      const el = probe.current;
      const appEl = el?.closest('.sh-app') ?? document.documentElement;
      const app = toBox(appEl.getBoundingClientRect());
      const safe = readSafe(el);
      const top = Math.max(app.top + safe.top, coveredTop()) + 8;
      const bottom = Math.min(app.top + app.height - safe.bottom, coveredBottom()) - 8;
      const left = app.left + Math.max(16, safe.left);
      const right = app.left + app.width - Math.max(16, safe.right);
      const bounds = { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
      const t = target && isShown(target) ? toBox(target.getBoundingClientRect()) : null;
      const r = t && around && isShown(around) ? toBox(around.getBoundingClientRect()) : null;
      const coverEl = cover ? queryTarget(cover) : null;
      const c = coverEl ? toBox(coverEl.getBoundingClientRect()) : null;
      const head = zeno.available && zeno.present ? zeno.anchor() : null;
      const next: Scene = {
        app,
        bounds,
        target: t,
        radius: target && t ? radiusOf(target) : 0,
        around: r,
        cover: c,
        head: head ? toBox(head) : null,
      };
      setState((prev) =>
        prev && prev.target === target && sameScene(prev.scene, next) ? prev : { target, scene: next },
      );
    };
    const loop = () => {
      measure();
      raf = performance.now() < until ? requestAnimationFrame(loop) : 0;
    };
    const burst = () => {
      until = performance.now() + 700;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    burst();
    const vv = window.visualViewport;
    window.addEventListener('scroll', burst, { capture: true, passive: true });
    window.addEventListener('resize', burst);
    window.addEventListener('orientationchange', burst);
    vv?.addEventListener('resize', burst);
    vv?.addEventListener('scroll', burst);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(burst) : null;
    if (target) ro?.observe(target);
    if (around) ro?.observe(around);
    const offMove = zeno.onMove(burst);
    const id = window.setInterval(measure, 300);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', burst, { capture: true });
      window.removeEventListener('resize', burst);
      window.removeEventListener('orientationchange', burst);
      vv?.removeEventListener('resize', burst);
      vv?.removeEventListener('scroll', burst);
      ro?.disconnect();
      offMove();
      window.clearInterval(id);
    };
  }, [on, target, around, cover, zeno, probe]);
  return on && state && state.target === target ? state.scene : null;
}

// ---------- o véu, o furo e o anel ----------

type Hole = Box & { radius: number };

/**
 * O furo desliza de um alvo para o outro com a mola calma; ao rolar, acompanha sem animar. Entre um passo e outro
 * (`keep`), ele fica onde estava; um passo sem alvo (o fim do capítulo) fecha o furo. Com movimento reduzido, troca
 * de lugar de uma vez.
 */
function useGlidingHole(hole: Hole | null, el: Element | null, reduced: boolean, keep: boolean): Hole | null {
  const [mem, setMem] = useState<{ el: Element | null; hole: Hole | null }>({ el, hole });
  const [glide, setGlide] = useState<{ from: Hole; seq: number } | null>(null);
  const [t, setT] = useState(1);
  if (hole && (mem.el !== el || !sameBox(mem.hole, hole) || mem.hole?.radius !== hole.radius)) {
    if (mem.el !== el && mem.hole && !reduced) {
      setGlide({ from: mem.hole, seq: (glide?.seq ?? 0) + 1 });
      setT(0);
    }
    setMem({ el, hole });
  }
  useEffect(() => {
    if (!glide) return;
    const a = animate(0, 1, { ...spring.calma, onUpdate: setT, onComplete: () => setGlide(null) });
    return () => a.stop();
  }, [glide]);
  const current = hole ?? (keep ? mem.hole : null);
  if (!current) return null;
  return glide && t < 1 ? mixBox(glide.from, current, t) : current;
}

function Veil({ view, target: el, scene }: { view: TourView; target: Element | null; scene: Scene }) {
  const reduced = usePrefersReducedMotion();
  const { app } = scene;
  const rel = scene.target
    ? { ...scene.target, left: scene.target.left - app.left, top: scene.target.top - app.top }
    : null;
  const area = { width: app.width, height: app.height };
  const target = rel ? clampHole(holeFor(rel, scene.radius), area) : null;
  // entre um passo e outro (sem balão), o furo espera o alvo novo; com o balão de um passo sem alvo, ele fecha
  const hole = useGlidingHole(target, el, reduced, !view.balloon);
  // passo de fazer: só o furo deixa o toque passar; passo de olhar (ou sem alvo): o véu segura todos os toques
  const blockers = view.veil === 'do' && target ? blockersAround(area, target) : [{ left: 0, top: 0, ...area }];
  return (
    <m.div
      className="tt-veil-layer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: tween.base }}
      exit={{ opacity: 0, transition: tween.exit }}
    >
      <svg className="tt-veil-svg" width={area.width} height={area.height} aria-hidden="true">
        <path className="tt-veil" d={veilPath(area, hole)} fillRule="evenodd" />
        <AnimatePresence>
          {target && hole && (
            <m.g
              key="ring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: tween.base }}
              exit={{ opacity: 0, transition: tween.exit }}
            >
              <rect
                className="tt-halo"
                x={hole.left}
                y={hole.top}
                width={hole.width}
                height={hole.height}
                rx={hole.radius}
              />
              <rect
                className="tt-ring"
                x={hole.left}
                y={hole.top}
                width={hole.width}
                height={hole.height}
                rx={hole.radius}
              />
            </m.g>
          )}
        </AnimatePresence>
      </svg>
      {blockers.map((b, i) => (
        <div
          key={i}
          className="tt-block"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
          aria-hidden="true"
        />
      ))}
    </m.div>
  );
}

// ---------- o balão ----------

function PositionedBalloon({
  model,
  scene,
  ringed,
  firstOfRunRef,
}: {
  model: BalloonModel;
  scene: Scene;
  /** o alvo tem o anel (com o véu): o balão guarda a folga do anel em volta dele */
  ringed: boolean;
  firstOfRunRef: RefObject<boolean>;
}) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  // o balão que sai (na troca de passo) não recebe toque nem foco, e sai da árvore do leitor de tela
  const present = useIsPresent();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  // com o Zeno em cena (num canto), o balão fica ao lado da cabeça dele, do lado de dentro da tela; se a tela for
  // estreita demais para os dois lado a lado, perto da cabeça, como sem o canto
  const head = scene.head;
  const besideW = head ? besideWidth(scene.bounds, head, scene.app, BALLOON_MAX) : 0;
  const beside = !!head && besideW >= BESIDE_MIN;
  const pinned = model.place !== 'near' && !head;
  // encostado, o balão ocupa a largura toda da área (sem fresta do título por trás)
  const width = beside ? besideW : pinned ? scene.bounds.width : Math.min(BALLOON_MAX, scene.bounds.width);
  // encostado em cima (sem o Zeno, ou ao lado dele no Começar), cobre o título do passo por inteiro, sem meia linha
  // aparecendo embaixo
  const coverTop = beside ? !!model.cover : pinned && model.place === 'top';
  const minHeight =
    coverTop && scene.cover ? Math.max(0, boxBottom(scene.cover) + 4 - scene.bounds.top) : 0;

  // a altura muda com o texto (a resposta) e com a letra maior: mede de novo
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const next = { width: el.offsetWidth, height: el.offsetHeight };
      setSize((prev) => (prev && prev.width === next.width && prev.height === next.height ? prev : next));
    };
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(read) : null;
    ro?.observe(el);
    const raf = requestAnimationFrame(read);
    return () => {
      ro?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // o foco vai para o balão ao abrir; nos passos seguintes, se ele estava no balão (ou se perdeu na troca).
  // Cada passo monta um balão novo (a chave é o passo), então isto roda uma vez por passo, já medido. Roda de novo
  // quando o balão volta depois de começar a sair (a tela trocou o elemento do alvo por um instante): enquanto saía,
  // ele ficou inert e o foco caiu no body
  const measured = !!size;
  const wantsFocus = model.focus;
  useEffect(() => {
    if (!wantsFocus || !measured || !present) return;
    const active = document.activeElement;
    const inLayer = !!active?.closest('.tt-balloon-layer');
    if (firstOfRunRef.current || !active || active === document.body || inLayer) {
      firstOfRunRef.current = false;
      ref.current?.focus({ preventScroll: true });
    }
  }, [wantsFocus, measured, present, firstOfRunRef]);

  let place: BalloonPlacement | null = null;
  if (size) {
    // o balão não cobre o alvo (com o anel) nem a região em volta dele
    const region = scene.around ?? scene.target;
    // com o anel, a folga dele (6 px e o halo); sem o anel (o Começar), só não encostar
    const avoid = region ? inflate(region, ringed ? 10 : 2) : null;
    const box = { width, height: size.height };
    if (beside && head) {
      // ao lado dele; se ali cobriria o alvo, encostado na borda de cima ou de baixo, longe do alvo
      place =
        placeBeside(
          { size: box, bounds: scene.bounds, head, height: zenoPx(scene.app.height), avoid, pinTop: !!model.cover },
          scene.app,
        ) ??
        placeBalloon({
          size: box,
          bounds: scene.bounds,
          anchor: null,
          avoid,
          dock: zenoCorner(head, scene.app).row === 'top' ? 'bottom' : 'top',
          pointTo: region,
        });
    } else {
      place = placeBalloon({
        size: box,
        bounds: scene.bounds,
        anchor: pinned ? null : (head ?? avoid),
        avoid,
        prefer: model.prefer,
        dock: model.place === 'top' ? 'top' : 'bottom',
        pointTo: pinned ? region : null,
      });
    }
  }
  const left = place ? place.left - scene.app.left : 0;
  const top = place ? place.top - scene.app.top : 0;
  return (
    <div
      className="tt-pos"
      style={{ transform: `translate3d(${left}px, ${top}px, 0)`, visibility: place ? 'visible' : 'hidden' }}
      data-leaving={present ? undefined : ''}
      inert={!present || undefined}
      aria-hidden={present ? undefined : true}
    >
      <Balloon
        ref={ref}
        id={id}
        text={model.text}
        counter={model.counter}
        primary={model.primary}
        secondary={model.secondary}
        onExit={model.onExit}
        tail={place?.tail ?? null}
        side={place?.side ?? 'below'}
        width={width}
        minHeight={minHeight}
      />
    </div>
  );
}

// ---------- a cena ----------

export interface TourSceneProps {
  view: TourView;
  /** o alvo de agora (achado de novo se a tela trocou o elemento) */
  target: Element | null;
  veil: boolean;
  model: BalloonModel | null;
  zeno: ZenoController;
  firstOfRunRef: RefObject<boolean>;
}

export default function TourScene({ view, target, veil, model, zeno, firstOfRunRef }: TourSceneProps) {
  const probe = useRef<HTMLDivElement>(null);
  const scene = useScene(veil || !!model, target, target ? view.around : null, model?.cover ?? null, zeno, probe);
  // no Começar com o Zeno, o balão cobre o título só do lado dele: um fundo da cor da tela cobre o resto do título
  // por baixo do Zeno, para nenhuma meia linha aparecer entre os dois
  const cover = model?.cover && scene?.cover && scene.head ? scene.cover : null;
  return (
    <>
      <AnimatePresence>
        {veil && scene && <Veil key="veil" view={view} target={target} scene={scene} />}
      </AnimatePresence>
      <AnimatePresence>
        {cover && scene && (
          <m.div
            key="cover"
            className="tt-cover"
            style={{
              left: cover.left - scene.app.left,
              top: cover.top - scene.app.top,
              width: cover.width,
              height: cover.height,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: tween.base }}
            exit={{ opacity: 0, transition: tween.exit }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <div className="tt-balloon-layer">
        {/* um balão por vez: o do passo novo entra depois de o anterior sair (micro) */}
        <AnimatePresence mode="wait">
          {model && scene && (
            <PositionedBalloon
              key={model.key}
              model={model}
              scene={scene}
              ringed={veil && !!target}
              firstOfRunRef={firstOfRunRef}
            />
          )}
        </AnimatePresence>
        <div ref={probe} className="tt-safe" aria-hidden="true" />
      </div>
    </>
  );
}

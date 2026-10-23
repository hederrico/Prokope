// A raiz do app: movimento (LazyMotion e MotionConfig), aparência, guarda da sessão, a camada de cima
// (as abas ou uma tela cheia, com a passagem certa), as folhas do ?folha=, o palco do Zeno e os toasts.
import { useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, type FeatureBundle } from 'motion/react';
import { useLocation, useNavigate, useNavigationType, useOutlet } from 'react-router';
import { useSession } from '@/data/session';
import { usePillars, useProfile } from '@/data/hooks';
import { useExample } from '@/data/example';
import { ExampleBanner } from '@/components/shell/ExampleBanner';
import { SheetHost } from '@/components/shell/SheetHost';
import { AppToaster } from '@/components/shell/toast';
import { ScreenLayer, TransitionContext, type TransitionInfo } from '@/components/shell/ScreenLayer';
import { RouteSteps } from '@/components/shell/RouteSteps';
import { setShellState, useShellState } from '@/components/shell/shellState';
import { rootTransition } from '@/components/shell/transitions';
import { usePreferences } from './preferences';
import { useApplyPreferences } from './theme';
import { guardRedirect, shouldRemember } from './guard';
import { lastNavigation, pathOf } from './history';
import { installDismissedRecently, isIOSSafariBrowser } from './platform';
import { findScreen, rootKey } from './screens';
import { Splash } from './Splash';
import { rememberPillars, splashAgain, splashDone } from './splashBridge';
import { WriteErrorToast } from './WriteErrorToast';
import { ZenoHost } from '@/zeno';

// para onde a pessoa queria ir antes de entrar (um link direto)
let pendingDestination: string | null = null;

/** Guarda as cores dos pilares ativos, na ordem, para a próxima abertura acender os pontos do caminho. */
function SplashMemory() {
  const colors = usePillars()
    .map((p) => p.pillar.color)
    .join(',');
  useEffect(() => {
    if (colors) rememberPillars(colors.split(',') as Parameters<typeof rememberPillars>[0]);
  }, [colors]);
  return null;
}

export function RootLayout() {
  useApplyPreferences();
  const session = useSession();
  // modo exemplo: a faixa no topo, e a abertura não guarda os pilares da história
  const example = useExample().active;
  // o app fechou no meio de "Apagar todos os dados": a guarda leva de volta para a tela de apagar, que retoma
  const deleting = useProfile()?.deleting === true;
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const animationsOff = usePreferences((s) => !s.animations);
  // Motion: animações e saídas desde a primeira pintura; layout e arrasto (domMax) chegam sob demanda
  const [features, setFeatures] = useState<FeatureBundle>(domAnimation);
  useEffect(() => {
    let alive = true;
    import('@/motion/features')
      .then((mod) => alive && setFeatures(mod.default))
      .catch(() => {
        /* sem o pedaço (sem internet no primeiro acesso): seguem as animações básicas */
      });
    return () => {
      alive = false;
    };
  }, []);
  const sheetOpen = useShellState((s) => s.sheetOpen);

  // ---------- guarda da sessão ----------
  const redirect = guardRedirect(location.pathname, {
    status: session.status,
    needsOnboarding: session.needsOnboarding,
    suggestInstall: isIOSSafariBrowser() && !installDismissedRecently(),
    pending: pendingDestination,
    deleting,
  });
  // a tela atual pode continuar na tela enquanto a guarda leva adiante (entrar, terminar o primeiro acesso);
  // uma tela que pede sessão não renderiza sem ela: fica a abertura até a guarda chegar
  const here = findScreen(location.pathname)?.def;
  const keepCurrent = !!redirect && session.status === 'ready' && (!!here?.auth || here?.kind === 'flow');
  const waiting = session.status === 'loading' || (!!redirect && !keepCurrent);

  useLayoutEffect(() => {
    // um link direto aberto sem sessão: guarda o destino para seguir até ele depois de entrar
    if (redirect && session.status === 'signedOut' && shouldRemember(location.pathname))
      pendingDestination = pathOf(location);
    if (!redirect && session.status === 'ready' && pendingDestination === pathOf(location)) pendingDestination = null;
    if (redirect && redirect !== pathOf(location)) void navigate(redirect, { replace: true });
  }, [redirect, location, navigate, session.status]);

  // ---------- a camada de cima ----------
  // depois de esperar (abertura, guarda), a tela pinta pronta, sem passagem
  const key = rootKey(location.pathname);
  const [current, setCurrent] = useState<{ key: string; path: string; info: TransitionInfo }>(() => ({
    key,
    path: location.pathname,
    info: { type: 'none', seq: 0 },
  }));
  let info = current.info;
  if (current.key !== key) {
    const type = waiting ? 'none' : rootTransition(current.path, location.pathname, lastNavigation());
    info = { type, seq: current.info.seq + 1, from: current.path };
    setCurrent({ key, path: location.pathname, info });
  } else if (current.path !== location.pathname || (waiting && info.type !== 'none')) {
    info = waiting ? { ...info, type: 'none' } : info;
    setCurrent({ key, path: location.pathname, info });
  }

  const tabs = key === 'tabs' && !waiting;
  useEffect(() => setShellState({ fullScreen: !waiting && key !== 'tabs' }), [key, waiting]);
  // a abertura do index.html sai quando a primeira tela pinta, e volta numa espera dentro do app
  useEffect(() => (waiting ? splashAgain() : splashDone()), [waiting]);

  return (
    <LazyMotion features={features}>
      <MotionConfig reducedMotion={animationsOff ? 'always' : 'user'}>
        <div className="sh-app" data-tabs={tabs || undefined} data-example={example || undefined}>
          <div className="sh-main" inert={sheetOpen || undefined}>
            {waiting ? (
              <Splash />
            ) : (
              <TransitionContext.Provider value={info}>
                {/* sem initial={false}: ele passaria a todas as animações de dentro das telas e bloquearia a entrada
                    do que aparece depois; a primeira camada já nasce parada pelo enter 'none' */}
                <AnimatePresence>
                  <ScreenLayer key={key} id={key} level="root" enter={info.type} scrollable={key !== 'tabs'}>
                    <RouteSteps location={location} navigationType={navigationType}>
                      {outlet}
                    </RouteSteps>
                  </ScreenLayer>
                </AnimatePresence>
              </TransitionContext.Provider>
            )}
          </div>
          <SheetHost />
          <div id="sh-overlays" className="sh-sheets" />
          <ZenoHost />
          <AppToaster />
          <WriteErrorToast />
          <ExampleBanner active={example} />
          {session.status === 'ready' && !example && <SplashMemory />}
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

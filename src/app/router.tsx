// O roteador (React Router, data router). Todas as telas carregam sob demanda (route.lazy): a navegação espera
// o arquivo chegar, e a passagem já começa com a tela nova pronta. As rotas vêm da tabela em screens.ts.
import { createBrowserRouter, Navigate, useNavigate, useRouteError, type RouteObject } from 'react-router';
import { TabsLayout } from '@/components/shell/TabsLayout';
import { recentLastPath } from '@/components/shell/navigation';
import { showToast, showUndo } from '@/components/shell/toast';
import { recordNavigation } from './history';
import { captureGesturesFlag, isStandalone } from './platform';
import { RootLayout } from './RootLayout';
import { SCREENS, type ScreenDef } from './screens';
import { Splash } from './Splash';

function lazyScreen(def: ScreenDef): RouteObject {
  return {
    path: def.path,
    handle: def,
    lazy: async () => ({ Component: (await def.load()).default }),
  };
}

/** "/" abre a última aba usada, se faz menos de 30 minutos; depois disso, o Hoje. */
function IndexRedirect() {
  return <Navigate to={recentLastPath() ?? '/hoje'} replace />;
}

function NotFound() {
  return <Navigate to="/hoje" replace />;
}

/** Erro ao carregar uma tela (sem internet no primeiro acesso a um pedaço do app, por exemplo). */
function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  console.error(error);
  return (
    <div className="sh-splash">
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center', padding: 24, textAlign: 'center' }}>
        <h1 className="ttl3" style={{ margin: 0 }}>
          Esta tela não carregou agora.
        </h1>
        <p className="lead" style={{ margin: 0 }}>
          Seus registros estão guardados. Tente de novo em instantes.
        </p>
        <button
          type="button"
          className="sh-nb-act"
          style={{ justifySelf: 'center' }}
          onClick={() => window.location.reload()}
        >
          Tentar de novo
        </button>
        <button
          type="button"
          className="sh-nb-left"
          style={{ justifySelf: 'center' }}
          onClick={() => void navigate('/hoje')}
        >
          Ir para o Hoje
        </button>
      </div>
    </div>
  );
}

const tabScreens = SCREENS.filter((s) => s.kind === 'tab' || s.kind === 'push');
const otherScreens = SCREENS.filter((s) => s.kind !== 'tab' && s.kind !== 'push');

export const routes: RouteObject[] = [
  {
    id: 'root',
    path: '/',
    Component: RootLayout,
    HydrateFallback: Splash,
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: IndexRedirect },
      { id: 'tabs', Component: TabsLayout, children: tabScreens.map(lazyScreen) },
      ...otherScreens.map(lazyScreen),
      { path: '*', Component: NotFound },
    ],
  },
];

// abrir pelo ícone da Tela de Início entra no Hoje (start_url): se a última aba foi usada há pouco, volta para ela
function initialRedirect() {
  if (typeof window === 'undefined') return;
  if (!isStandalone() || window.location.pathname !== '/hoje' || window.location.search) return;
  const last = recentLastPath();
  if (last && last !== '/hoje') window.history.replaceState(window.history.state, '', last);
}

captureGesturesFlag();
initialRedirect();

export const router = createBrowserRouter(routes);

recordNavigation(router.state.location, 'INIT');
router.subscribe((state) => recordNavigation(state.location, state.historyAction));

// testes automáticos (Playwright): um gancho para navegar e mostrar toasts sem depender do conteúdo das telas
if (typeof navigator !== 'undefined' && navigator.webdriver) {
  (window as unknown as { __pkShell: unknown }).__pkShell = { navigate: router.navigate, showUndo, showToast };
}

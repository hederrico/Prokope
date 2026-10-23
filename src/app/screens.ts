// Tabela das telas do app (docs/interacao/navegacao.md e o mapa do app): rota, tipo de passagem, aba, nome e o arquivo.
// O roteador (router.tsx) monta as rotas a partir daqui, e a casca usa a mesma tabela para escolher a passagem,
// o "Voltar" com o nome da tela anterior e a guarda da sessão.
import type { ComponentType } from 'react';
import { matchRoutes, type RouteObject } from 'react-router';

export type TabId = 'hoje' | 'progresso' | 'jornada' | 'ajustes';

/**
 * tab: raiz de uma aba · push: tela empurrada (fica com a barra de abas) · full: tela cheia ·
 * flow: tela cheia em passos (o último trecho da rota é o passo) · dev: só em desenvolvimento
 */
export type ScreenKind = 'tab' | 'push' | 'full' | 'flow' | 'dev';

export interface ScreenDef {
  path: string;
  kind: ScreenKind;
  /** aba da rota (tab e push) */
  tab?: TabId;
  /** nome curto da tela, usado no "Voltar" da tela seguinte */
  title?: string;
  /** entrada e conta (instalar, entrar, sem acesso): sem passagem ao pintar, troca suave ao sair */
  auth?: boolean;
  /** pode abrir sem sessão */
  open?: boolean;
  /** fluxo feito de rotas diferentes (kind 'flow'): a ordem do passo, para a casca fazer a passagem de passo
   *  entre elas (RouteSteps). Fluxos de uma rota só (/comecar/:passo) trocam o passo por dentro (StepTransition). */
  step?: number;
  load: () => Promise<{ default: ComponentType }>;
}

export const TABS: { id: TabId; path: string; label: string; icon: 'sun' | 'chart-line-up' | 'path' | 'gear-six' }[] = [
  { id: 'hoje', path: '/hoje', label: 'Hoje', icon: 'sun' },
  { id: 'progresso', path: '/progresso', label: 'Progresso', icon: 'chart-line-up' },
  { id: 'jornada', path: '/jornada', label: 'Jornada', icon: 'path' },
  { id: 'ajustes', path: '/ajustes', label: 'Ajustes', icon: 'gear-six' },
];

const habit = () => import('@/screens/habit/HabitScreen');
const pastReview = () => import('@/screens/journey/PastReviewScreen');
const pillarForm = () => import('@/screens/settings/PillarFormScreen');
const habitForm = () => import('@/screens/settings/HabitFormScreen');
const trainingPlan = () => import('@/screens/journey/RunPlanScreen');
const runScreen = () => import('@/screens/run/RunScreen');
const runDone = () => import('@/screens/run/RunDoneScreen');

export const SCREENS: ScreenDef[] = [
  // entrada
  {
    path: '/instalar',
    kind: 'full',
    auth: true,
    open: true,
    title: 'Instalar',
    load: () => import('@/screens/onboarding/InstallScreen'),
  },
  {
    path: '/entrar',
    kind: 'full',
    auth: true,
    open: true,
    title: 'Entrar',
    load: () => import('@/screens/onboarding/SignInScreen'),
  },
  {
    path: '/entrar/sem-acesso',
    kind: 'full',
    auth: true,
    title: 'Conta sem acesso',
    load: () => import('@/screens/onboarding/AccessDeniedScreen'),
  },
  {
    path: '/comecar/:passo',
    kind: 'flow',
    title: 'Começar',
    load: () => import('@/screens/onboarding/OnboardingScreen'),
  },
  {
    path: '/convite/:id',
    kind: 'full',
    open: true,
    title: 'Convite',
    load: () => import('@/screens/settings/InviteLinkScreen'),
  },

  // Hoje
  { path: '/hoje', kind: 'tab', tab: 'hoje', title: 'Hoje', load: () => import('@/screens/today/TodayScreen') },
  { path: '/hoje/habito/:id', kind: 'push', tab: 'hoje', title: 'Hábito', load: habit },

  // Progresso
  {
    path: '/progresso',
    kind: 'tab',
    tab: 'progresso',
    title: 'Progresso',
    load: () => import('@/screens/progress/ProgressScreen'),
  },
  { path: '/progresso/habito/:id', kind: 'push', tab: 'progresso', title: 'Hábito', load: habit },
  { path: '/progresso/revisoes/:semana', kind: 'push', tab: 'progresso', title: 'Revisão', load: pastReview },

  // Jornada
  {
    path: '/jornada',
    kind: 'tab',
    tab: 'jornada',
    title: 'Jornada',
    load: () => import('@/screens/journey/JourneyScreen'),
  },
  // o plano de cada treino guiado; a rota antiga da corrida leva ao primeiro
  { path: '/jornada/treino/:id', kind: 'push', tab: 'jornada', title: 'Treino', load: trainingPlan },
  { path: '/jornada/corrida', kind: 'push', tab: 'jornada', title: 'Treino', load: trainingPlan },
  {
    path: '/jornada/treino/:id/plano',
    kind: 'full',
    title: 'Plano',
    load: () => import('@/screens/journey/TrainingPlanEditScreen'),
  },
  {
    path: '/jornada/fases',
    kind: 'push',
    tab: 'jornada',
    title: 'Editar jornada',
    load: () => import('@/screens/journey/EditPhasesScreen'),
  },
  { path: '/jornada/revisoes/:semana', kind: 'push', tab: 'jornada', title: 'Revisão', load: pastReview },
  // o treino em andamento e o treino feito, de cada treino guiado; as rotas antigas são as do primeiro
  { path: '/treino/:habito/:semana/:treino', kind: 'full', title: 'Treino', load: runScreen },
  { path: '/treino/:habito/:semana/:treino/feito', kind: 'full', title: 'Treino feito', load: runDone },
  { path: '/corrida/:semana/:treino', kind: 'full', title: 'Treino', load: runScreen },
  { path: '/corrida/:semana/:treino/feito', kind: 'full', title: 'Treino feito', load: runDone },
  {
    path: '/revisao/:semana/fim',
    kind: 'full',
    title: 'Revisão',
    load: () => import('@/screens/review/StayWeekScreen'),
  },
  {
    path: '/revisao/:semana/:passo',
    kind: 'flow',
    title: 'Revisão',
    load: () => import('@/screens/review/ReviewScreen'),
  },
  { path: '/fase/:numero', kind: 'full', title: 'Fase', load: () => import('@/screens/review/PhaseUnlockedScreen') },

  // Ajustes
  {
    path: '/ajustes',
    kind: 'tab',
    tab: 'ajustes',
    title: 'Ajustes',
    load: () => import('@/screens/settings/SettingsScreen'),
  },
  {
    path: '/ajustes/pilares',
    kind: 'push',
    tab: 'ajustes',
    title: 'Pilares',
    load: () => import('@/screens/settings/PillarsScreen'),
  },
  { path: '/ajustes/pilares/novo', kind: 'full', title: 'Novo pilar', load: pillarForm },
  {
    path: '/ajustes/pilares/:id',
    kind: 'push',
    tab: 'ajustes',
    title: 'Pilar',
    load: () => import('@/screens/settings/PillarScreen'),
  },
  { path: '/ajustes/pilares/:id/editar', kind: 'full', title: 'Editar pilar', load: pillarForm },
  {
    path: '/ajustes/habitos',
    kind: 'push',
    tab: 'ajustes',
    title: 'Hábitos',
    load: () => import('@/screens/settings/HabitsScreen'),
  },
  // Novo hábito: tipo e detalhes são passos da mesma camada (o passo desliza, a barra fica)
  {
    path: '/ajustes/habitos/novo/tipo',
    kind: 'flow',
    step: 1,
    title: 'Novo hábito',
    load: () => import('@/screens/settings/NewHabitTypeScreen'),
  },
  { path: '/ajustes/habitos/novo/detalhes', kind: 'flow', step: 2, title: 'Novo hábito', load: habitForm },
  { path: '/ajustes/habitos/:id', kind: 'push', tab: 'ajustes', title: 'Hábito', load: habit },
  { path: '/ajustes/habitos/:id/editar', kind: 'full', title: 'Editar hábito', load: habitForm },
  {
    path: '/ajustes/horarios',
    kind: 'push',
    tab: 'ajustes',
    title: 'Horários',
    load: () => import('@/screens/settings/ScheduleScreen'),
  },
  {
    path: '/ajustes/lembretes',
    kind: 'push',
    tab: 'ajustes',
    title: 'Lembretes',
    load: () => import('@/screens/settings/RemindersScreen'),
  },
  {
    path: '/ajustes/aparencia',
    kind: 'push',
    tab: 'ajustes',
    title: 'Aparência',
    load: () => import('@/screens/settings/AppearanceScreen'),
  },
  {
    path: '/ajustes/tutorial',
    kind: 'push',
    tab: 'ajustes',
    title: 'Tutorial',
    load: () => import('@/screens/settings/TutorialScreen'),
  },
  {
    path: '/ajustes/pausar',
    kind: 'push',
    tab: 'ajustes',
    title: 'Pausar',
    load: () => import('@/screens/settings/PauseScreen'),
  },
  {
    path: '/ajustes/a-dois',
    kind: 'push',
    tab: 'ajustes',
    title: 'A dois',
    load: () => import('@/screens/settings/TogetherScreen'),
  },
  {
    path: '/ajustes/dados',
    kind: 'push',
    tab: 'ajustes',
    title: 'Dados e conta',
    load: () => import('@/screens/settings/DataScreen'),
  },
  {
    path: '/ajustes/dados/apagar',
    kind: 'push',
    tab: 'ajustes',
    title: 'Apagar dados',
    load: () => import('@/screens/settings/DeleteDataScreen'),
  },
];

// só em desenvolvimento (o Vite tira este pedaço do build de produção)
if (import.meta.env.DEV) {
  SCREENS.push({
    path: '/dev/componentes',
    kind: 'dev',
    open: true,
    title: 'Componentes',
    load: () => import('@/screens/dev/ComponentGallery'),
  });
}
// o laboratório do Zeno no app: também no build dos testes (--mode e2e), que é onde rodam os e2e e as capturas;
// nunca no build de produção
if (import.meta.env.DEV || import.meta.env.MODE === 'e2e') {
  SCREENS.push({
    path: '/dev/zeno',
    kind: 'dev',
    open: true,
    title: 'Zeno',
    load: () => import('@/screens/dev/ZenoLab'),
  });
}

const MATCHER: RouteObject[] = SCREENS.map((s) => ({ path: s.path, handle: s }));

export interface ScreenMatch {
  def: ScreenDef;
  params: Record<string, string | undefined>;
  pathname: string;
}

/** A tela de um caminho (sem a busca), ou null se nenhuma rota casa. */
export function findScreen(pathname: string): ScreenMatch | null {
  const m = matchRoutes(MATCHER, pathname);
  const last = m?.[m.length - 1];
  if (!last) return null;
  return { def: last.route.handle as ScreenDef, params: last.params, pathname: last.pathname };
}

/** A aba de um caminho: o primeiro trecho da rota diz qual aba está ativa. */
export function tabOf(pathname: string): TabId | null {
  const def = findScreen(pathname)?.def;
  return def?.tab ?? null;
}

export function tabRoot(tab: TabId): string {
  return `/${tab}`;
}

/** A tela de cima: corta trechos do fim até achar uma tela da mesma aba (deep link sem pilha). */
export function parentPath(pathname: string): string | null {
  const tab = tabOf(pathname);
  const parts = pathname.split('/').filter(Boolean);
  while (parts.length > 1) {
    parts.pop();
    const candidate = '/' + parts.join('/');
    const def = findScreen(candidate)?.def;
    if (def && (def.kind === 'tab' || def.kind === 'push') && (!tab || def.tab === tab)) return candidate;
  }
  return tab ? tabRoot(tab) : null;
}

/** Chave da camada de cima: todas as abas dividem uma camada; cada tela cheia tem a sua; um fluxo em passos
 *  mantém a mesma camada entre os passos (a tela troca o conteúdo com StepTransition, e o StepTop fica). */
export function rootKey(pathname: string): string {
  const def = findScreen(pathname)?.def;
  if (!def) return pathname;
  if (def.kind === 'tab' || def.kind === 'push') return 'tabs';
  if (def.kind === 'flow') return pathname.replace(/\/[^/]+\/?$/, '');
  return pathname;
}

/** Profundidade de um caminho, para saber se a navegação empurra ou volta. */
export function depthOf(pathname: string): number {
  return pathname.split('/').filter(Boolean).length;
}

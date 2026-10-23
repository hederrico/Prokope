// Navegação da casca: a pilha de cada aba (o último caminho e o nome de cada tela), o "Voltar",
// abrir e fechar folhas e as rotas espelho (navegacao.md › Rotas e O que fica guardado).
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { currentEntry, previousEntry } from '@/app/history';
import { findScreen, parentPath, tabOf, tabRoot, TABS, type TabId } from '@/app/screens';
import { SHEET_PARAM, withSheet, withoutSheet } from '@/app/sheets';
import { useDataStore } from '@/stores/data';

// ---------- pilhas das abas ----------

interface Entry {
  pathname: string;
  /** caminho com a busca, sem a folha */
  path: string;
}

const stacks: Record<TabId, Entry[]> = { hoje: [], progresso: [], jornada: [], ajustes: [] };
const titles = new Map<string, string>();
const LAST_KEY = 'pk-last';
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version++;
  for (const l of listeners) l();
}

/** Atualiza a pilha da aba com o lugar novo. Idempotente: chamar duas vezes com o mesmo lugar não muda nada. */
export function syncTabStack(
  pathname: string,
  search: string,
  kind: 'push' | 'pop' | 'tab' | 'replace' | 'none',
): void {
  const tab = tabOf(pathname);
  if (!tab) return;
  const entry: Entry = { pathname, path: pathname + withoutSheet(search) };
  const stack = stacks[tab];
  const i = stack.findIndex((e) => e.pathname === pathname);
  if (i >= 0) {
    stack.length = i + 1;
    stack[i] = entry;
  } else {
    const top = stack[stack.length - 1];
    const parent = parentPath(pathname);
    if (top && (kind === 'push' || top.pathname === parent)) stack.push(entry);
    else if (top && kind === 'replace') stack[stack.length - 1] = entry;
    else stacks[tab] = parent && parent !== pathname ? [{ pathname: parent, path: parent }, entry] : [entry];
  }
  // no modo exemplo, o último caminho fica o de antes: abrir pelo ícone não cai numa tela da história de exemplo
  if (!useDataStore.getState().example) {
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify({ path: entry.path, at: Date.now() }));
    } catch {
      /* sem armazenamento */
    }
  }
  // sem notify(): roda durante a renderização da casca, e a tela nova já lê a pilha atualizada
}

// Modo exemplo: as pilhas guardam caminhos com ids da história de exemplo. Na volta, cada aba recupera a pilha de
// antes do exemplo, e tocar na aba não abre um hábito que não existe nos dados da pessoa.
let beforeExample: Record<TabId, Entry[]> | null = null;
useDataStore.subscribe((s, prev) => {
  if (s.example === prev.example) return;
  if (s.example) {
    beforeExample = {
      hoje: [...stacks.hoje],
      progresso: [...stacks.progresso],
      jornada: [...stacks.jornada],
      ajustes: [...stacks.ajustes],
    };
    return;
  }
  if (!beforeExample) return;
  Object.assign(stacks, beforeExample);
  beforeExample = null;
  notify();
});

/** O último caminho da aba (para onde a aba volta ao ser tocada). */
export function lastPathOf(tab: TabId): string {
  const s = stacks[tab];
  return s.length ? s[s.length - 1].path : tabRoot(tab);
}

/** Leva a aba de volta à raiz (tocar na aba ativa). */
export function resetTabStack(tab: TabId): void {
  stacks[tab] = [];
  notify();
}

/** A última aba usada, se faz menos de 30 minutos (abrir pelo ícone da Tela de Início). */
export function recentLastPath(maxAgeMs = 30 * 60 * 1000): string | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof path !== 'string' || typeof at !== 'number' || Date.now() - at > maxAgeMs) return null;
    return tabOf(path.split('?')[0]) ? path : null;
  } catch {
    return null;
  }
}

export interface BackTarget {
  /** caminho para onde o Voltar leva */
  path: string;
  /** nome da tela anterior ("Hoje", "Pilares", o nome do pilar...) */
  label: string;
  /** a tela anterior foi aberta nesta sessão (a casca guardou o desenho dela, e o arrasto da borda pode mostrá-la) */
  inStack: boolean;
}

function titleFor(pathname: string): string {
  return titles.get(pathname) ?? findScreen(pathname)?.def.title ?? 'Voltar';
}

/** Para onde o Voltar leva a partir de um caminho de aba. */
export function backTargetFor(pathname: string): BackTarget | null {
  const tab = tabOf(pathname);
  if (!tab) return null;
  const stack = stacks[tab];
  const i = stack.findIndex((e) => e.pathname === pathname);
  if (i > 0) {
    const prev = stack[i - 1];
    return { path: prev.path, label: titleFor(prev.pathname), inStack: true };
  }
  const parent = parentPath(pathname);
  if (!parent || parent === pathname) return null;
  return { path: parent, label: titleFor(parent), inStack: false };
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Para onde o Voltar da tela atual leva (atualiza quando a pilha muda). */
export function useBackTarget(): BackTarget | null {
  const { pathname } = useLocation();
  useSyncExternalStore(subscribe, () => version);
  return backTargetFor(pathname);
}

/** Dá à tela atual um nome para o Voltar da próxima ("‹ Mente" no hábito aberto pelo pilar Mente). */
export function useScreenTitle(title: string | undefined): void {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!title) return;
    titles.set(pathname, title);
    notify();
  }, [pathname, title]);
}

// ---------- voltar ----------

export interface NavState {
  /** força a passagem: 'push', 'pop' ou 'none' */
  transition?: 'push' | 'pop' | 'none';
  /** a busca antes de abrir a folha (fechar volta para ela) */
  sheetBase?: string;
}

/**
 * Voltar: usa o voltar do navegador quando a entrada anterior é o destino (o voltar do navegador e o do app
 * ficam iguais); senão troca a entrada atual pelo destino, com a passagem de voltar.
 * Numa tela de aba, o destino é a tela anterior da pilha (ou a de cima, num link direto).
 * Numa tela cheia, é a entrada anterior do histórico, ou `fallback` (padrão: a última tela do Hoje).
 */
export function useGoBack(): (fallback?: string) => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (fallback?: string) => {
      const prev = previousEntry();
      const tab = tabOf(location.pathname);
      const state: NavState = { transition: 'pop' };
      if (tab) {
        const target = fallback ?? backTargetFor(location.pathname)?.path ?? tabRoot(tab);
        if (prev === target) navigate(-1);
        else void navigate(target, { replace: true, state });
        return;
      }
      if (prev !== undefined && (fallback === undefined || prev === fallback)) navigate(-1);
      else void navigate(fallback ?? lastPathOf('hoje'), { replace: true, state });
    },
    [navigate, location.pathname],
  );
}

// ---------- folhas ----------

/** Abre e fecha folhas pela URL (?folha=...). Abrir cria uma entrada no histórico; fechar volta. */
export function useSheetNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const open = useCallback(
    (name: string, args?: Record<string, string | number | undefined>, options: { replace?: boolean } = {}) => {
      const base = withoutSheet(location.search);
      const state: NavState = { sheetBase: base };
      void navigate(
        { pathname: location.pathname, search: withSheet(location.search, name, args) },
        { state, replace: options.replace },
      );
    },
    [navigate, location.pathname, location.search],
  );

  const close = useCallback(() => {
    if (!new URLSearchParams(location.search).has(SHEET_PARAM)) return;
    const base = (location.state as NavState | null)?.sheetBase;
    const target = location.pathname + (base ?? withoutSheet(location.search));
    if (previousEntry() === target && currentEntry() === location.pathname + location.search) navigate(-1);
    else void navigate(target, { replace: true });
  }, [navigate, location]);

  return { open, close };
}

/** Abre uma folha: const openSheet = useOpenSheet(); openSheet('agua') ou openSheet('menu', { habito: id }). */
export function useOpenSheet() {
  return useSheetNavigation().open;
}

// ---------- abas e rotas espelho ----------

/** A aba da tela atual (null numa tela cheia). */
export function useCurrentTab(): TabId | null {
  return tabOf(useLocation().pathname);
}

/** Hábito aberto dentro da aba atual: /hoje/habito/:id, /progresso/habito/:id ou /ajustes/habitos/:id. */
export function habitPath(id: string, from: TabId | null = 'hoje'): string {
  if (from === 'progresso') return `/progresso/habito/${encodeURIComponent(id)}`;
  if (from === 'ajustes') return `/ajustes/habitos/${encodeURIComponent(id)}`;
  return `/hoje/habito/${encodeURIComponent(id)}`;
}

/** Revisão passada dentro da aba atual: /progresso/revisoes/:semana ou /jornada/revisoes/:semana. */
export function pastReviewPath(week: string, from: TabId | null = 'jornada'): string {
  return from === 'progresso'
    ? `/progresso/revisoes/${encodeURIComponent(week)}`
    : `/jornada/revisoes/${encodeURIComponent(week)}`;
}

/** Os caminhos das rotas espelho na aba atual: const paths = useMirrorPaths(); <Link to={paths.habit(id)}>. */
export function useMirrorPaths() {
  const tab = useCurrentTab();
  return {
    habit: (id: string) => habitPath(id, tab),
    pastReview: (week: string) => pastReviewPath(week, tab),
  };
}

/** Passo de um fluxo em tela cheia (/comecar/:passo, /revisao/:semana/:passo): trocar de passo troca a entrada
 *  do histórico (replace), para o voltar do navegador sair do fluxo inteiro. */
export function useFlowStep() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const last = pathname.split('/').filter(Boolean).pop() ?? '';
  const step = Number.parseInt(last, 10);
  const goTo = (next: number | string) => {
    const base = pathname.replace(/\/[^/]+\/?$/, '');
    void navigate(`${base}/${next}${search}`, { replace: true });
  };
  return { step: Number.isFinite(step) ? step : 1, goTo };
}

export { TABS };

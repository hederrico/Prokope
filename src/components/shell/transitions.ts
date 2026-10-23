// Qual passagem usar entre duas telas (navegacao.md › Quatro tipos de passagem e Animação de cada passagem).
// Funções puras, testadas em transitions.test.ts.
import type { NavigationRecord } from '@/app/history';
import { depthOf, findScreen, rootKey, tabOf } from '@/app/screens';
import type { TransitionType } from './types';

type Nav = Pick<NavigationRecord, 'action' | 'delta' | 'state'>;

function forced(nav: Nav): 'push' | 'pop' | 'none' | undefined {
  const t = (nav.state as { transition?: unknown } | null)?.transition;
  return t === 'push' || t === 'pop' || t === 'none' ? t : undefined;
}

function isBack(nav: Nav): boolean {
  if (nav.action === 'POP') return nav.delta < 0;
  return forced(nav) === 'pop';
}

/** Entre duas telas das abas: outra aba troca a opacidade; na mesma aba, empurra ou volta. */
export function tabTransition(prevPath: string, nextPath: string, nav: Nav): TransitionType {
  if (tabOf(prevPath) !== tabOf(nextPath)) return 'tab';
  const f = forced(nav);
  if (f) return f;
  if (nav.action === 'POP') return nav.delta < 0 ? 'pop' : 'push';
  return depthOf(nextPath) < depthOf(prevPath) ? 'pop' : 'push';
}

/** Entre duas camadas de cima (as abas, uma tela cheia, a entrada). */
export function rootTransition(prevPath: string, nextPath: string, nav: Nav): TransitionType {
  const prev = findScreen(prevPath)?.def;
  const next = findScreen(nextPath)?.def;
  const nextTabs = rootKey(nextPath) === 'tabs';
  const prevTabs = rootKey(prevPath) === 'tabs';
  const fromEntry = !!prev?.auth || (prev?.kind === 'flow' && prevPath.startsWith('/comecar/'));
  // a tela pediu a troca seca (Corrida → Treino feito, Revisão → Fase desbloqueada: a tela nova tem a própria entrada)
  if (forced(nav) === 'none') return 'none';
  // conta sem acesso: troca de opacidade em base, sem deslocamento
  if (next?.path === '/entrar/sem-acesso') return 'fadeBase';
  // entrar no app (do Entrar ou do fim do primeiro acesso): a aba aparece com uma troca suave em micro
  if (nextTabs && fromEntry) return 'fade';
  if (nextTabs) return prevTabs ? 'none' : 'closeFull';
  if (prevTabs) return 'openFull';
  return isBack(nav) ? 'closeFull' : 'openFull';
}

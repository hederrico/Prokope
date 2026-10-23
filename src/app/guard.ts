// Guarda pela sessão: para onde cada estado da sessão leva (navegacao.md, telas/entrada.md, telas/estados.md).
// Função pura, testada em guard.test.ts. A casca aplica o resultado com navigate(..., { replace: true }).
import { findScreen } from './screens';

export interface GuardInput {
  status: 'loading' | 'signedOut' | 'denied' | 'ready';
  needsOnboarding: boolean;
  /** no Safari do iPhone fora da Tela de Início, sem "Agora não" nos últimos 7 dias */
  suggestInstall: boolean;
  /** para onde a pessoa queria ir antes de entrar (um link direto) */
  pending?: string | null;
}

const AUTH = new Set(['/instalar', '/entrar', '/entrar/sem-acesso']);

/** O caminho para onde a guarda manda, ou null quando a pessoa pode ficar onde está. */
export function guardRedirect(pathname: string, s: GuardInput): string | null {
  if (s.status === 'loading') return null;
  const def = findScreen(pathname)?.def;
  if (def?.kind === 'dev') return null;
  const isAuth = AUTH.has(pathname);
  const isOnboarding = pathname.startsWith('/comecar/');

  switch (s.status) {
    case 'signedOut':
      if (pathname === '/entrar' || pathname === '/instalar') return null;
      if (def?.open) return null; // convite pelo link: a tela pede o login
      return s.suggestInstall ? '/instalar' : '/entrar';
    case 'denied':
      return pathname === '/entrar/sem-acesso' ? null : '/entrar/sem-acesso';
    case 'ready':
      if (s.needsOnboarding) return isOnboarding ? null : '/comecar/1';
      if (isAuth || isOnboarding) return s.pending && !AUTH.has(s.pending.split('?')[0]) ? s.pending : '/hoje';
      return null;
  }
}

/** Guarda o destino de um link direto aberto sem sessão, para seguir até ele depois de entrar. */
export function shouldRemember(pathname: string): boolean {
  const def = findScreen(pathname)?.def;
  return !!def && !def.auth && def.kind !== 'flow' && pathname !== '/';
}

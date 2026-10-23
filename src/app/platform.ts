// Onde o app está rodando: instalado na Tela de Início, no Safari do iPhone, com os gestos ligados.
// Instalar no iPhone (telas/estados.md): iPhone ou iPad pelo userAgent (ou MacIntel com toque), sem CriOS, FxiOS e EdgiOS.

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true || (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches)
  );
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** O Safari do iPhone ou do iPad, fora da Tela de Início. */
export function isIOSSafariBrowser(): boolean {
  if (!isIOS() || isStandalone()) return false;
  return !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
}

const INSTALL_DISMISSED = 'pk-install-dismissed';

/** "Agora não" foi tocado nos últimos 7 dias. A tela de instalar grava a data com markInstallDismissed(). */
export function installDismissedRecently(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(INSTALL_DISMISSED));
    return Number.isFinite(at) && at > 0 && now - at < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function markInstallDismissed(): void {
  try {
    localStorage.setItem(INSTALL_DISMISSED, String(Date.now()));
  } catch {
    /* sem armazenamento */
  }
}

const GESTURES = 'pk-gestos';

/** Guarda o ?gestos=1 da URL (para testar o arrasto da borda fora do app instalado) e tira o parâmetro da barra. */
export function captureGesturesFlag(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const flag = url.searchParams.get('gestos');
  if (flag === null) return;
  try {
    if (flag === '0') sessionStorage.removeItem(GESTURES);
    else sessionStorage.setItem(GESTURES, '1');
  } catch {
    /* sem armazenamento */
  }
  url.searchParams.delete('gestos');
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

/** O arrasto da borda esquerda volta: no app instalado (no Safari comum o navegador já tem o gesto),
 *  no modo de desenvolvimento e com ?gestos=1. */
export function edgeSwipeEnabled(): boolean {
  if (isStandalone() || import.meta.env.DEV) return true;
  try {
    return sessionStorage.getItem(GESTURES) === '1';
  } catch {
    return false;
  }
}

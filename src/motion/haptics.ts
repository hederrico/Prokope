// Vibração bônus (movimento.md › Vibração e som). O Safari não tem API de vibração: no iOS 18 ou mais novo,
// alternar por código um <input type="checkbox" switch> escondido gera um toque leve do motor de vibração.
// Usada só nos níveis 1, 2 e 4 da escada de celebração. Se o truque parar de funcionar, nada quebra.

let label: HTMLLabelElement | null = null;
let last = 0;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function ensureSwitch(): HTMLLabelElement | null {
  if (label?.isConnected) return label;
  if (typeof document === 'undefined' || !document.body) return null;
  const l = document.createElement('label');
  l.setAttribute('aria-hidden', 'true');
  l.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  l.appendChild(input);
  document.body.appendChild(l);
  label = l;
  return l;
}

/** Um toque leve de vibração, quando o aparelho deixa. Chame dentro do gesto (toque) da pessoa. */
export function haptic(): void {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - last < 60) return;
  last = now;
  try {
    if (isIOS()) {
      ensureSwitch()?.click();
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(8);
  } catch {
    /* sem vibração: tudo segue igual */
  }
}

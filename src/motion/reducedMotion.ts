// Movimento reduzido: o iPhone pede (prefers-reduced-motion) ou a pessoa desligou "Animações" em Aparência.
// O interruptor do app só reduz; ele não liga o movimento se o iPhone pediu para reduzir (movimento.md).
import { useSyncExternalStore } from 'react';
import { getPreferences, usePreferences } from '@/app/preferences';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof matchMedia !== 'function') return () => {};
  const mq = matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/** O sistema pede menos movimento. */
export function systemPrefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia(QUERY).matches;
}

/** Só a preferência do sistema, como hook. */
export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, systemPrefersReducedMotion, () => false);
}

/** true quando o movimento deve ser reduzido: pelo sistema ou pelo interruptor "Animações". */
export function usePrefersReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  const animations = usePreferences((s) => s.animations);
  return system || !animations;
}

/** A mesma pergunta fora do React (gestos, animações imperativas). */
export function prefersReducedMotion(): boolean {
  return systemPrefersReducedMotion() || !getPreferences().animations;
}

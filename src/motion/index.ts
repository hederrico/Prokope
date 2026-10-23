// Movimento e feedback: tokens, variantes, movimento reduzido, vibração, som e a volta para a frente.
export * from './tokens';
export { fadeOut, fadeUpPresence, useCascadeOnce, useFadeUpOnce, useFirstMount } from './variants';
export {
  prefersReducedMotion,
  systemPrefersReducedMotion,
  usePrefersReducedMotion,
  useSystemReducedMotion,
} from './reducedMotion';
export { haptic } from './haptics';
export { playChime, playSoftTick, unlockAudio } from './sound';
export { onForeground, useForeground } from './useForeground';

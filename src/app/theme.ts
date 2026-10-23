// Aplica a aparência: data-theme (Sistema, Claro, Escuro) e data-motion="off" no <html>, e a cor da barra do
// navegador e do app instalado (meta theme-color, o --bg de cada tema). O index.html faz o mesmo antes da primeira pintura.
import { useLayoutEffect } from 'react';
import { usePreferences, type ThemePreference } from './preferences';

/** --bg do claro e do escuro, convertidos de OKLCH (os mesmos do index.html). */
export const THEME_COLORS = { light: '#fbf9f6', dark: '#110f0d' } as const;

export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const media = meta.getAttribute('media') ?? '';
    const forScheme = media.includes('dark') ? 'dark' : 'light';
    meta.content = THEME_COLORS[theme === 'system' ? forScheme : theme];
  }
  const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (scheme) scheme.content = theme === 'system' ? 'light dark' : theme;
}

export function applyMotion(animations: boolean): void {
  const root = document.documentElement;
  if (animations) root.removeAttribute('data-motion');
  else root.setAttribute('data-motion', 'off');
}

/** Mantém o <html> igual às preferências. */
export function useApplyPreferences(): void {
  const theme = usePreferences((s) => s.theme);
  const animations = usePreferences((s) => s.animations);
  useLayoutEffect(() => applyTheme(theme), [theme]);
  useLayoutEffect(() => applyMotion(animations), [animations]);
}

// Preferências de aparência do aparelho: tema, animações e som (Ajustes › Aparência).
// O perfil no Firestore é a fonte (comunicacao.md › Estado de interface); aqui fica a cópia local, que pinta a primeira
// tela no tema certo antes de os dados chegarem. O index.html lê as mesmas chaves antes da primeira pintura.
// Quem carregar o perfil chama setPreferences({...}) com os valores de lá; a tela de Aparência chama o mesmo ao mudar.
import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Preferences {
  /** Sistema, Claro ou Escuro */
  theme: ThemePreference;
  /** "Animações" ligado. Desligado reduz o movimento (data-motion="off" e MotionConfig "always") */
  animations: boolean;
  /** "Som suave ao marcar". Desligado por padrão */
  sound: boolean;
}

/** Chaves do localStorage (as duas primeiras também são lidas pelo script do index.html). */
export const PREFERENCE_KEYS = { theme: 'pk-theme', motion: 'pk-motion', sound: 'pk-sound' } as const;

export const DEFAULT_PREFERENCES: Preferences = { theme: 'system', animations: true, sound: false };

function readStored(): Preferences {
  try {
    const t = localStorage.getItem(PREFERENCE_KEYS.theme);
    return {
      theme: t === 'light' || t === 'dark' ? t : 'system',
      animations: localStorage.getItem(PREFERENCE_KEYS.motion) !== 'off',
      sound: localStorage.getItem(PREFERENCE_KEYS.sound) === 'on',
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function writeStored(p: Preferences) {
  try {
    if (p.theme === 'system') localStorage.removeItem(PREFERENCE_KEYS.theme);
    else localStorage.setItem(PREFERENCE_KEYS.theme, p.theme);
    if (p.animations) localStorage.removeItem(PREFERENCE_KEYS.motion);
    else localStorage.setItem(PREFERENCE_KEYS.motion, 'off');
    if (p.sound) localStorage.setItem(PREFERENCE_KEYS.sound, 'on');
    else localStorage.removeItem(PREFERENCE_KEYS.sound);
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
}

interface PreferencesStore extends Preferences {
  setPreferences(patch: Partial<Preferences>): void;
}

// ---------- troca de tema ao vivo (ajustes-rotina-conta.md › Aparência) ----------
// A classe theme-fade fica no <html> por 240 ms, com a transição das cores em --dur-base e --ease-in-out (no modo
// reduzido do sistema, --dur-base vale 150 ms; com "Animações" desligado, a troca é seca). As prévias de tema têm
// cores fixas e não mudam. Em Sistema, o mesmo vale quando o iPhone troca sozinho de claro para escuro.
const FADE_CLASS = 'theme-fade';
const FADE_MS = 240;
let fadeTimer: ReturnType<typeof setTimeout> | undefined;

function ensureFadeStyle() {
  if (typeof document === 'undefined' || document.getElementById('pk-theme-fade')) return;
  const style = document.createElement('style');
  style.id = 'pk-theme-fade';
  style.textContent =
    `html.${FADE_CLASS}, html.${FADE_CLASS} *, html.${FADE_CLASS} *::before, html.${FADE_CLASS} *::after {` +
    ' transition-property: background-color, color, border-color, fill, stroke, box-shadow, outline-color !important;' +
    ' transition-duration: var(--dur-base, 240ms) !important;' +
    ' transition-timing-function: var(--ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) !important;' +
    ' transition-delay: 0s !important; }';
  document.head.appendChild(style);
}

/** Liga a transição das cores por 240 ms (chame antes de trocar o data-theme). */
export function fadeThemeChange(animations: boolean): void {
  if (typeof document === 'undefined' || !animations) return;
  ensureFadeStyle();
  const root = document.documentElement;
  root.classList.add(FADE_CLASS);
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => root.classList.remove(FADE_CLASS), FADE_MS + 40);
}

export const usePreferences = create<PreferencesStore>()((set, get) => ({
  ...readStored(),
  setPreferences(patch) {
    const prev = get();
    const { theme, animations, sound } = { ...prev, ...patch };
    const next: Preferences = { theme, animations, sound };
    if (theme !== prev.theme) fadeThemeChange(animations);
    writeStored(next);
    set(next);
  },
}));

export function getPreferences(): Preferences {
  const { theme, animations, sound } = usePreferences.getState();
  return { theme, animations, sound };
}

export function setPreferences(patch: Partial<Preferences>): void {
  usePreferences.getState().setPreferences(patch);
}

// outra aba do computador mudou a aparência: segue junto
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && (Object.values(PREFERENCE_KEYS) as string[]).includes(e.key)) usePreferences.setState(readStored());
  });
  // em Sistema, o iPhone trocou sozinho de claro para escuro com o app aberto: a mesma troca suave
  if (typeof window.matchMedia === 'function') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', () => {
      const p = usePreferences.getState();
      if (p.theme === 'system') fadeThemeChange(p.animations);
    });
  }
}

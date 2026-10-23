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

export const usePreferences = create<PreferencesStore>()((set, get) => ({
  ...readStored(),
  setPreferences(patch) {
    const { theme, animations, sound } = { ...get(), ...patch };
    const next: Preferences = { theme, animations, sound };
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
}

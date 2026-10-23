// Sessão: quem está usando o app e de onde vêm os dados (modo demonstração ou Firebase).
// <DataProvider> envolve o app: liga o relógio, abre a fonte de dados e os ouvintes, e expõe useSession().
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { clockOf } from '@/domain/day';
import { newProfile } from '@/domain/planTemplate';
import { baseState, connectSource, disconnectSource, useDataStore, whenReady } from '@/stores/data';
import { installAgoraParam, nowMs, startClock } from '@/stores/clock';
import { startTogether } from '@/stores/together';
import { setPreferences } from '@/app/preferences';
import { startDraftWatcher } from '@/actions/drafts';
import { leaveExample } from './example';
import { isFirebaseConfigured } from './firebaseConfig';
import { LocalSource } from './localSource';
import { PROFILE_ID, type DataSource } from './source';

export type SessionStatus = 'loading' | 'signedOut' | 'denied' | 'ready';
export type SessionMode = 'demo' | 'firebase';

export interface SessionUser {
  name: string;
  email?: string;
}

export interface Session {
  status: SessionStatus;
  mode: SessionMode | null;
  user: SessionUser | null;
  /** conta sem plano configurado (primeiro acesso) */
  needsOnboarding: boolean;
  /** true quando o .env tem a configuração do Firebase */
  firebaseAvailable: boolean;
  /** frase para a tela Entrar ("O login não terminou. Tente de novo."), ou null */
  error: string | null;
  /**
   * Entra no modo demonstração, com a história de exemplo (semeada na primeira vez, ou de novo se a demonstração
   * ficou sem plano). Com `{ empty: true }`, entra como uma conta recém-criada: perfil sem plano, e a guarda leva ao
   * primeiro acesso (/comecar/1), para testar o Começar sem Firebase.
   */
  enterDemo(opts?: { empty?: boolean }): Promise<void>;
  /** Google por redirecionamento; sem Firebase, rejeita com uma mensagem clara */
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  /** apaga a demonstração e semeia de novo */
  resetDemo(): Promise<void>;
}

const MODE_KEY = 'pk.session.mode';
const DEMO_UID = 'demo';
export const SIGN_IN_FAILED = 'O login não terminou. Tente de novo.';
export const FIREBASE_UNAVAILABLE =
  'O login com Google ainda não está disponível nesta versão. Use o modo demonstração para conhecer o app.';

function readMode(): SessionMode | null {
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === 'demo' || v === 'firebase' ? v : null;
  } catch {
    return null;
  }
}

function writeMode(mode: SessionMode | null) {
  try {
    if (mode) localStorage.setItem(MODE_KEY, mode);
    else localStorage.removeItem(MODE_KEY);
  } catch {
    /* sem armazenamento: segue só na memória */
  }
}

function isPermissionDenied(error: unknown): boolean {
  return !!error && typeof error === 'object' && (error as { code?: string }).code === 'permission-denied';
}

async function seed(source: DataSource) {
  const { seedDemo } = await import('./seed');
  await seedDemo(source, nowMs());
}

/** O perfil de uma conta nova na demonstração (sem plano: o app abre o primeiro acesso). */
async function blankDemoProfile(source: DataSource) {
  const { DEMO_NAME } = await import('./seed');
  await source.write([
    { op: 'set', col: 'profile', id: PROFILE_ID, data: newProfile(DEMO_NAME, nowMs(), clockOf(null)) },
  ]);
}

/**
 * Como abrir a demonstração. boot: reabrir o app (fica o que está no aparelho; só semeia se não houver nada, para
 * "Apagar todos os dados" continuar apagado depois de recarregar). enter: "Explorar com dados de exemplo" (semeia
 * também quando a demonstração ficou sem plano). fresh: "Começar de novo". empty: "Testar o primeiro acesso".
 */
type DemoOpen = 'boot' | 'enter' | 'fresh' | 'empty';

const SessionContext = createContext<Session | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profile = useDataStore((s) => s.profile);
  const profileLoaded = useDataStore((s) => s.profileLoaded);
  const dataError = useDataStore((s) => s.error);
  // modo exemplo (data/example.ts): o store mostra a história de exemplo; a sessão continua sendo a da pessoa
  const example = useDataStore((s) => s.example);
  const firebaseUnsub = useRef<(() => void) | null>(null);
  const firebaseSource = useRef<{ clearCache(): Promise<void> } | null>(null);

  const openDemo = useCallback(async (how: DemoOpen) => {
    await leaveExample();
    const previous = useDataStore.getState().source;
    if (previous) {
      disconnectSource();
      await previous.close();
    }
    const source = await LocalSource.open(DEMO_UID);
    const planless = source.hasData() && !source.get('profile', PROFILE_ID)?.planSetupAt;
    if (how === 'empty') {
      await source.deleteAll();
      await blankDemoProfile(source);
    } else if (how === 'fresh' || (how === 'enter' && planless)) {
      await source.deleteAll();
      await seed(source);
    } else if (!source.hasData()) await seed(source);
    connectSource(source);
    await whenReady();
    writeMode('demo');
    setMode('demo');
    setAuthUser(null);
    setStatus('ready');
  }, []);

  const bootFirebase = useCallback(async () => {
    const fb = await import('./firebase');
    const { FirestoreSource } = await import('./firestoreSource');
    try {
      await fb.getGoogleRedirectResult();
    } catch {
      setError(SIGN_IN_FAILED);
    }
    firebaseUnsub.current?.();
    firebaseUnsub.current = fb.watchUser((user) => {
      if (readMode() === 'demo') return;
      if (!user) {
        disconnectSource();
        setAuthUser(null);
        setMode(null);
        setStatus('signedOut');
        return;
      }
      const source = new FirestoreSource(fb.requireFirebase().db, user.uid);
      firebaseSource.current = source;
      setAuthUser({ name: user.displayName ?? user.email ?? '', email: user.email ?? undefined });
      writeMode('firebase');
      setMode('firebase');
      setStatus('loading');
      connectSource(source);
    });
  }, []);

  // abrir o app
  useEffect(() => {
    installAgoraParam();
    const stopClock = startClock();
    const stopTogether = startTogether();
    const stopDrafts = startDraftWatcher();
    const saved = readMode();
    // só em desenvolvimento: ?sem-acesso=pessoa@exemplo.com abre "Conta sem acesso" sem Firebase (para conferir a tela)
    const deniedEmail =
      import.meta.env.DEV && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('sem-acesso')
        : null;
    const boot = async () => {
      await Promise.resolve();
      if (deniedEmail) {
        setMode('demo');
        setAuthUser({ name: deniedEmail.split('@')[0] ?? '', email: deniedEmail });
        setStatus('denied');
        return;
      }
      if (saved === 'demo') await openDemo('boot');
      else if (isFirebaseConfigured) await bootFirebase();
      else setStatus('signedOut');
    };
    boot().catch(() => setStatus('signedOut'));
    return () => {
      stopClock();
      stopTogether();
      stopDrafts();
      firebaseUnsub.current?.();
    };
  }, [openDemo, bootFirebase]);

  // Demonstração sem perfil (depois de "Apagar todos os dados"): grava um perfil novo, sem plano, como no primeiro
  // login. Assim o primeiro acesso continua depois de recarregar, em vez de a história voltar sozinha.
  // (no modo exemplo, o perfil na tela é o da cópia: nada aqui vale para ele)
  useEffect(() => {
    if (mode !== 'demo' || example || !profileLoaded || profile) return;
    const source = useDataStore.getState().source;
    if (source?.kind === 'demo') blankDemoProfile(source).catch(() => undefined);
  }, [mode, example, profile, profileLoaded]);

  // Firebase, primeiro login: grava o perfil (nome, fuso e virada às 4h); o plano vem no primeiro acesso
  useEffect(() => {
    if (mode !== 'firebase' || example || isPermissionDenied(dataError) || !profileLoaded) return;
    const source = useDataStore.getState().source;
    if (!profile && source) {
      // primeiro login: nome, fuso e virada às 4h; o plano vem no primeiro acesso
      const clock = clockOf(null);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || clock.timeZone;
      source
        .write([
          {
            op: 'set',
            col: 'profile',
            id: PROFILE_ID,
            data: newProfile(
              authUser?.name?.split(' ')[0] || 'Você',
              nowMs(),
              { ...clock, timeZone: tz },
              authUser?.email,
            ),
          },
        ])
        .catch(() => undefined);
    }
  }, [mode, example, profile, profileLoaded, dataError, authUser]);

  const enterDemo = useCallback(
    async (opts: { empty?: boolean } = {}) => {
      setError(null);
      setStatus('loading');
      await openDemo(opts.empty ? 'empty' : 'enter');
    },
    [openDemo],
  );

  const resetDemo = useCallback(async () => {
    setError(null);
    setStatus('loading');
    await openDemo('fresh');
  }, [openDemo]);

  const signIn = useCallback(async () => {
    setError(null);
    if (!isFirebaseConfigured) throw new Error(FIREBASE_UNAVAILABLE);
    writeMode(null);
    const fb = await import('./firebase');
    await fb.signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    // no modo exemplo, sai dele antes (a fonte a fechar é a da pessoa)
    await leaveExample();
    const source = useDataStore.getState().source;
    disconnectSource();
    await source?.close();
    if (mode === 'firebase') {
      const fb = await import('./firebase');
      await fb.signOutUser().catch(() => undefined);
      await firebaseSource.current?.clearCache();
      firebaseSource.current = null;
    }
    writeMode(null);
    setMode(null);
    setAuthUser(null);
    setStatus('signedOut');
  }, [mode]);

  // a aparência do perfil (deste ou de outro aparelho) vai para a cópia local da casca; no modo exemplo, ficam as da
  // pessoa (a volta aplica as dela de novo)
  const prefs = profile?.prefs;
  useEffect(() => {
    if (prefs && !example) setPreferences({ theme: prefs.theme, animations: prefs.motion, sound: prefs.sound });
  }, [prefs, example]);

  const value = useMemo<Session>(() => {
    // no Firebase, a sessão fica pronta quando o perfil chega (ou a conta não tem acesso)
    let effective = status;
    if (mode === 'firebase') {
      if (isPermissionDenied(dataError)) effective = 'denied';
      else if (status === 'loading' && profileLoaded) effective = 'ready';
    }
    const ready = effective === 'ready';
    // no modo exemplo, a conta, o nome e o primeiro acesso seguem o perfil da pessoa (estacionado por baixo)
    const own = example ? baseState().profile : profile;
    const name = own?.name || authUser?.name || (mode === 'demo' ? 'Henrique' : '');
    return {
      status: effective,
      mode,
      user: mode ? { name, email: own?.email ?? authUser?.email } : null,
      needsOnboarding: ready && profileLoaded && (!own || !own.planSetupAt),
      firebaseAvailable: isFirebaseConfigured,
      error,
      enterDemo,
      signIn,
      signOut,
      resetDemo,
    };
  }, [
    status,
    mode,
    example,
    profile,
    profileLoaded,
    dataError,
    authUser,
    error,
    enterDemo,
    signIn,
    signOut,
    resetDemo,
  ]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de <DataProvider>.');
  return ctx;
}

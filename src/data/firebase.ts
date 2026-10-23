// Firebase: Auth com Google por redirecionamento e Firestore com cache persistente (várias abas).
// Só inicializa se a configuração existir. Importe este módulo de forma dinâmica para não carregar o SDK no modo demonstração:
//   if (isFirebaseConfigured) { const { requireFirebase } = await import('@/data/firebase'); ... }
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

export { firebaseConfig, isFirebaseConfigured };

export type FirebaseServices = { app: FirebaseApp; auth: Auth; db: Firestore };

function init(): FirebaseServices | null {
  if (!firebaseConfig) return null;
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  auth.languageCode = 'pt-BR';
  // grava primeiro no aparelho (IndexedDB) e sobe quando houver internet; as abas abertas dividem o mesmo cache
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return { app, auth, db };
}

const services = init();

export const firebaseApp: FirebaseApp | null = services?.app ?? null;
export const auth: Auth | null = services?.auth ?? null;
export const db: Firestore | null = services?.db ?? null;

/** Os serviços do Firebase, ou um erro claro quando o app está no modo demonstração. */
export function requireFirebase(): FirebaseServices {
  if (!services) {
    throw new Error('Firebase não configurado: o app está no modo demonstração. Veja docs/firebase.md.');
  }
  return services;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/** Entrar com Google. Sai da página e volta para o app; o resultado chega por getGoogleRedirectResult(). */
export function signInWithGoogle(): Promise<never> {
  return signInWithRedirect(requireFirebase().auth, googleProvider);
}

/** Chame uma vez ao abrir o app, para concluir a volta do login (devolve null quando não houve login agora). */
export function getGoogleRedirectResult(): Promise<UserCredential | null> {
  return getRedirectResult(requireFirebase().auth);
}

/** Ouve quem está logado. Devolve a função que para de ouvir. */
export function watchUser(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(requireFirebase().auth, callback);
}

export function signOutUser(): Promise<void> {
  return signOut(requireFirebase().auth);
}

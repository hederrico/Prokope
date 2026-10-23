// Configuração do Firebase lida do ambiente (VITE_FIREBASE_*, veja .env.example e docs/firebase.md).
// Este arquivo não importa o SDK: dá para perguntar isFirebaseConfigured sem carregar o Firebase.
// Sem configuração, o app roda no modo demonstração, com os dados no aparelho.
import type { FirebaseOptions } from 'firebase/app';

const env = import.meta.env;

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

/** No Firebase Hosting o login usa o domínio do próprio app: é o que faz o redirecionamento funcionar no Safari e no app instalado. */
function resolveAuthDomain(projectId: string): string {
  if (typeof location !== 'undefined') {
    const host = location.hostname;
    if (host === `${projectId}.web.app` || host === `${projectId}.firebaseapp.com`) return host;
  }
  return clean(env.VITE_FIREBASE_AUTH_DOMAIN) ?? `${projectId}.firebaseapp.com`;
}

function readConfig(): FirebaseOptions | null {
  const apiKey = clean(env.VITE_FIREBASE_API_KEY);
  const projectId = clean(env.VITE_FIREBASE_PROJECT_ID);
  const appId = clean(env.VITE_FIREBASE_APP_ID);
  if (!apiKey || !projectId || !appId) return null;
  const config: FirebaseOptions = {
    apiKey,
    projectId,
    appId,
    authDomain: resolveAuthDomain(projectId),
  };
  const storageBucket = clean(env.VITE_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = clean(env.VITE_FIREBASE_MESSAGING_SENDER_ID);
  if (storageBucket) config.storageBucket = storageBucket;
  if (messagingSenderId) config.messagingSenderId = messagingSenderId;
  return config;
}

export const firebaseConfig: FirebaseOptions | null = readConfig();

/** true quando o .env tem a configuração do Firebase; false = modo demonstração. */
export const isFirebaseConfigured: boolean = firebaseConfig !== null;

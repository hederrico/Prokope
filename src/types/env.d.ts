/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

// Variáveis de ambiente do app (veja .env.example). Todas opcionais: sem elas, o app roda no modo demonstração.
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  /** "off" desliga as ofertas automáticas do Zeno (testes) */
  readonly VITE_TOUR_AUTO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Cor do manifesto: --bg do tema claro, convertido de OKLCH
const BG_LIGHT = '#fbf9f6';

// Pasta do app: "/" no desenvolvimento e no Firebase Hosting, "/Prokope/" no GitHub Pages (BASE_PATH em pages.yml)
const base = (process.env.BASE_PATH ?? '/').replace(/\/?$/, '/');

// O app usa só os pesos regular, duotone, fill e bold do Phosphor: tira thin e light de cada ícone (um terço a menos no pacote)
function phosphorWeights(): Plugin {
  const entry = /\n {2}\[\n {4}"(?:thin|light)",\n[\s\S]*?\n {2}\],?/g;
  return {
    name: 'prokope:phosphor-weights',
    enforce: 'pre',
    transform: {
      filter: { id: /@phosphor-icons[\\/]react[\\/]dist[\\/]defs[\\/].*\.es\.js$/ },
      handler(code) {
        return { code: code.replace(entry, ''), map: null };
      },
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    phosphorWeights(),
    react(),
    tailwindcss(),
    VitePWA({
      // modo de aviso: a versão nova espera a pessoa tocar em "Atualizar" (src/app/PwaUpdate.tsx)
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon-180.png', 'fonts/*.woff2'],
      manifest: {
        id: base,
        name: 'Prokopē',
        short_name: 'Prokopē',
        description: 'Um pouco de progresso, todo dia. Poucos hábitos por vez, no seu ritmo.',
        lang: 'pt-BR',
        dir: 'ltr',
        // a raiz leva ao Hoje; é um arquivo de verdade (index.html) também no GitHub Pages, que não reescreve rotas
        start_url: base,
        scope: base,
        display: 'standalone',
        theme_color: BG_LIGHT,
        background_color: BG_LIGHT,
        categories: ['health', 'lifestyle', 'productivity'],
        icons: [
          { src: `${base}icons/pwa-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/pwa-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/pwa-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // as fontes latinas entram no pacote offline; os outros recortes da Onest (cirílico etc.) vêm sob demanda
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', 'fonts/*.woff2', 'assets/onest-latin-*.woff2'],
        navigateFallback: `${base}index.html`,
        // /__/auth e /__/firebase são do Firebase Hosting (login com redirecionamento): nunca servir o app no lugar
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.endsWith('.woff2'),
            handler: 'CacheFirst',
            options: { cacheName: 'pk-fonts', expiration: { maxEntries: 20 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    // o pedaço dos ícones (cerca de 300 ícones do Phosphor em 4 pesos) passa de 500 kB sem gzip; com gzip, perto de 140 kB
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      // o Tailwind não gera sourcemap do CSS; o aviso não muda nada no app
      onLog(level, log, handler) {
        if (log.code === 'SOURCEMAP_BROKEN' && log.plugin?.startsWith('@tailwindcss')) return;
        handler(level, log);
      },
      output: {
        // pedaços que mudam pouco ficam em arquivos próprios, e o cache do aparelho sobrevive às atualizações do app
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'icons', test: /node_modules[\\/]@phosphor-icons[\\/]/ },
            // o Zeno (o three.js e o desenho dele) não tem grupo: um grupo puxa as dependências junto, e o pedaço
            // principal passaria a importar o three. Ele fica no zeno3d-*.js, que só o import() de src/zeno/index.ts
            // carrega, e entra no pacote offline (o globPatterns pega todo .js; fica abaixo do limite de 2 MiB do Workbox)
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
});

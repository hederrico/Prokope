import { defineConfig, devices } from '@playwright/test';

// Os testes rodam no build de produção (vite preview). Rode `npm run build` antes, ou use `npm run test:e2e`, que já faz o build.
// PW_PORT troca a porta quando outro preview já está rodando.
const port = Number(process.env.PW_PORT ?? 4173);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      // Tamanho do iPhone no Chromium: 390 × 844, toque e escala 3 (o WebKit não vem instalado).
      // O user agent continua o do Chrome, para o app não achar que está no Safari fora da Tela de Início.
      name: 'iphone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `npx vite preview --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

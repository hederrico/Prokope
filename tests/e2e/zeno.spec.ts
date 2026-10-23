import { expect, test, type Page } from '@playwright/test';

// O Zeno de verdade, na /dev/zeno (existe no desenvolvimento e no build dos testes, nunca no de produção): entra e
// desenha num canvas do tamanho dele, aponta para um botão, sai e para de desenhar, o movimento reduzido, "Mostrar o
// Zeno" desligado e um aparelho sem WebGL. Os quadros são contados como no laboratório (frames e drawing).

// o gancho de teste do Zeno (window.__pkZeno) está declarado em tests/e2e/global.d.ts

// sem o service worker: ele baixaria o pedaço do Zeno junto com o pacote offline, e o teste quer ver a carga sob demanda
test.use({ serviceWorkers: 'block' });
// um de cada vez: o WebGL dos testes roda na CPU (SwiftShader), e vários desenhando juntos atrasam o tempo de cena
test.describe.configure({ mode: 'serial', timeout: 60_000 });

async function open(page: Page) {
  await page.goto('/dev/zeno');
  await expect(page.getByRole('heading', { level: 1, name: 'Zeno' })).toBeVisible();
}

async function enterDemo(page: Page) {
  await page.goto('/entrar');
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje$/);
}

async function go(page: Page, to: string) {
  await page.evaluate((to) => window.__pkShell.navigate(to), to);
  await page.waitForTimeout(600);
}

const frames = (page: Page) => page.evaluate(() => window.__pkZeno.frames);
const drawing = (page: Page) => page.evaluate(() => window.__pkZeno.drawing);
const present = (page: Page) => page.evaluate(() => window.__pkZeno.present);
const stats = (page: Page) => page.evaluate(() => window.__pkZeno.stats());
const gl = (page: Page) => page.locator('canvas.zn-gl:not(.zn-snap)');

test.describe('zeno', () => {
  test('entra: carrega sob demanda, o canvas tem o tamanho dele e desenha', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (r) => {
      if (/zeno3d-[^/]+\.js$/.test(r.url())) chunks.push(r.url());
    });
    await open(page);
    expect(await page.evaluate(() => window.__pkZeno.available)).toBe(true);
    // nada do three.js antes de ele entrar
    expect(chunks).toHaveLength(0);
    await expect(gl(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect.poll(() => present(page), { timeout: 15_000 }).toBe(true);
    expect(chunks).toHaveLength(1);
    await expect(gl(page)).toBeVisible();
    // o desenho fica escondido do leitor de tela, e o canvas não cobre a tela
    await expect(page.locator('.zn-stage')).toHaveAttribute('aria-hidden', 'true');
    const box = await gl(page).boundingBox();
    expect(box!.width).toBeLessThan(390 * 0.75);
    expect(box!.height).toBeLessThan(844 / 2);
    // de pé embaixo: o pé dele fica na borda de baixo
    const s = await stats(page);
    expect(s!.spot).toMatchObject({ side: 'left', row: 'bottom' });
    expect(s!.spot.y).toBeGreaterThan(800);
    // desenhando: os quadros andam
    const f = await frames(page);
    await page.waitForTimeout(600);
    expect(await frames(page)).toBeGreaterThan(f + 8);
    expect(await drawing(page)).toBe(true);
  });

  test('aponta para um botão de verdade e baixa o braço no rest()', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__pkZeno.zeno.enter());
    const alvo = page.getByRole('button', { name: 'Alvo 2', exact: true });
    await alvo.scrollIntoViewIfNeeded();
    await alvo.click();
    await expect.poll(async () => (await stats(page))!.pointing, { timeout: 10_000 }).toBe(true);
    // o dedo de apontar está para fora num dos braços
    await expect
      .poll(async () => {
        const p = (await page.evaluate(() => window.__pkZeno.params()))!;
        return Math.max(p.fL, p.fR);
      })
      .toBe(1);
    // a cabeça na tela, para o balão
    const head = await page.evaluate(() => {
      const r = window.__pkZeno.zeno.anchor();
      return r && { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    expect(head).not.toBeNull();
    expect(head!.w).toBeGreaterThan(40);
    expect(head!.y).toBeGreaterThan(400);

    await page.getByRole('button', { name: 'Baixar os braços' }).click();
    await expect.poll(async () => (await stats(page))!.pointing).toBe(false);
    const p = (await page.evaluate(() => window.__pkZeno.params()))!;
    expect(Math.max(p.fL, p.fR)).toBe(0);
  });

  test('sai: o desenho para e o canvas some', async ({ page }) => {
    await open(page);
    await page.evaluate(() => window.__pkZeno.zeno.enter());
    expect(await drawing(page)).toBe(true);
    // leave() resolve quando ele saiu e o laço parou
    await page.evaluate(() => window.__pkZeno.zeno.leave());
    expect(await present(page)).toBe(false);
    expect(await drawing(page)).toBe(false);
    const f = await frames(page);
    await page.waitForTimeout(700);
    expect(await frames(page)).toBe(f);
    await expect(gl(page)).toBeHidden();
    expect(await page.evaluate(() => window.__pkZeno.zeno.anchor())).toBeNull();
  });

  test('movimento reduzido: entra por opacidade, sem respirar, e o desenho para quando a pose assenta', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    const t0 = Date.now();
    await page.evaluate(() => window.__pkZeno.zeno.enter());
    // sem a caminhada de 2 s
    expect(Date.now() - t0).toBeLessThan(1800);
    expect(await present(page)).toBe(true);
    await expect.poll(() => drawing(page)).toBe(false);
    const f = await frames(page);
    await page.waitForTimeout(800);
    expect(await frames(page)).toBe(f);
    // uma pose nova troca por opacidade e o desenho para de novo
    await page.evaluate(() => window.__pkZeno.zeno.sit());
    expect((await stats(page))!.seated).toBe(true);
    await expect.poll(() => drawing(page)).toBe(false);
  });

  test('"Mostrar o Zeno" desligado: available fica falso, e com ele em cena ele sai', async ({ page }) => {
    await enterDemo(page);
    await page.evaluate(() => window.__pkZeno.zeno.enter());
    expect(await present(page)).toBe(true);

    await go(page, '/ajustes/aparencia');
    const sw = page.getByRole('switch', { name: 'Mostrar o Zeno' });
    await expect(sw).toBeChecked();
    await sw.click();
    await expect(sw).not.toBeChecked();
    expect(await page.evaluate(() => window.__pkZeno.available)).toBe(false);
    // ele dá tchau e sai
    await expect.poll(() => present(page), { timeout: 10_000 }).toBe(false);
    await expect.poll(() => drawing(page)).toBe(false);

    // na /dev/zeno, entrar não faz nada
    await go(page, '/dev/zeno');
    await expect(page.getByTestId('zeno-state')).toHaveText('Indisponível');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForTimeout(400);
    expect(await present(page)).toBe(false);

    // ligado de novo, ele pode voltar (e continua desligado depois de recarregar até lá)
    await go(page, '/ajustes/aparencia');
    await page.getByRole('switch', { name: 'Mostrar o Zeno' }).click();
    expect(await page.evaluate(() => window.__pkZeno.available)).toBe(true);
  });

  test('sem WebGL: available é falso e nada quebra', async ({ page }) => {
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === 'webgl2' || type === 'webgl') return null;
        return (get as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof get;
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page);
    expect(await page.evaluate(() => window.__pkZeno.available)).toBe(false);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.getByRole('button', { name: 'Acenar', exact: true }).click();
    await page.waitForTimeout(400);
    expect(await present(page)).toBe(false);
    await expect(gl(page)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

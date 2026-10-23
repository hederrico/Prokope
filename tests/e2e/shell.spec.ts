import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// A casca do app no tamanho do iPhone: entrar na demonstração, trocar de aba, empurrar e voltar (pelo botão e pelo
// arrasto da borda), abrir e fechar folhas (arrasto, Esc e voltar do navegador), o toast com Desfazer e o movimento
// reduzido. Para não depender do conteúdo das telas (que cada agente troca), a navegação usa o gancho de teste
// window.__pkShell (só existe com navigator.webdriver) e os papéis da casca (tab, dialog, botões do NavBar).

// (window.__pkShell está declarado em tests/e2e/global.d.ts)

async function enterDemo(page: Page) {
  // ?gestos=1 liga o arrasto da borda fora do app instalado
  await page.goto('/entrar?gestos=1');
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje$/);
  await expect(page.getByRole('tab', { name: 'Hoje' })).toHaveAttribute('aria-selected', 'true');
}

async function go(page: Page, to: string, state?: unknown) {
  await page.evaluate(([to, state]) => window.__pkShell.navigate(to as string, state ? { state } : undefined), [
    to,
    state,
  ] as const);
}

/** Espera a passagem assentar (a mola calma leva cerca de 350 ms). */
async function settle(page: Page) {
  await page.waitForTimeout(650);
}

/** Navega e devolve o deslocamento horizontal (px) e a opacidade da tela nova no primeiro quadro em que ela aparece. */
async function goAndSample(page: Page, to: string) {
  return page.evaluate(async (to) => {
    void window.__pkShell.navigate(to);
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      const el = document.querySelector<HTMLElement>(`[data-screen="${to}"]`);
      if (el) {
        await new Promise((r) => requestAnimationFrame(r));
        const cs = getComputedStyle(el);
        return { x: new DOMMatrix(cs.transform).m41, opacity: Number(cs.opacity) };
      }
    }
    return null;
  }, to);
}

async function edgeDrag(page: Page, toX: number, stepMs: number) {
  await page.mouse.move(6, 420);
  await page.mouse.down();
  for (let x = 6; x <= toX; x += 10) {
    await page.mouse.move(x, 421);
    await page.waitForTimeout(stepMs);
  }
  await page.mouse.up();
}

async function dragSheetDown(page: Page, distance: number) {
  const box = await page.getByRole('dialog').boundingBox();
  if (!box) throw new Error('folha sem caixa');
  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + 12);
  await page.mouse.down();
  for (let d = 0; d <= distance; d += 15) {
    await page.mouse.move(x, box.y + 12 + d);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
}

test.describe('casca', () => {
  test('percurso: abas, empurrar e voltar, folhas e Desfazer', async ({ page }) => {
    await enterDemo(page);

    // ---------- troca de aba ----------
    await page.getByRole('tab', { name: 'Progresso' }).click();
    await expect(page).toHaveURL(/\/progresso$/);
    await expect(page.getByRole('tab', { name: 'Progresso' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await expect(page).toHaveURL(/\/ajustes$/);
    await settle(page);

    // ---------- empurrar: a tela nova entra da direita ----------
    const first = await goAndSample(page, '/ajustes/pilares');
    expect(first).not.toBeNull();
    expect(first!.x).toBeGreaterThan(40);
    await settle(page);
    await expect(page).toHaveURL(/\/ajustes\/pilares$/);

    // voltar pelo botão, com o nome da tela anterior
    await page.getByRole('button', { name: 'Voltar para Ajustes' }).click();
    await expect(page).toHaveURL(/\/ajustes$/);
    await settle(page);

    // cada aba guarda a própria pilha
    await go(page, '/ajustes/pilares');
    await settle(page);
    await page.getByRole('tab', { name: 'Hoje' }).click();
    await expect(page).toHaveURL(/\/hoje$/);
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await expect(page).toHaveURL(/\/ajustes\/pilares$/);
    await settle(page);

    // ---------- voltar pelo arrasto da borda ----------
    // curto e devagar: volta para o lugar
    await edgeDrag(page, 90, 40);
    await settle(page);
    await expect(page).toHaveURL(/\/ajustes\/pilares$/);
    // passando de 35% da largura: completa
    await edgeDrag(page, 260, 16);
    await expect(page).toHaveURL(/\/ajustes$/);
    await settle(page);
    await expect(page.locator('[data-level="tab"]')).toHaveCount(1);

    // ---------- folha: arrastar para baixo fecha ----------
    await go(page, '/ajustes?folha=agua', { sheetBase: '' });
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute('aria-modal', 'true');
    await settle(page);
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await dragSheetDown(page, 320);
    await expect(page).toHaveURL(/\/ajustes$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // o voltar do navegador fecha
    await go(page, '/ajustes?folha=agua', { sheetBase: '' });
    await expect(page.getByRole('dialog')).toBeVisible();
    await settle(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/ajustes$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Esc fecha; o X fecha
    await go(page, '/ajustes?folha=agua', { sheetBase: '' });
    await expect(page.getByRole('dialog')).toBeVisible();
    await settle(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/\/ajustes$/);

    // ---------- toast com Desfazer ----------
    await page.getByRole('tab', { name: 'Hoje' }).click();
    await expect(page).toHaveURL(/\/hoje$/);
    await settle(page);
    await page.evaluate(() => {
      window.__undone = false;
      window.__pkShell.showUndo(
        { title: 'Ovo · 6 g', detail: '52 de 80 g hoje', pillar: 'alim', icon: 'egg' },
        () => {},
      );
      window.__pkShell.showUndo(
        { title: 'Caminhada marcada', detail: '3 de 7 na semana', pillar: 'familia', icon: 'check' },
        () => {
          window.__undone = true;
        },
      );
    });
    const toast = page.locator('.sh-toast').filter({ hasText: 'Caminhada marcada' });
    await expect(toast).toBeVisible();
    await settle(page);
    // um por vez
    await expect(page.locator('.sh-toast')).toHaveCount(1);
    // 8 px acima da barra de abas
    const bar = await page.getByRole('tablist').boundingBox();
    const box = await toast.boundingBox();
    expect(Math.abs(bar!.y - (box!.y + box!.height) - 8)).toBeLessThanOrEqual(2);
    await toast.getByRole('button', { name: 'Desfazer' }).click();
    expect(await page.evaluate(() => window.__undone)).toBe(true);
    await expect(page.locator('.sh-toast')).toHaveCount(0);
  });

  test('um toast novo troca o anterior no lugar, e uma folha abrindo tira o toast', async ({ page }) => {
    await enterDemo(page);
    await settle(page);
    await page.evaluate(() => window.__pkShell.showUndo({ title: 'Ovo · 6 g', pillar: 'alim', icon: 'egg' }, () => {}));
    const first = page.locator('[data-sonner-toast]').filter({ hasText: 'Ovo' });
    await expect(first).toBeVisible();
    await settle(page);
    const before = (await first.boundingBox())!;
    // o anterior não sobe na pilha: some no mesmo lugar enquanto o novo entra
    const path = await page.evaluate(async () => {
      window.__pkShell.showUndo({ title: 'Caminhada marcada', pillar: 'familia', icon: 'check' }, () => {});
      const ys: number[] = [];
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => requestAnimationFrame(r));
        const old = [...document.querySelectorAll('[data-sonner-toast]')].find((el) => el.textContent?.includes('Ovo'));
        if (old) ys.push(old.getBoundingClientRect().y);
      }
      return ys;
    });
    for (const y of path) expect(Math.abs(y - before.y)).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
    await expect(page.locator('.sh-toast')).toContainText('Caminhada marcada');

    await go(page, '/hoje?folha=agua', { sheetBase: '' });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
  });

  test('link direto numa tela empurrada: o arrasto da borda mostra a tela de cima e volta', async ({ page }) => {
    await enterDemo(page);
    await page.goto('/ajustes/pilares?gestos=1');
    await expect(page.locator('[data-screen="/ajustes/pilares"]')).toBeVisible();
    await expect(page.locator('.sh-edge')).toHaveCount(1);
    await settle(page);
    await page.mouse.move(6, 420);
    await page.mouse.down();
    for (let x = 6; x <= 150; x += 10) {
      await page.mouse.move(x, 421);
      await page.waitForTimeout(16);
    }
    // a tela de cima (Ajustes) aparece por baixo durante o arrasto
    await expect(page.locator('[data-screen="/ajustes"]')).toBeVisible();
    for (let x = 150; x <= 280; x += 10) {
      await page.mouse.move(x, 421);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await expect(page).toHaveURL(/\/ajustes$/);
    await settle(page);
    await expect(page.locator('[data-level="tab"]')).toHaveCount(1);
  });

  test('Novo hábito: tipo → detalhes é um passo na mesma camada, com a barra parada', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await settle(page);
    await go(page, '/ajustes/habitos/novo/tipo');
    await settle(page);
    const layer = page.locator('[data-screen="/ajustes/habitos/novo"]');
    await expect(layer).toBeVisible();
    const title = layer.locator('.sh-nb-title');
    const x0 = (await title.boundingBox())!.x;
    await layer.getByRole('button', { name: /^Contador/ }).click();
    await expect(page).toHaveURL(/\/ajustes\/habitos\/novo\/detalhes\?tipo=counter/);
    // o título fica parado enquanto o corpo troca
    for (let i = 0; i < 5; i++) {
      expect(Math.abs((await title.boundingBox())!.x - x0)).toBeLessThanOrEqual(1);
      await page.waitForTimeout(60);
    }
    await expect(page.locator('.sh-layer')).toHaveCount(1);
    await expect(layer.getByRole('button', { name: 'Voltar para Tipo' })).toBeVisible();
    await layer.getByRole('button', { name: 'Voltar para Tipo' }).click();
    await expect(page).toHaveURL(/\/ajustes\/habitos\/novo\/tipo/);
    await expect(layer.getByRole('button', { name: 'Cancelar' })).toBeVisible();
  });

  test('o app reaberto no meio de "Apagar todos os dados" retoma o apagar', async ({ page }) => {
    await enterDemo(page);
    await settle(page);
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open('prokope-local-demo', 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      const tx = db.transaction('docs', 'readwrite');
      const store = tx.objectStore('docs');
      const row = await new Promise<{ data: Record<string, unknown> }>((resolve) => {
        const r = store.get('profile/profile');
        r.onsuccess = () => resolve(r.result);
      });
      row.data.deleting = true;
      store.put(row);
      await new Promise((r) => (tx.oncomplete = r));
      db.close();
    });
    await page.goto('/progresso');
    await expect(page).toHaveURL(/\/comecar\/1$/, { timeout: 10_000 });
  });

  test('o Desfazer some sozinho depois de 5 s', async ({ page }) => {
    await enterDemo(page);
    await page.evaluate(() => window.__pkShell.showUndo({ title: 'Caminhada marcada' }, () => {}));
    await expect(page.locator('.sh-toast')).toBeVisible();
    await page.waitForTimeout(4000);
    await expect(page.locator('.sh-toast')).toBeVisible();
    await expect(page.locator('.sh-toast')).toHaveCount(0, { timeout: 3000 });
  });

  test.describe('movimento reduzido', () => {
    test.use({ reducedMotion: 'reduce' });

    test('empurrar vira troca de opacidade; folha e toast continuam', async ({ page }) => {
      await enterDemo(page);
      await page.getByRole('tab', { name: 'Ajustes' }).click();
      await settle(page);

      const first = await goAndSample(page, '/ajustes/pilares');
      expect(first).not.toBeNull();
      expect(Math.abs(first!.x)).toBeLessThan(1);
      expect(first!.opacity).toBeLessThan(1);
      await settle(page);
      await page.getByRole('button', { name: 'Voltar para Ajustes' }).click();
      await expect(page).toHaveURL(/\/ajustes$/);
      await settle(page);

      await go(page, '/ajustes?folha=agua', { sheetBase: '' });
      await expect(page.getByRole('dialog')).toBeVisible();
      await settle(page);
      await dragSheetDown(page, 320);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page).toHaveURL(/\/ajustes$/);

      await page.evaluate(() =>
        window.__pkShell.showUndo({ title: 'Caminhada marcada', pillar: 'familia', icon: 'check' }, () => {}),
      );
      await expect(page.locator('.sh-toast')).toBeVisible();
    });
  });

  // a preferência do perfil é a fonte (a cópia local só adianta a primeira pintura): o teste desliga pela tela
  test('o interruptor "Animações" desligado reduz pelo app', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await settle(page);
    await go(page, '/ajustes/aparencia');
    await settle(page);
    await page.getByRole('switch', { name: /Animações/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`acessibilidade da casca no tema ${colorScheme === 'light' ? 'claro' : 'escuro'}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await enterDemo(page);
      await go(page, '/hoje?folha=agua', { sheetBase: '' });
      await expect(page.getByRole('dialog')).toBeVisible();
      await settle(page);
      const sheet = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(sheet.violations).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.evaluate(() =>
        window.__pkShell.showUndo(
          { title: 'Caminhada marcada', detail: '3 de 7 na semana', pillar: 'familia', icon: 'check' },
          () => {},
        ),
      );
      await expect(page.locator('.sh-toast')).toBeVisible();
      await settle(page);
      const shell = await new AxeBuilder({ page })
        .include('[role="tablist"]')
        .include('.sh-toaster')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(shell.violations).toEqual([]);
    });
  }
});

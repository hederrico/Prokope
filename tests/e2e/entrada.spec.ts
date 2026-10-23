import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Entrada: Entrar (com a demonstração e o Google sem Firebase), Instalar no iPhone e o primeiro acesso em 3 passos.
// O primeiro acesso usa a demonstração como uma conta nova: depois de entrar, a base local do aparelho fica só com um
// perfil sem plano (como no primeiro login com Google), e o app abre em /comecar/1.

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

async function enterDemo(page: Page, agora = '07:03') {
  await page.goto(`/entrar?agora=${agora}`);
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje/);
}

/** Deixa a demonstração como uma conta recém-criada: perfil sem plano e nenhum outro dado. */
async function asNewAccount(page: Page, agora = '07:03') {
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('prokope-local-demo', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const tx = db.transaction('docs', 'readwrite');
    const store = tx.objectStore('docs');
    const rows = await new Promise<{ path: string; data: Record<string, unknown> }[]>((resolve) => {
      const r = store.getAll();
      r.onsuccess = () => resolve(r.result);
    });
    for (const row of rows) {
      if (row.path === 'profile/profile') {
        row.data.planSetupAt = null;
        store.put(row);
      } else store.delete(row.path);
    }
    await new Promise((resolve) => (tx.oncomplete = resolve));
    db.close();
    localStorage.removeItem('pk-drafts');
  });
  // abre pela entrada: a guarda leva a conta sem plano para o primeiro acesso
  await page.goto(`/entrar?agora=${agora}`);
  await expect(page).toHaveURL(/\/comecar\/1/);
}

/** Espera a passagem entre passos assentar. */
async function settle(page: Page) {
  await page.waitForTimeout(550);
}

const caption = (page: Page) => page.locator('.ob-cap');

test.describe('entrada', () => {
  test('Entrar: a demonstração abre o Hoje, e o Google sem Firebase explica com calma', async ({ page }) => {
    await page.goto('/entrar');
    await expect(page.getByRole('heading', { level: 1, name: 'Prokopē' })).toBeVisible();
    await expect(page.locator('[lang="el"]')).toHaveText('προκοπή');
    await expect(page.getByText('Seus registros ficam na sua conta. Ninguém mais vê.')).toBeVisible();

    const results = await new AxeBuilder({ page }).include('.sh-full').analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);

    test.skip(!!process.env.VITE_FIREBASE_API_KEY, 'com Firebase, o botão sai para o Google');
    await page.getByRole('button', { name: 'Entrar com Google' }).click();
    await expect(page.getByRole('status')).toContainText('ainda não está ligado');
    await expect(page).toHaveURL(/\/entrar$/);

    await page.getByRole('button', { name: /demonstra/i }).click();
    await expect(page).toHaveURL(/\/hoje$/);
  });

  test('Instalar no iPhone: "Agora não" segue para Entrar e lembra por 7 dias', async ({ browser }) => {
    const context = await browser.newContext({
      userAgent: IPHONE_SAFARI,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page).toHaveURL(/\/instalar$/);
    await expect(page.getByRole('heading', { name: 'Instale na Tela de Início' })).toBeVisible();
    await expect(page.getByRole('list').getByRole('listitem')).toHaveCount(3);
    await page.getByRole('button', { name: 'Agora não' }).click();
    await expect(page).toHaveURL(/\/entrar$/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/entrar$/);
    await context.close();
  });

  test('primeiro acesso: plano base, pilares, rotina e o primeiro Hoje', async ({ page }) => {
    await enterDemo(page);
    await asNewAccount(page);

    // passo 1: o plano base já vem escolhido
    await expect(page.getByRole('progressbar', { name: 'Passo 1 de 3' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fechar' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: /Com o plano base/ })).toBeChecked();
    await expect(page.getByText('Entrou como Henrique')).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // passo 2: chips e interruptores
    await expect(page).toHaveURL(/\/comecar\/2/);
    await settle(page);
    await expect(page.getByRole('heading', { name: 'Seus pilares' })).toBeFocused();
    await expect(caption(page)).toContainText('7 hábitos escolhidos');
    // medições desmarcadas
    for (const name of ['Peso', 'Cintura', 'Tempo de tela']) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'false');
    }
    await page.getByRole('button', { name: 'Sem Shorts e TikTok' }).click();
    await expect(caption(page)).toContainText('8 hábitos escolhidos');
    // a caminhada é a mesma em Corpo e em Família
    await page.getByRole('button', { name: 'Caminhada também em Família' }).click();
    await expect(page.getByRole('button', { name: 'Caminhada com o cachorro' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(caption(page)).toContainText('7 hábitos escolhidos');
    await page.getByRole('button', { name: 'Caminhada com o cachorro' }).click();
    // pilar fora do plano: os chips recolhem
    await page.getByRole('switch', { name: 'Família no plano' }).click();
    await expect(page.getByRole('button', { name: 'Louça' })).toHaveCount(0);
    await page.getByRole('switch', { name: 'Família no plano' }).click();
    await expect(page.getByRole('button', { name: 'Louça' })).toBeVisible();

    // fechar e reabrir o app volta para o passo salvo
    await page.goto('/entrar?agora=07:03');
    await expect(page).toHaveURL(/\/comecar\/2/);
    await expect(caption(page)).toContainText('8 hábitos escolhidos');
    await page.getByRole('button', { name: 'Continuar' }).click();

    // passo 3: horários nativos; as telas acompanham o deitar
    await expect(page).toHaveURL(/\/comecar\/3/);
    await settle(page);
    await page.getByLabel('Deitar', { exact: true }).fill('22:30');
    await expect(page.getByLabel('Telas desligadas', { exact: true })).toHaveValue('21:30');
    await expect(page.locator('.pk-li').getByText('8h20 até acordar')).toBeVisible();
    await page.getByRole('checkbox', { name: 'Sexta' }).click();
    await expect(page.getByRole('checkbox', { name: 'Sexta' })).toHaveAttribute('aria-checked', 'true');
    await expect(caption(page)).toHaveText('Fase 1 · Base · 8 hábitos · começa hoje');

    // fim: o plano é gravado e o Hoje abre, sem voltar para o primeiro acesso
    await page.getByRole('button', { name: 'Começar a fase 1' }).click();
    await expect(page).toHaveURL(/\/hoje$/);
    await page.goto('/comecar/1');
    await expect(page).toHaveURL(/\/hoje$/);
  });

  test('primeiro acesso depois das 20h: a fase começa amanhã', async ({ page }) => {
    await enterDemo(page, '20:40');
    await asNewAccount(page, '20:40');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await settle(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/comecar\/3/);
    await expect(caption(page)).toHaveText('Fase 1 · Base · 7 hábitos · começa amanhã');
  });

  test('primeiro acesso do zero: criar o primeiro pilar', async ({ page }) => {
    await enterDemo(page);
    await asNewAccount(page);
    await page.getByRole('radio', { name: /Do zero/ }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await settle(page);
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await expect(caption(page)).toHaveText('Crie pelo menos um pilar');

    await page.getByRole('button', { name: 'Criar o primeiro pilar' }).click();
    const form = page.getByRole('dialog');
    await expect(form).toBeVisible();
    await form.getByRole('textbox', { name: 'Nome' }).fill('Finanças');
    await form.getByRole('button', { name: 'Criar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('switch', { name: 'Finanças no plano' })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  });

  test('Ajustes › Testar o primeiro acesso: conta vazia, "Do zero" com uma fase, e recarregar não traz a história', async ({
    page,
  }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /Testar o primeiro acesso/ }).click();
    await expect(page).toHaveURL(/\/comecar\/1/);
    // recarregar continua no primeiro acesso (a demonstração não se semeia sozinha de novo)
    await page.reload();
    await expect(page).toHaveURL(/\/comecar\/1/);

    await page.getByRole('radio', { name: /Do zero/ }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await settle(page);
    await page.getByRole('button', { name: 'Criar o primeiro pilar' }).click();
    const form = page.getByRole('dialog');
    await form.getByRole('textbox', { name: 'Nome' }).fill('Leitura');
    await form.getByRole('button', { name: 'Criar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await settle(page);
    await expect(page).toHaveURL(/\/comecar\/3/);
    await page.getByRole('button', { name: 'Começar', exact: true }).click();
    await expect(page).toHaveURL(/\/hoje/);
    // no Hoje, o Zeno começa "O dia" (tutorial.spec.ts); aqui o teste sai do tutorial
    await page.getByRole('button', { name: 'Sair do tutorial' }).click();

    // do zero também nasce com a fase 1 (sem fim), para a Jornada ter uma fase atual
    await page.getByRole('tab', { name: 'Jornada' }).click();
    await expect(page).toHaveURL(/\/jornada/);
    await expect(page.getByText(/Base/).first()).toBeVisible();

    // "Começar de novo a demonstração" traz a história de volta
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /Começar de novo a demonstração/ }).click();
    await expect(page.getByText('A demonstração começou de novo')).toBeVisible();
    await page.getByRole('tab', { name: 'Jornada' }).click();
    await expect(page.getByText('Alimentação').first()).toBeVisible();
  });
});

import { expect, test, type Page } from '@playwright/test';

// Ajustes no tamanho do iPhone, no modo demonstração: reordenar pilares pela alça, criar um pilar, arquivar com
// Desfazer, apagar pilar (folha), criar um hábito (tipo e detalhes), mudar um horário, trocar o tema ao vivo,
// pausar e encerrar a pausa, o convite do A dois e a palavra "apagar".

// o gancho de teste da casca (window.__pkShell) está declarado em tests/e2e/global.d.ts

async function enterDemo(page: Page) {
  await page.goto('/entrar');
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje$/);
}

async function go(page: Page, to: string) {
  await page.evaluate((to) => window.__pkShell.navigate(to), to);
  await page.waitForTimeout(600);
}

async function pillarNames(page: Page): Promise<string[]> {
  return page.locator('.st-plist:not(.archived) .st-pil-main b').allInnerTexts();
}

test.describe('ajustes', () => {
  test('Ajustes mostra o plano, a rotina e o app, com a contagem dos hábitos', async ({ page }) => {
    await enterDemo(page);
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeVisible();
    for (const label of ['Meu plano', 'Rotina', 'App']) {
      await expect(page.getByRole('heading', { level: 2, name: label })).toBeVisible();
    }
    const habits = page.getByRole('button', { name: /^Hábitos/ });
    await expect(habits).toBeVisible();
    expect(Number(await habits.locator('.rv').innerText())).toBeGreaterThan(5);
    await expect(page.getByRole('button', { name: /Começar de novo a demonstração/ })).toBeVisible();
    await page
      .getByRole('button', { name: /Henrique/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ajustes\/dados$/);
  });

  test('pilares: arrastar pela alça muda a ordem e grava ao soltar', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/ajustes/pilares');
    const before = await pillarNames(page);
    expect(before.length).toBeGreaterThanOrEqual(3);
    const grip = page.getByRole('button', { name: `Mover ${before[0]}` });
    const box = await grip.boundingBox();
    if (!box) throw new Error('alça sem caixa');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let d = 0; d <= 150; d += 10) {
      await page.mouse.move(x, y + d);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await page.waitForTimeout(700);
    const after = await pillarNames(page);
    expect(after[0]).not.toBe(before[0]);
    expect(after).toContain(before[0]);
    // grava: a ordem continua depois de recarregar
    await page.reload();
    await expect(page.locator('.st-pil-main').first()).toBeVisible();
    expect(await pillarNames(page)).toEqual(after);

    // teclado: Espaço pega, seta sobe, Espaço solta
    const moved = after[1];
    await page.getByRole('button', { name: `Mover ${moved}` }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    expect((await pillarNames(page))[0]).toBe(moved);
    // as setas sozinhas também movem a linha com foco, e gravam
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    expect((await pillarNames(page))[1]).toBe(moved);
  });

  test('novo pilar: Criar só acende com nome; o pilar novo abre vazio', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/ajustes/pilares');
    await page.getByRole('button', { name: 'Novo pilar' }).click();
    await expect(page).toHaveURL(/\/ajustes\/pilares\/novo$/);
    const create = page.getByRole('button', { name: 'Criar' });
    await expect(create).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('textbox', { name: 'Nome' }).fill('Finanças');
    await expect(create).not.toHaveAttribute('aria-disabled', 'true');
    // a categoria sugerida pelo nome sobe para o topo
    await expect(page.getByText('sugerido pelo nome')).toBeVisible();
    // cor já usada: o rótulo avisa sem bloquear
    await page
      .getByRole('radio', { name: /usada em/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: /também em/ })).toBeVisible();
    await page.getByRole('radio', { name: 'Mel' }).click();
    // busca sem acento
    await page.getByRole('searchbox', { name: 'Buscar ícone' }).fill('poupar');
    await page.getByRole('radio', { name: 'Cofrinho' }).click();
    await create.click();
    await expect(page).toHaveURL(/\/ajustes\/pilares\/(?!novo)[^/]+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Finanças' })).toBeVisible();
    await expect(page.getByText('Nenhum hábito neste pilar.')).toBeVisible();
  });

  test('arquivar um pilar volta a Pilares com Desfazer; apagar pede confirmação', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/ajustes/pilares');
    const name = (await pillarNames(page))[2];
    await page.locator('.st-pil-main', { hasText: name }).click();
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();

    // apagar: a folha explica e recomenda arquivar
    await page.getByRole('button', { name: /Apagar pilar/ }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: `Apagar ${name}?` })).toBeVisible();
    await expect(sheet.getByRole('button', { name: `Apagar ${name} de vez` })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.getByRole('button', { name: /^Arquivar pilar/ }).click();
    await expect(page).toHaveURL(/\/ajustes\/pilares$/);
    const toast = page.locator('.sh-toast').filter({ hasText: `${name} arquivado` });
    await expect(toast).toBeVisible();
    await expect(page.locator('.st-plist.archived')).toContainText(name);
    await toast.getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.locator('.st-plist.archived')).toHaveCount(0);
    expect(await pillarNames(page)).toContain(name);
  });

  test('novo hábito: tipo, detalhes e Criar', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/ajustes/habitos');
    await page.getByRole('button', { name: 'Novo hábito' }).first().click();
    await expect(page).toHaveURL(/\/ajustes\/habitos\/novo\/tipo/);
    await expect(page.getByRole('heading', { name: 'Que tipo de hábito?' })).toBeVisible();
    await page.getByRole('button', { name: /^Contador/ }).click();
    await expect(page).toHaveURL(/novo\/detalhes\?tipo=counter/);
    const create = page.getByRole('button', { name: 'Criar' });
    await expect(create).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('textbox', { name: 'Nome' }).fill('Leitura');
    // a meta sobe um passo
    await page.getByRole('button', { name: 'Aumentar meta' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Meta' })).toHaveAttribute('aria-valuenow', '6');
    // "‹ Tipo" guarda o rascunho
    await page.getByRole('button', { name: 'Voltar para Tipo' }).click();
    await expect(page.getByText('escolhido')).toBeVisible();
    await page.getByRole('button', { name: /^Contador/ }).click();
    await expect(page.getByRole('textbox', { name: 'Nome' })).toHaveValue('Leitura');
    await create.click();
    await expect(page).toHaveURL(/\/ajustes\/habitos$/);
    await expect(page.getByRole('button', { name: /^Leitura\./ })).toBeVisible();
  });

  test('horários: mudar um horário grava ao fechar a roda e avisa com Desfazer', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/ajustes/horarios');
    const bed = page.getByLabel(/^Deitar, /);
    await bed.fill('22:30');
    // a roda fecha: o campo perde o foco (um toque fora)
    await page.getByText('Cada horário é a meta').click();
    const toast = page.locator('.sh-toast').filter({ hasText: 'Deitar às 22h30' });
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Mude também o alarme do iPhone.');
    await go(page, '/ajustes/lembretes');
    await expect(page.getByText('22:20')).toBeVisible();
  });

  test('aparência: o tema troca ao vivo', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/ajustes/aparencia');
    await page.getByRole('radio', { name: 'Tema Escuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'Tema Escuro' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('radio', { name: 'Tema Claro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('radio', { name: 'Tema Sistema' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  });

  test('pausar: o app inteiro, com data de volta, e encerrar', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/ajustes/pausar');
    await expect(page.getByRole('heading', { name: 'Uma pausa também faz parte.' })).toBeVisible();
    // alguns hábitos: sem nenhum marcado, o botão fica desabilitado
    await page.getByRole('radio', { name: 'Alguns hábitos' }).click();
    await expect(page.getByText('Escolha pelo menos um hábito.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Pausar/ })).toBeDisabled();
    await page.getByRole('radio', { name: 'O app inteiro' }).click();
    await page.getByRole('button', { name: /^Pausar/ }).click();
    await expect(page.locator('.sh-toast').filter({ hasText: 'Pausa começou' })).toBeVisible();
    await expect(page.getByText(/^Em pausa/)).toBeVisible();
    await page.getByRole('button', { name: 'Encerrar a pausa' }).click();
    await expect(page.locator('.sh-toast').filter({ hasText: 'Pausa encerrada' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Uma pausa também faz parte.' })).toBeVisible();
  });

  test('pausar este hábito: Pausar abre com o hábito já marcado', async ({ page }) => {
    await enterDemo(page);
    await go(page, '/ajustes/habitos');
    await page
      .getByRole('button', { name: /^Caminhada com o cachorro/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/ajustes\/habitos\/[^/]+$/);
    await page.getByRole('button', { name: /Pausar este hábito/ }).click();
    await expect(page).toHaveURL(/\/ajustes\/pausar\?habito=/);
    await expect(page.getByRole('radio', { name: 'Alguns hábitos' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('checkbox', { name: 'Caminhada com o cachorro' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('button', { name: /^Pausar/ })).toBeEnabled();
  });

  test('a dois: o convite fica pronto', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await enterDemo(page);
    await go(page, '/ajustes/a-dois');
    await page.getByRole('button', { name: 'Compartilhar convite' }).click();
    await expect(page.getByText(/Convite pronto · vale até/)).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar convite' }).click();
    await expect(page.locator('.sh-toast').filter({ hasText: 'Convite cancelado' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compartilhar convite' })).toBeVisible();
  });

  test('apagar todos os dados: o botão só acende com a palavra', async ({ page }) => {
    await enterDemo(page);
    // na demonstração, Dados e conta abre pelo cartão do perfil, com exportar e apagar
    await page.getByRole('tab', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /demonstração · seus dados/i }).click();
    await expect(page).toHaveURL(/\/ajustes\/dados$/);
    await expect(page.getByRole('button', { name: /Exportar em CSV/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Exportar em JSON/ })).toBeVisible();
    await page.getByRole('button', { name: /Apagar todos os dados/ }).click();
    await expect(page).toHaveURL(/\/ajustes\/dados\/apagar$/);
    const btn = page.locator('#st-delete-btn');
    await expect(btn).toHaveAttribute('aria-disabled', 'true');
    await page.getByLabel(/Para confirmar/).fill(' Apagar ');
    await expect(btn).not.toHaveAttribute('aria-disabled', 'true');
    await btn.click();
    await expect(page).toHaveURL(/\/comecar\/1/, { timeout: 15_000 });
    // recarregar continua no primeiro acesso: a demonstração não se semeia sozinha de novo
    await page.reload();
    await expect(page).toHaveURL(/\/comecar\/1/);
  });
});

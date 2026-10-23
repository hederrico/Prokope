import { expect, test, type Page } from '@playwright/test';

// Hábito e Progresso (docs/interacao/telas/habito-progresso.md) no tamanho do iPhone, com a demonstração semeada
// na quinta da história às 18h12: o detalhe da caminhada (força 72%, 24 com e 8 sem, humor 4,1 contra 3,4),
// corrigir um dia com Desfazer, o zero refrigerante, as vistas do Progresso (visão geral, humor, medidas, um pilar),
// o seletor de período e a folha de um dia.

async function enterDemo(page: Page, agora = '2026-10-22T18:12') {
  await page.goto(`/entrar?agora=${agora}`);
  await page.getByRole('button', { name: /demonstra/i }).click();
  await expect(page).toHaveURL(/\/hoje$/);
}

/** Espera a passagem assentar (a mola calma leva cerca de 350 ms). */
async function settle(page: Page) {
  await page.waitForTimeout(650);
}

async function openProgress(page: Page) {
  await page.getByRole('tab', { name: 'Progresso' }).click();
  await expect(page).toHaveURL(/\/progresso/);
  await settle(page);
}

async function chip(page: Page, name: string) {
  await page.getByRole('group', { name: 'O que ver' }).getByRole('button', { name, exact: true }).click();
  await settle(page);
}

async function openWalk(page: Page) {
  await openProgress(page);
  await chip(page, 'Família');
  await page.getByRole('button', { name: /^Caminhada com o cachorro/ }).click();
  await expect(page).toHaveURL(/\/progresso\/habito\//);
  await settle(page);
}

test.describe('hábito e progresso', () => {
  test('caminhada: números da história, corrigir um dia e Desfazer', async ({ page }) => {
    await enterDemo(page);
    await openWalk(page);

    await expect(page.getByRole('heading', { level: 1, name: 'Caminhada com o cachorro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltar para Progresso' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Força do hábito, 72%' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Total, 24 caminhadas' })).toBeVisible();
    await expect(page.getByText('Nos dias com caminhada, seu humor médio foi 4,1. Nos outros, 3,4.')).toBeVisible();
    await expect(page.getByText('24 dias com · 8 dias sem')).toBeVisible();

    // quarta, 21: sem caminhada → Feito
    const day = page.getByRole('button', { name: /^21 de outubro, sem caminhada/ });
    await day.scrollIntoViewIfNeeded();
    await day.click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('heading', { name: 'Quarta, 21 de outubro' })).toBeVisible();
    const group = sheet.getByRole('radiogroup', { name: 'Como foi a caminhada' });
    await expect(group.getByRole('radio', { name: /Sem caminhada/ })).toHaveAttribute('aria-checked', 'true');
    await group.getByRole('radio', { name: /Feito/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Caminhada marcada na quarta')).toBeVisible();
    await expect(page.getByRole('button', { name: /^21 de outubro, caminhada feita/ })).toBeVisible();

    // Desfazer volta ao estado anterior
    await page.getByRole('button', { name: 'Desfazer' }).click();
    await expect(page.getByRole('button', { name: /^21 de outubro, sem caminhada/ })).toBeVisible();
  });

  test('zero refrigerante: a contagem, o recorde e os períodos', async ({ page }) => {
    await enterDemo(page);
    await openProgress(page);
    await chip(page, 'Alimentação');
    await page.getByRole('button', { name: /^Zero refrigerante/ }).click();
    await settle(page);
    await expect(page.getByText('12 dias sem refrigerante. Recorde de 21 dias.')).toBeAttached();
    await expect(page.getByRole('button', { name: /^12 dias, de 11 de outubro a hoje/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^21 dias, .*recorde/ })).toBeVisible();
    await expect(page.getByText('Mais 9 dias e você iguala o seu recorde.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registrar deslize' })).toBeVisible();
  });

  test('progresso: visão geral, período, humor, medidas e um dia', async ({ page }) => {
    await enterDemo(page);
    await openProgress(page);

    // visão geral
    await expect(page.getByRole('meter', { name: 'Constância da semana, 76% até agora' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Família\s*88%/ })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Período' })).toContainText('19 – 25 de outubro');
    await expect(page.getByRole('button', { name: 'Próximo período' })).toHaveAttribute('aria-disabled', 'true');

    // semana anterior e de volta
    await page.getByRole('button', { name: 'Período anterior' }).click();
    await expect(page.getByRole('group', { name: 'Período' })).toContainText('12 – 18 de outubro');
    await expect(page).toHaveURL(/semana=2026-10-12/);
    await page.getByRole('button', { name: 'Voltar para esta semana' }).click();
    await expect(page.getByRole('group', { name: 'Período' })).toContainText('19 – 25 de outubro');

    // humor: o período vira o mês
    await chip(page, 'Humor');
    await expect(page).toHaveURL(/periodo=mes/);
    await expect(page.getByRole('group', { name: 'Período' })).toContainText('Outubro');
    await page.getByRole('button', { name: /^21 de outubro, humor/ }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'Quarta, 21 de outubro' })).toBeVisible();
    await expect(sheet.getByText('Hábitos', { exact: true })).toBeVisible();
    await sheet.getByRole('button', { name: 'Editar este dia' }).click();
    await expect(page).toHaveURL(/\/hoje\?dia=2026-10-21/);

    // medidas: a frase neutra do peso
    await openProgress(page);
    await chip(page, 'Medidas');
    await expect(page.getByRole('heading', { name: 'A média desceu 1,1 kg em 3 semanas' })).toBeVisible();
    await page.getByRole('button', { name: 'Ocultar os valores' }).click();
    await expect(page.getByRole('heading', { name: 'A média desceu ••• kg em 3 semanas' })).toBeVisible();
  });
});

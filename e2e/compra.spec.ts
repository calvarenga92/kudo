import { expect, test } from '@playwright/test';
import {
  adicionarPeca, adicionarPrimeiraPeca, cadastrarCarteira, CARTEIRA_RECUSADA, contraApi,
  entrarComContaNova, limparEstado, url,
} from './apoio';

test.beforeEach(async ({ page }) => { await limparEstado(page); });

/** Uma peça diferente por teste e por projeto (desktop 1–3, mobile 4–6); a 8ª está esgotada. */
const pecaDaCompra = (n: 1 | 2 | 3) => n + (test.info().project.name === 'mobile' ? 3 : 0);

test('carrinho vazio orienta o proximo passo', async ({ page }) => {
  await page.goto('/carrinho');
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explorar o mercado' })).toBeVisible();
});

test('adiciona peca, ajusta quantidade e ve o total acompanhar', async ({ page }) => {
  await adicionarPrimeiraPeca(page);
  await page.goto('/carrinho');

  const total = page.locator('dd').last();
  const antes = await total.textContent();

  await page.getByRole('button', { name: /Aumentar quantidade/ }).click();
  await expect(total).not.toHaveText(antes ?? '');
});

test('cupom valido desconta e cupom invalido avisa', async ({ page }) => {
  await adicionarPrimeiraPeca(page);
  await page.goto('/carrinho');

  await page.getByLabel('Código promocional').fill('KURIO10');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByText('10% de desconto')).toBeVisible();

  await page.getByRole('button', { name: /Remover cupom/ }).click();
  await page.getByLabel('Código promocional').fill('NAOEXISTE');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByRole('alert')).toHaveText('Cupom não encontrado.');
});

test('valores do resumo aparecem no padrao brasileiro', async ({ page }) => {
  await adicionarPrimeiraPeca(page);
  await page.goto('/carrinho');

  const valor = (termo: string) =>
    page.locator('dt', { hasText: termo }).locator('xpath=following-sibling::dd');

  await expect(valor('Taxa de rede')).toHaveText('0,0042 ETH');

  await page.getByLabel('Código promocional').fill('KURIO10');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(valor('Desconto')).toHaveText(/^\(-\) \d{1,3}(\.\d{3})*,\d+ ETH$/);
  await expect(page.locator('dd').last()).toHaveText(/^\d{1,3}(\.\d{3})*,\d+ ETH$/);
});

test('cupom expirado tem mensagem propria', async ({ page }) => {
  await adicionarPrimeiraPeca(page);
  await page.goto('/carrinho');
  await page.getByLabel('Código promocional').fill('EXPIRADO50');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByRole('alert')).toHaveText('Este cupom expirou.');
});

test('compra completa leva ao recibo e esvazia o carrinho', async ({ page }) => {
  await entrarComContaNova(page);
  await adicionarPeca(page, pecaDaCompra(1));

  await page.goto('/pagamento');
  await cadastrarCarteira(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await page.waitForURL(/\/pedido\//);
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible();

  await page.goto('/carrinho');
  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible();
});

test('pagamento recusado mostra o motivo em vez de confirmar', async ({ page }) => {
  await entrarComContaNova(page);
  await adicionarPeca(page, pecaDaCompra(2));

  // no mock a recusa é um cenário; na API, carteira terminada em "dead" (README da kudo-api)
  if (contraApi) {
    await page.goto('/pagamento');
    await cadastrarCarteira(page, CARTEIRA_RECUSADA);
  } else {
    await page.goto(url('/pagamento', { cenario: 'pagamento-recusado' }));
    await cadastrarCarteira(page);
  }
  await page.getByRole('button', { name: 'Confirmar compra' }).click();

  await page.waitForURL(/\/pedido\//);
  await expect(page.getByText('A transação foi recusada')).toBeVisible();
});

test('recibo continua acessivel ao recarregar', async ({ page }) => {
  await entrarComContaNova(page);
  await adicionarPeca(page, pecaDaCompra(3));
  await page.goto('/pagamento');
  await cadastrarCarteira(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await page.waitForURL(/\/pedido\//);

  await page.reload();
  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible();
});

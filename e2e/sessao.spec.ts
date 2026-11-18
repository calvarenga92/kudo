import { expect, test } from '@playwright/test';
import { BASE_API, CONTA, entrar, entrarComContaNova, limparEstado } from './apoio';

test.beforeEach(async ({ page }) => { await limparEstado(page); });

test('entra com credenciais validas e mostra o usuario no cabecalho', async ({ page }) => {
  await entrar(page);
  await expect(page.getByRole('link', { name: 'Claudio' })).toBeVisible();
});

test('credenciais invalidas mostram erro sem revelar se o e-mail existe', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(CONTA.email);
  await page.getByLabel('Senha').fill('senhaerrada');
  await page.getByRole('button', { name: 'Entrar' }).click();

  const alerta = page.getByRole('alert');
  await expect(alerta).toHaveText('E-mail ou senha incorretos.');

  // e-mail inexistente devolve exatamente a mesma mensagem
  await page.getByLabel('E-mail').fill('ninguem@kudo.test');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(alerta).toHaveText('E-mail ou senha incorretos.');
});

test('cadastro valida os campos e devolve erro por campo', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByRole('tab', { name: 'Criar conta' }).click();

  await page.getByLabel('Nome').fill('Teste');
  await page.getByLabel('E-mail').fill('invalido');
  await page.getByLabel('Senha').fill('123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByText('E-mail inválido.')).toBeVisible();
  await expect(page.getByText('Use ao menos 8 caracteres.')).toBeVisible();
});

test('rota protegida redireciona para entrar e preserva o destino', async ({ page }) => {
  await page.goto('/perfil');
  await expect(page).toHaveURL(/\/entrar\?destino=%2Fperfil/);
});

/**
 * O servidor deixa de reconhecer o token (venceu, ou a pessoa saiu em outro aparelho) com a
 * página ainda achando que está logada. Antes isto era simulado com uma sessão que já nascia
 * vencida, e o teste passava sem o token chegar a ser aceito. Agora o token vale primeiro e
 * é revogado depois.
 */
test('sessao encerrada no servidor nao deixa o usuario preso numa tela logada', async ({ page }) => {
  await entrarComContaNova(page);
  await page.goto('/perfil');
  await expect(page).toHaveURL(/\/perfil/);

  const status = await page.evaluate(async (base) => {
    const token = sessionStorage.getItem('kudo.token');
    const r = await fetch(`${base}/sessao`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.status;
  }, BASE_API);
  expect(status).toBe(204);

  await page.reload();
  await expect(page).toHaveURL(/\/entrar/);
});

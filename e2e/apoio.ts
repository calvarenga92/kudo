import { expect, test, type Page } from '@playwright/test';

/**
 * Com VITE_API_URL a suíte roda contra a API real (na kudo-api: `npm run test:e2e:front`);
 * sem ela, contra o MSW. O mesmo teste vale para os dois: é o contrato.
 */
export const contraApi = Boolean(process.env.VITE_API_URL);
export const BASE_API = process.env.VITE_API_URL ?? '/api';

/** Cenários (?cenario=) e eventos simulados existem só no MSW; a API real não tem esse modo. */
export function soNoMock(motivo: string) {
  test.skip(contraApi, `só no mock: ${motivo}`);
}

export const CONTA = {
  email: 'claudio@kudo.test',
  senha: 'senha12345',
};

export function url(caminho: string, parametros: Record<string, string> = {}) {
  const busca = new URLSearchParams(parametros).toString();
  return busca ? `${caminho}?${busca}` : caminho;
}

/** Entra na conta de demonstração. Só para teste que não muda nada na conta. */
export async function entrar(pagina: Page) {
  await pagina.goto('/entrar');
  await pagina.getByLabel('E-mail').fill(CONTA.email);
  await pagina.getByLabel('Senha').fill(CONTA.senha);
  await pagina.getByRole('button', { name: 'Entrar' }).click();
  await pagina.waitForURL('/');
}

/**
 * Cria uma conta só deste teste e entra nela. Contra a API o banco é compartilhado entre os
 * testes paralelos: com a conta demo, um teste esvaziava o carrinho enquanto outro pagava.
 */
export async function entrarComContaNova(pagina: Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@kudo.test`;
  await pagina.goto('/entrar');
  await pagina.getByRole('tab', { name: 'Criar conta' }).click();
  await pagina.getByLabel('Nome').fill('Claudio Teste');
  await pagina.getByLabel('E-mail').fill(email);
  await pagina.getByLabel('Senha').fill(CONTA.senha);
  await pagina.getByRole('button', { name: 'Criar conta' }).click();
  await pagina.waitForURL('/');
  return email;
}

export const CARTEIRA_OK = `0x${'a1'.repeat(20)}`;
/** Na API, o gateway simulado recusa carteira com endereço terminado em "dead". */
export const CARTEIRA_RECUSADA = `0x${'b2'.repeat(18)}dead`;

/** Conta nova não tem carteira: o pagamento pede uma antes de liberar a confirmação. */
export async function cadastrarCarteira(pagina: Page, endereco = CARTEIRA_OK) {
  const salvar = pagina.getByRole('button', { name: 'Salvar carteira' });
  await pagina.getByLabel('Apelido da carteira').fill('Carteira de teste');
  await pagina.getByLabel('Endereço da carteira').fill(endereco);
  await salvar.click();
  await expect(salvar).toBeHidden();
}

/** Cada teste parte de um estado limpo: o mock guarda tudo em localStorage. */
export async function limparEstado(pagina: Page) {
  await pagina.goto('/');
  await pagina.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // storage indisponivel
    }
  });
}

/**
 * O blog da home tambem usa <article>, entao o catalogo precisa de escopo
 * proprio — senao a contagem mistura peca com post.
 */
export const cartoes = (pagina: Page) =>
  pagina.locator('section[aria-labelledby="titulo-catalogo"] article');

/** allTextContents e count nao esperam: a grade precisa estar montada antes. */
export async function aguardarCatalogo(pagina: Page) {
  await cartoes(pagina).first().waitFor();
}

export const adicionarPrimeiraPeca = (pagina: Page) => adicionarPeca(pagina, 0);

/**
 * Teste que compra de verdade usa uma peça só dele: contra a API o estoque baixa, e todos
 * comprando a primeira peça a esgotavam no meio da rodada. Os índices ficam na 1ª página.
 */
export async function adicionarPeca(pagina: Page, indice: number) {
  await pagina.goto('/');
  await aguardarCatalogo(pagina);
  await cartoes(pagina).nth(indice).locator('a').first().click();
  await pagina.waitForURL(/\/nft\//);
  await pagina.getByRole('button', { name: /Comprar/ }).click();
  await pagina.getByText('Adicionado ao carrinho.').waitFor();
}

/** Lê um preço exibido no padrão brasileiro ("1.234,56 ETH") como número. */
export const precoEmNumero = (texto: string) =>
  Number(texto.replace(' ETH', '').replace(/\./g, '').replace(',', '.'));

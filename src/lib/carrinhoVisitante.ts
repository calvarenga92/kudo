/**
 * Com a API real, o carrinho de quem ainda não entrou é identificado por um id que a
 * API devolve no cabeçalho X-Carrinho-Visitante. Guardo e reenvio; ao entrar, a API
 * passa os itens para a conta e o id deixa de valer. No mock, o cabeçalho é ignorado.
 */
export const CABECALHO_CARRINHO = 'X-Carrinho-Visitante';
const CHAVE = 'kudo.carrinho-visitante';

export function lerCarrinhoVisitante(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function gravarCarrinhoVisitante(id: string): void {
  try {
    localStorage.setItem(CHAVE, id);
  } catch {
    // storage bloqueado: o carrinho de visitante não sobrevive ao recarregar
  }
}

export function limparCarrinhoVisitante(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // nada a fazer
  }
}

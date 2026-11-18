/**
 * Valores monetários em string decimal, somados como inteiros de 18 casas.
 * A regra vive no pacote compartilhado com o app mobile; este arquivo só a reexporta
 * para que nenhum import do app precise mudar.
 *
 * A exibição em ETH também vem do pacote, já no padrão brasileiro ("1,99 ETH"),
 * igual no app mobile. O valor em si nunca é convertido.
 */
export {
  paraUnidades, paraTexto, somar, subtrair, multiplicar, percentual, comparar, menor, formatarEth,
} from '@calvarenga92/kudo-regras';

/**
 * Converte um número em texto decimal ("1234.5") para o padrão brasileiro
 * ("1.234,5"): vírgula separa as casas decimais e ponto agrupa os milhares.
 */
export function paraExibicao(texto: string): string {
  const negativo = texto.startsWith('-');
  const [inteira, decimal] = (negativo ? texto.slice(1) : texto).split('.');
  const agrupada = inteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}${agrupada}${decimal === undefined ? '' : `,${decimal}`}`;
}


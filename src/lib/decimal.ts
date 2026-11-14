/**
 * Valores monetários em string decimal, somados como inteiros de 18 casas.
 * A regra vive no pacote compartilhado com o app mobile; este arquivo só a reexporta
 * para que nenhum import do app precise mudar.
 *
 * A exibição é a única coisa local: o pacote formata com ponto decimal e aqui o
 * texto passa para o padrão brasileiro. O valor em si nunca é convertido.
 */
import { formatarEth as formatarEthComPonto } from '@calvarenga92/kurio-regras';

export {
  paraUnidades, paraTexto, somar, subtrair, multiplicar, percentual, comparar, menor,
} from '@calvarenga92/kurio-regras';

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

/** Valor em ETH pronto para a tela: "1,99 ETH", "0,0042 ETH". */
export function formatarEth(valor: string): string {
  const [numero, ...resto] = formatarEthComPonto(valor).split(' ');
  return [paraExibicao(numero), ...resto].join(' ');
}

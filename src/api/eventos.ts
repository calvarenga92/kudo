/**
 * Todo evento carrega identidade, recurso afetado e versão. O cliente descarta
 * duplicata pelo id e versão anterior à que já aplicou. O contrato mora no
 * @calvarenga92/kudo-regras, o mesmo pacote que a API usa.
 */
export type {
  EventoBase, EventosCliente, EventosServidor, NftAtualizado, PedidoAtualizado,
} from '@calvarenga92/kudo-regras';

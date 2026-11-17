import { io, type Socket } from 'socket.io-client';
import type { EventosCliente, EventosServidor } from '@/api/eventos';
import { lerToken } from '@/lib/token';
import type { Conexao, EstadoConexao } from './tipos';

type SocketTipado = Socket<EventosServidor, EventosCliente>;

export function criarSocket(url: string): Conexao {
  const socket: SocketTipado = io(url, {
    transports: ['websocket'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  const observadores = new Set<(estado: EstadoConexao) => void>();
  let estadoAtual: EstadoConexao = 'conectando';
  // O servidor esquece as salas quando a conexão cai: na reconexão me identifico de novo.
  let identificado: string | null | undefined;

  function enviarIdentificacao() {
    if (identificado === undefined) return;
    // Quem decide a sala é o token; o id sozinho não abre os eventos privados da conta.
    socket.emit('session.identify', { usuarioId: identificado, token: identificado ? lerToken() : null });
  }

  function definirEstado(proximo: EstadoConexao) {
    estadoAtual = proximo;
    observadores.forEach((o) => o(proximo));
  }

  socket.on('connect', () => {
    definirEstado('conectado');
    enviarIdentificacao();
  });
  socket.on('disconnect', () => definirEstado('desconectado'));
  socket.io.on('reconnect_attempt', () => definirEstado('conectando'));

  return {
    escutar(evento, ouvinte) {
      socket.on(evento, ouvinte as never);
      return () => { socket.off(evento, ouvinte as never); };
    },
    observarEstado(ouvinte) {
      observadores.add(ouvinte);
      ouvinte(estadoAtual);
      return () => observadores.delete(ouvinte);
    },
    identificar(usuarioId) {
      identificado = usuarioId;
      if (socket.connected) enviarIdentificacao();
    },
    encerrar() {
      observadores.clear();
      socket.disconnect();
    },
  };
}

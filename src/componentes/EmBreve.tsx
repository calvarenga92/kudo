export function EmBreve({ titulo }: { titulo: string }) {
  return (
    <section className="conteudo flex min-h-[40vh] flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-display text-foreground">{titulo}</h1>
      <p className="max-w-md text-body text-muted">
        Esta área ainda não foi construída. A rota existe para a navegação
        do layout continuar coerente.
      </p>
    </section>
  );
}

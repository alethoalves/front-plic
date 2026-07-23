// Combina fichas de projeto + fichas de um plano específico numa linha por
// avaliador (mesmo avaliador pode ter enviado as duas na mesma submissão,
// já que quem avalia o projeto também avalia o(s) plano(s) dele). Ignora
// fichas "sem nota" (notaTotal null, período de projeto bloqueado) tanto na
// soma quanto na contagem — evita que uma ficha placeholder apareça como
// "a nota mais baixa" quando na verdade não representa uma nota real.
export const combinarFichasPorAvaliador = (fichasProjeto = [], fichasPlano = []) => {
  const porAvaliador = new Map();

  fichasProjeto
    .filter((f) => f.notaTotal !== null)
    .forEach((f) => {
      porAvaliador.set(f.avaliadorId, {
        avaliadorId: f.avaliadorId,
        avaliador: f.avaliador,
        notaTotal: f.notaTotal,
        fichaProjetoId: f.id,
        fichaPlanoId: null,
        arquivadaProjeto: f.arquivada,
        arquivadaPlano: null,
      });
    });

  fichasPlano
    .filter((f) => f.notaTotal !== null)
    .forEach((f) => {
      const existente = porAvaliador.get(f.avaliadorId);
      if (existente) {
        existente.notaTotal += f.notaTotal;
        existente.fichaPlanoId = f.id;
        existente.arquivadaPlano = f.arquivada;
      } else {
        porAvaliador.set(f.avaliadorId, {
          avaliadorId: f.avaliadorId,
          avaliador: f.avaliador,
          notaTotal: f.notaTotal,
          fichaProjetoId: null,
          fichaPlanoId: f.id,
          arquivadaProjeto: null,
          arquivadaPlano: f.arquivada,
        });
      }
    });

  return Array.from(porAvaliador.values()).map((row) => ({
    ...row,
    // Indicador de linha combinada: arquivada se qualquer uma das duas
    // partes (projeto/plano) estiver arquivada.
    arquivada: Boolean(row.arquivadaProjeto || row.arquivadaPlano),
    // Prefere a ficha de projeto como id "principal" da linha (mesmo
    // comportamento já usado por abrirFichaDetalhada em ProjetoAvaliacaoResumo).
    fichaId: row.fichaProjetoId ?? row.fichaPlanoId,
  }));
};

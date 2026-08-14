// Agrupa participações ignoradas (vindas de aprovar/reprovarParticipacao,
// shape { id, motivo }[]) por motivo, pra um resumo legível no toast — ex.:
// " (3 ignoradas: 2 por orientador ainda não aprovado, 1 por plano não
// classificado)".
export const resumirParticipacoesIgnoradas = (ignoradas) => {
  if (!ignoradas || ignoradas.length === 0) return "";
  const porMotivo = new Map();
  ignoradas.forEach(({ motivo }) => {
    const chave = motivo || "motivo não informado";
    porMotivo.set(chave, (porMotivo.get(chave) || 0) + 1);
  });
  const detalhes = [...porMotivo.entries()]
    .map(([motivo, qtd]) => `${qtd} por ${motivo.toLowerCase()}`)
    .join(", ");
  return ` (${ignoradas.length} ignorada${ignoradas.length > 1 ? "s" : ""}: ${detalhes})`;
};

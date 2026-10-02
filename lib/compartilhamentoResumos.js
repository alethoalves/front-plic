// Rótulos compartilhados entre o admin (gerar/listar links) e a página
// pública /compartilhado/resumos/[token].

export const PREMIACAO_OPCOES = [
  { value: "INDICACAO_PREMIO", label: "Indicação a prêmio" },
  { value: "MENCAO_HONROSA", label: "Menção honrosa" },
  { value: "PREMIO", label: "Premiado" },
];

export const COMENTARIO_OPCOES = [
  { value: null, label: "Com ou sem comentário" },
  { value: "COM", label: "Apenas com comentário" },
  { value: "SEM", label: "Apenas sem comentário" },
];

export const EXIBICAO_OPCOES = [
  { value: "AMBOS", label: "Original e depurado (quem acessa escolhe)" },
  { value: "DEPURADO", label: "Apenas depurado por IA" },
  { value: "ORIGINAL", label: "Apenas original" },
  { value: "NENHUM", label: "Não exibir comentários" },
];

const formatarNota = (n) => Number(n).toLocaleString("pt-BR");

// "A, B, C e mais 2" — evita descrições enormes quando muitas áreas são escolhidas
const resumirLista = (nomes, max = 3) =>
  nomes.length > max ? `${nomes.slice(0, max).join(", ")} e mais ${nomes.length - max}` : nomes.join(", ");

// Lista legível dos filtros de um link, ex.: ["Menção honrosa ou Premiado", "Nota ≥ 8"]
export const descreverFiltros = (filtros) => {
  if (!filtros) return [];
  const partes = [];
  if (filtros.premiacao?.length) {
    partes.push(
      filtros.premiacao
        .map((p) => PREMIACAO_OPCOES.find((o) => o.value === p)?.label || p)
        .join(" ou ")
    );
  }
  if (filtros.categorias?.length) partes.push(`Modalidade: ${resumirLista(filtros.categorias)}`);
  if (filtros.grandeAreasNomes?.length) partes.push(`Grande área: ${resumirLista(filtros.grandeAreasNomes)}`);
  if (filtros.areasNomes?.length) partes.push(`Área: ${resumirLista(filtros.areasNomes)}`);
  if (filtros.comentario === "COM") partes.push("Com comentário");
  if (filtros.comentario === "SEM") partes.push("Sem comentário");
  const { notaMin, notaMax } = filtros;
  if (notaMin != null && notaMax != null) partes.push(`Nota de ${formatarNota(notaMin)} a ${formatarNota(notaMax)}`);
  else if (notaMin != null) partes.push(`Nota ≥ ${formatarNota(notaMin)}`);
  else if (notaMax != null) partes.push(`Nota ≤ ${formatarNota(notaMax)}`);
  return partes;
};

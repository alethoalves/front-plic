// Tipos de campo que não fazem sentido (ou não são seguros) como coluna de tabela:
// texto rico não tem representação tabular útil e não deve ter seu conteúdo bruto exposto.
export const TIPOS_NAO_SELECIONAVEIS = ["blockNote"];

// Formata o valor de uma Resposta (campo dinâmico) pra exibição numa célula de tabela
export const formatarValorCampoDinamico = (resposta, tipo) => {
  if (!resposta) return "-";
  const { value } = resposta;

  if (tipo === "flag") {
    return value === "true" || value === true ? "Sim" : "Não";
  }
  if (tipo === "checkbox" || tipo === "multiselect") {
    if (typeof value !== "string") return "-";
    try {
      const parsed = JSON.parse(value);
      return (Array.isArray(parsed) ? parsed : [String(parsed)]).join(", ");
    } catch {
      return value.split(",").map((v) => v.trim()).filter(Boolean).join(", ");
    }
  }
  if (tipo === "arquivo") return value ? "Arquivo anexado" : "-";

  return value || "-";
};

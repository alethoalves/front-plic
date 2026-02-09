/**
 * Aplica regras condicionais (visibilidade) aos campos
 * @param {Array} campos - Array de campos do formulário
 * @param {Object} values - Valores atuais do formulário (result of watch())
 * @returns {Array} Array contendo os ids dos campos que devem ser visíveis
 */
export const applyConditionalRules = (campos, values) => {
  const visibleFieldIds = new Set();

  // Adiciona TODOS os campos como visíveis por padrão
  campos.forEach((campo) => {
    visibleFieldIds.add(campo.id);
  });

  // Processa cada regra para aplicar lógica de visibilidade
  campos.forEach((campo) => {
    if (campo.regras && campo.regras.length > 0) {
      campo.regras.forEach((regra) => {
        // Obtém o valor do campo que dispara a regra
        const campoTrigger = campos.find((c) => c.id === regra.campoId);
        if (!campoTrigger) return;

        const valorAtual = values[`campo_${regra.campoId}`];
        const condicaoAtingida = verificaCondicao(
          valorAtual,
          regra.condicao,
          regra.valores
        );

        // Se a ação é MOSTRAR e a condição foi atingida, adiciona os campos
        if (regra.acao === "MOSTRAR" && condicaoAtingida) {
          regra.camposAlvo.forEach((campoId) => {
            visibleFieldIds.add(campoId);
          });
        }
        // Se a ação é MOSTRAR e a condição NÃO foi atingida, remove os campos
        else if (regra.acao === "MOSTRAR" && !condicaoAtingida) {
          regra.camposAlvo.forEach((campoId) => {
            visibleFieldIds.delete(campoId);
          });
        }
        // Se a ação é ESCONDER e a condição foi atingida, remove os campos
        else if (regra.acao === "ESCONDER" && condicaoAtingida) {
          regra.camposAlvo.forEach((campoId) => {
            visibleFieldIds.delete(campoId);
          });
        }
      });
    }
  });

  return Array.from(visibleFieldIds);
};

/**
 * Verifica se uma condição é atingida
 * @param {*} valor - Valor atual do campo
 * @param {string} condicao - Tipo de condição (IGUAL, DIFERENTE, CONTÉM, etc)
 * @param {Array} valores - Valores para comparar
 * @returns {boolean}
 */
const verificaCondicao = (valor, condicao, valores) => {
  // Se o valor for um array (para multiselect), precisamos verificar se há interseção
  const valorArray = Array.isArray(valor) ? valor : [valor];

  switch (condicao) {
    case "IGUAL":
      return valorArray.some((v) => valores.includes(v));

    case "DIFERENTE":
      return !valorArray.some((v) => valores.includes(v));

    case "CONTÉM":
      return valorArray.some((v) =>
        v && typeof v === "string"
          ? valores.some((val) =>
              v.toLowerCase().includes(val.toLowerCase())
            )
          : false
      );

    case "NÃO_CONTÉM":
      return !valorArray.some((v) =>
        v && typeof v === "string"
          ? valores.some((val) =>
              v.toLowerCase().includes(val.toLowerCase())
            )
          : false
      );

    case "VAZIO":
      return (
        !valor ||
        (Array.isArray(valor) && valor.length === 0) ||
        valor === ""
      );

    case "NÃO_VAZIO":
      return (
        valor && (Array.isArray(valor) ? valor.length > 0 : valor !== "")
      );

    case "MAIOR_QUE":
      return Number(valor) > Number(valores[0]);

    case "MENOR_QUE":
      return Number(valor) < Number(valores[0]);

    default:
      return true;
  }
};

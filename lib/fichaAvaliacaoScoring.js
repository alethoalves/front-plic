/*
  Motor de pontuação da ficha de avaliação (Projeto/Plano de Trabalho) — espelha
  api-plic/src/services/fichaAvaliacaoScoring.js. Usado tanto no editor do gestor (preview de
  pontuação máxima) quanto na tela de preenchimento do avaliador (subtotais ao vivo).

  Um nó da árvore `schemaCriterios` é:
    - grupo:    { id, tipo: 'grupo', label, descricao?, itens: [nó, ...] }
    - critério: { id, tipo: 'criterio', label, descricao?, peso, escala }

  `escala` sempre resolve o valor escolhido para uma fração 0-1 do próprio min/max do
  critério; pontos do critério = fração × peso. Pontos de um grupo = soma dos filhos.
*/

export const TIPOS_ESCALA = [
  { value: "binaria", label: "Sim / Não" },
  { value: "likert", label: "Rótulos customizados (ex: 0 / 0,5 / 1)" },
  { value: "numerica", label: "Números (pills)" },
  { value: "slider", label: "Barra deslizante" },
  { value: "manual", label: "Campo de nota manual" },
];

export const novoCriterio = () => ({
  id: `crit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  tipo: "criterio",
  label: "",
  descricao: "",
  peso: 1,
  escala: {
    tipo: "binaria",
    opcoes: [
      { valor: 0, label: "Não" },
      { valor: 1, label: "Sim" },
    ],
  },
});

export const novoGrupo = () => ({
  id: `grp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  tipo: "grupo",
  label: "",
  descricao: "",
  itens: [],
});

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const resolverMinMax = (escala) => {
  if (escala.tipo === "binaria" || escala.tipo === "likert") {
    const valores = (escala.opcoes || []).map((o) => o.valor);
    return { min: Math.min(...valores), max: Math.max(...valores) };
  }
  return { min: escala.min, max: escala.max };
};

const calcularFracao = (escala, valor) => {
  const { min, max } = resolverMinMax(escala);
  if (max === min) return 0;
  return (valor - min) / (max - min);
};

/** Soma recursiva dos pesos — pontuação máxima de um ramo (grupo ou raiz da árvore). */
export const pontuacaoMaximaSchema = (nos = []) =>
  round2(
    nos.reduce(
      (soma, no) => soma + (no.tipo === "grupo" ? pontuacaoMaximaSchema(no.itens) : (no.peso || 0)),
      0
    )
  );

/** Extrai só os critérios-folha da árvore (usado pra validar se todos foram respondidos). */
export const listarCriterios = (nos = [], acc = []) => {
  for (const no of nos) {
    if (no.tipo === "grupo") listarCriterios(no.itens, acc);
    else acc.push(no);
  }
  return acc;
};

/**
 * Calcula pontosObtidos/pontosMaximos em toda a árvore a partir de um
 * Map<criterioId, {valorSelecionado, comentario?}>. Não faz mutação — devolve uma nova
 * árvore anotada, pronta tanto para exibir subtotais ao vivo quanto para montar o
 * payload de envio (`flattenRespostas`). `comentario` é sempre opcional.
 */
export const calcularArvoreComNotas = (nos = [], valoresPorId) => {
  let pontosObtidos = 0;
  let pontosMaximos = 0;
  const arvore = nos.map((no) => {
    if (no.tipo === "grupo") {
      const filho = calcularArvoreComNotas(no.itens, valoresPorId);
      pontosObtidos += filho.pontosObtidos;
      pontosMaximos += filho.pontosMaximos;
      return { ...no, itens: filho.arvore, pontosObtidos: filho.pontosObtidos, pontosMaximos: filho.pontosMaximos };
    }
    const { valorSelecionado, comentario } = valoresPorId.get(no.id) || {};
    const respondido = typeof valorSelecionado === "number" && !Number.isNaN(valorSelecionado);
    const pontos = respondido ? calcularFracao(no.escala, valorSelecionado) * no.peso : 0;
    pontosObtidos += pontos;
    pontosMaximos += no.peso;
    return { ...no, valorSelecionado, comentario, respondido, pontosObtidos: round2(pontos) };
  });
  return { arvore, pontosObtidos: round2(pontosObtidos), pontosMaximos: round2(pontosMaximos) };
};

/** Achata a árvore calculada em [{id, valorSelecionado, comentario}] — payload da API. */
export const flattenRespostas = (nosCalculados = [], acc = []) => {
  for (const no of nosCalculados) {
    if (no.tipo === "grupo") flattenRespostas(no.itens, acc);
    else if (no.respondido) acc.push({ id: no.id, valorSelecionado: no.valorSelecionado, comentario: no.comentario });
  }
  return acc;
};

/** Rótulo legível do valor escolhido, para telas somente-leitura (auditoria/ficha salva). */
export const rotuloValor = (escala, valor) => {
  if (!escala) return String(valor);
  if (escala.tipo === "binaria" || escala.tipo === "likert") {
    return escala.opcoes?.find((o) => o.valor === valor)?.label ?? String(valor);
  }
  return String(valor);
};

/*
  Motor de pontuação da ficha de avaliação de submissões (Evento) — espelha
  api-plic/src/services/criterioAvaliacaoScoring.js. Usado nas telas de
  preenchimento do avaliador (prévia ao vivo da nota; o total definitivo é
  sempre recalculado no servidor) e no formulário de configuração do admin.

  Reaproveita o motor de fração 0-1 de lib/fichaAvaliacaoScoring.js, que já
  é agnóstico a árvore/shape (opera em cima de um único `escala`+`valor`).
*/

import { resolverMinMax, calcularFracao, rotuloValor } from "./fichaAvaliacaoScoring.js";

export { rotuloValor };

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const escalaPadraoQualitativa = () => [
  { valor: 0, label: "Não atende", descricao: "" },
  { valor: 0.5, label: "Atende parcialmente", descricao: "" },
  { valor: 1, label: "Atende totalmente", descricao: "" },
];

export const construirEscala = (criterio) => {
  if (criterio.tipoEntrada === "QUALITATIVA") {
    return { tipo: "likert", opcoes: criterio.escala || [] };
  }
  return { tipo: "numerica", min: criterio.notaMinima, max: criterio.notaMaxima };
};

/**
 * `criterios`: [CriterioAvaliacao, ...]
 * `valoresPorId`: { [criterioId]: number } — mesmo shape do estado
 * `selectedNotas` já usado nas telas de preenchimento.
 * Prévia ao vivo da nota final (0-10) — mesma fórmula usada no servidor:
 * média das frações (0-1) por critério, ponderada por peso. O peso de TODOS
 * os critérios entra no denominador (mesmo os ainda não respondidos, que
 * contam fração 0), pra prévia não pular pro topo só porque o primeiro
 * critério respondido foi marcado no valor máximo.
 */
export const calcularNotaTotalPonderada = (criterios, valoresPorId) => {
  let somaPontos = 0;
  let somaPesos = 0;
  for (const criterio of criterios) {
    const peso = criterio.peso ?? 1;
    somaPesos += peso;
    const valor = valoresPorId[criterio.id];
    if (valor === undefined) continue;
    const escala = construirEscala(criterio);
    somaPontos += calcularFracao(escala, valor) * peso;
  }
  if (somaPesos === 0) return 0;
  return round2((somaPontos / somaPesos) * 10);
};

export { resolverMinMax };

/** Baldes de cor (vermelho/amarelo/verde) pela posição do valor dentro da
 * própria escala do critério — não depende de quantas opções existem nem
 * de o admin configurar cor nenhuma. */
const severidadePorFracao = (fracao) => {
  if (fracao <= 1 / 3) return "error";
  if (fracao <= 2 / 3) return "warning";
  return "success";
};

/**
 * Opções `{valor, label, descricao?, severidade?}` pra renderizar os pills
 * de um critério — numéricas (geradas a partir de notaMinima/notaMaxima,
 * como já era, sem cor) ou qualitativas (rótulo curto + descrição
 * opcional + severidade error/warning/success, configurados pelo admin em
 * `criterio.escala`).
 */
export const opcoesInput = (criterio) => {
  if (criterio.tipoEntrada === "QUALITATIVA") {
    const escala = construirEscala(criterio);
    return (criterio.escala || []).map((o) => ({
      valor: o.valor,
      label: o.label,
      descricao: o.descricao || "",
      severidade: severidadePorFracao(calcularFracao(escala, o.valor)),
    }));
  }
  return Array.from(
    { length: criterio.notaMaxima - criterio.notaMinima + 1 },
    (_, i) => criterio.notaMinima + i
  ).map((v) => ({ valor: v, label: String(v) }));
};

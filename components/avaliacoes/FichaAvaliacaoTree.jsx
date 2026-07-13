"use client";

import styles from "./FichaAvaliacaoTree.module.scss";
import {
  calcularArvoreComNotas,
  resolverMinMax,
} from "@/lib/fichaAvaliacaoScoring";

/** Gera a lista de valores de min a max (passo `step`) pra escalas numéricas/slider em pills. */
const gerarPassos = (min, max, step = 1) => {
  const passos = [];
  const n = Math.round((max - min) / step);
  for (let i = 0; i <= n; i++)
    passos.push(Math.round((min + i * step) * 100) / 100);
  return passos;
};

/**
 * Renderiza (recursivamente) a árvore de grupos/critérios de uma ficha de avaliação,
 * escolhendo o widget certo por escala (Sim/Não, rótulos, pills numéricas, slider ou nota
 * manual). Compartilhado entre as telas de preenchimento de projeto e de plano de trabalho.
 */
const NoFicha = ({ no, index, valores, onSelecionar, onComentar }) => {
  if (no.tipo === "grupo") {
    const { pontosObtidos, pontosMaximos } = calcularArvoreComNotas(
      no.itens,
      valores,
    );
    return (
      <div className={styles.grupo}>
        <div className={styles.grupoTitulo}>
          <h6>{no.label}</h6>
          <span className={styles.subtotalBadge}>
            {pontosObtidos}/{pontosMaximos} pts
          </span>
        </div>
        {no.itens.map((filho, i) => (
          <NoFicha
            key={filho.id}
            no={filho}
            index={i + 1}
            valores={valores}
            onSelecionar={onSelecionar}
            onComentar={onComentar}
          />
        ))}
      </div>
    );
  }

  const valorAtual = valores.get(no.id)?.valorSelecionado;
  const comentarioAtual = valores.get(no.id)?.comentario ?? "";
  const { min, max } = resolverMinMax(no.escala);
  // Comentário é opcional, mas só faz sentido oferecê-lo quando a nota escolhida
  // ainda não é a nota máxima do critério (peso cheio já não precisa de justificativa).
  const notaDiferenteDoMaximo =
    typeof valorAtual === "number" && valorAtual !== max;

  return (
    <div className={styles.item}>
      <div className={styles.label}>
        <h6>
          <span>{index}. </span>
          {no.label} (Peso: {no.peso})
        </h6>
      </div>
      {no.descricao && (
        <div className={styles.instructions}>
          <p style={{ whiteSpace: "pre-line" }}>{no.descricao}</p>
        </div>
      )}

      {(no.escala.tipo === "binaria" || no.escala.tipo === "likert") && (
        <div className={styles.values}>
          {/* Critério binário (0/1): mostra "Sim" (valor 1) antes de "Não" (valor 0),
              independente da ordem cadastrada na rubrica. */}
          {(no.escala.tipo === "binaria"
            ? [...no.escala.opcoes].sort((a, b) => b.valor - a.valor)
            : no.escala.opcoes
          ).map((op) => (
            <div
              key={op.valor}
              className={`${styles.value} ${styles.valueLabel} ${valorAtual === op.valor ? styles.selected : ""}`}
              onClick={() => onSelecionar(no.id, op.valor)}
            >
              <p>{op.label}</p>
            </div>
          ))}
        </div>
      )}

      {no.escala.tipo === "numerica" && (
        <div className={styles.values}>
          {gerarPassos(min, max, no.escala.step || 1).map((valor) => (
            <div
              key={valor}
              className={`${styles.value} ${valorAtual === valor ? styles.selected : ""}`}
              onClick={() => onSelecionar(no.id, valor)}
            >
              <p>{valor}</p>
            </div>
          ))}
        </div>
      )}

      {no.escala.tipo === "slider" && (
        <div className={styles.sliderRow}>
          <input
            type="range"
            min={min}
            max={max}
            step={no.escala.step || 1}
            value={valorAtual ?? min}
            onChange={(e) => onSelecionar(no.id, Number(e.target.value))}
          />
          <span>{valorAtual ?? min}</span>
        </div>
      )}

      {no.escala.tipo === "manual" && (
        <input
          type="number"
          className={styles.manualInput}
          min={min}
          max={max}
          step={no.escala.step || "any"}
          value={valorAtual ?? ""}
          onChange={(e) =>
            onSelecionar(
              no.id,
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
        />
      )}

      {notaDiferenteDoMaximo && (
        <textarea
          className={styles.comentario}
          placeholder="Justificativa (opcional)"
          value={comentarioAtual}
          onChange={(e) => onComentar(no.id, e.target.value)}
        />
      )}
    </div>
  );
};

/** `schemaCriterios`: árvore da rubrica. `valores`: Map<criterioId, {valorSelecionado, comentario?}>. */
const FichaAvaliacaoTree = ({
  schemaCriterios,
  valores,
  onSelecionar,
  onComentar,
}) => (
  <div className={styles.quesitos}>
    {(schemaCriterios || []).map((no, index) => (
      <NoFicha
        key={no.id}
        no={no}
        index={index + 1}
        valores={valores}
        onSelecionar={onSelecionar}
        onComentar={onComentar}
      />
    ))}
  </div>
);

export default FichaAvaliacaoTree;

"use client";
import { useState } from "react";
import styles from "./GrupoAvaliacao.module.scss";

// Renderiza recursivamente um grupo (e subgrupos) da fichaAvaliacao de uma
// Participação — mesma árvore usada nas telas de Seleção de Participações
// (Aluno/Orientador) e no resumo de avaliação do Plano de Trabalho.
const GrupoAvaliacao = ({ grupo, nivel = 0 }) => {
  const [expanded, setExpanded] = useState(nivel === 0);
  const temItens =
    grupo.respostaCampos?.length > 0 ||
    grupo.grupos?.some(
      (g) => g.respostaCampos?.length > 0 || g.grupos?.length > 0
    );
  const nivelClass = nivel === 1 ? styles.nivel1 : nivel >= 2 ? styles.nivel2 : "";

  return (
    <div className={`${styles.grupoBox} ${nivelClass}`}>
      <div
        className={styles.grupoHeader}
        onClick={() => temItens && setExpanded(!expanded)}
        style={{ cursor: temItens ? "pointer" : "default" }}
      >
        <div className={styles.grupoLabel}>
          {temItens && (
            <i
              className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"}`}
              style={{ fontSize: "0.72rem" }}
            />
          )}
          {grupo.label}
        </div>
        <span className={styles.notaBadge}>
          {grupo.nota ?? 0} / {grupo.notaMax ?? 0}
        </span>
      </div>

      {expanded && (
        <div className={styles.grupoContent}>
          {grupo.respostaCampos?.map((item, idx) => (
            <div key={idx} className={styles.itemBox}>
              <div className={styles.itemNumber}>
                Item {idx + 1}
                {grupo.notaPorItem != null && (
                  <span style={{ marginLeft: 8, color: "var(--primary-dark)", fontWeight: 700 }}>
                    +{grupo.notaPorItem}
                  </span>
                )}
              </div>
              {item
                .filter((c) => c.value !== undefined && c.value !== null && c.value !== "")
                .map((c, ci) => (
                  <div key={ci} className={styles.itemRow}>
                    <span className={styles.itemKey}>{c.label}:</span>
                    <span className={styles.itemValue}>
                      {typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value)}
                    </span>
                  </div>
                ))}
            </div>
          ))}
          {grupo.grupos?.map((sub, i) => (
            <GrupoAvaliacao key={i} grupo={sub} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GrupoAvaliacao;

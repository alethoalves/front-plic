import styles from "./ProgressoEtapas.module.scss";

const NOMES_ETAPA = ["Área", "Trabalho", "Pôster", "Ficha"];

// Indicador discreto de progresso do wizard do avaliador — "Passo X de Y"
// + dots, mesmo padrão já usado no wizard de check-in
// (components/checkin/ProgressoEtapas.jsx), cópia local pra manter as duas
// features desacopladas.
const ProgressoEtapas = ({ atual, total }) => (
  <div className={styles.progresso}>
    <p className={styles.label}>
      Passo {atual} de {total}
      {NOMES_ETAPA[atual - 1] ? ` · ${NOMES_ETAPA[atual - 1]}` : ""}
    </p>
    <div className={styles.dots}>
      {Array.from({ length: total }, (_, indice) => (
        <span
          key={indice}
          className={`${styles.dot} ${indice < atual ? styles.dotPreenchido : ""}`}
        />
      ))}
    </div>
  </div>
);

export default ProgressoEtapas;

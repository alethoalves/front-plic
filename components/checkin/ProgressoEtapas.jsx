import styles from "./ProgressoEtapas.module.scss";

// Indicador simples de progresso pras telas de instrução do check-in — deixa
// explícito pro aluno que ele está seguindo uma sequência de passos, não uma
// tela solta.
const ProgressoEtapas = ({ atual, total }) => (
  <div className={styles.progresso}>
    <p className={styles.label}>
      Passo {atual} de {total}
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

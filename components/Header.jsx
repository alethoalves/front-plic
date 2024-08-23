import styles from "./Header.module.scss";

const Header = ({ titulo, subtitulo, descricao, className, status }) => {
  return (
    <div className={`${styles.header} ${className}`}>
      <h4>{titulo}</h4>
      {subtitulo && <h5>{subtitulo}</h5>}
      {status && (
        <div
          className={`${styles.status} 
                      ${status.type === "incompleto" && styles.incompleto}
                      ${
                        (status.type === "ativo" ||
                          status.type === "completo") &&
                        styles.ativo
                      }
                      ${status.type === "inativo" && styles.inativo}
                      `}
        >
          <p>inscrição {status.label}</p>
        </div>
      )}

      {descricao && <p className={styles.p3}>{descricao}</p>}
    </div>
  );
};

export default Header;

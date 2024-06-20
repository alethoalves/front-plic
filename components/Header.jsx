import styles from './Header.module.scss'

const Header = ({titulo,subtitulo,descricao,className}) => {
    return (
    <div className={`${styles.header} ${className}`}>
        <h4>{titulo}</h4>
        {subtitulo && <h5>{subtitulo}</h5>}
        {descricao && <p className={styles.p3}>{descricao}</p>}
        
    </div>
    );
  };
  
  export default Header;
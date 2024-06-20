import styles from './Buscador.module.scss'

const Buscador = ({className}) => {
    return (
    <div className={`${styles.buscador} ${className}`}>
        <p>Buscar</p>
        
    </div>
    );
  };
  
  export default Buscador;
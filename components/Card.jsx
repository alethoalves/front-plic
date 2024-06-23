import styles from './Card.module.scss'
import Button from "@/components/Button";
import { RiDeleteBin6Line, RiEditLine, RiLogoutBoxRLine } from '@remixicon/react';

const Card = ({loading, tipoForm, tituloForm}) => {
    return (
        <div className={`${styles.btnItem}`}>
        <div className={`${styles.header} mr-2`}>
          <div className="h7">{tipoForm}</div>
          <p>{tituloForm}</p>
        </div>
        <div className={styles.actions}>
          <div className={`${styles.group1} mr-1`}>
            <Button
              icon={RiLogoutBoxRLine}
              className="btn-primary"
              type="submit" // submit, reset, button
              disabled={loading}
            >{loading ? 'Carregando...' : 'Acessar'}</Button>
          </div>
          <div className={styles.group2}>
            <Button
              icon={RiEditLine}
              className="btn-blue mr-1"
              type="submit" // submit, reset, button
              disabled={loading}
            ></Button>
            <Button
              icon={RiDeleteBin6Line}
              className="btn-error "
              type="submit" // submit, reset, button
              disabled={loading}
            ></Button>
          </div>
          
        </div>
      </div>
    );
  };
  
  export default Card;
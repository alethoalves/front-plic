import styles from './Card.module.scss'
import Button from "@/components/Button";
import { RiDeleteBin6Line, RiEditLine, RiLogoutBoxRLine } from '@remixicon/react';

const Card = ({title, subtitle}) => {
    return (
        <div className={`${styles.btnItem}`}>
        <div className={`${styles.header} mr-2`}>
          <div className={`h7 ${styles.destaque}`}>{title}</div>
          <p>{subtitle}</p>
        </div>
        <div className={styles.actions}>
          <div className={`${styles.group1} mr-1`}>
            <Button
              icon={RiLogoutBoxRLine}
              className="btn-primary"
              type="submit" // submit, reset, button
              
            >Acessar</Button>
          </div>
          <div className={styles.group2}>
            <Button
              icon={RiEditLine}
              className="btn-secondary mr-1"
              type="submit" // submit, reset, button
            ></Button>
            <Button
              icon={RiDeleteBin6Line}
              className="btn-error "
              type="submit" // submit, reset, button
            ></Button>
          </div>
          
        </div>
      </div>
    );
  };
  
  export default Card;
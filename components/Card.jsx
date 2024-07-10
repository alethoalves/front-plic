import styles from './Card.module.scss'
import Button from "@/components/Button";
import { RiDeleteBin6Line, RiEditLine, RiLogoutBoxRLine } from '@remixicon/react';

const Card = ({ title, subtitle, onEdit, onDelete, onView }) => {
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
            type="button"
            onClick={onView}
          >
            Acessar
          </Button>
        </div>
        <div className={styles.group2}>
          <Button
            icon={RiEditLine}
            className="btn-secondary mr-1"
            type="button"
            onClick={onEdit}
          ></Button>
          <Button
            icon={RiDeleteBin6Line}
            className="btn-error"
            type="button"
            onClick={onDelete}
          ></Button>
        </div>
      </div>
    </div>
  );
};

export default Card;

import Button from "@/components/Button";

import {
  RiAddLargeLine,
  RiAddLine,
  RiEditLine,
  RiEyeLine,
} from "@remixicon/react";
import styles from "./ItemForm.module.scss";

const ItemForm = ({
  onEdit,
  onView,
  formulario,
  nomeFormulario,
  tipoFormulario,
}) => {
  return (
    <div className={styles.itemForm}>
      <p>
        {tipoFormulario === "PlanoDeTrabalho"
          ? "Plano de Trabalho"
          : tipoFormulario}
      </p>
      <div className={styles.edicao}>
        {!formulario && (
          <div className={`${styles.actions} ${styles.actionWithLabel}`}>
            <Button
              icon={RiAddLargeLine}
              className="btn-secondary "
              type="button"
              onClick={onEdit}
            >
              Definir Formulário
            </Button>
          </div>
        )}

        {formulario && (
          <>
            <div className={styles.label}>
              <div className={styles.value}>
                <p>{nomeFormulario}</p>
              </div>
            </div>
            <div className={styles.actions}>
              <Button
                icon={RiEyeLine}
                className="btn-secondary "
                type="button"
                onClick={onView}
              />
              <Button
                icon={RiEditLine}
                className="btn-secondary ml-1"
                type="button"
                onClick={onEdit}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ItemForm;

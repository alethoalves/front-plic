import styles from "./Modal.module.scss";
import Button from "@/components/Button";
import {
  RiCloseLargeLine,
  RiDeleteBin6Line,
  RiEditLine,
  RiLogoutBoxRLine,
} from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";

const Modal = ({ isOpen, onClose, edit, itemName, children }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      // Reset visible state when modal is closed
      setVisible(false);
    }
  }, [isOpen]);

  const handleCloseWithDelay = () => {
    setVisible(false);
    setTimeout(onClose, 400);
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.modalBackdrop} ${visible && styles.visible}`}>
      <div className={`${styles.modalContent} `}>
        <div onClick={handleCloseWithDelay} className={styles.closeIcon}>
          <RiCloseLargeLine />
        </div>
        {edit && (
          <>
            <div className={`${styles.icon} mb-2`}>
              <RiEditLine />
            </div>
            <h4>{edit ? `Editar ${itemName}` : `Novo ${itemName}`}</h4>
            <p>
              {edit
                ? `Edite os dados de ${itemName}.`
                : `Preencha os dados abaixo para criar ${itemName}.`}
            </p>
          </>
        )}

        {children}
      </div>
    </div>
  );
};

export default Modal;

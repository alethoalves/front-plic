import styles from "./ModalDelete.module.scss";
import Button from "@/components/Button";
import {
  RiCloseLargeLine,
  RiDeleteBin6Line,
  RiDeleteBinLine,
  RiEditLine,
  RiLogoutBoxRLine,
} from "@remixicon/react";
import { useCallback, useEffect, useState } from "react";

const Modal = ({
  isOpen,
  onClose,
  title,
  confirmationText = "Tem certeza que deseja excluir?",
  errorDelete,
  handleDelete,
}) => {
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
        <div className={`${styles.icon} mb-2`}>
          <RiDeleteBinLine />
        </div>
        <h4>{title}</h4>
        <p className="mt-1">{`${confirmationText}`}</p>
        {errorDelete && (
          <div className={`notification notification-error`}>
            <p className="p5">{errorDelete}</p>
          </div>
        )}
        <div className={styles.btnSubmit}>
          <Button className="btn-error mt-4" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

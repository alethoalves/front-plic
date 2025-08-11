"use client";
import Button from "@/components/Button";

import {
  RiAddLine,
  RiCouponLine,
  RiFileExcelLine,
  RiLoginBoxLine,
} from "@remixicon/react";
import styles from "./InscricaoButton.module.scss";

import { Dialog } from "primereact/dialog";
import { useState } from "react";
import Modal from "../Modal";

export const LoginAvaliadorEvento = ({ eventoSlug }) => {
  const [visible, setVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <div
        className={`w-100 ${styles.action} ${styles.primary}`}
        onClick={() => setIsModalOpen(true)}
      >
        <RiLoginBoxLine />
        <h6>Espaço do avaliador</h6>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="medium" // ou "large" dependendo do que você precisa
        showIconClose={true}
      >
        <div className={styles.dialogEventoContent}>
          <h5 className="mb-2">Espaço do Avaliador</h5>
          <p>Conteúdo do formulário de inscrição aqui...</p>
        </div>
      </Modal>
    </>
  );
};

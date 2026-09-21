"use client";

import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { RiArrowGoBackLine } from "@remixicon/react";
import styles from "./ModalConfirmacao.module.scss";

// Modal de confirmação no mesmo padrão já usado no resto do sistema
// (ícone + <h4> + <p> + um único botão de ação, ex.:
// components/EditalAtividades.jsx:158-199) — substitui o ConfirmDialog do
// PrimeReact, que tem uma skin própria fora do padrão visual do projeto.
const ModalConfirmacao = ({
  isOpen,
  onClose,
  titulo = "Confirmação",
  mensagem,
  textoConfirmar = "Confirmar",
  icon: Icon = RiArrowGoBackLine,
  onConfirmar,
  loading,
  erro,
}) => (
  <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose}>
    <div className={`${styles.icon} mb-2`}>
      <Icon />
    </div>
    <h4>{titulo}</h4>
    <p className="mt-1">{mensagem}</p>
    {erro && (
      <div className="notification notification-error">
        <p className="p5">{erro}</p>
      </div>
    )}
    <div className={styles.btnSubmit}>
      <Button className="btn-error" onClick={onConfirmar} loading={loading}>
        {textoConfirmar}
      </Button>
    </div>
  </Modal>
);

export default ModalConfirmacao;

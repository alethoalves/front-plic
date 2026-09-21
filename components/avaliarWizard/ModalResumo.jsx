"use client";

import Modal from "@/components/Modal";
import { transformarQuebrasEmParagrafos } from "@/lib/formatarParagrafo";
import { RiFileList3Line } from "@remixicon/react";
import styles from "./wizard.module.scss";

// Mesmo padrão de modal já usado na tela antiga (avaliacoes/page.jsx) pra
// ler o resumo sem sair do fluxo — aqui alimentado pelo `getResumo` já
// pré-carregado pelo wizard assim que um trabalho é atribuído.
const ModalResumo = ({ isOpen, onClose, resumo, carregando }) => (
  <Modal isOpen={isOpen} onClose={onClose} size="large">
    <div className={`${styles.iconeCentral} mb-2`}>
      <RiFileList3Line />
    </div>
    {carregando && <p className="text-center">Carregando resumo...</p>}
    {!carregando && resumo && (
      <>
        <h4 className="mb-2 text-center">{resumo?.Resumo?.titulo}</h4>
        {resumo?.Resumo?.conteudo?.map((secao, index) => (
          <div key={index} className="mb-2">
            {secao.nome && <h6 className="mb-1">{secao.nome}</h6>}
            <div className="text-justify">
              {transformarQuebrasEmParagrafos(secao.conteudo)}
            </div>
          </div>
        ))}
      </>
    )}
    {!carregando && !resumo && (
      <p className="text-center">Não foi possível carregar o resumo agora.</p>
    )}
  </Modal>
);

export default ModalResumo;

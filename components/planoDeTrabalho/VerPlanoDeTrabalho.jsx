"use client";
import Button from "@/components/Button";

import {
  RiAddLine,
  RiArrowRightSLine,
  RiFileExcelLine,
  RiLink,
} from "@remixicon/react";
import styles from "./VerPlanoDeTrabalho.module.scss";
import NoData from "../NoData";
import GanttChart from "../GanttChart";
import { useState } from "react";
import {
  linkProjetoToInscricao,
  unlinkProjetoFromInscricao,
} from "@/app/api/client/projeto";

const VerPlanoDeTrabalho = ({
  planoDeTrabalhoDetalhes,
  loading,
  tenant,
  inscricaoSelected,
  onProjetoVinculado, // Callback recebido como prop
  closeModal,
}) => {
  const [activeTab, setActiveTab] = useState("conteudo");
  const [isLinking, setIsLinking] = useState(false); // Estado de carregamento da operação de link
  const [error, setError] = useState(null); // Estado de erro

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <>
      <div className={styles.detalhesProjeto}>
        <h6>Detalhes do Projeto</h6>
        <div className={`${styles.card} ${styles.titulo} `}>
          <h6 className={`${styles.label} `}>
            Área: {planoDeTrabalhoDetalhes.area.area}
          </h6>
          <div className={`${styles.value} `}>
            <p className="uppercase">
              <strong>{planoDeTrabalhoDetalhes.titulo}</strong>
            </p>
            <form className={`${styles.formulario}`}>
              <div className={`${styles.input}`}></div>
            </form>
          </div>
        </div>
        {error && <p className={styles.error}>{error}</p>}{" "}
        {/* Exibição de erros */}
        <div className={`${styles.nav}`}>
          <div className={`${styles.menu}`}>
            <div
              className={`${styles.itemMenu} ${
                activeTab === "conteudo" ? styles.itemMenuSelected : ""
              }`}
              onClick={() => handleTabChange("conteudo")}
            >
              <p>Conteúdo</p>
            </div>
            <div
              className={`${styles.itemMenu} ${
                activeTab === "cronograma" ? styles.itemMenuSelected : ""
              }`}
              onClick={() => handleTabChange("cronograma")}
            >
              <p>Cronograma</p>
            </div>
          </div>
        </div>
        {activeTab === "conteudo" && (
          <div className={`${styles.conteudo}`}>
            <div className={`${styles.card} `}>
              <h6 className={`${styles.label} `}>Introdução</h6>
              <div className={`${styles.value} `}>
                <p>{planoDeTrabalhoDetalhes.conteudo}</p>
                <form className={`${styles.formulario}`}>
                  <div className={`${styles.input}`}></div>
                </form>
              </div>
            </div>
          </div>
        )}
        {activeTab === "cronograma" && (
          <div className={`${styles.cronograma}`}>
            <GanttChart
              cronograma={planoDeTrabalhoDetalhes.CronogramaPlanoDeTrabalho}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default VerPlanoDeTrabalho;

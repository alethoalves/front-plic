"use client";
import Button from "@/components/Button";

import {
  RiAddLine,
  RiArrowRightSLine,
  RiFileExcelLine,
  RiLink,
} from "@remixicon/react";
import styles from "./VerProjeto.module.scss";
import NoData from "../NoData";
import GanttChart from "../GanttChart";
import { useState } from "react";
import {
  linkProjetoToInscricao,
  unlinkProjetoFromInscricao,
} from "@/app/api/client/projeto";

const VerProjeto = ({
  projetoDetalhes,
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
  const handleLinkProject = async () => {
    const tenantSlug = tenant;
    const idInscricao = inscricaoSelected;
    const idProjeto = projetoDetalhes.id;

    setIsLinking(true);
    setError(null);

    try {
      const response = await linkProjetoToInscricao(
        tenantSlug,
        idInscricao,
        idProjeto
      );
      console.log("Projeto vinculado com sucesso:", response);

      // Chama o callback para atualizar a listagem no FluxoInscricaoEdital
      if (typeof onProjetoVinculado === "function") {
        console.log(projetoDetalhes);
        onProjetoVinculado(projetoDetalhes); // Passa o projeto vinculado
      }
      // Fecha o modal após o sucesso
      if (typeof closeModal === "function") {
        closeModal();
      }
    } catch (err) {
      console.error("Erro ao vincular projeto:", err);
      const errorMessage =
        err.response?.data?.message || "Falha ao vincular o projeto.";
      setError(errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <>
      <div className={styles.detalhesProjeto}>
        <h6>Detalhes do Projeto</h6>
        <div className={`${styles.card} ${styles.titulo} `}>
          <h6 className={`${styles.label} `}>
            Área: {projetoDetalhes.area.area}
          </h6>
          <div className={`${styles.value} `}>
            <p className="uppercase">
              <strong>{projetoDetalhes.titulo}</strong>
            </p>
            <form className={`${styles.formulario}`}>
              <div className={`${styles.input}`}></div>
            </form>
          </div>
        </div>
        {error && <p className={styles.error}>{error}</p>}{" "}
        {/* Exibição de erros */}
        <Button
          icon={RiLink}
          className="mt-2 btn-secondary"
          type="button"
          onClick={handleLinkProject} // Chama a função ao clicar
          disabled={loading || isLinking} // Desativa o botão durante o carregamento
        >
          {isLinking ? "Vinculando..." : "Vincular projeto à inscrição"}
        </Button>
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
            <div
              className={`${styles.itemMenu} ${
                activeTab === "anexos" ? styles.itemMenuSelected : ""
              }`}
              onClick={() => handleTabChange("anexos")}
            >
              <p>Anexos</p>
            </div>
          </div>
        </div>
        {activeTab === "conteudo" && (
          <div className={`${styles.conteudo}`}>
            <div className={`${styles.card} `}>
              <h6 className={`${styles.label} `}>Introdução</h6>
              <div className={`${styles.value} `}>
                <p>{projetoDetalhes.introducao}</p>
                <form className={`${styles.formulario}`}>
                  <div className={`${styles.input}`}></div>
                </form>
              </div>
            </div>
            <div className={`${styles.card} `}>
              <h6 className={`${styles.label} `}>Justificativa</h6>
              <div className={`${styles.value} `}>
                <p>{projetoDetalhes.justificativa}</p>
                <form className={`${styles.formulario}`}>
                  <div className={`${styles.input}`}></div>
                </form>
              </div>
            </div>
            <div className={`${styles.card} `}>
              <h6 className={`${styles.label} `}>Objetivos</h6>
              <div className={`${styles.value} `}>
                <p>{projetoDetalhes.objetivos}</p>
                <form className={`${styles.formulario}`}>
                  <div className={`${styles.input}`}></div>
                </form>
              </div>
            </div>
            <div className={`${styles.card} `}>
              <h6 className={`${styles.label} `}>Revisão bibliográfica</h6>
              <div className={`${styles.value} `}>
                <p>{projetoDetalhes.fundamentacao}</p>
                <form className={`${styles.formulario}`}>
                  <div className={`${styles.input}`}></div>
                </form>
              </div>
            </div>
            <div className={`${styles.card} `}>
              <h6 className={`${styles.label} `}>Metodologia</h6>
              <div className={`${styles.value} `}>
                <p>{projetoDetalhes.metodologia}</p>
                <form className={`${styles.formulario}`}>
                  <div className={`${styles.input}`}></div>
                </form>
              </div>
            </div>
            <div className={`${styles.card} `}>
              <h6 className={`${styles.label} `}>Resultados</h6>
              <div className={`${styles.value} `}>
                <p>{projetoDetalhes.resultados}</p>
                <form className={`${styles.formulario}`}>
                  <div className={`${styles.input}`}></div>
                </form>
              </div>
            </div>
            <div className={`${styles.card} `}>
              <h6 className={`${styles.label} `}>Referências</h6>
              <div className={`${styles.value} `}>
                <p>{projetoDetalhes.referencias}</p>
                <form className={`${styles.formulario}`}>
                  <div className={`${styles.input}`}></div>
                </form>
              </div>
            </div>
          </div>
        )}
        {activeTab === "cronograma" && (
          <div className={`${styles.cronograma}`}>
            <GanttChart cronograma={projetoDetalhes.CronogramaProjeto} />
          </div>
        )}
        {activeTab === "anexos" && (
          <div className={`${styles.anexos}`}>
            <div className={`${styles.lista}`}>
              {projetoDetalhes.AnexoProjeto.map((anexo, index) => (
                <div key={index} className={`${styles.listaItem}`}>
                  <div className={`${styles.content}`}>
                    {/* Link para visualização em nova aba */}
                    <a
                      href={anexo.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {anexo.nomeAnexo}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VerProjeto;

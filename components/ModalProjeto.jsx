"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./ModalProjeto.module.scss";
import {
  RiAddCircleLine,
  RiAlertLine,
  RiArrowLeftCircleLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiExternalLinkLine,
  RiLink,
} from "@remixicon/react";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import FileInput from "@/components/FileInput";
import Campo from "@/components/Campo";

import { uploadFile, xmlLattes } from "@/app/api/clientReq";
import generateLattesText from "@/lib/generateLattesText";
import { getFormulario } from "@/app/api/client/formulario";
import ParticipacaoForm from "@/components/Formularios/ParticipacaoForm";
import FormProjeto from "@/components/Formularios/FormProjeto";

import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import Modal from "@/components/Modal";
import { deleteParticipacao } from "@/app/api/client/participacao";
import Button from "./Button";
import NoData from "./NoData";
import { getProjetoById, getProjetosDoUsuario } from "@/app/api/client/projeto";
import Input from "./Input";
import GanttChart from "./GanttChart";

const ModalProjeto = ({
  tenant,
  inscricaoSelected,
  isModalOpen,
  closeModal,
  modalView,
  setModalView,
  meusProjetos,
  projetoDetalhes,
  selectedProjeto,
  setSelectedProjeto,
  handleCreateOrEditProjetoSuccess,
  fetchProjetoDetalhes,
  handleUpdateProjeto,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState("conteudo");
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  useEffect(() => {
    if (modalView === "view" && selectedProjeto) {
      fetchProjetoDetalhes(selectedProjeto.id);
    }
  }, [modalView, selectedProjeto, fetchProjetoDetalhes]);

  return (
    <>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>Projeto</h4>
      <div className="flex">
        {modalView !== "list" && (
          <Button
            className={`btn-secondary mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiArrowLeftCircleLine}
            onClick={() => {
              if (modalView === "edit") {
                setModalView("view");
              } else {
                setModalView("list");
                setSelectedProjeto(null);
                setProjetoDetalhes(null);
              }
            }}
          >
            {modalView === "edit" ? "Voltar para Visualização" : "Voltar"}
          </Button>
        )}
        {modalView === "view" && selectedProjeto && (
          <Button
            className={`btn-secondary ml-1 mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiEditLine}
            onClick={() => setModalView("edit")}
          >
            Editar
          </Button>
        )}
      </div>
      {modalView === "list" && (
        <>
          <Button
            className={`btn-secondary mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiAddCircleLine}
            onClick={() => setModalView("create")}
          >
            Novo Projeto
          </Button>
          <h6>Meus Projetos</h6>
          <div className={styles.projetos}>
            {meusProjetos.length > 0 ? (
              meusProjetos.map((projeto) => (
                <div
                  key={projeto.id}
                  onClick={() => {
                    setSelectedProjeto(projeto);
                    setModalView("view");
                  }}
                  className={styles.projeto}
                >
                  <h6>{projeto.titulo}</h6>
                  <div className={styles.actions}>
                    <div className={styles.action}>
                      <RiArrowRightSLine />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <NoData description="Não encontramos nenhum projeto. Crie um novo!" />
            )}
          </div>
        </>
      )}
      {modalView === "view" && projetoDetalhes && (
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
          <Button
            icon={RiLink}
            className="mt-2 btn-secondary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Carregando..." : "Vincular projeto à inscrição"}
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
      )}
      {modalView === "create" && (
        <FormProjeto
          tenantSlug={tenant}
          idInscricao={inscricaoSelected}
          onSuccess={handleCreateOrEditProjetoSuccess}
        />
      )}
      {modalView === "edit" && selectedProjeto && (
        <FormProjeto
          tenantSlug={tenant}
          idInscricao={inscricaoSelected}
          initialData={projetoDetalhes} // Dados do projeto para edição
          onSuccess={handleCreateOrEditProjetoSuccess} // Atualização do estado após sucesso
          onSubmit={(projetoData) =>
            handleUpdateProjeto(selectedProjeto.id, projetoData)
          }
        />
      )}
    </>
  );
};

export default ModalProjeto;

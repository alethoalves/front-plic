"use client";

import styles from "./Inscricao.module.scss";
import { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import {
  RiAddCircleLine,
  RiArrowRightSLine,
  RiGroupLine,
  RiEditLine,
  RiGraduationCapLine,
  RiFileList3Line,
  RiFoldersLine,
} from "@remixicon/react";
import { getInscricao, getInscricaoUserById } from "@/app/api/client/inscricao";
import { DataView } from "primereact/dataview";
import CPFVerificationForm from "./Formularios/CPFVerificationForm";
import ParticipacaoForm from "./Formularios/ParticipacaoForm";
import ParticipacaoGestorController from "./participacao/ParticipacaoGestorController";
import { Tag } from "primereact/tag";
import { formatStatusText, getSeverityByStatus } from "@/lib/tagUtils";
import Modal from "./Modal";
import FormGestorProjetoCreateOrEdit from "./Formularios/FormGestorProjetoCreateOrEdit";
import FormGestorPlanoDeTrabalhoCreateOrEdit from "./Formularios/FormGestorPlanoDeTrabalhoCreateOrEdit";

const Inscricao = ({ params, inscricaoId }) => {
  /* ---------- estados ---------- */
  const [inscricao, setInscricao] = useState(null);
  const [participacaoSelected, setParticipacaoSelected] = useState();
  const [isModalParticipacaoOpen, setIsModalParticipacaoOpen] = useState(false);
  const [verifiedData, setVerifiedData] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projetoSelected, setProjetoSelected] = useState();
  const [isModalProjetoOpen, setIsModalProjetoOpen] = useState(false);
  const [planoSelected, setPlanoSelected] = useState();
  const [isModalPlanoOpen, setIsModalPlanoOpen] = useState(false);
  const [inscricaoProjetoSelected, setInscricaoProjetoSelected] = useState();
  const toast = useRef(null);

  /* ---------- 1. lista ---------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getInscricaoUserById(params.tenant, inscricaoId);
        setInscricao(data);
      } catch (e) {
        console.error(e);
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao buscar dados da inscrição",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, inscricaoId]);

  const closeModalAndResetData = () => {
    setIsModalParticipacaoOpen(false);
    setParticipacaoSelected(null);
  };

  const handleCreateOrEditSuccess = async () => {
    try {
      const data = await getInscricaoUserById(params.tenant, inscricaoId);
      setInscricao(data);
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao atualizar dados da inscrição",
        life: 3000,
      });
    }
  };
  const renderModalProjeto = () => (
    <Modal
      isOpen={isModalProjetoOpen}
      onClose={() => {
        setIsModalProjetoOpen(false);
        setProjetoSelected(null);
      }}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>

      <FormGestorProjetoCreateOrEdit
        projetoId={projetoSelected?.id}
        tenantSlug={params.tenant}
        idInscricao={inscricaoId}
        onSuccess={handleCreateOrEditSuccess}
        onClose={() => {
          setIsModalProjetoOpen(false);
          setProjetoSelected(null);
        }}
      />
    </Modal>
  );
  const listTemplateProjeto = (projetos) => {
    return (
      <div className={styles.list}>
        {projetos.map((inscricaoProjeto, index) => (
          <div key={inscricaoProjeto.id}>
            <div
              key={inscricaoProjeto.id}
              className={styles.itemList}
              onClick={() => {
                setProjetoSelected(inscricaoProjeto.projeto);
                setIsModalProjetoOpen(true);
              }}
            >
              <div className={styles.content1}>
                <h6 className="mb-1 flex justify-content-between">
                  Projeto {index + 1} <span>ID - {inscricaoProjeto.id}</span>
                </h6>
                <p className={`mr-1 ${styles.status} ${styles.statusDefault}`}>
                  {inscricaoProjeto.notaFinal
                    ? `Nota Final: ${inscricaoProjeto.notaFinal.toFixed(3)}`
                    : "Não avaliado"}
                </p>
                {inscricaoProjeto.statusAvaliacao && (
                  <p className={`${styles.status} ${styles.statusDefault}`}>
                    {inscricaoProjeto.statusAvaliacao}
                  </p>
                )}

                <p>{inscricaoProjeto.projeto.titulo}</p>
              </div>
              <div className={styles.content2}>
                <RiArrowRightSLine />
              </div>
            </div>
            <div className={`${styles.box} m-2`}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiFileList3Line />
                </div>
                <h6>Planos de Trabalho</h6>
                <div
                  onClick={() => {
                    setInscricaoProjetoSelected(inscricaoProjeto);
                    setProjetoSelected(inscricaoProjeto.projeto);
                    setPlanoSelected(null);
                    setIsModalPlanoOpen(true);
                  }}
                  className={`ml-1 ${styles.icon} ${styles.iconClick}`}
                >
                  <RiAddCircleLine />
                </div>
              </div>
              {inscricao.planosDeTrabalho?.filter(
                (plano) => plano.inscricaoProjetoId === inscricaoProjeto.id
              ).length > 0 ? (
                <DataView
                  value={inscricao.planosDeTrabalho.filter(
                    (plano) => plano.inscricaoProjetoId === inscricaoProjeto.id
                  )}
                  listTemplate={listTemplatePlanosDeTrabalho}
                  layout="list"
                />
              ) : (
                <p className="p-2">
                  Nenhum plano de trabalho vinculado a este projeto
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  const listTemplateParticipante = (participantes) => {
    if (!participantes || participantes.length === 0) {
      return <p>Nenhum participante encontrado</p>;
    }

    return (
      <div className={styles.list}>
        {participantes.map((participante) => (
          <div
            key={participante.id}
            className={styles.itemList}
            onClick={() => {
              setParticipacaoSelected(participante);
              setIsModalParticipacaoOpen(true);
            }}
          >
            <div className={styles.content1}>
              <Tag
                className="mb-1"
                rounded
                severity={getSeverityByStatus(participante?.statusParticipacao)}
              >
                {formatStatusText(participante?.statusParticipacao)}
              </Tag>
              <p>{participante.user?.nome}</p>
            </div>
            <div className={styles.content2}>
              <RiArrowRightSLine />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const listTemplatePlanosDeTrabalho = (planos) => {
    if (!planos || planos.length === 0) {
      return <p>Nenhum plano de trabalho encontrado</p>;
    }

    return (
      <div className={styles.list}>
        {planos.map((plano, index) => (
          <div key={plano.id}>
            <div
              key={plano.id}
              className={styles.itemList}
              onClick={() => {
                setPlanoSelected(plano);
                setProjetoSelected({ id: plano.projetoId });
                setIsModalPlanoOpen(true);
              }}
            >
              <div className={styles.content1}>
                <h6 className="mb-1 flex justify-content-between">
                  Plano {index + 1} <span>ID - {plano.id}</span>
                </h6>
                <Tag
                  className="mb-1"
                  rounded
                  severity={getSeverityByStatus(plano?.statusClassificacao)}
                >
                  {formatStatusText(plano?.statusClassificacao)}
                </Tag>
                <p>{plano.titulo}</p>
              </div>
              <div className={styles.content2}>
                <RiArrowRightSLine />
              </div>
            </div>
            <div className={`${styles.box} m-2`}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiGraduationCapLine />
                </div>
                <h6>Alunos</h6>
                <div
                  onClick={() => {
                    setParticipacaoSelected(null);
                    setTipoParticipacao("aluno");
                    setVerifiedData(null);
                    setIsModalParticipacaoOpen(true);
                  }}
                  className={`ml-1 ${styles.icon} ${styles.iconClick}`}
                >
                  <RiAddCircleLine />
                </div>
              </div>

              {plano?.participacoes && plano?.participacoes?.length > 0 && (
                <DataView
                  value={plano?.participacoes}
                  listTemplate={listTemplateParticipante}
                  layout="list"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderModalParticipacao = () => (
    <Modal isOpen={isModalParticipacaoOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      {!participacaoSelected?.id && (
        <div>
          <h4>Nova participação</h4>
          <p>Preencha os dados abaixo para adicionar uma nova participação.</p>

          <CPFVerificationForm
            tenantSlug={params.tenant}
            onCpfVerified={setVerifiedData}
          />
          {verifiedData && (
            <ParticipacaoForm
              tenantSlug={params.tenant}
              inscricaoId={`${inscricaoId}`}
              initialData={verifiedData || {}}
              onClose={() => setIsModalParticipacaoOpen(false)}
              onSuccess={() => {
                handleCreateOrEditSuccess();
                setIsModalParticipacaoOpen(false);
              }}
              showLabelInicio={false}
              tipoParticipacao={tipoParticipacao}
            />
          )}
        </div>
      )}
      {participacaoSelected?.id && (
        <ParticipacaoGestorController
          tenant={params.tenant}
          participacaoId={participacaoSelected?.id}
          onClose={closeModalAndResetData}
          onSuccess={handleCreateOrEditSuccess}
        />
      )}
    </Modal>
  );

  if (loading) {
    return <p className="mt-2">Carregando...</p>;
  }

  if (!inscricao) {
    return <p className="mt-2">Nenhuma inscrição encontrada</p>;
  }

  // Filtrar orientadores
  const orientadores = inscricao.participacoes?.filter(
    (p) => p.tipo === "orientador"
  );
  const renderModalPlanoDeTrabalho = () => (
    <Modal
      isOpen={isModalPlanoOpen}
      onClose={() => {
        setIsModalPlanoOpen(false);
        setPlanoSelected(null);
      }}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <FormGestorPlanoDeTrabalhoCreateOrEdit
        tenantSlug={params.tenant}
        initialData={planoSelected}
        idInscricao={inscricaoId}
        idProjeto={projetoSelected?.id}
        idFormularioEdital={inscricao.edital.formularioPlanoDeTrabalhoId}
        onSuccess={() => {
          handleCreateOrEditSuccess();
          setIsModalPlanoOpen(false);
        }}
        onUpdatePlanoDeTrabalho={() => {
          handleCreateOrEditSuccess();
          setIsModalPlanoOpen(false);
        }}
        onClose={() => setIsModalPlanoOpen(false)}
      />
    </Modal>
  );
  return (
    <div className={styles.content}>
      <div className={styles.toast}>
        <Toast ref={toast} />
      </div>

      <div className={styles.head}>
        <div className={styles.item}>
          <h5>
            Inscrição #{inscricao.id} - {inscricao.edital.titulo} (
            {inscricao.edital.ano})
          </h5>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.box}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiGroupLine />
            </div>
            <h6>Orientadores</h6>
            <div
              onClick={() => {
                setParticipacaoSelected(null);
                setTipoParticipacao("orientador");
                setVerifiedData(null);
                setIsModalParticipacaoOpen(true);
              }}
              className={`ml-1 ${styles.icon} ${styles.iconClick}`}
            >
              <RiAddCircleLine />
            </div>
          </div>
          {orientadores && orientadores.length > 0 ? (
            <DataView
              value={orientadores}
              listTemplate={listTemplateParticipante}
              layout="list"
            />
          ) : (
            <p>Nenhum orientador vinculado</p>
          )}
        </div>
        <div className={styles.box}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiFoldersLine />
            </div>
            <h6>Projetos</h6>
            <div
              onClick={() => {
                setProjetoSelected(null);
                setIsModalProjetoOpen(true);
              }}
              className={`ml-1 ${styles.icon} ${styles.iconClick}`}
            >
              <RiAddCircleLine />
            </div>
          </div>
          {inscricao?.InscricaoProjeto &&
            inscricao.InscricaoProjeto.length > 0 && (
              <DataView
                value={inscricao.InscricaoProjeto}
                listTemplate={listTemplateProjeto}
                layout="list" // Define o layout como lista
              />
            )}
        </div>
      </div>
      {renderModalProjeto()}
      {renderModalParticipacao()}
      {renderModalPlanoDeTrabalho()}
    </div>
  );
};

export default Inscricao;

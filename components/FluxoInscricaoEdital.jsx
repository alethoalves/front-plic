"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./FluxoInscricaoEdital.module.scss";
import {
  RiAlertLine,
  RiArticleLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFolder5Line,
  RiLinkUnlink,
  RiSendPlaneLine,
  RiUserAddLine,
  RiArrowRightSLine,
  RiUserSettingsLine,
  RiProjectorLine,
} from "@remixicon/react";
import {
  getInscricaoUserById,
  submissaoInscricao,
} from "@/app/api/client/inscricao";
import Modal from "@/components/Modal";
import ProjetoController from "./projeto/ProjetoController";
import ParticipacaoController from "./participacao/ParticipacaoController";
import NoData from "./NoData";
import PlanoDeTrabalhoController from "./planoDeTrabalho/PlanoDeTrabalhoController";
import { unlinkProjetoFromInscricao } from "@/app/api/client/projeto";
import { deletePlanoDeTrabalho } from "@/app/api/client/planoDeTrabalho";
import { deleteParticipacao } from "@/app/api/client/participacao";
import Button from "./Button";
import VerInscricao from "./VerInscricao";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Router } from "next/router";

const FluxoInscricaoEdital = ({ tenant, inscricaoSelected }) => {
  // ESTADOS
  const [inscricao, setInscricao] = useState();
  const [activeStep, setActiveStep] = useState("orientador");
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProjeto, setIsModalOpenProjeto] = useState(false);
  const [isModalOpenPlanoDeTrabalho, setIsModalOpenPlanoDeTrabalho] =
    useState(false);
  const [isModalOpenInscricao, setIsModalOpenInscricao] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [editalInfo, setEditalInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjetoId, setSelectedProjetoId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [planoDeTrabalhoSelected, setPlanoDeTrabalhoSelected] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [deletingParticipacaoId, setDeletingParticipacaoId] = useState(null);
  const toast = useRef(null);
  console.log("Inscrição:", inscricao);
  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };

  const showSuccess = (message) => {
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: message,
      life: 5000,
    });
  };

  const handleFinalizarInscricao = async () => {
    setSubmitting(true);
    setErrors([]);

    try {
      await submissaoInscricao(tenant, inscricaoSelected);
      showSuccess("Inscrição enviada com sucesso!");
      Router.push(
        `/${tenant}/user/editais/inscricoes/${inscricaoSelected}/acompanhamento`,
      );
    } catch (error) {
      console.error("Erro ao enviar a inscrição:", error);

      if (Array.isArray(error.response?.data?.errors)) {
        setErrors(error.response.data.errors);
      } else {
        showError(
          error.message ||
            "Ocorreu um erro inesperado ao enviar sua inscrição. Tente novamente.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addProjetoVinculado = (projeto) => {
    setInscricao((prev) => ({
      ...prev,
      InscricaoProjeto: [...prev.InscricaoProjeto, { id: projeto.id, projeto }],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getInscricaoUserById(tenant, inscricaoSelected);
        setInscricao(response);
        setEditalInfo(response.edital);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, inscricaoSelected]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setItemToEdit(data);
    setPlanoDeTrabalhoSelected(data);
    setErrors([]);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setErrorDelete("");
    setIsModalOpenProjeto(false);
    setSelectedProjetoId(null);
    setIsModalOpenPlanoDeTrabalho(false);
    setPlanoDeTrabalhoSelected(null);
    setIsModalOpenInscricao(false);
  };

  const openProjetoModal = (projetoId) => {
    setSelectedProjetoId(projetoId);
    setIsModalOpenProjeto(true);
  };

  const handleUnlinkProjeto = async (projetoId) => {
    const projetoRemovido = inscricao.InscricaoProjeto.find(
      (item) => item.projeto.id === projetoId,
    );
    setInscricao((prev) => ({
      ...prev,
      InscricaoProjeto: prev.InscricaoProjeto.filter(
        (item) => item.projeto.id !== projetoId,
      ),
    }));
    setErrorDelete(null);

    try {
      await unlinkProjetoFromInscricao(tenant, inscricaoSelected, projetoId);
      showSuccess("Projeto desvinculado com sucesso!");
    } catch (error) {
      console.error("Erro ao desvincular projeto:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao desvincular o projeto.";
      setErrorDelete(errorMessage);
      setInscricao((prev) => ({
        ...prev,
        InscricaoProjeto: [...prev.InscricaoProjeto, projetoRemovido],
      }));
      showError(errorMessage);
    }
  };

  const handleDeletePlanoDeTrabalho = async (planoId) => {
    const planoRemovido = inscricao.planosDeTrabalho.find(
      (item) => item.id === planoId,
    );
    setInscricao((prev) => ({
      ...prev,
      planosDeTrabalho: prev.planosDeTrabalho.filter(
        (item) => item.id !== planoId,
      ),
    }));
    setErrorDelete(null);

    try {
      await deletePlanoDeTrabalho(tenant, inscricaoSelected, planoId);
      showSuccess("Plano de trabalho excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir Plano de Trabalho:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao excluir o Plano de Trabalho.";
      setErrorDelete(errorMessage);
      setInscricao((prev) => ({
        ...prev,
        planosDeTrabalho: [...prev.planosDeTrabalho, planoRemovido],
      }));
      showError(errorMessage);
    }
  };

  const handleDeleteParticipacao = async (participacaoId) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta participação? Esta ação não pode ser desfeita.",
    );
    if (!confirmed) return;

    setDeletingParticipacaoId(participacaoId);
    setErrorDelete(null);

    try {
      await deleteParticipacao(tenant, participacaoId);
      setInscricao((prev) => ({
        ...prev,
        participacoes: prev.participacoes.filter(
          (item) => item.id !== participacaoId,
        ),
      }));
      showSuccess("Participação excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir Participação:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao excluir a Participação.";
      setErrorDelete(errorMessage);
      showError(errorMessage);
    } finally {
      setDeletingParticipacaoId(null);
    }
  };

  const updatePlanoDeTrabalhoList = (updatedPlano) => {
    setInscricao((prev) => {
      const existingPlanoIndex = prev.planosDeTrabalho.findIndex(
        (item) => item.id === updatedPlano.id,
      );

      let updatedPlanosDeTrabalho;
      if (existingPlanoIndex !== -1) {
        updatedPlanosDeTrabalho = [...prev.planosDeTrabalho];
        updatedPlanosDeTrabalho[existingPlanoIndex] = updatedPlano;
      } else {
        updatedPlanosDeTrabalho = [...prev.planosDeTrabalho, updatedPlano];
      }

      return {
        ...prev,
        planosDeTrabalho: updatedPlanosDeTrabalho,
      };
    });
  };

  const getStepIcon = (step) => {
    switch (step) {
      case "orientador":
        return RiUserSettingsLine;
      case "projetos":
        return RiProjectorLine;
      default:
        return RiUserSettingsLine;
    }
  };

  // Função para contar solicitações de bolsa
  const countBolsaSolicitadas = () => {
    if (!inscricao?.participacoes) return 0;
    return inscricao.participacoes.filter(
      (participacao) =>
        participacao.tipo === "aluno" && participacao.solicitarBolsa === true,
    ).length;
  };

  // Função para verificar se atingiu o limite de planos
  const atingiuLimitePlanos = () => {
    if (!inscricao?.planosDeTrabalho || !editalInfo?.maxPlanos) return false;
    return inscricao.planosDeTrabalho.length >= editalInfo.maxPlanos;
  };

  // Função para verificar se atingiu o limite de bolsas
  const atingiuLimiteBolsa = () => {
    const bolsasSolicitadas = countBolsaSolicitadas();
    return bolsasSolicitadas >= (editalInfo?.maxSolicitacaoBolsa || 0);
  };

  // Função para verificar se pode adicionar mais alunos ao plano
  const podeAdicionarAluno = (planoId) => {
    const alunosNoPlano =
      inscricao.participacoes?.filter(
        (p) => p?.tipo === "aluno" && p?.planoDeTrabalhoId === planoId,
      ).length || 0;
    return alunosNoPlano < (inscricao.edital?.maxAlunosPorPlano || 0);
  };
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <ProgressSpinner style={{ width: "40px", height: "40px" }} />
        <p>Carregando inscrição...</p>
      </div>
    );
  }

  if (notFound) {
    return <NoData description="Inscrição não encontrada :/" />;
  }

  return (
    <>
      <Toast ref={toast} position="top-right" />

      {/* Modais */}
      <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
        <div className={styles.modalIcon}>
          <RiEditLine />
        </div>
        <ParticipacaoController
          itemToEdit={itemToEdit}
          tenant={tenant}
          inscricaoSelected={inscricaoSelected}
          setInscricao={setInscricao}
          closeModalAndResetData={closeModalAndResetData}
          planoDeTrabalhoDetalhes={planoDeTrabalhoSelected}
          tipoParticipacao={tipoParticipacao}
          atingiuLimiteBolsa={atingiuLimiteBolsa()}
        />
      </Modal>

      <Modal
        size={"large"}
        isOpen={isModalOpenProjeto}
        onClose={closeModalAndResetData}
      >
        <div className={styles.modalIcon}>
          <RiEditLine />
        </div>
        <ProjetoController
          tenant={tenant}
          inscricaoSelected={inscricaoSelected}
          idProjeto={selectedProjetoId}
          closeModal={closeModalAndResetData}
          onProjetoVinculado={addProjetoVinculado}
          editalFormularioId={editalInfo?.formProjetoId}
          inscricao={inscricao}
        />
      </Modal>

      <Modal
        size={"large"}
        isOpen={isModalOpenPlanoDeTrabalho}
        onClose={closeModalAndResetData}
      >
        <div className={styles.modalIcon}>
          <RiEditLine />
        </div>
        <PlanoDeTrabalhoController
          tenantSlug={tenant}
          idInscricao={inscricaoSelected}
          idProjeto={selectedProjetoId}
          onClose={closeModalAndResetData}
          planoDeTrabalhoDetalhes={planoDeTrabalhoSelected}
          onUpdatePlanoDeTrabalho={updatePlanoDeTrabalhoList}
          editalFormularioId={editalInfo?.formPlanoDeTrabalhoId}
        />
      </Modal>

      <Modal
        size={"large"}
        isOpen={isModalOpenInscricao}
        onClose={closeModalAndResetData}
      >
        <div className={styles.modalIcon}>
          <RiEditLine />
        </div>
        <VerInscricao
          inscricaoSelected={inscricaoSelected}
          tenant={tenant}
          setErrors={setErrors}
          onClose={closeModalAndResetData}
        />
      </Modal>

      {/* Conteúdo Principal */}
      {inscricao && (
        <div className={styles.container}>
          {/* Header */}
          <Card className={styles.headerCard}>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>
                <h4>Formulário de Inscrição</h4>
                <p className={styles.headerSubtitle}>
                  Complete as etapas abaixo para finalizar sua inscrição
                </p>
              </div>
              <div className={styles.editalInfo}>
                <div className={styles.editalBadge}>
                  <span className={styles.editalAno}>
                    {inscricao.edital?.ano}
                  </span>
                </div>
                <p className={styles.editalTitulo}>
                  {inscricao.edital?.titulo}
                </p>
              </div>
            </div>
          </Card>

          {/* Alertas de Erro */}
          {errors.length > 0 && (
            <div className={styles.errorsContainer}>
              {errors.map((error, index) => (
                <div key={index} className={styles.errorAlert}>
                  <RiAlertLine size={18} />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Botão de Envio */}
          <div className={styles.submitSection}>
            <Button
              className={styles.submitButton}
              type="button"
              disabled={submitting}
              icon={RiSendPlaneLine}
              onClick={handleFinalizarInscricao}
            >
              {submitting ? "Enviando..." : "Finalizar e enviar inscrição"}
            </Button>
            <p className={styles.termoText}>
              Ao enviar a inscrição, você concorda com os termos estabelecidos
              no edital.
            </p>
          </div>

          {/* Steps Menu */}
          <div className={styles.stepsContainer}>
            <button
              className={`${styles.stepTab} ${activeStep === "orientador" ? styles.active : ""}`}
              onClick={() => setActiveStep("orientador")}
            >
              <RiUserSettingsLine size={20} />
              <span>Orientador</span>
              {inscricao.participacoes?.filter(
                (item) => item?.tipo === "orientador",
              ).length > 0 && (
                <span className={styles.stepCount}>
                  {
                    inscricao.participacoes.filter(
                      (item) => item?.tipo === "orientador",
                    ).length
                  }
                </span>
              )}
            </button>

            <button
              className={`${styles.stepTab} ${activeStep === "projetos" ? styles.active : ""}`}
              onClick={() => setActiveStep("projetos")}
            >
              <RiProjectorLine size={20} />
              <span>Projetos</span>
              {inscricao.InscricaoProjeto?.length > 0 && (
                <span className={styles.stepCount}>
                  {inscricao.InscricaoProjeto.length}
                </span>
              )}
            </button>
          </div>

          {/* Conteúdo Dinâmico */}
          <Card className={styles.contentCard}>
            {/* ORIENTADOR */}
            {activeStep === "orientador" && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h5>Orientação</h5>
                  <p className={styles.sectionDescription}>
                    Adicione o orientador responsável por esta inscrição
                  </p>
                </div>

                {inscricao.participacoes
                  ?.filter((item) => item?.tipo === "orientador")
                  .sort((a, b) => a.id - b.id)
                  .map((item) => (
                    <div className={styles.participacaoItem} key={item.id}>
                      <div
                        className={styles.participacaoInfoClickable}
                        onClick={() => {
                          openModalAndSetData(item);
                          setTipoParticipacao("orientador");
                        }}
                      >
                        <div className={styles.participacaoInfo}>
                          <div
                            className={`${styles.statusBadge} ${item.status === "incompleto" ? styles.incompleto : styles.completo}`}
                          >
                            {item.status === "incompleto" ? (
                              <RiAlertLine size={14} />
                            ) : (
                              <RiCheckboxCircleLine size={14} />
                            )}
                            <span>
                              {item.status === "incompleto"
                                ? "Incompleto"
                                : "Completo"}
                            </span>
                          </div>
                          <div className={styles.participacaoDetails}>
                            <span className={styles.participacaoTipo}>
                              Orientador
                            </span>
                            <span className={styles.participacaoNome}>
                              {item.user.nome.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.participacaoActions}>
                        {/* Botão de Excluir Participação (Orientador) */}
                        <button
                          className={`${styles.iconButton} ${styles.danger}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteParticipacao(item.id);
                          }}
                          disabled={deletingParticipacaoId === item.id}
                          title="Remover orientador"
                        >
                          {deletingParticipacaoId === item.id ? (
                            <span className={styles.deletingText}>...</span>
                          ) : (
                            <RiDeleteBinLine size={18} />
                          )}
                        </button>
                      </div>
                      <RiArrowRightSLine size={18} />
                    </div>
                  ))}

                {editalInfo.maxOrientadores <
                  inscricao.participacoes.filter(
                    (item) => item?.tipo === "orientador",
                  ).length && (
                  <button
                    className={styles.addButton}
                    onClick={() => {
                      setTipoParticipacao("orientador");
                      openModalAndSetData(null);
                    }}
                  >
                    <RiUserAddLine size={20} />
                    <span>Adicionar orientador</span>
                  </button>
                )}
              </div>
            )}

            {/* PROJETOS */}
            {activeStep === "projetos" && (
              <div className={styles.section}>
                {/* Contadores */}
                <div className={styles.countersContainer}>
                  <div className={styles.counterCard}>
                    <div className={styles.counterHeader}>
                      <RiArticleLine size={18} />
                      <span>Planos de Trabalho</span>
                    </div>
                    <div className={styles.counterValue}>
                      {inscricao.planosDeTrabalho?.length || 0} /{" "}
                      {editalInfo?.maxPlanos || 0}
                    </div>
                  </div>
                  <div className={styles.counterCard}>
                    <div className={styles.counterHeader}>
                      <RiUserAddLine size={18} />
                      <span>Solicitações de Bolsa</span>
                    </div>
                    <div className={styles.counterValue}>
                      {countBolsaSolicitadas()} /{" "}
                      {editalInfo?.maxSolicitacaoBolsa || 0}
                    </div>
                    {atingiuLimiteBolsa() && (
                      <div className={styles.counterWarning}>
                        <RiAlertLine size={14} />
                        <span>Limite de bolsas atingido</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.sectionHeader}>
                  <h5>Projetos e Planos de Trabalho</h5>
                  <p className={styles.sectionDescription}>
                    Vincule projetos e adicione planos de trabalho com seus
                    respectivos alunos
                  </p>
                </div>

                {inscricao.InscricaoProjeto?.map((item) => (
                  <div key={item.id} className={styles.projetoCard}>
                    <div className={styles.projetoHeader}>
                      <div className={styles.projetoInfo}>
                        <RiFolder5Line size={20} />
                        <div>
                          <span className={styles.projetoLabel}>Projeto</span>
                          <h6 className={styles.projetoTitulo}>
                            {item.projeto.titulo}
                          </h6>
                        </div>
                      </div>
                      <div className={styles.projetoActions}>
                        <button
                          className={styles.iconButton}
                          onClick={() => openProjetoModal(item.projeto.id)}
                          title="Ver projeto"
                        >
                          <RiEyeLine size={18} />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.warning}`}
                          onClick={() => handleUnlinkProjeto(item.projeto.id)}
                          title="Desvincular projeto"
                        >
                          <RiLinkUnlink size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Planos de Trabalho */}
                    {inscricao.planosDeTrabalho
                      ?.filter(
                        (i) =>
                          i.projetoId === item.projetoId ||
                          i.projetoId === item.id,
                      )
                      .sort((a, b) => a.id - b.id)
                      .map((element) => (
                        <div key={element.id} className={styles.planoCard}>
                          <div className={styles.planoHeader}>
                            <div className={styles.planoInfo}>
                              <RiArticleLine size={18} />
                              <div>
                                <span className={styles.planoLabel}>
                                  Plano de Trabalho
                                </span>
                                <h6 className={styles.planoTitulo}>
                                  {element.titulo}
                                </h6>
                              </div>
                            </div>
                            <div className={styles.planoActions}>
                              <button
                                className={styles.iconButton}
                                onClick={() => {
                                  setSelectedProjetoId(item.projeto.id);
                                  setPlanoDeTrabalhoSelected(element);
                                  setIsModalOpenPlanoDeTrabalho(true);
                                }}
                                title="Ver plano"
                              >
                                <RiEyeLine size={18} />
                              </button>
                              <button
                                className={`${styles.iconButton} ${styles.danger}`}
                                onClick={() =>
                                  handleDeletePlanoDeTrabalho(element.id)
                                }
                                title="Excluir plano de trabalho"
                              >
                                <RiDeleteBinLine size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Alunos do Plano */}
                          <div className={styles.alunosSection}>
                            <div className={styles.alunosHeader}>
                              <span className={styles.alunosLabel}>
                                Alunos vinculados
                              </span>
                              <span className={styles.alunosCount}>
                                {
                                  inscricao.participacoes?.filter(
                                    (p) =>
                                      p?.tipo === "aluno" &&
                                      p?.planoDeTrabalhoId === element.id,
                                  ).length
                                }{" "}
                                / {inscricao.edital.maxAlunosPorPlano}
                              </span>
                            </div>

                            {inscricao.participacoes
                              ?.filter(
                                (p) =>
                                  p?.tipo === "aluno" &&
                                  p?.planoDeTrabalhoId === element.id,
                              )
                              .sort((a, b) => a.id - b.id)
                              .map((aluno) => (
                                <div
                                  key={aluno.id}
                                  className={styles.alunoItem}
                                >
                                  <div
                                    className={styles.alunoInfoClickable}
                                    onClick={() => {
                                      openModalAndSetData(aluno);
                                      setTipoParticipacao("aluno");
                                    }}
                                  >
                                    <div className={styles.alunoInfo}>
                                      <div
                                        className={`${styles.statusDot} ${aluno.status === "incompleto" ? styles.incompleto : styles.completo}`}
                                      />
                                      <span className={styles.alunoNome}>
                                        {aluno.user.nome.toUpperCase()}
                                      </span>
                                      {aluno.solicitarBolsa && (
                                        <span className={styles.bolsaBadge}>
                                          <RiUserAddLine size={12} />
                                          Bolsa
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    className={`${styles.iconButton} ${styles.danger}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteParticipacao(aluno.id);
                                    }}
                                    disabled={
                                      deletingParticipacaoId === aluno.id
                                    }
                                    title="Remover aluno"
                                  >
                                    {deletingParticipacaoId === aluno.id ? (
                                      <span className={styles.deletingText}>
                                        ...
                                      </span>
                                    ) : (
                                      <RiDeleteBinLine size={16} />
                                    )}
                                  </button>
                                  <RiArrowRightSLine size={18} />
                                </div>
                              ))}

                            {podeAdicionarAluno(element.id) && (
                              <button
                                className={styles.addAlunoButton}
                                onClick={() => {
                                  setTipoParticipacao("aluno");
                                  openModalAndSetData(null);
                                  setPlanoDeTrabalhoSelected(element);
                                }}
                              >
                                <RiUserAddLine size={16} />
                                <span>Adicionar aluno</span>
                              </button>
                            )}

                            {podeAdicionarAluno(element.id) &&
                              atingiuLimiteBolsa() && (
                                <div className={styles.limitWarning}>
                                  <RiAlertLine size={14} />
                                  <span>
                                    Limite máximo de bolsas atingido. Não é
                                    possível adicionar mais alunos com bolsa.
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}

                    {/* Botão Adicionar Plano de Trabalho - só aparece se não atingiu o limite */}
                    {!atingiuLimitePlanos() && (
                      <button
                        className={styles.addPlanoButton}
                        onClick={() => {
                          setPlanoDeTrabalhoSelected(null);
                          setSelectedProjetoId(item.projeto.id);
                          setIsModalOpenPlanoDeTrabalho(true);
                        }}
                      >
                        <RiArticleLine size={18} />
                        <span>Adicionar Plano de Trabalho</span>
                      </button>
                    )}

                    {atingiuLimitePlanos() && (
                      <div className={styles.limitWarning}>
                        <RiAlertLine size={14} />
                        <span>
                          Limite máximo de {editalInfo?.maxPlanos} planos de
                          trabalho atingido
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Botão Vincular novo projeto - CORRIGIDO: sempre visível quando existem projetos ou não */}
                {(!inscricao.InscricaoProjeto?.length ||
                  inscricao.InscricaoProjeto?.length > 0) && (
                  <button
                    className={styles.addProjetoButton}
                    onClick={() => setIsModalOpenProjeto(true)}
                  >
                    <RiFolder5Line size={20} />
                    <span>Vincular novo projeto</span>
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default FluxoInscricaoEdital;

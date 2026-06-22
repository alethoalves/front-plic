"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./FluxoInscricaoEdital.module.scss";
import {
  RiAlertLine,
  RiArticleLine,
  RiCheckboxCircleLine,
  RiCheckboxBlankCircleLine,
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
import { getQuestionarioPublico } from "@/app/api/client/questionarioSatisfacao";
import QuestionarioSatisfacaoModal from "@/components/QuestionarioSatisfacaoModal";
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
import { useRouter } from "next/navigation";

const FluxoInscricaoEdital = ({
  tenant,
  inscricaoSelected,
  gestorMode = false,
}) => {
  const router = useRouter();
  // ESTADOS
  const [inscricao, setInscricao] = useState();
  const [activeStep, setActiveStep] = useState("orientador");
  const [, setErrorDelete] = useState(null);
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
  const [showQuestionario, setShowQuestionario] = useState(false);
  const [questionario, setQuestionario] = useState(null);
  const toast = useRef(null);
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

  const executarSubmissao = async () => {
    setSubmitting(true);
    setErrors([]);
    try {
      await submissaoInscricao(tenant, inscricaoSelected);
      showSuccess("Inscrição enviada com sucesso!");
      if (gestorMode) {
        router.push(`/${tenant}/gestor/${editalInfo?.ano}/inscricoes`);
      } else {
        router.push(
          `/${tenant}/user/editais/inscricoes/${inscricaoSelected}/acompanhamento`,
        );
      }
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

  const handleFinalizarInscricao = async () => {
    // Se já respondeu, submete direto sem verificar questionário
    if (inscricao?.questionarioRespondido) {
      executarSubmissao();
      return;
    }
    // Verifica se existe questionário ativo para inscrição neste tenant
    try {
      const q = await getQuestionarioPublico(tenant, "inscricao");
      setQuestionario(q);
      setShowQuestionario(true);
    } catch {
      // Sem questionário ativo — submete direto
      executarSubmissao();
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

  // Checklist de pendências da inscrição
  const computeChecks = () => {
    if (!inscricao || !editalInfo) return [];

    const orientadores =
      inscricao.participacoes?.filter((p) => p.tipo === "orientador") || [];
    const projetos = inscricao.InscricaoProjeto || [];
    const planos = inscricao.planosDeTrabalho || [];
    const alunos =
      inscricao.participacoes?.filter((p) => p.tipo === "aluno") || [];

    const checks = [
      {
        label: "Orientador adicionado",
        done: orientadores.length > 0,
        disabled: false,
        tab: "orientador",
        action: () => {
          setActiveStep("orientador");
          setTipoParticipacao("orientador");
          openModalAndSetData(null);
        },
      },
    ];

    if (editalInfo.formOrientadorId) {
      checks.push({
        label: "Formulário do orientador preenchido",
        done:
          orientadores.length > 0 &&
          orientadores.every((p) => p.status !== "incompleto"),
        disabled: orientadores.length === 0,
        tab: "orientador",
        action: () => {
          const incompleto = orientadores.find((p) => p.status === "incompleto");
          setActiveStep("orientador");
          setTipoParticipacao("orientador");
          openModalAndSetData(incompleto || orientadores[0]);
        },
      });
    }

    checks.push({
      label: "Projeto vinculado",
      done: projetos.length > 0,
      disabled: false,
      tab: "projetos",
      action: () => {
        setActiveStep("projetos");
        setIsModalOpenProjeto(true);
      },
    });

    checks.push({
      label: "Plano de Trabalho adicionado",
      done: planos.length > 0,
      disabled: projetos.length === 0,
      tab: "projetos",
      action: () => {
        setActiveStep("projetos");
        const primeiroProjeto = projetos[0];
        if (primeiroProjeto) {
          setSelectedProjetoId(primeiroProjeto.projeto.id);
          setPlanoDeTrabalhoSelected(null);
          setIsModalOpenPlanoDeTrabalho(true);
        }
      },
    });

    checks.push({
      label: "Aluno adicionado",
      done: alunos.length > 0,
      disabled: planos.length === 0,
      tab: "projetos",
      action: () => {
        setActiveStep("projetos");
        const primeiroPlano = planos[0];
        if (primeiroPlano) {
          setTipoParticipacao("aluno");
          setPlanoDeTrabalhoSelected(primeiroPlano);
          openModalAndSetData(null);
        }
      },
    });

    if (editalInfo.formAlunoId) {
      checks.push({
        label: "Formulário do aluno preenchido",
        done:
          alunos.length > 0 && alunos.every((p) => p.status !== "incompleto"),
        disabled: alunos.length === 0,
        tab: "projetos",
        action: () => {
          const incompleto = alunos.find((p) => p.status === "incompleto");
          setActiveStep("projetos");
          setTipoParticipacao("aluno");
          openModalAndSetData(incompleto || alunos[0]);
        },
      });
    }

    return checks;
  };

  // Função para verificar se pode adicionar mais alunos ao plano
  const podeAdicionarAluno = (planoId) => {
    const alunosNoPlano =
      inscricao.participacoes?.filter(
        (p) => p?.tipo === "aluno" && p?.planoDeTrabalhoId === planoId,
      ).length || 0;
    return alunosNoPlano < (inscricao.edital?.maxAlunosPorPlano || 0);
  };

  const getPlanosPorProjeto = (inscricaoProjetoItem) =>
    inscricao.planosDeTrabalho?.filter(
      (i) =>
        i.projetoId === inscricaoProjetoItem.projetoId ||
        i.projetoId === inscricaoProjetoItem.id,
    ) ?? [];

  const getRemuneradosPorProjeto = (inscricaoProjetoItem) => {
    const planoIds = getPlanosPorProjeto(inscricaoProjetoItem).map((p) => p.id);
    return (
      inscricao.participacoes?.filter(
        (p) =>
          p.tipo === "aluno" &&
          p.solicitarBolsa === true &&
          planoIds.includes(p.planoDeTrabalhoId),
      ).length ?? 0
    );
  };

  const getMaxVoluntariosPorProjeto = (inscricaoProjetoItem) => {
    const maxRemunerados = editalInfo?.maxRemuneradosPorProjeto || 2;
    const maxVoluntarios = editalInfo?.maxVoluntariosPorProjeto || 4;
    const remunerados = getRemuneradosPorProjeto(inscricaoProjetoItem);
    return maxRemunerados + maxVoluntarios - remunerados;
  };

  const getVoluntariosPorProjeto = (inscricaoProjetoItem) => {
    const planoIds = getPlanosPorProjeto(inscricaoProjetoItem).map((p) => p.id);
    return (
      inscricao.participacoes?.filter(
        (p) =>
          p.tipo === "aluno" &&
          p.solicitarBolsa !== true &&
          planoIds.includes(p.planoDeTrabalhoId),
      ).length ?? 0
    );
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
          editalAno={editalInfo?.ano}
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
          minAtividadesPorPlano={editalInfo?.minAtividadesPorPlano}
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

      {/* Banner Modo Gestor */}
      {gestorMode && (
        <div className={styles.gestorBanner}>
          <RiUserSettingsLine size={18} />
          <span>
            Modo Gestor — você está acessando esta inscrição em nome do
            proponente.
          </span>
        </div>
      )}

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

          {/* Banner de Status da Inscrição */}
          {(() => {
            const checks = computeChecks();
            const allDone = checks.every((c) => c.done);
            const pendingCount = checks.filter(
              (c) => !c.done && !c.disabled,
            ).length;

            return (
              <div
                className={`${styles.statusBanner} ${allDone ? styles.bannerReady : styles.bannerPending}`}
              >
                <div className={styles.statusBannerHeader}>
                  <span className={styles.statusBannerIcon}>
                    {allDone ? (
                      <RiCheckboxCircleLine size={22} />
                    ) : (
                      <RiAlertLine size={22} />
                    )}
                  </span>
                  <div>
                    <p className={styles.statusBannerTitle}>
                      {allDone
                        ? "Inscrição não enviada! Clique em finalizar para concluir."
                        : "Inscrição não finalizada"}
                    </p>
                    {!allDone && (
                      <p className={styles.statusBannerSubtitle}>
                        {pendingCount === 0
                          ? "Complete os itens obrigatórios antes de enviar"
                          : `${pendingCount} ${pendingCount === 1 ? "item pendente" : "itens pendentes"} — complete antes de enviar`}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.checkList}>
                  {checks.map((check, idx) => {
                    const state = check.disabled
                      ? "waiting"
                      : check.done
                        ? "done"
                        : "pending";
                    return (
                      <div
                        key={idx}
                        className={`${styles.checkItem} ${styles[state]}`}
                      >
                        <span className={styles.checkIcon}>
                          {state === "done" && (
                            <RiCheckboxCircleLine size={16} />
                          )}
                          {state === "pending" && <RiAlertLine size={16} />}
                          {state === "waiting" && (
                            <RiCheckboxBlankCircleLine size={16} />
                          )}
                        </span>
                        <span className={styles.checkLabel}>{check.label}</span>
                        {state === "pending" && check.action && (
                          <button
                            className={styles.checkAction}
                            onClick={check.action}
                          >
                            Ir →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className={styles.supportChannels}>
                  <div className={styles.supportChannel}>
                    <span className={styles.supportChannelIcon}>💬</span>
                    <div className={styles.supportChannelBody}>
                      <span className={styles.supportChannelLabel}>Problema técnico na plataforma?</span>
                      <a
                        href={`https://wa.me/5561991651494?text=${encodeURIComponent("Olá! Preciso de ajuda com minha inscrição no PLIC.")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.supportChannelLink + " " + styles.whatsapp}
                      >
                        Chamar suporte no WhatsApp →
                      </a>
                    </div>
                  </div>
                  {editalInfo?.tenant?.emailTenant && (
                    <div className={styles.supportChannel}>
                      <span className={styles.supportChannelIcon}>✉️</span>
                      <div className={styles.supportChannelBody}>
                        <span className={styles.supportChannelLabel}>Dúvida sobre as regras do edital?</span>
                        <a
                          href={`mailto:${editalInfo.tenant.emailTenant}`}
                          className={styles.supportChannelLink + " " + styles.email}
                        >
                          {editalInfo.tenant.emailTenant}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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
                      <RiFolder5Line size={18} />
                      <span>Projetos</span>
                    </div>
                    <div className={styles.counterValue}>
                      {inscricao.InscricaoProjeto?.length || 0} /{" "}
                      {editalInfo?.maxProjetos || 0}
                    </div>
                  </div>
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

                    {/* Contadores por projeto */}
                    <div className={styles.projetoCounters}>
                      <div
                        className={`${styles.projetoCounter} ${getPlanosPorProjeto(item).length >= (editalInfo?.maxPlanosPorProjeto || 6) ? styles.atLimit : ""}`}
                      >
                        <span className={styles.projetoCounterLabel}>
                          Planos
                        </span>
                        <span className={styles.projetoCounterValue}>
                          {getPlanosPorProjeto(item).length} /{" "}
                          {editalInfo?.maxPlanosPorProjeto || 6}
                        </span>
                      </div>
                      <div
                        className={`${styles.projetoCounter} ${getRemuneradosPorProjeto(item) >= (editalInfo?.maxRemuneradosPorProjeto || 2) ? styles.atLimit : ""}`}
                      >
                        <span className={styles.projetoCounterLabel}>
                          Remunerados
                        </span>
                        <span className={styles.projetoCounterValue}>
                          {getRemuneradosPorProjeto(item)} /{" "}
                          {editalInfo?.maxRemuneradosPorProjeto || 2}
                        </span>
                      </div>
                      <div
                        className={`${styles.projetoCounter} ${getVoluntariosPorProjeto(item) >= getMaxVoluntariosPorProjeto(item) ? styles.atLimit : ""}`}
                      >
                        <span className={styles.projetoCounterLabel}>
                          Voluntários
                        </span>
                        <span className={styles.projetoCounterValue}>
                          {getVoluntariosPorProjeto(item)} /{" "}
                          {getMaxVoluntariosPorProjeto(item)}
                        </span>
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
        </div>
      )}

      {showQuestionario && questionario && (
        <QuestionarioSatisfacaoModal
          tenant={tenant}
          questionario={questionario}
          inscricaoId={inscricaoSelected}
          onConcluir={() => {
            setShowQuestionario(false);
            // Após responder, marca localmente para não exibir novamente caso a submissão falhe
            setInscricao((prev) =>
              prev ? { ...prev, questionarioRespondido: true } : prev,
            );
            executarSubmissao();
          }}
          onCancelar={() => {
            // Apenas fecha — usuário retorna à inscrição sem submeter
            setShowQuestionario(false);
          }}
        />
      )}
    </>
  );
};

export default FluxoInscricaoEdital;

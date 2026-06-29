"use client";
import {
  RiGroupLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiArrowRightSLine,
  RiGraduationCapLine,
  RiUserStarLine,
  RiUserSharedLine,
  RiLockLine,
  RiQuestionLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useRef, useState } from "react";
import { getMinhasParticipacoes } from "@/app/api/client/participacao";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import { validarParticipacao } from "@/app/api/client/participacao";
import Modal from "@/components/Modal";
import EditarParticipacao from "@/components/participacao/EditarParticipacao";
import NoData from "@/components/NoData";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [participacoes, setParticipacoes] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear(),
  );
  const [anos, setAnos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipacao, setSelectedParticipacao] = useState(null);
  const [inscricao, setInscricao] = useState(null);
  const [helpModal, setHelpModal] = useState(null);
  const toast = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getMinhasParticipacoes(params.tenant);
        const data = response || [];
        setParticipacoes(data);

        const anosUnicos = [
          ...new Set(data.map((p) => p.inscricao?.edital?.ano).filter(Boolean)),
        ].sort((a, b) => b - a);
        setAnos(anosUnicos);

        const anoAtual = new Date().getFullYear();
        if (anosUnicos.length > 0 && !anosUnicos.includes(anoAtual)) {
          setAnoSelecionado(anosUnicos[0]);
        }
      } catch (error) {
        console.error("Erro ao buscar participações:", error);
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao carregar participações",
          life: 5000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  const participacoesFiltradas = participacoes.filter(
    (p) => p.inscricao?.edital?.ano === anoSelecionado,
  );

  const isEditalAberto = (participacao) => {
    const fimInscricao = participacao.inscricao?.edital?.fimInscricao;
    if (!fimInscricao) return false;
    return new Date(fimInscricao) >= new Date();
  };

  const podeEditar = (participacao) => {
    return (
      isEditalAberto(participacao) &&
      participacao.statusParticipacao === "EM_ANALISE"
    );
  };

  const handleOpenModal = async (participacao) => {
    if (!podeEditar(participacao)) return;

    try {
      const inscricaoData = await getInscricaoUserById(
        params.tenant,
        participacao.inscricao.id,
      );
      setInscricao(inscricaoData);
      setSelectedParticipacao(participacao);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Erro ao buscar inscrição:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar dados da inscrição",
        life: 5000,
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParticipacao(null);
    setInscricao(null);
  };

  const handleValidateParticipacao = async (tenantSlug, participacaoData) => {
    try {
      await validarParticipacao(tenantSlug, participacaoData?.id);
      const updatedParticipacoes = await getMinhasParticipacoes(params.tenant);
      setParticipacoes(updatedParticipacoes || []);
    } catch (error) {
      console.error("Erro ao validar participação:", error);
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "orientador":
        return <RiUserStarLine size={18} />;
      case "coorientador":
        return <RiUserSharedLine size={18} />;
      case "aluno":
        return <RiGraduationCapLine size={18} />;
      default:
        return null;
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case "orientador":
        return "Orientador";
      case "coorientador":
        return "Coorientador";
      case "aluno":
        return "Aluno";
      default:
        return tipo;
    }
  };

  const getStatusParticipacaoLabel = (status) => {
    switch (status) {
      case "EM_ANALISE":
        return "Em análise";
      case "APROVADA":
        return "Aprovada";
      case "RECUSADA":
        return "Recusada";
      case "SUBSTITUIDA":
        return "Substituída";
      case "CANCELADA":
        return "Cancelada";
      case "ATIVA":
      case "ativo":
        return "Ativa";
      case "PENDENTE":
        return "Pendente";
      case "INATIVA":
      case "inativo":
        return "Inativa";
      default:
        return status;
    }
  };

  const getStatusParticipacaoVariant = (status) => {
    switch (status) {
      case "APROVADA":
      case "ATIVA":
      case "ativo":
        return "success";
      case "EM_ANALISE":
      case "PENDENTE":
        return "warning";
      case "RECUSADA":
      case "CANCELADA":
      case "SUBSTITUIDA":
      case "INATIVA":
      case "inativo":
        return "danger";
      default:
        return "default";
    }
  };

  const helpTexts = {
    statusParticipacao: {
      titulo: "Status da Participação",
      descricao:
        "Indica a situação da sua participação no edital, definida pela gestão do programa.",
      itens: [
        { label: "Em análise", desc: "Sua participação está sendo avaliada." },
        { label: "Aprovada", desc: "Sua participação foi aprovada." },
        { label: "Ativa", desc: "Sua participação está ativa e em execução." },
        { label: "Pendente", desc: "Há uma pendência a ser resolvida." },
        { label: "Recusada", desc: "Sua participação foi recusada." },
        { label: "Inativa", desc: "Sua participação foi inativada." },
        {
          label: "Substituída",
          desc: "Você foi substituído nesta participação.",
        },
        { label: "Cancelada", desc: "Sua participação foi cancelada." },
      ],
    },
    statusInscricao: {
      titulo: "Status da Inscrição",
      descricao:
        "Indica se o proponente (orientador responsável) já finalizou e enviou a inscrição do edital.",
      itens: [
        {
          label: "Pendente",
          desc: "A inscrição ainda não foi enviada pelo proponente.",
        },
        { label: "Enviada", desc: "A inscrição já foi finalizada e enviada." },
      ],
    },
    statusDocumentacao: {
      titulo: "Status da Documentação",
      descricao:
        "Indica se a sua documentação (currículo Lattes, formulários, etc.) já foi completamente preenchida.",
      itens: [
        {
          label: "Pendente",
          desc: "Há documentos ou formulários que ainda precisam ser preenchidos.",
        },
        {
          label: "Completo",
          desc: "Toda a documentação necessária foi enviada.",
        },
      ],
    },
  };

  const openHelp = (e, type) => {
    e.stopPropagation();
    setHelpModal(type);
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />

      <Modal
        isOpen={!!helpModal}
        onClose={() => setHelpModal(null)}
        size="small"
      >
        {helpModal && helpTexts[helpModal] && (
          <div className={styles.helpContent}>
            <div className={styles.helpIcon}>
              <RiQuestionLine size={24} />
            </div>
            <h4>{helpTexts[helpModal].titulo}</h4>
            <p className={styles.helpDescricao}>
              {helpTexts[helpModal].descricao}
            </p>
            <div className={styles.helpItens}>
              {helpTexts[helpModal].itens.map((item, idx) => (
                <div key={idx} className={styles.helpItem}>
                  <strong>{item.label}:</strong> {item.desc}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <RiGroupLine />
            </div>
            <div className={styles.headerContent}>
              <h6>Minhas Participações</h6>
              <p>
                Acompanhe suas participações em editais e envie a documentação
                solicitada.
              </p>
            </div>
          </div>
          {!loading && anos.length > 0 && (
            <div className={styles.anosNav}>
              {anos.map((ano) => (
                <button
                  key={ano}
                  className={`${styles.anoTab} ${ano === anoSelecionado ? styles.anoActive : ""}`}
                  onClick={() => setAnoSelecionado(ano)}
                >
                  {ano}
                </button>
              ))}
            </div>
          )}

          <div className={styles.mainContent}>
            {loading && (
              <div className={styles.loading}>
                <ProgressSpinner style={{ width: "40px", height: "40px" }} />
                <p>Carregando participações...</p>
              </div>
            )}

            {!loading && participacoes.length === 0 && (
              <NoData description="Você ainda não possui participações em editais nesta instituição." />
            )}

            {!loading &&
              participacoes.length > 0 &&
              participacoesFiltradas.length === 0 && (
                <NoData
                  description={`Nenhuma participação encontrada para ${anoSelecionado}.`}
                />
              )}

            {!loading && participacoesFiltradas.length > 0 && (
              <div className={styles.participacoesList}>
                {participacoesFiltradas.map((participacao) => {
                  const editavel = podeEditar(participacao);
                  return (
                    <div
                      key={participacao.id}
                      className={`${styles.participacaoCard} ${!editavel ? styles.fechado : ""}`}
                      onClick={() => handleOpenModal(participacao)}
                    >
                      <div className={styles.cardLeft}>
                        <div className={styles.cardInfo}>
                          <div className={styles.cardEdital}>
                            {participacao.inscricao.edital.titulo} —{" "}
                            {participacao.inscricao.edital.ano}
                          </div>
                          <div className={styles.cardMeta}>
                            <span className={styles.tipoBadge}>
                              {getTipoIcon(participacao.tipo)}
                              {getTipoLabel(participacao.tipo)}
                            </span>
                            <button
                              className={`${styles.statusParticipacaoBadge} ${styles[getStatusParticipacaoVariant(participacao.statusParticipacao)]}`}
                              onClick={(e) => openHelp(e, "statusParticipacao")}
                            >
                              {getStatusParticipacaoLabel(
                                participacao.statusParticipacao,
                              )}
                              <RiQuestionLine size={12} />
                            </button>
                          </div>
                          <button
                            className={`${styles.inscricaoBadge} ${participacao.inscricao.status === "enviada" ? styles.inscricaoEnviada : styles.inscricaoPendente}`}
                            onClick={(e) => openHelp(e, "statusInscricao")}
                          >
                            Inscrição #{participacao.inscricao.id} —{" "}
                            {participacao.inscricao.status === "enviada"
                              ? "Enviada"
                              : "Pendente"}
                            <RiQuestionLine size={12} />
                          </button>
                          {participacao.planoDeTrabalho && (
                            <div className={styles.planoLabel}>
                              {participacao.planoDeTrabalho.titulo}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.cardRight}>
                        {editavel ? (
                          <>
                            <button
                              className={`${styles.statusBadge} ${participacao.status === "incompleto" ? styles.statusIncompleto : styles.statusCompleto}`}
                              onClick={(e) => openHelp(e, "statusDocumentacao")}
                            >
                              {participacao.status === "incompleto" ? (
                                <>
                                  <RiAlertLine size={14} />
                                  pendente
                                </>
                              ) : (
                                <>
                                  <RiCheckboxCircleLine size={14} />
                                  completa
                                </>
                              )}
                              <RiQuestionLine size={12} />
                            </button>
                            <RiArrowRightSLine
                              size={20}
                              className={styles.arrow}
                            />
                          </>
                        ) : (
                          <span className={styles.fechadoBadge}>
                            <RiLockLine size={14} />
                            Inscrições encerradas
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
        {selectedParticipacao && inscricao && (
          <EditarParticipacao
            participacaoInfo={selectedParticipacao}
            setParticipacaoInfo={(updater) => {
              const updated =
                typeof updater === "function"
                  ? updater(selectedParticipacao)
                  : updater;
              setSelectedParticipacao(updated);
              setParticipacoes((prev) =>
                prev.map((p) =>
                  p.id === updated.id ? { ...p, ...updated } : p,
                ),
              );
            }}
            tenant={params.tenant}
            inscricaoSelected={selectedParticipacao.inscricao.id}
            setInscricao={setInscricao}
            closeModalAndResetData={handleCloseModal}
            handleValidateParticipacao={handleValidateParticipacao}
            tipoParticipacao={selectedParticipacao.tipo}
          />
        )}
      </Modal>
    </>
  );
};

export default Page;

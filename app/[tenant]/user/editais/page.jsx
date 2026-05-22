"use client";
import {
  RiArrowRightSLine,
  RiCalendarEventFill,
  RiSurveyLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiTimerLine,
  RiCalendarEventLine,
  RiUserLine,
  RiInformationLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import {
  createInscricaoByUser,
  getMinhasInscricoes,
} from "@/app/api/client/inscricao";
import { formatarData } from "@/lib/formatarDatas";
import NoData from "@/components/NoData";
import Link from "next/link";
import { Card } from "primereact/card";
import { Badge } from "@/components/Badge"; // Se tiver componente Badge, senão criamos
import { getEditais } from "@/app/api/client/edital";

const Page = ({ params }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editais, setEditais] = useState([]);
  const [inscricoes, setInscricoes] = useState([]);
  const [errorMessages, setErrorMessages] = useState({});
  const [inscribingId, setInscribingId] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState({
    open: false,
    editalId: null,
  });
  const [modalNaoAluno, setModalNaoAluno] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [editaisData, inscricoesData] = await Promise.all([
          getEditais(params.tenant),
          getMinhasInscricoes(params.tenant),
        ]);
        setEditais(Array.isArray(editaisData) ? editaisData : []);
        setInscricoes(Array.isArray(inscricoesData) ? inscricoesData : []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  const handleClickInscrever = (editalId) => {
    setModalConfirmacao({ open: true, editalId });
  };

  const handleConfirmarProfessor = async () => {
    const editalId = modalConfirmacao.editalId;
    setModalConfirmacao({ open: false, editalId: null });
    await createNewInscricao(editalId);
  };

  const handleNaoProfessor = () => {
    setModalConfirmacao({ open: false, editalId: null });
    setModalNaoAluno(true);
  };

  const createNewInscricao = async (editalId) => {
    setInscribingId(editalId);
    setErrorMessages((prev) => ({ ...prev, [editalId]: "" }));

    try {
      const response = await createInscricaoByUser(params.tenant, { editalId });
      if (response) {
        router.push(
          `/${params.tenant}/user/editais/inscricoes/${response.inscricao.id}`,
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessages((prev) => ({
        ...prev,
        [editalId]:
          error.response?.data?.message ?? "Erro na conexão com o servidor.",
      }));
    } finally {
      setInscribingId(null);
    }
  };

  const getStatusInfo = (edital) => {
    const hoje = new Date();
    const inicio = edital.inicioInscricao
      ? new Date(edital.inicioInscricao)
      : null;
    const fim = edital.fimInscricao ? new Date(edital.fimInscricao) : null;

    if (!inicio || !fim) {
      return {
        label: "Período não definido",
        icon: RiTimeLine,
        variant: "neutral",
      };
    }

    if (hoje < inicio) {
      return {
        label: "Em breve",
        icon: RiTimerLine,
        variant: "warning",
      };
    }

    if (hoje > fim) {
      return {
        label: "Encerrado",
        icon: RiErrorWarningLine,
        variant: "error",
      };
    }

    return {
      label: "Inscrições Abertas",
      icon: RiCheckboxCircleLine,
      variant: "success",
    };
  };

  const getInscricaoStatusVariant = (status) => {
    switch (status) {
      case "pendente":
        return "warning";
      case "aprovado":
        return "success";
      case "reprovado":
        return "error";
      default:
        return "neutral";
    }
  };
  const anoAtual = new Date().getFullYear();
  const editaisDoAno = editais.filter(
    (edital) => Number(edital.ano) === anoAtual,
  );
  const editaisOrdenados = editaisDoAno.sort((a, b) => a.id - b.id);
  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h3 className={styles.pageTitle}>Editais Disponíveis</h3>
            <p className={styles.pageDescription}>
              Inscreva-se nos programas e editais disponíveis para sua
              participação
            </p>
          </div>
        </div>

        {/* Lista de Editais */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <p>Carregando editais...</p>
          </div>
        ) : editais?.length > 0 ? (
          <div className={styles.editaisGrid}>
            {editaisOrdenados.map((edital) => {
              const statusInfo = getStatusInfo(edital);
              const StatusIcon = statusInfo.icon;
              const inscricoesDoEdital = inscricoes.filter(
                (insc) => insc.edital.id === edital.id,
              );
              const temInscricao = inscricoesDoEdital.length > 0;
              const isOpen = statusInfo.label === "Inscrições Abertas";

              return (
                <Card key={edital.id} className={styles.editalCard}>
                  {/* Status Badge */}
                  <div className={styles.cardStatus}>
                    <Badge variant={statusInfo.variant}>
                      <StatusIcon size={14} />
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Conteúdo Principal */}
                  <div className={styles.cardContent}>
                    <div className={styles.editalInfo}>
                      <span className={styles.editalAno}>{edital.ano}</span>
                      <h4 className={styles.editalTitulo}>{edital.titulo}</h4>
                    </div>

                    {/* Período de Inscrição */}
                    {edital.inicioInscricao && edital.fimInscricao && (
                      <div className={styles.periodoInfo}>
                        <RiCalendarEventLine size={16} />
                        <span>
                          {formatarData(edital.inicioInscricao)} até{" "}
                          {formatarData(edital.fimInscricao)}
                        </span>
                      </div>
                    )}

                    {/* Descrição (se existir) */}
                    {edital.descricao && (
                      <p className={styles.editalDescricao}>
                        {edital.descricao.length > 120
                          ? edital.descricao.substring(0, 120) + "..."
                          : edital.descricao}
                      </p>
                    )}

                    {/* Ações ou Inscrições */}
                    <div className={styles.cardActions}>
                      {!temInscricao && isOpen && (
                        <Button
                          className={styles.inscreverButton}
                          icon={RiSurveyLine}
                          onClick={() => handleClickInscrever(edital.id)}
                          loading={inscribingId === edital.id}
                          disabled={inscribingId === edital.id}
                        >
                          {inscribingId === edital.id
                            ? "Processando..."
                            : "Fazer inscrição"}
                        </Button>
                      )}

                      {temInscricao && (
                        <div className={styles.inscricoesList}>
                          {inscricoesDoEdital.map((inscricao) => {
                            const href =
                              inscricao.status === "pendente"
                                ? `/${params.tenant}/user/editais/inscricoes/${inscricao.id}`
                                : `/${params.tenant}/user/editais/inscricoes/${inscricao.id}/acompanhamento`;

                            return (
                              <Link
                                key={inscricao.id}
                                href={href}
                                className={styles.inscricaoLink}
                              >
                                <div className={styles.inscricaoItem}>
                                  <div className={styles.inscricaoInfo}>
                                    <span className={styles.inscricaoNumero}>
                                      Inscrição #{inscricao.id}
                                    </span>
                                    <Badge
                                      variant={getInscricaoStatusVariant(
                                        inscricao.status,
                                      )}
                                      size="small"
                                    >
                                      {inscricao.status}
                                    </Badge>
                                  </div>
                                  <RiArrowRightSLine size={20} />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {!temInscricao && !isOpen && (
                        <div className={styles.inscricoesIndisponivel}>
                          <RiErrorWarningLine size={16} />
                          <span>Inscrições indisponíveis no momento</span>
                        </div>
                      )}
                    </div>

                    {/* Mensagem de Erro */}
                    {errorMessages[edital.id] && (
                      <div className={styles.errorMessage}>
                        <RiErrorWarningLine size={16} />
                        <span>{errorMessages[edital.id]}</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <NoData description="Não há editais disponíveis no momento." />
          </div>
        )}
      </div>

      {/* Modal: confirmação de perfil professor */}
      <Modal
        isOpen={modalConfirmacao.open}
        onClose={() => setModalConfirmacao({ open: false, editalId: null })}
      >
        <div className={styles.modalPergunta}>
          <div className={styles.modalPerguntaIcon}>
            <RiUserLine size={28} />
          </div>
          <h4>Confirmação de perfil</h4>
          <p>Apenas professores podem fazer inscrição. Você é professor?</p>
          <div className={styles.modalPerguntaActions}>
            <Button
              className={styles.btnSim}
              onClick={handleConfirmarProfessor}
            >
              Sim, sou professor
            </Button>
            <Button className={styles.btnNao} onClick={handleNaoProfessor}>
              Não, sou aluno
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: informação para alunos */}
      <Modal isOpen={modalNaoAluno} onClose={() => setModalNaoAluno(false)}>
        <div className={styles.modalPergunta}>
          <div
            className={`${styles.modalPerguntaIcon} ${styles.modalInfoIcon}`}
          >
            <RiInformationLine size={28} />
          </div>
          <h4>Acesso restrito a professores</h4>
          <p>
            Somente professores podem realizar inscrições. Você deve entrar em
            contato com um professor da sua instituição para que ele possa te
            inscrever nos editais de iniciação científica.
          </p>
          <div className={styles.modalPerguntaActions}>
            <Button
              className={styles.btnSim}
              onClick={() => setModalNaoAluno(false)}
            >
              Entendi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Page;

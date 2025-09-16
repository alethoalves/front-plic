"use client";

import styles from "./page.module.scss";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  associarAvaliadorSubmissao,
  desvincularAvaliadorSubmissao,
  gerarFeedback,
  getResumo,
  getSubmissoesEmAvaliacao,
  getSubmissoesSemAvaliacao,
  processarAvaliacao,
} from "@/app/api/client/submissaoAvaliador";
import {
  Ri24HoursFill,
  RiArrowLeftCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFileList3Line,
  RiMedalLine,
  RiQuillPenLine,
  RiSpam2Line,
  RiSparkling2Line,
  RiStarLine,
  RiErrorWarningLine,
} from "@remixicon/react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import NoData from "@/components/NoData";
import { transformarQuebrasEmParagrafos } from "@/lib/formatarParagrafo";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState({});
  const [submissoesEmAvaliacao, setSubmissoesEmAvaliacao] = useState([]);
  const [filteredSubmissoes, setFilteredSubmissoes] = useState([]);
  const [loadingResumo, setLoadingResumo] = useState({});
  const [loadingDevolver, setLoadingDevolver] = useState({});
  const [modalParams, setModalParams] = useState(null);
  const [submissao, setSubmissao] = useState(null);
  const [evento, setEvento] = useState(null);
  const [selectedNotas, setSelectedNotas] = useState({});
  const [notaTotal, setNotaTotal] = useState(0);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const toast = useRef(null);

  const router = useRouter();

  // Função para exibir toasts
  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 5000 });
  };

  // Função para calcular a média das notas
  const calcularNotaTotal = (criterios, notasSelecionadas) => {
    const totalNotas = criterios.reduce((acc, criterio) => {
      const notaSelecionada = notasSelecionadas[criterio.id];
      return acc + (notaSelecionada || 0);
    }, 0);
    return totalNotas / criterios.length;
  };

  // Função de busca dos dados ao renderizar o componente
  const fetchData = async () => {
    setLoading(true);
    try {
      const submissaoComResumo = await getResumo(
        params.idInstituicao,
        params.idSubmissao,
        params.idTenant
      );
      setSubmissao(submissaoComResumo);
      setEvento({
        ...submissaoComResumo.evento,
        notaTotal: 0,
        mencaoHonrosaSelecionada: false,
        premioSelecionado: false,
        comentarioFeedback: "",
        notaMinimaPremio: submissaoComResumo.evento.notaMinimaPremio || 0,
        notaMinimaMencaoHonrosa:
          submissaoComResumo.evento.notaMinimaMencaoHonrosa || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      showToast(
        "error",
        "Erro",
        "Não foi possível carregar os dados da submissão."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Função para lidar com a seleção de notas
  const handleNotaSelecionada = (criterioId, valor) => {
    const novasNotas = {
      ...selectedNotas,
      [criterioId]: valor,
    };
    setSelectedNotas(novasNotas);

    const novaNotaTotal = calcularNotaTotal(
      evento.CriterioAvaliacao,
      novasNotas
    );
    setNotaTotal(novaNotaTotal);

    // Atualiza o evento com a nova nota atribuída ao critério
    setEvento((prevEvento) => {
      const criteriosAtualizados = prevEvento.CriterioAvaliacao.map(
        (criterio) => {
          if (criterio.id === criterioId) {
            return {
              ...criterio,
              notaAtribuida: valor,
            };
          }
          return criterio;
        }
      );

      return {
        ...prevEvento,
        CriterioAvaliacao: criteriosAtualizados,
        notaTotal: novaNotaTotal,
      };
    });
  };

  // Função para lidar com a mudança no campo de feedback
  const handleComentarioChange = (e) => {
    const comentario = e.target.value;
    setEvento((prevEvento) => ({
      ...prevEvento,
      comentarioFeedback: comentario,
    }));
  };

  // Função para selecionar menção honrosa
  const handleSelecionarMencaoHonrosa = () => {
    if (notaTotal >= evento?.notaMinimaMencaoHonrosa) {
      setEvento((prevEvento) => ({
        ...prevEvento,
        mencaoHonrosaSelecionada: !prevEvento.mencaoHonrosaSelecionada,
        premioSelecionado: false, // Desmarca prêmio se menção for selecionada
      }));
    } else {
      showToast(
        "warn",
        "Atenção",
        `Nota insuficiente para menção honrosa. Mínimo: ${evento?.notaMinimaMencaoHonrosa}`
      );
    }
  };

  // Função para selecionar prêmio
  const handleSelecionarPremio = () => {
    if (notaTotal >= evento?.notaMinimaPremio) {
      setEvento((prevEvento) => ({
        ...prevEvento,
        premioSelecionado: !prevEvento.premioSelecionado,
        mencaoHonrosaSelecionada: false, // Desmarca menção se prêmio for selecionado
      }));
    } else {
      showToast(
        "warn",
        "Atenção",
        `Nota insuficiente para prêmio. Mínimo: ${evento?.notaMinimaPremio}`
      );
    }
  };

  // Função para tratar a desvinculação do avaliador
  const handleDesvincularAvaliador = async (eventoId, idSubmissao) => {
    confirmDialog({
      message: "Tem certeza que deseja devolver esta avaliação?",
      header: "Confirmação de Devolução",
      icon: "pi pi-exclamation-triangle",
      accept: async () => {
        setError({});
        setLoadingDevolver((prevLoading) => ({
          ...prevLoading,
          [idSubmissao]: true,
        }));

        try {
          const updatedSubmissao = await desvincularAvaliadorSubmissao(
            eventoId,
            idSubmissao
          );
          if (updatedSubmissao) {
            setSubmissoesEmAvaliacao((prevSubmissoes) =>
              prevSubmissoes.filter((submissao) => submissao.id !== idSubmissao)
            );
            setFilteredSubmissoes((prevSubmissoes) => [
              ...prevSubmissoes,
              updatedSubmissao,
            ]);
            showToast("success", "Sucesso", "Avaliação devolvida com sucesso.");
          }
        } catch (err) {
          setError((prevErrors) => ({
            ...prevErrors,
            [idSubmissao]:
              err.response?.data?.error || "Erro ao desvincular submissão",
          }));
          showToast("error", "Erro", "Não foi possível devolver a avaliação.");
        } finally {
          setLoadingDevolver((prevLoading) => ({
            ...prevLoading,
            [idSubmissao]: false,
          }));
          router.push(
            `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliador/avaliacoes`
          );
        }
      },
    });
  };

  const handleLerResumo = () => {
    router.push(
      `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliador/resumo/${params.idInstituicao}/${params.idSubmissao}/${params.idTenant}`
    );
  };

  const formatarResumo = (resumoArray) => {
    return transformarQuebrasEmParagrafos(resumoArray);
  };

  // Função para gerar feedback com IA e atualizar o textarea
  const handleGerarFeedback = async () => {
    setLoadingFeedback(true);

    try {
      const { comentarioFeedback, ...eventoSemComentario } = evento;
      const conteudoFormatado = formatarResumo(submissao?.Resumo?.conteudo);
      const feedback = await gerarFeedback(
        submissao?.Resumo?.titulo,
        conteudoFormatado,
        eventoSemComentario,
        params.idInstituicao
      );
      setEvento((prevEvento) => ({
        ...prevEvento,
        comentarioFeedback: feedback,
      }));
      showToast("success", "Sucesso", "Feedback gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar feedback com IA:", error);
      showToast("error", "Erro", "Não foi possível gerar o feedback.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Função para finalizar a avaliação
  const handleTerminarAvaliacao = async () => {
    // Verificar se todas as notas foram atribuídas
    const criteriosSemNota = evento.CriterioAvaliacao.filter(
      (criterio) => selectedNotas[criterio.id] === undefined
    );

    if (criteriosSemNota.length > 0) {
      showToast(
        "warn",
        "Atenção",
        "Por favor, atribua notas a todos os critérios antes de finalizar."
      );
      return;
    }

    setLoading(true);
    setError({});

    try {
      const body = {
        ...evento,
        submissaoId: submissao.id,
      };
      const response = await processarAvaliacao(params.idInstituicao, body);

      if (response.status === "success") {
        showToast("success", "Sucesso", "Avaliação processada com sucesso!");
        setTimeout(() => {
          router.push(
            `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliador/avaliacoes`
          );
        }, 1500);
      } else {
        setError({ geral: response.message || "Erro ao processar avaliação." });
        showToast(
          "error",
          "Erro",
          response.message || "Erro ao processar avaliação."
        );
      }
    } catch (error) {
      setError({
        geral:
          error.response?.data?.message ||
          "Ocorreu um erro ao finalizar a avaliação.",
      });
      showToast(
        "error",
        "Erro",
        error.response?.data?.message ||
          "Ocorreu um erro ao finalizar a avaliação."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />
      <div className={styles.navContent}>
        <div
          className={styles.voltar}
          onClick={() =>
            router.push(
              `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliador/avaliacoes`
            )
          }
        >
          <div className={styles.iconBack}>
            <RiArrowLeftCircleLine />
          </div>
          <p>Voltar</p>
        </div>
        {loading && <h6>Aguarde. Carregando...</h6>}
        {error.geral && (
          <div className={`${styles.error} mb-1`}>
            <p>{error.geral}</p>
          </div>
        )}
        {submissao && !loading && (
          <>
            <div className={styles.squares}>
              <div className={`${styles.square} ${styles.squareWarning}`}>
                <div className={styles.squareHeader}>
                  <p>Pôster nº</p>
                  <h6>
                    {submissao.square.length > 0
                      ? submissao.square[0].numero
                      : "-"}
                  </h6>
                </div>
                <div className={styles.squareContent}>
                  <div className={styles.info}>
                    <p className={styles.area}>
                      {submissao?.Resumo?.area?.area || "sem área"} -{" "}
                      {submissao?.tenant?.sigla.toUpperCase()} -{" "}
                      {submissao?.categoria.toUpperCase()}
                    </p>
                  </div>
                  <div className={styles.submissaoData}>
                    <h6>{submissao?.Resumo?.titulo}</h6>
                  </div>
                  {error[submissao.id] && (
                    <div className={styles.error}>
                      <p>{error[submissao.id]}</p>
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  <div className={styles.item1}>
                    <div
                      className={`${styles.squareHeader} ${styles.action} ${styles.actionError}`}
                      onClick={() =>
                        handleDesvincularAvaliador(
                          submissao.evento.id,
                          submissao.id
                        )
                      }
                    >
                      <RiDeleteBinLine />
                      <p>
                        {loadingDevolver[submissao.id]
                          ? "Devolvendo..."
                          : "Devolver"}
                      </p>
                    </div>

                    <div
                      className={`${styles.squareHeader} ${styles.action}`}
                      onClick={() => handleLerResumo()}
                    >
                      <RiFileList3Line />
                      <p>
                        {loadingResumo[submissao.id]
                          ? "Buscando resumo..."
                          : "Ler Resumo"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className={styles.fichaDeAvaliacao}>
          {submissao?.CriterioAvaliacao?.length === 0 ? (
            <NoData description="Critérios de avaliação não foram definidos." />
          ) : (
            <div className={styles.fichaDeAvaliacao}>
              {!loading && <h5>Ficha de Avaliação</h5>}

              {!loading && (
                <>
                  <div className={styles.quesitos}>
                    {evento?.CriterioAvaliacao?.sort((a, b) => a.id - b.id).map(
                      (item, index) => {
                        const valores = Array.from(
                          { length: item.notaMaxima - item.notaMinima + 1 },
                          (_, i) => item.notaMinima + i
                        );
                        return (
                          <div className={styles.item} key={item.id}>
                            <div className={styles.label}>
                              <h6>
                                <span>{index + 1}. </span>
                                {item.titulo}
                              </h6>
                            </div>
                            <div className={styles.instructions}>
                              <p style={{ whiteSpace: "pre-line" }}>
                                {item.descricao}
                              </p>
                            </div>
                            <div className={styles.values}>
                              {valores.map((valor) => (
                                <div
                                  key={valor}
                                  value={valor}
                                  className={`${styles.value} ${
                                    selectedNotas[item.id] === valor
                                      ? styles.selected
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleNotaSelecionada(item.id, valor)
                                  }
                                >
                                  <p>{valor}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                  {/* Card de Nota Total */}
                  {evento?.CriterioAvaliacao?.length > 0 && (
                    <div className={styles.notaTotalCard}>
                      <div className={styles.notaHeader}>
                        <h5>Nota Final</h5>
                        <div className={styles.notaValor}>
                          <span>{notaTotal.toFixed(1)}</span>
                          <small>/10</small>
                        </div>
                      </div>
                      <div className={styles.notaProgress}>
                        <div
                          className={styles.notaProgressBar}
                          style={{ width: `${notaTotal * 10}%` }}
                        ></div>
                      </div>
                      <div className={styles.notaMinimas}>
                        <p>
                          Mínimo para menção honrosa:{" "}
                          {evento.notaMinimaMencaoHonrosa}
                        </p>
                        <p>Mínimo para prêmio: {evento.notaMinimaPremio}</p>
                      </div>
                    </div>
                  )}
                  {/* Exibe os botões com base nas notas mínimas e na média total */}
                  <div className={styles.item}>
                    <div className={styles.label}>
                      <h6>Premiação</h6>
                      <p className="mt-1">
                        Nota mínima para atribuir menção honrosa:{" "}
                        <strong>
                          {submissao?.evento?.notaMinimaMencaoHonrosa}
                        </strong>
                      </p>
                      <p className="mt-1">
                        Nota mínima para indicar a prêmio destaque:{" "}
                        <strong>{submissao?.evento?.notaMinimaPremio}</strong>
                      </p>
                    </div>
                    <div className={styles.instructions}></div>
                    <div className={styles.premio}>
                      <div
                        className={`${styles.value} ${
                          evento?.mencaoHonrosaSelecionada
                            ? styles.selectedPremio
                            : notaTotal >= evento?.notaMinimaMencaoHonrosa
                            ? styles.available
                            : styles.disabled
                        }`}
                        onClick={handleSelecionarMencaoHonrosa}
                      >
                        <RiStarLine />
                        <p>
                          {evento?.mencaoHonrosaSelecionada
                            ? "Menção Honrosa Selecionada"
                            : "Indicar à Menção Honrosa"}
                        </p>
                        {notaTotal < evento?.notaMinimaMencaoHonrosa && (
                          <RiErrorWarningLine className={styles.warningIcon} />
                        )}
                      </div>

                      <div
                        className={`${styles.value} ${
                          evento?.premioSelecionado
                            ? styles.selectedPremio
                            : notaTotal >= evento?.notaMinimaPremio
                            ? styles.available
                            : styles.disabled
                        }`}
                        onClick={handleSelecionarPremio}
                      >
                        <RiMedalLine />
                        <p>
                          {evento?.premioSelecionado
                            ? "Prêmio Selecionado"
                            : "Indicar ao Prêmio Destaque"}
                        </p>
                        {notaTotal < evento?.notaMinimaPremio && (
                          <RiErrorWarningLine className={styles.warningIcon} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.item} mt-2`}>
                    <div className={styles.label}>
                      <h6>Feedback/Comentário ao aluno (OPCIONAL)</h6>
                    </div>
                    {false && (
                      <Button
                        className="button btn-warning-secondary mb-1 mt-2"
                        onClick={handleGerarFeedback}
                        icon={RiSparkling2Line}
                        disabled={loadingFeedback}
                      >
                        {loadingFeedback
                          ? "Gerando..."
                          : "Gerar sugestão de feedback com IA"}
                      </Button>
                    )}
                    <textarea
                      type="text"
                      placeholder="Escreva aqui seu feedback para o autor..."
                      value={evento?.comentarioFeedback || ""}
                      onChange={handleComentarioChange}
                    ></textarea>
                  </div>

                  <Button
                    className="button btn-warning mt-3 mb-3"
                    onClick={handleTerminarAvaliacao}
                    icon={RiQuillPenLine}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Finalizar Avaliação"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;

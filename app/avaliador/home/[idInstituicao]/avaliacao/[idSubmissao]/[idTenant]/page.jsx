"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
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
} from "@/app/api/client/submissao"; // Supondo que essa função está na API do client
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
} from "@remixicon/react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import NoData from "@/components/NoData";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState({}); // Erros individuais por submissão
  const [submissoesEmAvaliacao, setSubmissoesEmAvaliacao] = useState([]);
  const [filteredSubmissoes, setFilteredSubmissoes] = useState([]); // Submissões filtradas exibidas
  const [loadingResumo, setLoadingResumo] = useState({}); // Estado separado para o carregamento de resumo
  const [loadingDevolver, setLoadingDevolver] = useState({});
  const [modalParams, setModalParams] = useState(null);
  const [submissao, setSubmissao] = useState(null);
  const [evento, setEvento] = useState(null);
  const [selectedNotas, setSelectedNotas] = useState({}); // Novo estado para armazenar notas selecionadas
  const [notaTotal, setNotaTotal] = useState(0); // Nova chave para armazenar a média
  const [loadingFeedback, setLoadingFeedback] = useState(false); // Estado para controlar o carregamento do feedback

  const router = useRouter();

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
        comentarioFeedback: "", // Inicializa a chave para armazenar o comentário
        notaMinimaPremio: submissaoComResumo.evento.notaMinimaPremio || 0,
        notaMinimaMencaoHonrosa:
          submissaoComResumo.evento.notaMinimaMencaoHonrosa || 0,
      });
      // console.log("Dados carregados:", submissaoComResumo.evento);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
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
              notaAtribuida: valor, // Adiciona a chave para armazenar a nota atribuída
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

    // Log para verificar as mudanças
    //console.log("Notas selecionadas:", novasNotas);
    //console.log("Evento atualizado:", evento);
  };

  // Função para lidar com a mudança no campo de feedback
  const handleComentarioChange = (e) => {
    const comentario = e.target.value;
    setEvento((prevEvento) => ({
      ...prevEvento,
      comentarioFeedback: comentario, // Atualiza o comentário no evento
    }));
  };
  // Função para selecionar menção honrosa
  const handleSelecionarMencaoHonrosa = () => {
    setEvento((prevEvento) => ({
      ...prevEvento,
      mencaoHonrosaSelecionada: !prevEvento.mencaoHonrosaSelecionada,
    }));
  };

  // Função para selecionar prêmio
  const handleSelecionarPremio = () => {
    setEvento((prevEvento) => ({
      ...prevEvento,
      premioSelecionado: !prevEvento.premioSelecionado,
    }));
  };

  // Função para tratar a desvinculação do avaliador
  const handleDesvincularAvaliador = async (eventoId, idSubmissao) => {
    setError({});
    setLoadingDevolver((prevLoading) => ({
      ...prevLoading,
      [idSubmissao]: true, // Define o carregamento do botão "Devolver"
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
      }
    } catch (err) {
      setError((prevErrors) => ({
        ...prevErrors,
        [idSubmissao]:
          err.response?.data?.error || "Erro ao desvincular submissão",
      }));
    } finally {
      setLoadingDevolver((prevLoading) => ({
        ...prevLoading,
        [idSubmissao]: false, // Remove o estado de carregamento do botão "Devolver"
      }));
      router.push(`/avaliador/home/${params.idInstituicao}`);
    }
  };
  const handleLerResumo = () => {
    setIsModalOpen(true);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setModalParams(null); // Limpa os parâmetros quando o modal fecha
  };

  const ModalContent = () => {
    return (
      <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
        <div className={`${styles.icon} mb-2`}>
          <RiFileList3Line />
        </div>
        <h4>{submissao?.planoDeTrabalho?.titulo}</h4>

        {submissao?.planoDeTrabalho?.registroAtividades &&
          submissao?.planoDeTrabalho?.registroAtividades.length > 0 &&
          (submissao?.planoDeTrabalho?.registroAtividades[0].respostas
            ?.length === 0 ? (
            <p>Resumo não enviado</p> // Verifica se respostas é um array vazio
          ) : (
            submissao?.planoDeTrabalho?.registroAtividades[0].respostas?.map(
              (item, i) => {
                if (item.campo.label !== "Colaboradores") {
                  return (
                    <div key={i}>
                      <h6>{item.campo.label}</h6>
                      <p>{item.value}</p>
                    </div>
                  );
                }
              }
            )
          ))}
      </Modal>
    );
  };
  const formatarResumo = (resumoArray) => {
    return resumoArray
      .map((item) => {
        const label = item.campo.label; // Exemplo: "Introdução", "Metodologia"
        const texto = item.value; // O conteúdo da seção
        return `${label}\n${texto}\n`; // Formata com uma quebra de linha após o título e o conteúdo
      })
      .join("\n"); // Junta todas as partes com uma quebra de linha entre elas
  };
  // Função para gerar feedback com IA e atualizar o textarea
  const handleGerarFeedback = async () => {
    setLoadingFeedback(true); // Define estado de carregamento

    try {
      const { comentarioFeedback, ...eventoSemComentario } = evento;
      const feedback = await gerarFeedback(
        submissao?.planoDeTrabalho?.titulo,
        formatarResumo(
          submissao?.planoDeTrabalho?.registroAtividades[0].respostas
        ),
        eventoSemComentario,
        params.idInstituicao
      );
      setEvento((prevEvento) => ({
        ...prevEvento,
        comentarioFeedback: feedback, // Atualiza o comentário com o feedback gerado
      }));
    } catch (error) {
      console.error("Erro ao gerar feedback com IA:", error);
    } finally {
      setLoadingFeedback(false); // Remove estado de carregamento
    }
  };
  // Função para finalizar a avaliação
  const handleTerminarAvaliacao = async () => {
    setLoading(true); // Inicia o estado de carregamento
    setError({}); // Limpa erros anteriores

    try {
      const body = {
        ...evento,
        submissaoId: submissao.id,
      };
      const response = await processarAvaliacao(params.idInstituicao, body);

      if (response.status === "success") {
        alert("Avaliação processada com sucesso!");
        // Redireciona ou atualiza a página se necessário
        router.push(`/avaliador/home/${params.idInstituicao}`);
      } else {
        setError({ geral: response.message || "Erro ao processar avaliação." });
      }
    } catch (error) {
      // Captura erros específicos e exibe mensagem
      setError({
        geral:
          error.response?.data?.message ||
          "Ocorreu um erro ao finalizar a avaliação.",
      });
    } finally {
      setLoading(false); // Finaliza o estado de carregamento
    }
  };
  return (
    <>
      {ModalContent()}
      <div className={styles.navContent}>
        <div
          className={styles.voltar}
          onClick={() => router.push(`/avaliador/home/${params.idInstituicao}`)}
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
        {submissao && (
          <>
            <div className={styles.squares}>
              <div className={`${styles.square} ${styles.squareWarning}`}>
                {submissao.square.map((squareItem) => (
                  <div key={squareItem.id} className={styles.squareHeader}>
                    <p>Pôster nº</p>
                    <h6>{squareItem.numero}</h6>
                  </div>
                ))}
                {submissao.square.length == 0 && (
                  <div className={styles.squareHeader}>
                    <p>Pôster nº</p>
                    <h6>-</h6>
                  </div>
                )}

                <div className={styles.squareContent}>
                  <div className={styles.info}>
                    <p className={styles.area}>
                      {submissao?.planoDeTrabalho?.area?.area || "sem área"} -{" "}
                      {submissao?.planoDeTrabalho?.inscricao?.edital?.tenant?.sigla.toUpperCase()}{" "}
                      -{" "}
                      {submissao?.planoDeTrabalho?.inscricao?.edital?.titulo.toUpperCase()}
                    </p>
                  </div>
                  <div className={styles.submissaoData}>
                    <h6>{submissao?.planoDeTrabalho?.titulo}</h6>
                  </div>
                  {error[submissao.id] && (
                    <div className={styles.error}>
                      <p>{error[item?.id]}</p>
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  <div className={styles.item1}>
                    <div
                      className={`${styles.squareHeader} ${styles.action} ${styles.actionError}`}
                      onClick={() =>
                        handleDesvincularAvaliador(
                          submissao.planoDeTrabalho?.inscricao?.edital
                            ?.eventoId,
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
              <h5>Ficha de Avaliação</h5>

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
                      {notaTotal >= evento?.notaMinimaMencaoHonrosa && (
                        <div
                          className={`${styles.value} ${
                            evento.mencaoHonrosaSelecionada
                              ? styles.selectedPremio
                              : ""
                          }`}
                          onClick={handleSelecionarMencaoHonrosa}
                        >
                          <RiStarLine />
                          <p>
                            {evento.mencaoHonrosaSelecionada
                              ? "Menção Honrosa Selecionada"
                              : "Clique para indicar à Menção Honrosa"}
                          </p>
                        </div>
                      )}

                      {notaTotal >= evento?.notaMinimaPremio && (
                        <div
                          className={`${styles.value} ${
                            evento.premioSelecionado
                              ? styles.selectedPremio
                              : ""
                          }`}
                          onClick={handleSelecionarPremio}
                        >
                          <RiMedalLine />
                          <p>
                            {evento.premioSelecionado
                              ? "Prêmio Selecionado"
                              : "Clique para indicar ao Prêmio Destaque"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${styles.item} mt-2`}>
                    <div className={styles.label}>
                      <h6>Feedback/Comentário ao aluno</h6>
                    </div>
                    <Button
                      className="button btn-warning-secondary mb-1 mt-2"
                      onClick={handleGerarFeedback} // Chama a função ao clicar
                      icon={RiSparkling2Line}
                      disabled={loadingFeedback} // Desabilita o botão enquanto carrega
                    >
                      {loadingFeedback
                        ? "Gerando..."
                        : "Gerar sugestão de feedback com IA"}
                    </Button>
                    <textarea
                      type="text"
                      placeholder="Escreva aqui"
                      value={evento?.comentarioFeedback || ""}
                      onChange={handleComentarioChange}
                    ></textarea>
                  </div>

                  <Button
                    className="button btn-warning mb-3"
                    onClick={handleTerminarAvaliacao}
                    icon={RiQuillPenLine}
                    disabled={loading}
                  >
                    Terminar Avaliação
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

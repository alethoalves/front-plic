"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  associarAvaliadorSubmissao,
  desvincularAvaliadorSubmissao,
  getResumo,
  getSubmissoesEmAvaliacao,
  getSubmissoesSemAvaliacao,
} from "@/app/api/client/submissao";
import {
  Ri24HoursFill,
  RiDeleteBinLine,
  RiEditLine,
  RiFileList3Line,
  RiQuillPenLine,
} from "@remixicon/react";
import Modal from "@/components/Modal";
import {
  associarAvaliadorInscricaoProjeto,
  desassociarAvaliadorInscricaoProjeto,
  getAvaliacoesPendentes,
  getFichaAvaliacao,
  getProjetoParaAvaliar,
  getProjetosAguardandoAvaliacao,
  getProjetosEmAvaliacao,
  processarFichaAvaliacao,
} from "@/app/api/client/avaliador";
import NoData from "@/components/NoData";
import Button from "@/components/Button";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({}); // Erros individuais por submissão
  const [fichaError, setFichaError] = useState(null); // Novo estado para erros da ficha de avaliação
  const router = useRouter();
  const [inscricaoProjeto, setInscricaoProjeto] = useState(null);
  const [fichaAvaliacao, setFichaAvaliacao] = useState(null);
  const [selectedNotas, setSelectedNotas] = useState({});
  const [notaTotal, setNotaTotal] = useState(0);
  const [submissao, setSubmissao] = useState(null);
  const [evento, setEvento] = useState(null);
  // Função de busca dos dados ao renderizar o componente
  const fetchData = async () => {
    try {
      const data = await getProjetoParaAvaliar(params.tenant, params.idProjeto);
      setInscricaoProjeto(data);

      // Busca a ficha de avaliação
      const fichaDeAvaliacao = await getFichaAvaliacao(
        params.tenant,
        "projeto",
        data.inscricao.edital.id
      );
      setFichaAvaliacao(fichaDeAvaliacao);
      setEvento({
        ...fichaDeAvaliacao,
        notaTotal: 0,
        observacao: "", // Inicializa a chave para armazenar o comentário
      });
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setFichaError(
        `Erro ao carregar a ficha de avaliação. Tente novamente. ${error.response?.data?.message}`
      ); // Define o erro da ficha
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
      fichaAvaliacao?.CriterioFormularioAvaliacao,
      novasNotas
    );
    setNotaTotal(novaNotaTotal);
    setEvento((prevEvento) => {
      const criteriosAtualizados = prevEvento.CriterioFormularioAvaliacao.map(
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
        CriterioFormularioAvaliacao: criteriosAtualizados,
        notaTotal: novaNotaTotal,
      };
    });
  };

  // Função para lidar com a mudança no campo de feedback
  const handleComentarioChange = (e) => {
    const comentario = e.target.value;
    setEvento((prevEvento) => ({
      ...prevEvento,
      observacao: comentario, // Atualiza o comentário no evento
    }));
  };

  // Função para calcular a média das notas
  const calcularNotaTotal = (criterios, notasSelecionadas) => {
    const totalPeso = criterios.reduce(
      (acc, criterio) => acc + criterio.peso,
      0
    );

    if (totalPeso === 0) return 0;

    const somaNotasPonderadas = criterios.reduce((acc, criterio) => {
      const notaSelecionada = notasSelecionadas[criterio.id] || 0;
      return acc + notaSelecionada * criterio.peso;
    }, 0);

    return somaNotasPonderadas;
  };
  const handleTerminarAvaliacao = async () => {
    setLoading(true); // Inicia o estado de carregamento
    setError({}); // Limpa erros anteriores

    try {
      const body = {
        ...evento,
        projetoId: params.idProjeto,
      };
      const response = await processarFichaAvaliacao(params.tenant, body);

      if (response.status === "success") {
        alert("Avaliação processada com sucesso!");
        // Redireciona ou atualiza a página se necessário
        router.push(`/${params.tenant}/avaliador/avaliacoes/projetos`);
      } else {
        setError({ geral: response.message || "Erro ao processar avaliação." });
        setLoading(false);
      }
    } catch (error) {
      // Captura erros específicos e exibe mensagem
      setError({
        geral:
          error.response?.data?.message ||
          "Ocorreu um erro ao finalizar a avaliação.",
      });
      setLoading(false);
    }
  };
  return (
    <>
      <div className={styles.navContent}>
        <>
          <div className={styles.projeto}>
            <div className={styles.card}>
              <h6 className={styles.label}>Título</h6>
              <div className={styles.value}>
                <p>{inscricaoProjeto?.projeto?.titulo}</p>
              </div>
            </div>
            <div className={styles.card}>
              <h6 className={styles.label}>Área</h6>
              <div className={styles.value}>
                <p>{inscricaoProjeto?.projeto?.area.area}</p>
              </div>
            </div>
            <div className={`${styles.conteudo}`}>
              {inscricaoProjeto?.projeto?.Resposta?.sort(
                (a, b) => a.campo.ordem - b.campo.ordem
              ).map((item) => {
                // Função para extrair o nome do arquivo da URL
                const extractFileName = (url) => {
                  const parts = url.split("/");
                  const lastPart = parts[parts.length - 1];
                  return lastPart.split("_")[1] || lastPart; // Remove o timestamp inicial
                };

                return (
                  <div className={`${styles.card}`} key={item.id}>
                    <h6 className={`${styles.label}`}>{item.campo.label}</h6>
                    <div className={`${styles.value}`}>
                      {["link", "arquivo"].includes(item.campo.tipo) ? (
                        <a
                          href={item.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {item.campo.tipo === "arquivo" && "📁 "}
                          {item.campo.tipo === "link" && "🔗 "}
                          {extractFileName(item.value)}
                        </a>
                      ) : (
                        <p style={{ whiteSpace: "pre-wrap" }}>{item.value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.fichaDeAvaliacao}>
            <h5>Ficha de Avaliação</h5>

            {fichaError ? ( // Se houver erro na ficha, exibe a mensagem de erro
              <div className={styles.error}>
                <p>{fichaError}</p>
              </div>
            ) : (
              // Caso contrário, renderiza a ficha de avaliação
              <>
                <div className={styles.quesitos}>
                  {fichaAvaliacao?.CriterioFormularioAvaliacao?.sort(
                    (a, b) => a.id - b.id
                  ).map((item, index) => {
                    const valores = Array.from(
                      { length: item.notaMaxima - item.notaMinima + 1 },
                      (_, i) => item.notaMinima + i
                    );
                    return (
                      <div className={styles.item} key={item.id}>
                        <div className={styles.label}>
                          <h6>
                            <span>{index + 1}. </span>
                            {item.label} (Peso: {item.peso}){" "}
                            {/* Alteração aqui */}
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
                              <p style={{ whiteSpace: "pre-wrap" }}>{valor}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`${styles.item} mt-2`}>
                  <div className={styles.label}>
                    <h6>Feedback/Comentário ao aluno (OPCIONAL)</h6>
                  </div>

                  <textarea
                    type="text"
                    placeholder="Escreva aqui"
                    //value={evento?.observaocao || ""}
                    onChange={handleComentarioChange}
                  ></textarea>
                </div>

                {/* Nova div para exibir a nota final */}
                <div className={styles.notaFinal}>
                  <h6>Nota Final:</h6>
                  <p>{notaTotal.toFixed(2)}</p>{" "}
                  {/* Exibe a nota com 2 casas decimais */}
                </div>
              </>
            )}
          </div>
        </>
      </div>
      {error.geral && (
        <div className={`${styles.error} `}>
          <p>{error.geral}</p>
        </div>
      )}
      {!error ||
        (!fichaError && (
          <Button
            className="button btn-warning mt-2 mb-2"
            onClick={handleTerminarAvaliacao}
            icon={RiQuillPenLine}
            disabled={loading}
          >
            {loading ? "Aguarde. Carregando..." : "Terminar Avaliação"}
          </Button>
        ))}
    </>
  );
};

export default Page;

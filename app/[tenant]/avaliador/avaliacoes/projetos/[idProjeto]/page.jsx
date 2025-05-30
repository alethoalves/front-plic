"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiQuillPenLine, RiArrowRightLine } from "@remixicon/react";
import {
  getFichaAvaliacao,
  getProjetoParaAvaliar,
  processarFichaAvaliacao,
} from "@/app/api/client/avaliador";
import Button from "@/components/Button";
import { getEdital } from "@/app/api/client/edital";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({});
  const [fichaError, setFichaError] = useState(null);
  const router = useRouter();
  const [inscricaoProjeto, setInscricaoProjeto] = useState(null);
  const [fichaAvaliacao, setFichaAvaliacao] = useState(null);
  const [selectedNotas, setSelectedNotas] = useState({});
  const [notaTotal, setNotaTotal] = useState(0);
  const [evento, setEvento] = useState(null);
  const [fichaPlano, setFichaPlano] = useState(null);
  const [avaliacoesPlano, setAvaliacoesPlano] = useState({});
  const [currentStep, setCurrentStep] = useState(0); // 0 = projeto, 1+ = planos
  const [planosCount, setPlanosCount] = useState(0);

  const fetchData = async () => {
    try {
      const data = await getProjetoParaAvaliar(params.tenant, params.idProjeto);
      setInscricaoProjeto(data);
      setPlanosCount(data?.projeto?.planosDeTrabalho?.length || 0);

      const fichaProjeto = await getFichaAvaliacao(
        params.tenant,
        "projeto",
        data.inscricao.edital.id
      );
      setFichaAvaliacao(fichaProjeto);

      try {
        const fichaPlano = await getFichaAvaliacao(
          params.tenant,
          "plano_de_trabalho",
          data.inscricao.edital.id
        );
        setFichaPlano(fichaPlano);
      } catch (err) {
        if (err?.response?.status === 404) {
          // Edital não exige avaliação de plano
          setFichaPlano(null);
        } else {
          throw err; // repropaga outros erros
        }
      }

      setEvento({
        ...fichaProjeto,
        notaTotal: 0,
        observacao: "",
      });
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setFichaError(
        `Erro ao carregar a ficha de avaliação. Tente novamente. ${error.response?.data?.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      const criteriosAtualizados = prevEvento?.CriterioFormularioAvaliacao?.map(
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
        CriterioFormularioAvaliacao: criteriosAtualizados,
        notaTotal: novaNotaTotal,
      };
    });
  };

  const handleComentarioChange = (e) => {
    const comentario = e.target.value;
    setEvento((prevEvento) => ({
      ...prevEvento,
      observacao: comentario,
    }));
  };

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
    setLoading(true);
    setError({});

    try {
      const avaliacoesPlanoFormatted = Object.entries(avaliacoesPlano).map(
        ([planoId, plano]) => {
          const criterios = fichaPlano.CriterioFormularioAvaliacao.map(
            (criterio) => ({
              id: criterio.id,
              label: criterio.label,
              descricao: criterio.descricao,
              ordem: criterio.ordem,
              peso: criterio.peso,
              notaMinima: criterio.notaMinima,
              notaMaxima: criterio.notaMaxima,
              notaAtribuida: plano.selectedNotas?.[criterio.id],
            })
          );

          return {
            planoId: Number(planoId),
            notaTotal: plano.notaTotal,
            observacao: plano.observacao,
            CriterioFormularioAvaliacao: criterios,
          };
        }
      );

      const criteriosProjeto = fichaAvaliacao.CriterioFormularioAvaliacao.map(
        (criterio) => ({
          id: criterio.id,
          label: criterio.label,
          descricao: criterio.descricao,
          ordem: criterio.ordem,
          peso: criterio.peso,
          notaMinima: criterio.notaMinima,
          notaMaxima: criterio.notaMaxima,
          notaAtribuida: selectedNotas?.[criterio.id],
        })
      );

      const body = {
        projetoId: params.idProjeto,
        objeto: "PROJETO",
        notaTotal,
        observacao: evento.observacao,
        CriterioFormularioAvaliacao: criteriosProjeto,
        avaliacoesPlano: avaliacoesPlanoFormatted,
      };

      const response = await processarFichaAvaliacao(params.tenant, body);

      if (response.status === "success") {
        alert("Avaliação processada com sucesso!");
        router.push(`/${params.tenant}/avaliador/avaliacoes/projetos`);
      } else {
        setError({ geral: response.message || "Erro ao processar avaliação." });
      }
    } catch (error) {
      setError({
        geral:
          error.response?.data?.message ||
          "Ocorreu um erro ao finalizar a avaliação.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotaPlanoSelecionada = (planoId, criterioId, valor) => {
    setAvaliacoesPlano((prev) => {
      const prevPlano = prev[planoId] || {
        selectedNotas: {},
        notaTotal: 0,
        observacao: "",
      };

      const novasNotas = {
        ...prevPlano.selectedNotas,
        [criterioId]: valor,
      };

      const novaNotaTotal = calcularNotaTotal(
        fichaPlano?.CriterioFormularioAvaliacao || [],
        novasNotas
      );

      return {
        ...prev,
        [planoId]: {
          ...prevPlano,
          selectedNotas: novasNotas,
          notaTotal: novaNotaTotal,
        },
      };
    });
  };

  const handleComentarioPlanoChange = (planoId, comentario) => {
    setAvaliacoesPlano((prev) => ({
      ...prev,
      [planoId]: {
        ...prev[planoId],
        observacao: comentario,
      },
    }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const renderProjetoStep = () => (
    <div className={styles.navContent}>
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
            const extractFileName = (url) => {
              const parts = url.split("/");
              const lastPart = parts[parts.length - 1];
              return lastPart.split("_")[1] || lastPart;
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
                    <p>{item.value}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.fichaDeAvaliacao}>
        <h5>Ficha de Avaliação</h5>

        {fichaError ? (
          <div className={styles.error}>
            <p>{fichaError}</p>
          </div>
        ) : (
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
                        {item.label} (Peso: {item.peso})
                      </h6>
                    </div>
                    <div className={styles.instructions}>
                      <p style={{ whiteSpace: "pre-line" }}>{item.descricao}</p>
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
                          onClick={() => handleNotaSelecionada(item.id, valor)}
                        >
                          <p>{valor}</p>
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
                onChange={handleComentarioChange}
              ></textarea>
            </div>

            <div className={styles.notaFinal}>
              <h6>Nota Final:</h6>
              <p>{notaTotal.toFixed(2)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderPlanoStep = () => {
    const plano = inscricaoProjeto?.projeto?.planosDeTrabalho[currentStep - 1];
    const planoNotas = avaliacoesPlano[plano.id]?.selectedNotas || {};

    return (
      <div className={styles.navContent} key={plano.id}>
        <div className={styles.projeto}>
          <div className={styles.card}>
            <h6 className={styles.label}>Título do Plano</h6>
            <div className={styles.value}>
              <p>{plano.titulo}</p>
            </div>
          </div>
          <div className={styles.card}>
            <h6 className={styles.label}>Área</h6>
            <div className={styles.value}>
              <p>{plano.area?.area}</p>
            </div>
          </div>

          <div className={styles.conteudo}>
            {plano.Resposta?.length > 0 ? (
              plano.Resposta.sort((a, b) => a.campo.ordem - b.campo.ordem).map(
                (item) => {
                  const extractFileName = (url) => {
                    const parts = url.split("/");
                    const lastPart = parts[parts.length - 1];
                    return lastPart.split("_")[1] || lastPart;
                  };

                  return (
                    <div className={styles.card} key={item.id}>
                      <h6 className={styles.label}>{item.campo.label}</h6>
                      <div className={styles.value}>
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
                          <p>{item.value}</p>
                        )}
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <p>Nenhuma resposta preenchida.</p>
            )}
          </div>
        </div>

        <div className={styles.fichaDeAvaliacao}>
          <h5>Ficha de Avaliação do Plano</h5>
          {fichaPlano?.CriterioFormularioAvaliacao?.length > 0 ? (
            <div className={styles.quesitos}>
              {fichaPlano.CriterioFormularioAvaliacao.sort(
                (a, b) => a.id - b.id
              ).map((criterio, index) => {
                const valores = Array.from(
                  { length: criterio.notaMaxima - criterio.notaMinima + 1 },
                  (_, i) => criterio.notaMinima + i
                );

                return (
                  <div className={styles.item} key={criterio.id}>
                    <div className={styles.label}>
                      <h6>
                        <span>{index + 1}. </span>
                        {criterio.label} (Peso: {criterio.peso})
                      </h6>
                    </div>
                    <div className={styles.instructions}>
                      <p style={{ whiteSpace: "pre-line" }}>
                        {criterio.descricao}
                      </p>
                    </div>
                    <div className={styles.values}>
                      {valores.map((valor) => (
                        <div
                          key={valor}
                          className={`${styles.value} ${
                            planoNotas[criterio.id] === valor
                              ? styles.selected
                              : ""
                          }`}
                          onClick={() =>
                            handleNotaPlanoSelecionada(
                              plano.id,
                              criterio.id,
                              valor
                            )
                          }
                        >
                          <p>{valor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ fontStyle: "italic", color: "#888" }}>
              Nenhum critério de avaliação definido.
            </p>
          )}

          <div className={`${styles.item} mt-2`}>
            <div className={styles.label}>
              <h6>Feedback/Comentário ao aluno (OPCIONAL)</h6>
            </div>
            <textarea
              type="text"
              placeholder="Escreva aqui"
              value={avaliacoesPlano[plano.id]?.observacao || ""}
              onChange={(e) =>
                handleComentarioPlanoChange(plano.id, e.target.value)
              }
            ></textarea>
          </div>

          <div className={styles.notaFinal}>
            <h6>Nota Final:</h6>
            <p>{avaliacoesPlano[plano.id]?.notaTotal?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {currentStep === 0 ? renderProjetoStep() : renderPlanoStep()}

      <div className={styles.navigationButtons}>
        {currentStep > 0 && (
          <Button
            className="button btn-secondary"
            onClick={handleBack}
            disabled={loading}
          >
            Voltar
          </Button>
        )}

        {currentStep < planosCount && (
          <Button
            className="button btn-secondary"
            onClick={handleNext}
            icon={RiArrowRightLine}
            disabled={loading}
          >
            Próximo Plano
          </Button>
        )}

        {currentStep === planosCount && (
          <Button
            className="button btn-warning"
            onClick={handleTerminarAvaliacao}
            icon={RiQuillPenLine}
            disabled={loading}
          >
            {loading ? "Aguarde. Carregando..." : "Terminar Avaliação"}
          </Button>
        )}
      </div>

      {error.geral && (
        <div className={`${styles.error} `}>
          <p>{error.geral}</p>
        </div>
      )}
    </>
  );
};

export default Page;

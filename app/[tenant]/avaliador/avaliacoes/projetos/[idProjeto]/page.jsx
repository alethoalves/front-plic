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
import { ScrollPanel } from "primereact/scrollpanel";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import { Accordion, AccordionTab } from "primereact/accordion";
import GanttChart from "@/components/GanttChart";
import { Timeline } from "primereact/timeline";
import BlockNoteContent from "@/components/BlockNoteContent";
import FichaAvaliacaoTree from "@/components/avaliacoes/FichaAvaliacaoTree";
import { calcularArvoreComNotas, flattenRespostas, listarCriterios } from "@/lib/fichaAvaliacaoScoring";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({});
  const [fichaError, setFichaError] = useState(null);
  const router = useRouter();
  const [inscricaoProjeto, setInscricaoProjeto] = useState(null);
  const [fichaAvaliacao, setFichaAvaliacao] = useState(null);
  const [valoresProjeto, setValoresProjeto] = useState(new Map());
  const [observacaoProjeto, setObservacaoProjeto] = useState("");
  const [fichaPlano, setFichaPlano] = useState(null);
  const [avaliacoesPlano, setAvaliacoesPlano] = useState({}); // { [planoId]: { valores: Map, observacao } }
  const [currentStep, setCurrentStep] = useState(0); // 0 = projeto, 1+ = planos
  const [planosCount, setPlanosCount] = useState(0);
  const [expandedCards, setExpandedCards] = useState({});

  // Função para alternar (toggle) a expansão de um card
  const toggleCard = (chave) => {
    setExpandedCards((prev) => ({
      ...prev,
      [chave]: !prev[chave],
    }));
  };
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
    setValoresProjeto((prev) => {
      const next = new Map(prev);
      if (valor === undefined) next.delete(criterioId);
      else next.set(criterioId, valor);
      return next;
    });
  };

  const handleNotaPlanoSelecionada = (planoId, criterioId, valor) => {
    setAvaliacoesPlano((prev) => {
      const prevPlano = prev[planoId] || { valores: new Map(), observacao: "" };
      const novosValores = new Map(prevPlano.valores);
      if (valor === undefined) novosValores.delete(criterioId);
      else novosValores.set(criterioId, valor);

      return {
        ...prev,
        [planoId]: { ...prevPlano, valores: novosValores },
      };
    });
  };

  const handleComentarioPlanoChange = (planoId, comentario) => {
    setAvaliacoesPlano((prev) => ({
      ...prev,
      [planoId]: {
        ...(prev[planoId] || { valores: new Map() }),
        observacao: comentario,
      },
    }));
  };

  const arvoreProjetoCalculada = fichaAvaliacao
    ? calcularArvoreComNotas(fichaAvaliacao.schemaCriterios, valoresProjeto)
    : null;

  const handleTerminarAvaliacao = async () => {
    const totalCriteriosProjeto = listarCriterios(fichaAvaliacao.schemaCriterios).length;
    const respostasProjeto = flattenRespostas(arvoreProjetoCalculada.arvore);
    if (respostasProjeto.length < totalCriteriosProjeto) {
      setError({ geral: "Preencha a nota de todos os critérios do projeto antes de terminar a avaliação." });
      setCurrentStep(0);
      return;
    }

    let avaliacoesPlanoFormatted = [];
    if (fichaPlano) {
      const totalCriteriosPlano = listarCriterios(fichaPlano.schemaCriterios).length;
      for (const plano of inscricaoProjeto.projeto.planosDeTrabalho) {
        const estado = avaliacoesPlano[plano.id] || { valores: new Map(), observacao: "" };
        const arvorePlano = calcularArvoreComNotas(fichaPlano.schemaCriterios, estado.valores);
        const respostasPlano = flattenRespostas(arvorePlano.arvore);
        if (respostasPlano.length < totalCriteriosPlano) {
          setError({ geral: `Preencha a nota de todos os critérios do plano "${plano.titulo}" antes de terminar a avaliação.` });
          return;
        }
        avaliacoesPlanoFormatted.push({
          planoId: Number(plano.id),
          observacao: estado.observacao,
          respostas: respostasPlano,
        });
      }
    }

    setLoading(true);
    setError({});

    try {
      const body = {
        projetoId: params.idProjeto,
        objeto: "PROJETO",
        observacao: observacaoProjeto,
        respostas: respostasProjeto,
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

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };
  const cronogramaEvents =
    inscricaoProjeto?.projeto?.CronogramaProjeto.map((item) => ({
      status: item.atividade,
      date: `${item.inicio} – ${item.fim}`,
      icon: "pi pi-calendar",
    })) || [];
  const renderProjetoStep = () => (
    <div className={styles.navContent}>
      <div className={styles.projeto}>
        <h5 className="mb-2">Projeto</h5>
        <h6 className="mb-2">{inscricaoProjeto?.projeto?.titulo}</h6>
        <p>
          <strong>Área: </strong>
          {inscricaoProjeto?.projeto?.area.area}
        </p>

        <div className={`${styles.conteudo} mt-2`}>
          <Accordion multiple activeIndex={[]}>
            {inscricaoProjeto?.projeto?.Resposta?.sort(
              (a, b) => a.campo.id - b.campo.id
            ).map((item, i) => {
              const extractFileName = (url) => {
                // Se for FileList ou valor inválido, retorna vazio
                if (typeof url !== "string" || url === "[object FileList]")
                  return "";
                const parts = url.split("/");
                const lastPart = parts[parts.length - 1];
                return lastPart.split("_")[1] || lastPart;
              };

              // Verifica se é um arquivo/link válido
              const isFileOrLink = ["link", "arquivo"].includes(
                item.campo.tipo
              );
              const hasValidFileOrLink =
                isFileOrLink &&
                typeof item.value === "string" &&
                item.value.trim() !== "" &&
                item.value !== "[object FileList]" &&
                item.value.startsWith("http");

              return (
                <AccordionTab
                  key={`resposta-${item.id}`}
                  header={item.campo.label}
                  headerClassName={styles.accordionHeader}
                >
                  <div className={styles.value}>
                    {isFileOrLink ? (
                      hasValidFileOrLink ? (
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
                        <p className={styles.emptyValue}>
                          Nenhum arquivo/link enviado
                        </p>
                      )
                    ) : item.campo.tipo === "blockNote" ? (
                      <BlockNoteContent value={item.value} />
                    ) : (
                      <p
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                        }}
                      >
                        {item.value && item.value !== "[object FileList]"
                          ? item.value
                          : "Nenhum conteúdo fornecido"}
                      </p>
                    )}
                  </div>
                </AccordionTab>
              );
            })}
            <AccordionTab
              header="Cronograma"
              headerClassName={styles.accordionHeader}
            >
              <div className="card">
                <Timeline
                  value={cronogramaEvents}
                  opposite={(item) => <small>{item.date}</small>}
                  content={(item) => <span>{item.status}</span>}
                  //align="alternate" /* ou "left"/"right" conforme desejar */
                />
              </div>
            </AccordionTab>
          </Accordion>
        </div>
      </div>

      {/*
        === FICHA DE AVALIAÇÃO DO PROJETO ===
      */}

      <div className={styles.fichaDeAvaliacao}>
        <h5>Ficha de Avaliação</h5>

        {fichaError ? (
          <div className={styles.error}>
            <p>{fichaError}</p>
          </div>
        ) : (
          <>
            <FichaAvaliacaoTree
              schemaCriterios={fichaAvaliacao?.schemaCriterios}
              valores={valoresProjeto}
              onSelecionar={handleNotaSelecionada}
            />

            <div className={`${styles.item} mt-2`}>
              <div className={styles.label}>
                <h6>Feedback/Comentário ao aluno</h6>
              </div>
              <textarea
                type="text"
                placeholder="Escreva aqui"
                value={observacaoProjeto}
                onChange={(e) => setObservacaoProjeto(e.target.value)}
              ></textarea>
            </div>

            <div className={styles.notaFinal}>
              <h6>Nota Final:</h6>
              <p>
                {(arvoreProjetoCalculada?.pontosObtidos ?? 0).toFixed(2)} / {arvoreProjetoCalculada?.pontosMaximos ?? 0}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderPlanoStep = () => {
    const plano = inscricaoProjeto?.projeto?.planosDeTrabalho[currentStep - 1];
    const estadoPlano = avaliacoesPlano[plano.id] || { valores: new Map(), observacao: "" };
    const arvorePlanoCalculada = fichaPlano
      ? calcularArvoreComNotas(fichaPlano.schemaCriterios, estadoPlano.valores)
      : null;

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

          {/* Substituindo o toggle por Accordion */}
          <div className={`${styles.conteudo} mt-2`}>
            <Accordion multiple activeIndex={[]}>
              {plano.Resposta?.sort(
                (a, b) => a.campo.ordem - b.campo.ordem
              ).map((item) => {
                const extractFileName = (url) => {
                  // Se for FileList ou valor inválido, retorna vazio
                  if (typeof url !== "string" || url === "[object FileList]")
                    return "";
                  const parts = url.split("/");
                  const lastPart = parts[parts.length - 1];
                  return lastPart.split("_")[1] || lastPart;
                };

                // Verifica se é um arquivo/link válido
                const isFileOrLink = ["link", "arquivo"].includes(
                  item.campo.tipo
                );
                const hasValidFileOrLink =
                  isFileOrLink &&
                  typeof item.value === "string" &&
                  item.value.trim() !== "" &&
                  item.value !== "[object FileList]" &&
                  item.value.startsWith("http");

                return (
                  <AccordionTab
                    key={`resposta-plano-${item.id}`}
                    header={item.campo.label}
                    headerClassName={styles.accordionHeader}
                  >
                    <div className={styles.value}>
                      {isFileOrLink ? (
                        hasValidFileOrLink ? (
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
                          <p className={styles.emptyValue}>
                            Nenhum arquivo/link enviado
                          </p>
                        )
                      ) : item.campo.tipo === "blockNote" ? (
                        <BlockNoteContent value={item.value} />
                      ) : (
                        <p
                          style={{
                            whiteSpace: "pre-wrap",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.value && item.value !== "[object FileList]"
                            ? item.value
                            : "Nenhum conteúdo fornecido"}
                        </p>
                      )}
                    </div>
                  </AccordionTab>
                );
              })}
            </Accordion>
          </div>
        </div>

        <div className={styles.fichaDeAvaliacao}>
          <h5>Ficha de Avaliação do Plano</h5>
          {fichaPlano?.schemaCriterios?.length > 0 ? (
            <FichaAvaliacaoTree
              schemaCriterios={fichaPlano.schemaCriterios}
              valores={estadoPlano.valores}
              onSelecionar={(criterioId, valor) => handleNotaPlanoSelecionada(plano.id, criterioId, valor)}
            />
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
              value={estadoPlano.observacao || ""}
              onChange={(e) =>
                handleComentarioPlanoChange(plano.id, e.target.value)
              }
            ></textarea>
          </div>

          <div className={styles.notaFinal}>
            <h6>Nota Final:</h6>
            <p>
              {(arvorePlanoCalculada?.pontosObtidos ?? 0).toFixed(2)} / {arvorePlanoCalculada?.pontosMaximos ?? 0}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {currentStep === 0 ? renderProjetoStep() : renderPlanoStep()}
      {error.geral && (
        <div className={`${styles.error} `}>
          <p>{error.geral}</p>
        </div>
      )}
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
            className="button btn-primary mb-2"
            onClick={handleTerminarAvaliacao}
            icon={RiQuillPenLine}
            disabled={loading}
          >
            {loading ? "Aguarde. Carregando..." : "Terminar Avaliação"}
          </Button>
        )}
      </div>
    </>
  );
};

export default Page;

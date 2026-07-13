"use client";

import styles from "./page.module.scss";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiQuillPenLine,
  RiArrowRightLine,
  RiListUnordered,
  RiFileTextLine,
} from "@remixicon/react";
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
import { ProgressSpinner } from "primereact/progressspinner";
import { Timeline } from "primereact/timeline";
import { Toast } from "primereact/toast";
import BlockNoteContent from "@/components/BlockNoteContent";
import FichaAvaliacaoTree from "@/components/avaliacoes/FichaAvaliacaoTree";
import {
  calcularArvoreComNotas,
  flattenRespostas,
  listarCriterios,
} from "@/lib/fichaAvaliacaoScoring";

// Extrai o valor de uma Resposta no mesmo formato usado tanto pela visão
// interativa (Accordion) quanto pelo documento estático de impressão/PDF.
const renderRespostaValor = (item) => {
  const extractFileName = (url) => {
    if (typeof url !== "string" || url === "[object FileList]") return "";
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.split("_")[1] || lastPart;
  };

  const isFileOrLink = ["link", "arquivo"].includes(item.campo.tipo);
  const hasValidFileOrLink =
    isFileOrLink &&
    typeof item.value === "string" &&
    item.value.trim() !== "" &&
    item.value !== "[object FileList]" &&
    item.value.startsWith("http");

  if (isFileOrLink) {
    return hasValidFileOrLink ? (
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
      <p className={styles.emptyValue}>Nenhum arquivo/link enviado</p>
    );
  }

  if (item.campo.tipo === "blockNote") {
    return <BlockNoteContent value={item.value} />;
  }

  return (
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
  );
};

// Lista de respostas + cronograma em "texto corrido" (sem accordions/abas
// colapsadas) — conteúdo compartilhado entre a visualização em tela (toggle
// "texto corrido") e o documento de impressão/PDF, que precisa trazer tudo
// expandido independente do que estiver aberto no accordion.
const RespostasCorridas = ({ respostas, cronograma, cronogramaTitulo }) => (
  <>
    <div className={styles.printRespostas}>
      {[...(respostas || [])]
        .sort(
          (a, b) =>
            (a.campo.ordem ?? a.campo.id) - (b.campo.ordem ?? b.campo.id),
        )
        .map((item) => (
          <div key={`corrido-${item.id}`} className={styles.printField}>
            <h6>{item.campo.label}</h6>
            {renderRespostaValor(item)}
          </div>
        ))}
    </div>
    {cronograma?.length > 0 && (
      <div className={styles.printCronograma}>
        <h6>{cronogramaTitulo}</h6>
        <table>
          <thead>
            <tr>
              <th>Início</th>
              <th>Fim</th>
              <th>Atividade</th>
            </tr>
          </thead>
          <tbody>
            {cronograma.map((c, i) => (
              <tr key={i}>
                <td>{c.inicio}</td>
                <td>{c.fim}</td>
                <td>{c.atividade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
);

// Documento estático usado só na impressão — garante que o PDF traga o
// conteúdo completo independente do modo de visualização escolhido na tela.
// Mostra só o conteúdo submetido (sem notas da ficha).
const PrintDocument = ({
  titulo,
  area,
  respostas,
  cronograma,
  cronogramaTitulo,
}) => (
  <div className={`${styles.printDocument} printOnly`}>
    <h4>{titulo}</h4>
    {area && (
      <p>
        <strong>Área: </strong>
        {area}
      </p>
    )}
    <RespostasCorridas
      respostas={respostas}
      cronograma={cronograma}
      cronogramaTitulo={cronogramaTitulo}
    />
  </div>
);

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  // Controla só o carregamento inicial dos dados (distinto de `loading`, que
  // também é reaproveitado para desabilitar botões durante o envio da
  // avaliação) — evita mostrar a página com título/área/respostas em branco
  // e a Ficha de Avaliação já visível antes dos dados chegarem.
  const [initialLoading, setInitialLoading] = useState(true);
  const [fichaError, setFichaError] = useState(null);
  const router = useRouter();
  const toast = useRef(null);

  // Notificação flutuante de erro — mesmo padrão usado no fluxo de inscrição
  // (components/NovaInscricao.jsx, components/FluxoInscricaoEdital.jsx).
  const showError = (message) => {
    toast.current?.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };
  const [inscricaoProjeto, setInscricaoProjeto] = useState(null);
  const [fichaAvaliacao, setFichaAvaliacao] = useState(null);
  const [valoresProjeto, setValoresProjeto] = useState(new Map());
  const [fichaPlano, setFichaPlano] = useState(null);
  const [avaliacoesPlano, setAvaliacoesPlano] = useState({}); // { [planoId]: { valores: Map } }
  const [currentStep, setCurrentStep] = useState(0); // 0 = projeto, 1+ = planos
  const [planosCount, setPlanosCount] = useState(0);
  const [expandedCards, setExpandedCards] = useState({});
  // Alterna entre a visualização em accordion (por campo) e em texto corrido
  // (tudo expandido, um bloco atrás do outro) para o conteúdo submetido.
  const [visualizacao, setVisualizacao] = useState("accordion");

  const toggleVisualizacao = () => {
    setVisualizacao((prev) => (prev === "accordion" ? "corrido" : "accordion"));
  };

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
        data.inscricao.edital.id,
      );
      setFichaAvaliacao(fichaProjeto);

      try {
        const fichaPlano = await getFichaAvaliacao(
          params.tenant,
          "plano_de_trabalho",
          data.inscricao.edital.id,
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
      const message = `Erro ao carregar a ficha de avaliação. Tente novamente. ${error.response?.data?.message}`;
      setFichaError(message);
      showError(message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
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
      const prevPlano = prev[planoId] || { valores: new Map() };
      const novosValores = new Map(prevPlano.valores);
      if (valor === undefined) novosValores.delete(criterioId);
      else novosValores.set(criterioId, valor);

      return {
        ...prev,
        [planoId]: { ...prevPlano, valores: novosValores },
      };
    });
  };

  const arvoreProjetoCalculada = fichaAvaliacao
    ? calcularArvoreComNotas(fichaAvaliacao.schemaCriterios, valoresProjeto)
    : null;

  // Nota corrente de um plano específico, usada na tag da aba — calculada a
  // partir do estado já salvo em `avaliacoesPlano`, mesmo pra planos que não
  // são o passo atual.
  const arvorePlanoNaAba = (planoId) => {
    if (!fichaPlano) return null;
    const estado = avaliacoesPlano[planoId] || { valores: new Map() };
    return calcularArvoreComNotas(fichaPlano.schemaCriterios, estado.valores);
  };

  const handleTerminarAvaliacao = async () => {
    const totalCriteriosProjeto = listarCriterios(
      fichaAvaliacao.schemaCriterios,
    ).length;
    const respostasProjeto = flattenRespostas(arvoreProjetoCalculada.arvore);
    if (respostasProjeto.length < totalCriteriosProjeto) {
      showError(
        "Preencha a nota de todos os critérios do projeto antes de terminar a avaliação.",
      );
      setCurrentStep(0);
      return;
    }

    let avaliacoesPlanoFormatted = [];
    if (fichaPlano) {
      const totalCriteriosPlano = listarCriterios(
        fichaPlano.schemaCriterios,
      ).length;
      for (const plano of inscricaoProjeto.projeto.planosDeTrabalho) {
        const estado = avaliacoesPlano[plano.id] || {
          valores: new Map(),
        };
        const arvorePlano = calcularArvoreComNotas(
          fichaPlano.schemaCriterios,
          estado.valores,
        );
        const respostasPlano = flattenRespostas(arvorePlano.arvore);
        if (respostasPlano.length < totalCriteriosPlano) {
          showError(
            `Preencha a nota de todos os critérios do plano "${plano.titulo}" antes de terminar a avaliação.`,
          );
          return;
        }
        avaliacoesPlanoFormatted.push({
          planoId: Number(plano.id),
          respostas: respostasPlano,
        });
      }
    }

    setLoading(true);

    try {
      const body = {
        projetoId: params.idProjeto,
        objeto: "PROJETO",
        respostas: respostasProjeto,
        avaliacoesPlano: avaliacoesPlanoFormatted,
      };

      const response = await processarFichaAvaliacao(params.tenant, body);

      if (response.status === "success") {
        alert("Avaliação processada com sucesso!");
        router.push(`/${params.tenant}/avaliador/avaliacoes/projetos`);
      } else {
        showError(response.message || "Erro ao processar avaliação.");
      }
    } catch (error) {
      showError(
        error.response?.data?.message ||
          "Ocorreu um erro ao finalizar a avaliação.",
      );
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
    inscricaoProjeto?.projeto?.CronogramaProjeto?.map((item) => ({
      status: item.atividade,
      date: `${item.inicio} – ${item.fim}`,
      icon: "pi pi-calendar",
    })) || [];

  // Ações de navegação da ficha (Voltar / Próximo Plano / Terminar Avaliação)
  // — ficam na coluna da Ficha de Avaliação, tanto na etapa do projeto quanto
  // na de cada plano de trabalho.
  const renderFichaAcoes = () => (
    <div className={`${styles.fichaAcoes} mt-2`}>
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
          className="button btn-primary"
          onClick={handleTerminarAvaliacao}
          icon={RiQuillPenLine}
          disabled={loading}
        >
          {loading ? "Aguarde. Carregando..." : "Terminar Avaliação"}
        </Button>
      )}
    </div>
  );

  const renderProjetoStep = () => (
    <div className={styles.navContent}>
      <div className={`${styles.projeto} no-print`}>
        <div className="flex-space">
          <h5 className="mb-2">Projeto</h5>
          <Button
            className={`button btn-secondary ${styles.toggleVisualizacao}`}
            icon={
              visualizacao === "accordion" ? RiFileTextLine : RiListUnordered
            }
            title={
              visualizacao === "accordion"
                ? "Ver como texto corrido"
                : "Ver como texto em tópicos"
            }
            onClick={toggleVisualizacao}
          >
            {visualizacao === "accordion" ? "Texto corrido" : "Texto em tópicos"}
          </Button>
        </div>
        <h6 className="mb-2">{inscricaoProjeto?.projeto?.titulo}</h6>
        <p>
          <strong>Área: </strong>
          {inscricaoProjeto?.projeto?.area?.area}
        </p>

        <div className={`${styles.conteudo} mt-2`}>
          {visualizacao === "accordion" ? (
            <Accordion multiple activeIndex={[]}>
              {inscricaoProjeto?.projeto?.Resposta?.sort(
                (a, b) => a.campo.id - b.campo.id,
              ).map((item) => (
                <AccordionTab
                  key={`resposta-${item.id}`}
                  header={item.campo.label}
                  headerClassName={styles.accordionHeader}
                >
                  <div className={styles.value}>
                    {renderRespostaValor(item)}
                  </div>
                </AccordionTab>
              ))}
              {cronogramaEvents.length > 0 && (
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
              )}
            </Accordion>
          ) : (
            <RespostasCorridas
              respostas={inscricaoProjeto?.projeto?.Resposta}
              cronograma={inscricaoProjeto?.projeto?.CronogramaProjeto}
              cronogramaTitulo="Cronograma"
            />
          )}
        </div>
      </div>

      {/*
        === FICHA DE AVALIAÇÃO DO PROJETO ===
      */}

      <div className={`${styles.fichaDeAvaliacao} no-print`}>
        <h5>Ficha de Avaliação do Projeto</h5>

        {fichaError ? null : (
          <>
            <FichaAvaliacaoTree
              schemaCriterios={fichaAvaliacao?.schemaCriterios}
              valores={valoresProjeto}
              onSelecionar={handleNotaSelecionada}
            />

            <div className={styles.notaFinal}>
              <h6>Nota Final:</h6>
              <p>
                {(arvoreProjetoCalculada?.pontosObtidos ?? 0).toFixed(2)} /{" "}
                {arvoreProjetoCalculada?.pontosMaximos ?? 0}
              </p>
            </div>

            {renderFichaAcoes()}
          </>
        )}
      </div>

      <PrintDocument
        titulo={inscricaoProjeto?.projeto?.titulo}
        area={inscricaoProjeto?.projeto?.area?.area}
        respostas={inscricaoProjeto?.projeto?.Resposta}
        cronograma={inscricaoProjeto?.projeto?.CronogramaProjeto}
        cronogramaTitulo="Cronograma do Projeto"
      />
    </div>
  );

  const renderPlanoStep = () => {
    const plano = inscricaoProjeto?.projeto?.planosDeTrabalho[currentStep - 1];
    const estadoPlano = avaliacoesPlano[plano.id] || {
      valores: new Map(),
    };
    const arvorePlanoCalculada = fichaPlano
      ? calcularArvoreComNotas(fichaPlano.schemaCriterios, estadoPlano.valores)
      : null;

    const cronogramaPlanoEvents =
      plano.CronogramaPlanoDeTrabalho?.map((item) => ({
        status: item.atividade,
        date: `${item.inicio} – ${item.fim}`,
        icon: "pi pi-calendar",
      })) || [];

    return (
      <div className={styles.navContent} key={plano.id}>
        <div className={`${styles.projeto} no-print`}>
          <div className="flex-space">
            <h5 className="mb-2">Plano de Trabalho {currentStep}</h5>
            <Button
              className={`button btn-secondary ${styles.toggleVisualizacao}`}
              icon={
                visualizacao === "accordion" ? RiFileTextLine : RiListUnordered
              }
              title={
                visualizacao === "accordion"
                  ? "Ver como texto corrido"
                  : "Ver como texto em tópicos"
              }
              onClick={toggleVisualizacao}
            >
              {visualizacao === "accordion" ? "Texto corrido" : "Texto em tópicos"}
            </Button>
          </div>
          <h6 className="mb-2">{plano.titulo}</h6>
          <p>
            <strong>Área: </strong>
            {plano.area?.area}
          </p>

          <div className={`${styles.conteudo} mt-2`}>
            {visualizacao === "accordion" ? (
              <Accordion multiple activeIndex={[]}>
                {plano.Resposta?.sort(
                  (a, b) => a.campo.ordem - b.campo.ordem,
                ).map((item) => (
                  <AccordionTab
                    key={`resposta-plano-${item.id}`}
                    header={item.campo.label}
                    headerClassName={styles.accordionHeader}
                  >
                    <div className={styles.value}>
                      {renderRespostaValor(item)}
                    </div>
                  </AccordionTab>
                ))}
                {cronogramaPlanoEvents.length > 0 && (
                  <AccordionTab
                    header="Cronograma"
                    headerClassName={styles.accordionHeader}
                  >
                    <div className="card">
                      <Timeline
                        value={cronogramaPlanoEvents}
                        opposite={(item) => <small>{item.date}</small>}
                        content={(item) => <span>{item.status}</span>}
                      />
                    </div>
                  </AccordionTab>
                )}
              </Accordion>
            ) : (
              <RespostasCorridas
                respostas={plano.Resposta}
                cronograma={plano.CronogramaPlanoDeTrabalho}
                cronogramaTitulo="Cronograma"
              />
            )}
          </div>
        </div>

        <div className={`${styles.fichaDeAvaliacao} no-print`}>
          <h5>Ficha de Avaliação do Plano</h5>
          {fichaPlano?.schemaCriterios?.length > 0 ? (
            <FichaAvaliacaoTree
              schemaCriterios={fichaPlano.schemaCriterios}
              valores={estadoPlano.valores}
              onSelecionar={(criterioId, valor) =>
                handleNotaPlanoSelecionada(plano.id, criterioId, valor)
              }
            />
          ) : (
            <p style={{ fontStyle: "italic", color: "#888" }}>
              Nenhum critério de avaliação definido.
            </p>
          )}

          <div className={styles.notaFinal}>
            <h6>Nota Final:</h6>
            <p>
              {(arvorePlanoCalculada?.pontosObtidos ?? 0).toFixed(2)} /{" "}
              {arvorePlanoCalculada?.pontosMaximos ?? 0}
            </p>
          </div>

          {renderFichaAcoes()}
        </div>

        <PrintDocument
          titulo={plano.titulo}
          area={plano.area?.area}
          respostas={plano.Resposta}
          cronograma={plano.CronogramaPlanoDeTrabalho}
          cronogramaTitulo="Cronograma do Plano de Trabalho"
        />
      </div>
    );
  };

  if (initialLoading) {
    return (
      <>
        <Toast ref={toast} position="top-right" />
        <div className={styles.loadingContainer}>
          <ProgressSpinner style={{ width: "40px", height: "40px" }} />
          <p>Carregando avaliação...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <div className={`${styles.abas} no-print`}>
        <button
          type="button"
          className={`${styles.aba} ${currentStep === 0 ? styles.abaAtiva : ""}`}
          onClick={() => setCurrentStep(0)}
        >
          Projeto
          <span className={styles.abaNota}>
            {(arvoreProjetoCalculada?.pontosObtidos ?? 0).toFixed(1)}/
            {arvoreProjetoCalculada?.pontosMaximos ?? 0}
          </span>
        </button>
        {inscricaoProjeto?.projeto?.planosDeTrabalho?.map((plano, i) => {
          const arvorePlano = arvorePlanoNaAba(plano.id);
          return (
            <button
              key={plano.id}
              type="button"
              className={`${styles.aba} ${currentStep === i + 1 ? styles.abaAtiva : ""}`}
              onClick={() => setCurrentStep(i + 1)}
            >
              Plano {i + 1}
              <span className={styles.abaNota}>
                {(arvorePlano?.pontosObtidos ?? 0).toFixed(1)}/
                {arvorePlano?.pontosMaximos ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {currentStep === 0 ? renderProjetoStep() : renderPlanoStep()}
    </>
  );
};

export default Page;

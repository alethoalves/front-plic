"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react";
import { Toast } from "primereact/toast";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Timeline } from "primereact/timeline";

import styles from "./page.module.scss";
import Button from "@/components/Button";
import Skeleton from "@/components/Skeleton";
import { Badge } from "@/components/Badge";
import BlockNoteContent from "@/components/BlockNoteContent";
import { parseDateBR } from "@/lib/formatarDatas";
import {
  getAnaliseRecursoGestor,
  analisarRecursosEmLote,
} from "@/app/api/client/recurso";

// Mesma lógica de exibição usada na avaliação (avaliador/avaliacoes/projetos/[idProjeto])
// e na página de recurso do orientador — switch pelo tipo de campo do formulário de inscrição.
const renderRespostaValor = (item) => {
  const extractFileName = (url) => {
    if (typeof url !== "string" || url === "[object FileList]") return "";
    const parts = url.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.split("_")[1] || lastPart;
  };

  const isFileOrLink = ["link", "arquivo"].includes(item.campo?.tipo);
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

  if (item.campo?.tipo === "blockNote") {
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

const STATUS_BADGE = {
  DEFERIDO: { label: "Deferido (nota máxima)", variant: "success" },
  DEFERIDO_PARCIAL: { label: "Deferido parcialmente", variant: "info" },
  INDEFERIDO: { label: "Indeferido", variant: "error" },
};

const STATUS_PENDENTES = ["PENDENTE", "EM_ANALISE"];

const formatarDataHora = (data) =>
  data ? new Date(data).toLocaleString("pt-BR") : "";

const contarPendentes = (fichas) =>
  fichas
    .flatMap((f) => f.itens)
    .filter((i) => STATUS_PENDENTES.includes(i.status)).length;

// Componente controlado — a decisão (nota/comentário) vive no estado do Page,
// pra permitir um único envio em lote no final em vez de um botão por item.
const ItemRecurso = ({
  item,
  nota,
  comentario,
  onChangeNota,
  onChangeComentario,
}) => {
  const podeEditar = STATUS_PENDENTES.includes(item.status);
  const notaEhMaxima = item.peso !== null && nota === item.peso;
  const comentarioObrigatorio = !notaEhMaxima;

  return (
    <div className={styles.itemRecurso}>
      <div className={styles.itemRecursoHeader}>
        <span className={styles.itemRecursoLabel}>{item.criterioLabel}</span>
        {!podeEditar && item.status in STATUS_BADGE && (
          <Badge variant={STATUS_BADGE[item.status].variant}>
            {STATUS_BADGE[item.status].label}
          </Badge>
        )}
      </div>

      <div className={styles.notasContainer}>
        <div className={`${styles.notaBadge} ${styles.notaAtribuida}`}>
          <span className={styles.notaBadgeLabel}>Nota original</span>
          <span className={styles.notaBadgeValor}>
            {item.notaOriginal}
            {item.notaOriginalAproximada && " *"}
          </span>
        </div>
        <div className={`${styles.notaBadge} ${styles.notaMaxima}`}>
          <span className={styles.notaBadgeLabel}>Nota máxima</span>
          <span className={styles.notaBadgeValor}>{item.peso}</span>
        </div>
      </div>

      <p className={styles.comentarioAvaliador}>
        {item.comentarioAvaliador
          ? `Comentário do avaliador: ${item.comentarioAvaliador}`
          : "Nenhum comentário do avaliador"}
      </p>

      <p className={styles.recursoOrientadorLabel}>
        Recurso de {item.orientadorSolicitante}
      </p>
      <p className={styles.recursoOrientadorTexto}>
        {item.justificativaOrientador}
      </p>

      {podeEditar ? (
        item.peso === null ? (
          <p className={styles.avisoManual}>
            Não foi possível localizar este critério na ficha de avaliação.
          </p>
        ) : (
          <>
            <div className={styles.sliderBloco}>
              <div className={styles.sliderRow}>
                <input
                  type="range"
                  min={item.notaOriginal}
                  max={item.peso}
                  step={0.5}
                  value={nota}
                  onChange={(e) => onChangeNota(Number(e.target.value))}
                />
                <span className={styles.sliderValor}>{nota}</span>
              </div>
              <Button
                className="btn-secondary"
                onClick={() => onChangeNota(item.peso)}
              >
                Atribuir nota máxima
              </Button>
            </div>

            {comentarioObrigatorio && (
              <>
                <textarea
                  className={styles.textarea}
                  placeholder="Justifique a decisão (obrigatório quando a nota não é a máxima)..."
                  value={comentario}
                  onChange={(e) => onChangeComentario(e.target.value)}
                  rows={3}
                />
                {comentario.trim().length === 0 && (
                  <p className={styles.avisoComentario}>
                    Comentário obrigatório quando a nota atribuída não é a
                    máxima.
                  </p>
                )}
              </>
            )}
          </>
        )
      ) : (
        <div className={styles.recursoAnalisado}>
          <p className={styles.recursoAnalisadoLabel}>
            Nota atribuída: {item.notaAtribuida}
            {item.analisadoPor && ` — analisado por ${item.analisadoPor}`}
            {item.analisadoEm && ` em ${formatarDataHora(item.analisadoEm)}`}
          </p>
          {item.comentarioGestor && <p>{item.comentarioGestor}</p>}
        </div>
      )}
    </div>
  );
};

// Atualiza, num array de fichas, os itens cujo recursoId veio no lote salvo —
// usado tanto pras fichas do projeto quanto pras de cada plano.
const atualizarFichasComResultado = (fichas, atualizadosPorId) =>
  fichas.map((ficha) => ({
    ...ficha,
    itens: ficha.itens.map((item) => {
      const atualizado = atualizadosPorId.get(item.recursoId);
      if (!atualizado) return item;
      return {
        ...item,
        status: atualizado.status,
        notaAtribuida: atualizado.notaAtribuida,
        comentarioGestor: atualizado.comentarioGestor,
        analisadoEm: atualizado.analisadoEm,
        analisadoPor: atualizado.analisadoPor?.nome ?? item.analisadoPor,
      };
    }),
  }));

const Page = ({ params }) => {
  const router = useRouter();
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [analise, setAnalise] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [decisoes, setDecisoes] = useState({});
  const [salvandoLote, setSalvandoLote] = useState(false);

  const fetchAnalise = async () => {
    setLoading(true);
    try {
      const data = await getAnaliseRecursoGestor(params.tenant, params.planoId);
      setAnalise(data);
    } catch (error) {
      const detail =
        error.response?.data?.message ||
        "Não foi possível abrir esta análise de recurso.";
      toast.current?.show({
        severity: "warn",
        summary: "Análise não disponível",
        detail,
        life: 4000,
      });
      router.replace(
        `/${params.tenant}/gestor/${params.ano}/avaliacoes/projetos/distribuicao-recursos?aba=resultados`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tenant, params.planoId]);

  // Preenche o rascunho local com os itens ainda pendentes de todas as abas
  // (projeto + cada plano), sem sobrescrever o que o gestor já estiver
  // editando (ex.: depois de um envio parcialmente rejeitado).
  useEffect(() => {
    if (!analise) return;
    setDecisoes((prev) => {
      const next = { ...prev };
      const todasFichas = [
        ...(analise.projeto?.fichas ?? []),
        ...analise.planos.flatMap((p) => p.fichas),
      ];
      for (const ficha of todasFichas) {
        for (const item of ficha.itens) {
          if (
            STATUS_PENDENTES.includes(item.status) &&
            !(item.recursoId in next)
          ) {
            next[item.recursoId] = {
              nota: item.notaAtribuida ?? item.notaOriginal ?? 0,
              comentario: item.comentarioGestor ?? "",
            };
          }
        }
      }
      return next;
    });
  }, [analise]);

  const handleChangeNota = (recursoId, nota) =>
    setDecisoes((prev) => ({
      ...prev,
      [recursoId]: { ...prev[recursoId], nota },
    }));
  const handleChangeComentario = (recursoId, comentario) =>
    setDecisoes((prev) => ({
      ...prev,
      [recursoId]: { ...prev[recursoId], comentario },
    }));

  // Pendentes cobrem TODAS as abas — o envio em lote é global, tudo-ou-nada
  // pra família inteira (projeto + planos), não só a aba ativa.
  const todosItens = useMemo(() => {
    if (!analise) return [];
    const todasFichas = [
      ...(analise.projeto?.fichas ?? []),
      ...analise.planos.flatMap((p) => p.fichas),
    ];
    return todasFichas.flatMap((f) => f.itens);
  }, [analise]);
  const itensPendentes = useMemo(
    () => todosItens.filter((i) => STATUS_PENDENTES.includes(i.status)),
    [todosItens],
  );
  const todosValidos = itensPendentes.every((item) => {
    const d = decisoes[item.recursoId];
    if (!d || item.peso === null) return false;
    const notaEhMaxima = d.nota === item.peso;
    return notaEhMaxima || d.comentario.trim().length > 0;
  });

  const handleSalvarLote = async () => {
    setSalvandoLote(true);
    try {
      const itens = itensPendentes.map((item) => ({
        recursoId: item.recursoId,
        notaAtribuida: decisoes[item.recursoId].nota,
        comentario: decisoes[item.recursoId].comentario.trim() || undefined,
      }));
      const resultado = await analisarRecursosEmLote(params.tenant, itens);
      const atualizadosPorId = new Map(
        resultado.recursos.map((r) => [r.id, r]),
      );
      setAnalise((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          projeto: prev.projeto
            ? {
                ...prev.projeto,
                fichas: atualizarFichasComResultado(
                  prev.projeto.fichas,
                  atualizadosPorId,
                ),
              }
            : null,
          planos: prev.planos.map((p) => ({
            ...p,
            fichas: atualizarFichasComResultado(p.fichas, atualizadosPorId),
          })),
        };
      });
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: resultado.message,
        life: 4000,
      });
    } catch (error) {
      const detail =
        error.response?.data?.message ||
        "Não foi possível salvar as decisões. Nada foi salvo.";
      toast.current?.show({
        severity: "error",
        summary: "Erro ao salvar",
        detail,
        life: 5000,
      });
      // Rascunho local (decisoes) é preservado — nada foi salvo no backend.
    } finally {
      setSalvandoLote(false);
    }
  };

  // Dados exibidos nos dois painéis, resolvidos a partir da aba ativa.
  const stepAtivo = useMemo(() => {
    if (!analise) return null;
    if (!analise.temProjeto) return { ...analise.planos[0], ehProjeto: false };
    if (currentStep === 0) return { ...analise.projeto, ehProjeto: true };
    return { ...analise.planos[currentStep - 1], ehProjeto: false };
  }, [analise, currentStep]);

  const pendentesProjeto = useMemo(
    () => contarPendentes(analise?.projeto?.fichas ?? []),
    [analise],
  );

  const labelNota = stepAtivo?.ehProjeto ? "Projeto" : "Plano";

  return (
    <div>
      <Toast ref={toast} position="top-right" />
      <Link
        href={`/${params.tenant}/gestor/${params.ano}/avaliacoes/projetos/distribuicao-recursos?aba=resultados`}
        className={styles.voltar}
      >
        <RiArrowLeftLine />
        Voltar para Resultados e Recursos
      </Link>

      {loading ? (
        <Skeleton />
      ) : analise && stepAtivo ? (
        <>
          {analise.temProjeto && (
            <div className={styles.abas}>
              <button
                type="button"
                className={`${styles.aba} ${currentStep === 0 ? styles.abaAtiva : ""}`}
                onClick={() => setCurrentStep(0)}
              >
                Projeto
                {pendentesProjeto > 0 && (
                  <span className={styles.abaNota}>
                    {pendentesProjeto} pend.
                  </span>
                )}
              </button>
              {analise.planos.map((p, i) => {
                const pendentesPlano = contarPendentes(p.fichas);
                return (
                  <button
                    type="button"
                    key={p.id}
                    className={`${styles.aba} ${currentStep === i + 1 ? styles.abaAtiva : ""}`}
                    onClick={() => setCurrentStep(i + 1)}
                    title={p.titulo}
                  >
                    Plano {i + 1}
                    {pendentesPlano > 0 && (
                      <span className={styles.abaNota}>
                        {pendentesPlano} pend.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {analise.temProjeto && (
            <div className={styles.navegacaoAbas}>
              <Button
                className="btn-secondary"
                icon={RiArrowLeftLine}
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>
              <Button
                className="btn-secondary"
                icon={RiArrowRightLine}
                onClick={() => setCurrentStep((s) => Math.min(analise.planos.length, s + 1))}
                disabled={currentStep === analise.planos.length}
              >
                Próximo
              </Button>
            </div>
          )}

          <div className={styles.navContent}>
            <div className={styles.projeto}>
              <span className={styles.eyebrow}>
                Análise de recurso — {labelNota}
              </span>
              <h4 className={styles.titulo}>{stepAtivo.titulo}</h4>
              {stepAtivo.area?.area && (
                <p className={styles.area}>{stepAtivo.area.area}</p>
              )}

              {!stepAtivo.ehProjeto && (
                <>
                  <h6 className={styles.secaoTitulo}>Orientador(es)</h6>
                  {stepAtivo.orientador.map((o, idx) => (
                    <p key={idx}>
                      {o.nome} — {o.cpf}
                    </p>
                  ))}
                  <h6 className={styles.secaoTitulo}>Aluno(s)</h6>
                  {stepAtivo.aluno.map((a, idx) => (
                    <p key={idx}>
                      {a.nome} — {a.cpf}
                    </p>
                  ))}
                </>
              )}

              {(stepAtivo.conteudo?.length > 0 ||
                stepAtivo.cronograma?.length > 0) && (
                <>
                  <h6 className={styles.secaoTitulo}>
                    Conteúdo do {labelNota}
                  </h6>
                  <Accordion>
                    {stepAtivo.conteudo.map((item) => (
                      <AccordionTab
                        key={item.id}
                        header={item.campo?.label || "Campo"}
                      >
                        {renderRespostaValor(item)}
                      </AccordionTab>
                    ))}
                    {stepAtivo.cronograma?.length > 0 && (
                      <AccordionTab header="Cronograma">
                        <Timeline
                          value={[...stepAtivo.cronograma].sort(
                            (a, b) =>
                              parseDateBR(a.inicio) - parseDateBR(b.inicio),
                          )}
                          opposite={(item) => (
                            <small>{`${item.inicio} – ${item.fim}`}</small>
                          )}
                          content={(item) => <span>{item.atividade}</span>}
                        />
                      </AccordionTab>
                    )}
                  </Accordion>
                </>
              )}
            </div>

            <div className={styles.fichaDeAvaliacao}>
              {stepAtivo.fichas.length === 0 ? (
                <div className={styles.avisoManual}>
                  <p>Nenhum recurso para o {labelNota.toLowerCase()}.</p>
                  {stepAtivo.ehProjeto && analise.planos.length > 0 && (
                    <div className={styles.irParaPlano}>
                      <div className={styles.irParaPlanoBotoes}>
                        {analise.planos.map((p, i) => (
                          <Button
                            key={p.id}
                            className="btn-primary"
                            onClick={() => setCurrentStep(i + 1)}
                            title={p.titulo}
                          >
                            Leia o projeto ao lado e analise os recursos do{" "}
                            {analise.planos.length > 1
                              ? `Plano ${i + 1}`
                              : "plano"}{" "}
                            clicando aqui
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                stepAtivo.fichas.map((ficha) => (
                  <div key={ficha.id} className={styles.blocoAvaliador}>
                    <h6 className={styles.secaoTitulo}>
                      Avaliação de {ficha.avaliadorNome} ({ficha.notaTotal}/
                      {ficha.notaMaxima})
                    </h6>
                    {ficha.itens.map((item) => (
                      <ItemRecurso
                        key={item.recursoId}
                        item={item}
                        nota={
                          decisoes[item.recursoId]?.nota ??
                          item.notaAtribuida ??
                          item.notaOriginal ??
                          0
                        }
                        comentario={
                          decisoes[item.recursoId]?.comentario ??
                          item.comentarioGestor ??
                          ""
                        }
                        onChangeNota={(nota) =>
                          handleChangeNota(item.recursoId, nota)
                        }
                        onChangeComentario={(comentario) =>
                          handleChangeComentario(item.recursoId, comentario)
                        }
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.acoes}>
            {itensPendentes.length === 0 ? (
              <p className={styles.avisoManual}>
                Todos os recursos já foram analisados.
              </p>
            ) : (
              <Button
                className="btn-primary"
                onClick={handleSalvarLote}
                loading={salvandoLote}
                disabled={salvandoLote || !todosValidos}
                title={
                  !todosValidos
                    ? "Preencha nota e comentário (quando obrigatório) de todos os itens pendentes, em todas as abas."
                    : undefined
                }
              >
                Salvar decisão de todos os recursos ({itensPendentes.length})
              </Button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Page;

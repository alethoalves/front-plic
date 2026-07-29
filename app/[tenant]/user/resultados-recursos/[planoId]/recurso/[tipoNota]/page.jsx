"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  RiScales3Line,
  RiArrowLeftLine,
  RiEyeLine,
  RiRefreshLine,
  RiDeleteBin6Line,
  RiWhatsappFill,
  RiSave2Line,
  RiExternalLinkLine,
  RiYoutubeLine,
  RiFlaskLine,
  RiUserStarLine,
  RiCommunityLine,
} from "@remixicon/react";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Timeline } from "primereact/timeline";
import { Toast } from "primereact/toast";
import { Card } from "primereact/card";

import styles from "./page.module.scss";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import FileInput from "@/components/FileInput";
import Skeleton from "@/components/Skeleton";
import BlockNoteContent from "@/components/BlockNoteContent";
import GrupoAvaliacao from "@/components/participacao/GrupoAvaliacao";
import { parseDateBR } from "@/lib/formatarDatas";
import { getCurrentUserId, getCurrentUserNome } from "@/lib/headers";
import generateLattesText from "@/lib/generateLattesText";
import { xmlLattes } from "@/app/api/clientReq";
import {
  getRecursoDetalhe,
  criarRecurso,
  excluirRecurso,
} from "@/app/api/client/recurso";
import {
  gerarFichaAvaliacaoParticipacao,
  simularFichaAvaliacaoParticipacao,
  getItensAprovadosRejeitadosParticipacao,
} from "@/app/api/client/cvLattes";

const LABELS_NOTA = {
  projeto: "Projeto",
  plano: "Plano",
  orientador: "Orientador",
  aluno: "Aluno",
};

const EH_PROJETO_OU_PLANO = (tipoNota) =>
  tipoNota === "projeto" || tipoNota === "plano";

// Suporte do PLIC (não é o contato do tenant) — mesmo número já usado em
// FluxoInscricaoEdital.jsx, EditarParticipacao.jsx e ConviteAvaliadorClient.jsx.
// Migrado da listagem de Resultados e Recursos pra cá: aqui dá pra levar o
// contexto específico do recurso (plano, tipo de nota, título) na mensagem.
const SUPORTE_PLIC_WHATSAPP = "5561991651494";

const SuporteWhatsapp = ({ nome, cpf, planoId, labelNota, titulo }) => {
  const linhas = [
    `Olá! Meu nome é ${nome || "[nome não identificado]"} e preciso de ajuda com um recurso no PLIC.`,
    `CPF: ${cpf || "[CPF não identificado]"}`,
    `ID do plano de trabalho: ${planoId}`,
    `Nota: ${labelNota}`,
  ];
  if (titulo) linhas.push(`Título: ${titulo}`);

  return (
    <a
      className={styles.suporteWhatsapp}
      href={`https://wa.me/${SUPORTE_PLIC_WHATSAPP}?text=${encodeURIComponent(
        linhas.join("\n"),
      )}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <RiWhatsappFill />
      <div>
        <p className={styles.suporteWhatsappTitulo}>Precisa de ajuda?</p>
        <p>Fale com o suporte do PLIC pelo WhatsApp: +55 (61) 99165-1494</p>
      </div>
    </a>
  );
};

// Mesma lógica de exibição usada na avaliação (avaliador/avaliacoes/projetos/[idProjeto]) —
// switch pelo tipo de campo do formulário de inscrição.
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

// Percorre a árvore de FichaAvaliacao.respostas coletando os critérios-folha que
// ainda não atingiram a pontuação máxima (mesmo corte usado no back, ver
// recursoController.js).
const coletarItensAbaixoDoMaximo = (nos, acc = []) => {
  for (const no of nos || []) {
    if (no.tipo === "criterio" && no.pontosObtidos < no.peso) {
      acc.push(no);
    } else if (no.tipo === "grupo") {
      coletarItensAbaixoDoMaximo(no.itens, acc);
    }
  }
  return acc;
};

// Soma recursivamente os itens aprovados/rejeitados do próprio nó com os de todos
// os descendentes — só os nós-folha (com path/campos) recebem itensAprovados/
// itensRejeitados do backend, então os grupos intermediários precisam agregar.
const contarItensRecursivo = (grupo) => {
  const total = {
    aprovados: grupo.itensAprovados?.length || 0,
    rejeitados: grupo.itensRejeitados?.length || 0,
  };
  for (const sub of grupo.grupos || []) {
    const subtotal = contarItensRecursivo(sub);
    total.aprovados += subtotal.aprovados;
    total.rejeitados += subtotal.rejeitados;
  }
  return total;
};

// ─── Modal "itens não contabilizados" (Lattes) — mesmo padrão já usado no fluxo
// de inscrição (components/participacao/EditarParticipacao.jsx), adaptado aqui.
const GrupoItensNaoContabilizados = ({ grupo, nivel = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const temItens =
    grupo.itensAprovados?.length > 0 ||
    grupo.itensRejeitados?.length > 0 ||
    grupo.grupos?.length > 0;
  const { aprovados, rejeitados } = contarItensRecursivo(grupo);

  const renderCampos = (campos) =>
    campos.map((campo, idx) => {
      const vazio =
        campo.value === undefined || campo.value === null || campo.value === "";
      return (
        <div key={idx} className={styles.campoItem}>
          <span className={styles.campoLabel}>{campo.label}</span>
          <span
            className={styles.campoValor}
            style={
              vazio ? { color: "#9ca3af", fontStyle: "italic" } : undefined
            }
          >
            {vazio
              ? "(vazio)"
              : typeof campo.value === "object"
                ? JSON.stringify(campo.value)
                : String(campo.value)}
          </span>
        </div>
      );
    });

  return (
    <div
      className={`${styles.grupoAvaliacao} ${nivel === 0 ? styles.grupoPrincipal : nivel === 1 ? styles.grupoSecundario : styles.grupoTerciario}`}
    >
      <div
        className={`${styles.grupoHeader} ${temItens ? styles.clickable : ""}`}
        onClick={() => temItens && setExpanded(!expanded)}
      >
        <div className={styles.grupoHeaderTop}>
          {temItens && (
            <i
              className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"} ${styles.expandIcon}`}
            />
          )}
          <h5 className={styles.grupoLabel}>{grupo.label}</h5>
        </div>
        <div className={styles.grupoHeaderBottom}>
          <span
            style={{ color: "#16a34a", fontSize: "0.85rem", marginRight: 12 }}
          >
            {aprovados} aprovado(s)
          </span>
          <span style={{ color: "#dc2626", fontSize: "0.85rem" }}>
            {rejeitados} não contabilizado(s)
          </span>
        </div>
      </div>

      {expanded && grupo.itensAprovados?.length > 0 && (
        <div className={styles.itensResposta}>
          <p style={{ fontWeight: 600, color: "#16a34a", margin: "8px 0 4px" }}>
            Itens aprovados
          </p>
          {grupo.itensAprovados.map((item, idx) => (
            <div key={idx} className={styles.itemResposta}>
              <div className={styles.itemHeader}>
                <span className={styles.itemIndex}>Item {idx + 1}</span>
              </div>
              <div className={styles.itemCampos}>{renderCampos(item)}</div>
            </div>
          ))}
        </div>
      )}

      {expanded && grupo.itensRejeitados?.length > 0 && (
        <div className={styles.itensResposta}>
          <p style={{ fontWeight: 600, color: "#dc2626", margin: "8px 0 4px" }}>
            Itens não contabilizados
          </p>
          {grupo.itensRejeitados.map((rejeitado, idx) => (
            <div
              key={idx}
              className={styles.itemResposta}
              style={{ borderLeft: "3px solid #dc2626" }}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemIndex}>Item {idx + 1}</span>
              </div>
              <div className={styles.itemCampos}>
                {renderCampos(rejeitado.campos)}
              </div>
              {rejeitado.motivosReprovacao?.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.85rem",
                    color: "#7f1d1d",
                  }}
                >
                  <strong>Motivo da reprovação:</strong>
                  <ul style={{ margin: "4px 0 0 16px" }}>
                    {rejeitado.motivosReprovacao.map((motivo, mIdx) =>
                      motivo.subCondicoes ? (
                        <li key={mIdx}>
                          Sub-grupo ({motivo.operador}) — nenhuma condição
                          atendida:
                          <ul style={{ margin: "2px 0 0 16px" }}>
                            {motivo.subCondicoes
                              .filter((s) => !s.aprovado)
                              .map((sub, sIdx) => (
                                <li key={sIdx}>
                                  Campo <strong>{sub.campo}</strong> (
                                  {sub.operador}): esperado{" "}
                                  <strong>
                                    {JSON.stringify(sub.valorEsperado)}
                                  </strong>
                                  , encontrado{" "}
                                  <strong>
                                    {sub.valorEncontrado === null ||
                                    sub.valorEncontrado === undefined ||
                                    sub.valorEncontrado === ""
                                      ? "(ausente)"
                                      : String(sub.valorEncontrado)}
                                  </strong>
                                </li>
                              ))}
                          </ul>
                        </li>
                      ) : (
                        <li key={mIdx}>
                          Campo <strong>{motivo.campo}</strong> (
                          {motivo.operador}): esperado{" "}
                          <strong>
                            {JSON.stringify(motivo.valorEsperado)}
                          </strong>
                          , encontrado{" "}
                          <strong>
                            {motivo.valorEncontrado === null ||
                            motivo.valorEncontrado === undefined ||
                            motivo.valorEncontrado === ""
                              ? "(ausente)"
                              : String(motivo.valorEncontrado)}
                          </strong>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {expanded && grupo.grupos?.length > 0 && (
        <div className={styles.subgrupos}>
          {grupo.grupos.map((sub, idx) => (
            <GrupoItensNaoContabilizados
              key={idx}
              grupo={sub}
              nivel={nivel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Projeto / Plano ────────────────────────────────────────────────────────
const formatarData = (data) =>
  data ? new Date(data).toLocaleDateString("pt-BR") : "";

// Mesmo mínimo exigido pelo back (recursoSchema.js) — validar aqui evita o
// round-trip só pra mostrar a mensagem técnica do zod ("itens.0.justificativa - ...").
const JUSTIFICATIVA_MIN = 150;

const ContadorCaracteres = ({ texto }) => {
  const restantes = JUSTIFICATIVA_MIN - texto.trim().length;
  return (
    <p
      className={`${styles.contadorCaracteres} ${restantes > 0 ? styles.abaixoDoMinimo : ""}`}
    >
      {restantes > 0
        ? `Faltam ${restantes} caracteres (mínimo de ${JUSTIFICATIVA_MIN}).`
        : `${texto.trim().length}/${JUSTIFICATIVA_MIN} caracteres.`}
    </p>
  );
};

const RecursoProjetoPlano = ({
  recurso,
  tenant,
  planoId,
  tipoNota,
  toast,
  onEnviado,
}) => {
  const [respostas, setRespostas] = useState({});
  const [justificativaGeral, setJustificativaGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviandoChave, setEnviandoChave] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);

  const handleExcluir = async (recursoId) => {
    setExcluindoId(recursoId);
    try {
      await excluirRecurso(tenant, planoId, recursoId);
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Recurso excluído com sucesso.",
        life: 4000,
      });
      onEnviado();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message ||
          "Não foi possível excluir o recurso.",
        life: 5000,
      });
    } finally {
      setExcluindoId(null);
    }
  };

  const jaEnviadoGeral = recurso.recursosEnviados?.find(
    (r) => !r.fichaAvaliacaoId,
  );
  const enviadosPorChave = useMemo(() => {
    const mapa = new Map();
    (recurso.recursosEnviados || []).forEach((r) => {
      if (r.fichaAvaliacaoId && r.criterioId) {
        mapa.set(`${r.fichaAvaliacaoId}:${r.criterioId}`, r);
      }
    });
    return mapa;
  }, [recurso.recursosEnviados]);

  const fichasComItens = (recurso.fichas || [])
    .map((ficha) => ({
      ficha,
      itens: coletarItensAbaixoDoMaximo(ficha.respostas),
    }))
    .filter(({ itens }) => itens.length > 0);

  // Mesma transformação usada na ficha de avaliação do avaliador
  // (avaliador/avaliacoes/projetos/[idProjeto]/page.jsx) pra alimentar o
  // Timeline do PrimeReact — concatena início/fim num único texto oposto.
  const cronogramaEvents = [...(recurso.cronograma || [])]
    .sort((a, b) => parseDateBR(a.inicio) - parseDateBR(b.inicio))
    .map((item) => ({
      status: item.atividade,
      date: `${item.inicio} – ${item.fim}`,
      icon: "pi pi-calendar",
    }));

  const handleEnviarItem = async (chave) => {
    const texto = (respostas[chave] || "").trim();
    if (texto.length < JUSTIFICATIVA_MIN) {
      toast.current.show({
        severity: "warn",
        summary: "Justificativa muito curta",
        detail: `Escreva pelo menos ${JUSTIFICATIVA_MIN} caracteres (faltam ${JUSTIFICATIVA_MIN - texto.length}).`,
        life: 4000,
      });
      return;
    }

    const [fichaAvaliacaoId, criterioId] = chave.split(":");
    setEnviandoChave(chave);
    try {
      const resultado = await criarRecurso(tenant, planoId, {
        tipo: tipoNota,
        itens: [
          {
            fichaAvaliacaoId: Number(fichaAvaliacaoId),
            criterioId,
            justificativa: texto,
          },
        ],
      });
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: resultado.message || "Recurso enviado com sucesso.",
        life: 5000,
      });
      setRespostas((prev) => {
        const proximo = { ...prev };
        delete proximo[chave];
        return proximo;
      });
      onEnviado();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message || "Não foi possível enviar o recurso.",
        life: 5000,
      });
    } finally {
      setEnviandoChave(null);
    }
  };

  const handleEnviarGeral = async () => {
    const texto = justificativaGeral.trim();
    if (texto.length < JUSTIFICATIVA_MIN) {
      toast.current.show({
        severity: "warn",
        summary: "Justificativa muito curta",
        detail: `Escreva pelo menos ${JUSTIFICATIVA_MIN} caracteres (faltam ${JUSTIFICATIVA_MIN - texto.length}).`,
        life: 4000,
      });
      return;
    }
    setEnviando(true);
    try {
      const resultado = await criarRecurso(tenant, planoId, {
        tipo: tipoNota,
        justificativaGeral: texto,
      });
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: resultado.message || "Recurso enviado com sucesso.",
        life: 5000,
      });
      onEnviado();
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message || "Não foi possível enviar o recurso.",
        life: 5000,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <span className={styles.areaBadge}>
        <Badge>{recurso.area?.area ?? "Área não informada"}</Badge>
      </span>
      <h4 className={styles.tituloPlano}>{recurso.titulo}</h4>

      {(recurso.conteudo?.length > 0 || recurso.cronograma?.length > 0) && (
        <div className={styles.secao}>
          <h6 className={styles.secaoTitulo}>
            Conteúdo do {LABELS_NOTA[tipoNota]}
          </h6>
          <Accordion>
            {recurso.conteudo.map((item) => (
              <AccordionTab key={item.id} header={item.campo?.label || "Campo"}>
                {renderRespostaValor(item)}
              </AccordionTab>
            ))}
            {recurso.cronograma?.length > 0 && (
              <AccordionTab header="Cronograma">
                <div className="card">
                  <Timeline
                    value={cronogramaEvents}
                    opposite={(item) => <small>{item.date}</small>}
                    content={(item) => <span>{item.status}</span>}
                  />
                </div>
              </AccordionTab>
            )}
          </Accordion>
        </div>
      )}

      {recurso.fichas.length === 0 ? (
        <div className={styles.secao}>
          <div className={styles.avisoManual}>
            Esta nota foi atribuída manualmente pelo gestor, sem ficha de
            avaliação vinculada.
          </div>
          {jaEnviadoGeral ? (
            <div className={styles.recursoEnviado}>
              <p className={styles.recursoEnviadoLabel}>
                Recurso enviado por{" "}
                {jaEnviadoGeral.user?.nome || "um orientador"} em{" "}
                {formatarData(jaEnviadoGeral.createdAt)}
              </p>
              <p>{jaEnviadoGeral.justificativa}</p>
              <div className={styles.acoes}>
                <Button
                  className="btn-error-outline"
                  icon={RiDeleteBin6Line}
                  onClick={() => handleExcluir(jaEnviadoGeral.id)}
                  loading={excluindoId === jaEnviadoGeral.id}
                  disabled={excluindoId === jaEnviadoGeral.id}
                >
                  Excluir recurso
                </Button>
              </div>
            </div>
          ) : (
            <>
              <textarea
                className={styles.textarea}
                placeholder="Descreva o motivo do seu recurso..."
                value={justificativaGeral}
                onChange={(e) => setJustificativaGeral(e.target.value)}
                rows={5}
              />
              <ContadorCaracteres texto={justificativaGeral} />
              <div className={styles.acoes}>
                <Button
                  className="btn-primary"
                  onClick={handleEnviarGeral}
                  loading={enviando}
                  disabled={enviando || justificativaGeral.trim().length < JUSTIFICATIVA_MIN}
                  title={
                    justificativaGeral.trim().length < JUSTIFICATIVA_MIN
                      ? `Escreva pelo menos ${JUSTIFICATIVA_MIN} caracteres para enviar.`
                      : undefined
                  }
                >
                  Enviar Recurso
                </Button>
              </div>
            </>
          )}
        </div>
      ) : fichasComItens.length === 0 ? (
        <div className={styles.secao}>
          <div className={styles.avisoManual}>
            Não há itens disponíveis para recurso nesta nota.
          </div>
        </div>
      ) : (
        <div className={styles.secao}>
          <p className={styles.notasHint}>
            Escreva e envie o recurso individualmente para cada item abaixo.
          </p>
          {fichasComItens.map(({ ficha, itens }) => (
            <div key={ficha.id} className={styles.blocoAvaliador}>
              <h6 className={styles.secaoTitulo}>Avaliação {ficha.numero}</h6>
              {itens.map((item) => {
                const chave = `${ficha.id}:${item.id}`;
                const jaEnviado = enviadosPorChave.get(chave);
                return (
                  <div key={chave} className={styles.itemRecurso}>
                    <div className={styles.itemRecursoHeader}>
                      <span className={styles.itemRecursoLabel}>
                        {item.label}
                      </span>
                    </div>
                    <div className={styles.notasContainer}>
                      <div
                        className={`${styles.notaBadge} ${styles.notaAtribuida}`}
                      >
                        <span className={styles.notaBadgeLabel}>
                          Nota atribuída
                        </span>
                        <span className={styles.notaBadgeValor}>
                          {item.pontosObtidos}
                        </span>
                      </div>
                      <div
                        className={`${styles.notaBadge} ${styles.notaMaxima}`}
                      >
                        <span className={styles.notaBadgeLabel}>
                          Nota máxima
                        </span>
                        <span className={styles.notaBadgeValor}>
                          {item.peso}
                        </span>
                      </div>
                    </div>
                    <p className={styles.comentarioAvaliador}>
                      {item.comentario
                        ? `Comentário do avaliador: ${item.comentario}`
                        : "Nenhum comentário do avaliador"}
                    </p>
                    {jaEnviado ? (
                      <div className={styles.recursoEnviado}>
                        <p className={styles.recursoEnviadoLabel}>
                          Recurso enviado por{" "}
                          {jaEnviado.user?.nome || "um orientador"} em{" "}
                          {formatarData(jaEnviado.createdAt)}
                        </p>
                        <p>{jaEnviado.justificativa}</p>
                        <div className={styles.acoes}>
                          <Button
                            className="btn-error-outline"
                            icon={RiDeleteBin6Line}
                            onClick={() => handleExcluir(jaEnviado.id)}
                            loading={excluindoId === jaEnviado.id}
                            disabled={excluindoId === jaEnviado.id}
                          >
                            Excluir recurso
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <textarea
                          className={styles.textarea}
                          placeholder="Escreva aqui o seu recurso para este item..."
                          value={respostas[chave] || ""}
                          onChange={(e) =>
                            setRespostas((prev) => ({
                              ...prev,
                              [chave]: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                        <ContadorCaracteres texto={respostas[chave] || ""} />
                        <div className={styles.acoes}>
                          <Button
                            className="btn-primary"
                            onClick={() => handleEnviarItem(chave)}
                            loading={enviandoChave === chave}
                            disabled={
                              enviandoChave !== null ||
                              (respostas[chave] || "").trim().length < JUSTIFICATIVA_MIN
                            }
                            title={
                              (respostas[chave] || "").trim().length < JUSTIFICATIVA_MIN
                                ? `Escreva pelo menos ${JUSTIFICATIVA_MIN} caracteres para enviar.`
                                : undefined
                            }
                          >
                            Enviar Recurso
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// ─── Orientador / Aluno ─────────────────────────────────────────────────────
const RecursoParticipacao = ({
  recurso,
  tenant,
  tipoNota,
  toast,
  onAtualizado,
}) => {
  const ehAluno = tipoNota === "aluno";
  const [simulacao, setSimulacao] = useState(null);
  const [simulando, setSimulando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoXml, setEnviandoXml] = useState(false);
  const [fileError, setFileError] = useState("");
  const [modalItensAberto, setModalItensAberto] = useState(false);
  const [itensNaoContabilizados, setItensNaoContabilizados] = useState(null);
  const [loadingItens, setLoadingItens] = useState(false);

  const handleVerItensNaoContabilizados = async () => {
    if (!recurso.participacaoId) return;
    setModalItensAberto(true);
    if (itensNaoContabilizados) return;
    setLoadingItens(true);
    try {
      const resultado = await getItensAprovadosRejeitadosParticipacao(
        tenant,
        recurso.participacaoId,
      );
      setItensNaoContabilizados(resultado.fichaAvaliacao);
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message ||
          "Não foi possível carregar os itens não contabilizados.",
        life: 5000,
      });
      setModalItensAberto(false);
    } finally {
      setLoadingItens(false);
    }
  };

  const handleUploadXml = async (file) => {
    setFileError("");
    const isZip =
      [
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream",
      ].includes(file.type) || file.name.endsWith(".zip");
    const isXml =
      file.type === "text/xml" ||
      file.type === "application/xml" ||
      file.name.endsWith(".xml");
    if (!isZip && !isXml) {
      setFileError("Por favor, selecione um arquivo XML ou ZIP válido.");
      return;
    }
    setEnviandoXml(true);
    try {
      const userId = getCurrentUserId();
      const response = await xmlLattes(file, tenant, userId);
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Currículo Lattes enviado com sucesso.",
        life: 5000,
      });
      onAtualizado({ temCvLattes: true, cvLattesUrl: response?.fileUrl ?? null });
    } catch (error) {
      const detail =
        error.response?.data?.message ||
        "Não foi possível enviar o currículo Lattes.";
      setFileError(detail);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail,
        life: 5000,
      });
    } finally {
      setEnviandoXml(false);
    }
  };

  const handleSimular = async () => {
    if (!recurso.participacaoId) return;
    setSimulando(true);
    try {
      const resultado = await simularFichaAvaliacaoParticipacao(
        tenant,
        recurso.participacaoId,
      );
      setSimulacao({
        notaAnterior: resultado.notaAnterior,
        notaNova: resultado.notaNova,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message ||
          "Não foi possível calcular a nova nota.",
        life: 5000,
      });
    } finally {
      setSimulando(false);
    }
  };

  const notaInferior =
    simulacao &&
    simulacao.notaAnterior !== null &&
    simulacao.notaNova < simulacao.notaAnterior;

  const handleConfirmarRecalculo = async () => {
    if (!recurso.participacaoId) return;
    setSalvando(true);
    try {
      const resultado = await gerarFichaAvaliacaoParticipacao(
        tenant,
        recurso.participacaoId,
        true,
      );
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Ficha de avaliação recalculada com sucesso.",
        life: 5000,
      });
      setSimulacao(null);
      onAtualizado({ fichaAvaliacao: resultado.fichaAvaliacao });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message ||
          "Não foi possível salvar a nova nota.",
        life: 5000,
      });
    } finally {
      setSalvando(false);
    }
  };

  const totalNotasExtras = (recurso.notasExtras || []).reduce(
    (soma, n) => soma + n.valor,
    0,
  );
  const notaFicha = recurso.fichaAvaliacao?.nota ?? 0;
  const notaFichaMax =
    recurso.fichaAvaliacao?.notaMax ?? recurso.perfil?.notaMax ?? 0;
  const notaTotalMax =
    (recurso.perfil?.notaMax ?? 0) + (recurso.perfil?.notaMaxExtra ?? 0);
  const notaTotal = notaFicha + totalNotasExtras;

  return (
    <>
      <Modal
        isOpen={modalItensAberto}
        onClose={() => setModalItensAberto(false)}
        size="large"
      >
        <h5 className="mb-2">Itens não contabilizados</h5>
        {loadingItens ? (
          <Skeleton />
        ) : (
          itensNaoContabilizados && (
            <GrupoItensNaoContabilizados grupo={itensNaoContabilizados} />
          )
        )}
      </Modal>

      <Modal
        isOpen={!!simulacao}
        onClose={() => setSimulacao(null)}
        size="small"
      >
        {simulacao && (
          <div className={styles.simulacaoModal}>
            <h5>Recalcular ficha de avaliação</h5>
            <div className={styles.simulacaoNotas}>
              <div>
                <span className={styles.simulacaoLabel}>
                  Nota atual do Lattes
                </span>
                <span className={styles.simulacaoValor}>
                  {simulacao.notaAnterior ?? "—"}
                </span>
              </div>
              <div>
                <span className={styles.simulacaoLabel}>
                  Nova nota calculada
                </span>
                <span className={styles.simulacaoValor}>
                  {simulacao.notaNova}
                </span>
              </div>
            </div>
            {notaInferior ? (
              <>
                <p className={styles.avisoBloqueio}>
                  A nova nota é menor que a nota atual — não é possível salvar.
                </p>
                <div className={styles.acoes}>
                  <Button
                    className="btn-secondary"
                    onClick={() => setSimulacao(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p>Deseja continuar e salvar a nova nota?</p>
                <div className={styles.acoes}>
                  <Button
                    className="btn-secondary"
                    onClick={() => setSimulacao(null)}
                    disabled={salvando}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="btn-primary"
                    onClick={handleConfirmarRecalculo}
                    loading={salvando}
                    disabled={salvando}
                  >
                    Confirmar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <div className={styles.resumoNotas}>
        <div className={styles.resumoItem}>
          <span className={styles.resumoLabel}>Ficha do Lattes</span>
          <span className={styles.resumoValor}>
            {notaFicha} / {notaFichaMax}
          </span>
        </div>
        <div className={styles.resumoItem}>
          <span className={styles.resumoLabel}>Notas extras</span>
          <span className={styles.resumoValor}>+{totalNotasExtras}</span>
        </div>
        <div className={`${styles.resumoItem} ${styles.resumoTotal}`}>
          <span className={styles.resumoLabel}>Nota total</span>
          <span className={styles.resumoValor}>
            {notaTotal} / {notaTotalMax}
          </span>
        </div>
      </div>

      <div className={styles.secao}>
        <div className={styles.secaoHeader}>
          <h6 className={styles.secaoTitulo}>
            Ficha de avaliação do currículo Lattes
          </h6>
          <Button
            className="btn-secondary"
            icon={RiEyeLine}
            onClick={handleVerItensNaoContabilizados}
          >
            Ver itens não contabilizados
          </Button>
        </div>
        {recurso.fichaAvaliacao ? (
          <GrupoAvaliacao grupo={recurso.fichaAvaliacao} nivel={0} />
        ) : (
          <p className={styles.avisoManual}>
            Nenhuma ficha de avaliação calculada ainda.
          </p>
        )}
      </div>

      <div className={styles.secao}>
        <h6 className={styles.secaoTitulo}>
          Recalcular a partir do currículo Lattes
        </h6>
        {ehAluno ? (
          <>
            {recurso.temCvLattes && recurso.cvLattesUrl && (
              <div className={styles.updateInfo}>
                <RiSave2Line />
                <span>
                  Última atualização:{" "}
                  {generateLattesText(recurso.cvLattesUrl).formattedDate} às{" "}
                  {generateLattesText(recurso.cvLattesUrl).formattedTime}
                </span>
              </div>
            )}
            <FileInput
              label={
                recurso.temCvLattes
                  ? "Atualizar Currículo Lattes"
                  : "Enviar pasta .ZIP do Currículo Lattes"
              }
              onFileSelect={handleUploadXml}
              disabled={enviandoXml}
              errorMessage={fileError}
            />
            {recurso.temCvLattes && (
              <div className={styles.acoes}>
                <Button
                  className="btn-primary"
                  icon={RiRefreshLine}
                  onClick={handleSimular}
                  loading={simulando}
                  disabled={simulando}
                >
                  Recalcular
                </Button>
              </div>
            )}

            {/* Guia passo a passo — mesmo conteúdo de EditarParticipacao.jsx */}
            <Card className={styles.guideCard}>
              <div className={styles.guideHeader}>
                <h4>Como enviar ou atualizar seu Currículo Lattes</h4>
                <p className={styles.guideSubtitle}>
                  Siga os passos abaixo para exportar e enviar seu CV Lattes
                  em formato XML/ZIP
                </p>
              </div>

              <div className={styles.stepsList}>
                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepContent}>
                    <p>Acesse a plataforma Lattes</p>
                    <a
                      href="https://lattes.cnpq.br/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.stepLink}
                    >
                      <div className={styles.stepLogo}>
                        <Image
                          fill
                          src="/image/cnpqLogoMini.png"
                          alt="CNPq Logo"
                          sizes="24 24 700"
                        />
                      </div>
                      lattes.cnpq.br
                      <RiExternalLinkLine size={14} />
                    </a>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepContent}>
                    <p>Cadastre ou atualize seu currículo</p>
                    <div className={styles.stepActions}>
                      <a
                        href="https://wwws.cnpq.br/cvlattesweb/pkg_cv_estr.inicio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.stepLink}
                      >
                        Cadastrar novo currículo
                      </a>
                      <span className={styles.stepSeparator}>ou</span>
                      <a
                        href="https://lattes.cnpq.br/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.stepLink}
                      >
                        Atualizar currículo existente
                      </a>
                    </div>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepContent}>
                    <p>
                      Na página do seu currículo Lattes, clique em &quot;Exportar&quot;
                    </p>
                    <div className={styles.stepImage}>
                      <Image
                        fill
                        src="/image/printLattesExportar.png"
                        alt="Botão exportar no Lattes"
                        sizes="100 100 700"
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepContent}>
                    <p>
                      Selecione o formato <strong>XML</strong> e faça o
                      download
                    </p>
                    <div className={styles.fileFormatBadge}>
                      Será feito o download de uma pasta com o formato: .ZIP
                      ou um arquivo no formato .XML.
                    </div>
                  </div>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepNumber}>5</div>
                  <div className={styles.stepContent}>
                    <p>Faça o upload da pasta .ZIP ou do arquivo .XML</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Vídeos tutoriais — mesmo conteúdo de EditarParticipacao.jsx (aluno) */}
            <Card className={styles.tutoriaisCard}>
              <div className={styles.tutoriaisHeader}>
                <div className={styles.tutoriaisIcon}>
                  <RiYoutubeLine size={20} />
                </div>
                <div>
                  <h4>Vídeos Tutoriais</h4>
                  <p className={styles.tutoriaisSubtitle}>
                    Aprenda como cadastrar atividades no seu Currículo Lattes
                  </p>
                </div>
              </div>

              <div className={styles.tutoriaisList}>
                <a
                  href="https://www.youtube.com/watch?v=gTfFHQXoRQQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.tutorialItem}
                >
                  <div className={styles.tutorialIconWrapper}>
                    <RiFlaskLine size={18} />
                  </div>
                  <div className={styles.tutorialContent}>
                    <span className={styles.tutorialTitle}>
                      Como inserir Iniciação Científica no Lattes
                    </span>
                    <span className={styles.tutorialPlatform}>
                      YouTube
                      <RiExternalLinkLine size={12} />
                    </span>
                  </div>
                </a>

                <a
                  href="https://www.youtube.com/watch?v=7Ir-Ee1GPDc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.tutorialItem}
                >
                  <div className={styles.tutorialIconWrapper}>
                    <RiUserStarLine size={18} />
                  </div>
                  <div className={styles.tutorialContent}>
                    <span className={styles.tutorialTitle}>
                      Como inserir Monitoria no Lattes
                    </span>
                    <span className={styles.tutorialPlatform}>
                      YouTube
                      <RiExternalLinkLine size={12} />
                    </span>
                  </div>
                </a>

                <a
                  href="https://www.youtube.com/watch?v=BmMuhb_wm-Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.tutorialItem}
                >
                  <div className={styles.tutorialIconWrapper}>
                    <RiCommunityLine size={18} />
                  </div>
                  <div className={styles.tutorialContent}>
                    <span className={styles.tutorialTitle}>
                      Como inserir projetos de extensão no Lattes
                    </span>
                    <span className={styles.tutorialPlatform}>
                      YouTube
                      <RiExternalLinkLine size={12} />
                    </span>
                  </div>
                </a>
              </div>

              <div className={styles.tutoriaisFooter}>
                <RiYoutubeLine size={14} />
                <span>
                  Clique nos links acima para abrir os tutoriais no YouTube
                </span>
              </div>
            </Card>
          </>
        ) : !recurso.temCvLattes ? (
          <FileInput
            label="Enviar pasta .ZIP do Currículo Lattes"
            onFileSelect={handleUploadXml}
            disabled={enviandoXml}
            errorMessage={fileError}
          />
        ) : (
          <>
            <p className={styles.notasHint}>
              Você já possui um currículo Lattes cadastrado. Não é possível
              enviar um novo — apenas recalcular a nota a partir do que já foi
              enviado.
            </p>
            <div className={styles.acoes}>
              <Button
                className="btn-primary"
                icon={RiRefreshLine}
                onClick={handleSimular}
                loading={simulando}
                disabled={simulando}
              >
                Recalcular
              </Button>
            </div>
          </>
        )}
      </div>

      <div className={styles.secao}>
        <h6 className={styles.secaoTitulo}>Notas extras</h6>
        {recurso.notasExtras?.length > 0 ? (
          <>
            {recurso.notasExtras.map((nota) => (
              <p key={nota.id} className={styles.notaExtraItem}>
                +{nota.valor} pt{nota.valor === 1 ? "" : "s"}
                {nota.observacao ? ` — ${nota.observacao}` : ""}
              </p>
            ))}
            <p className={styles.notasHint}>
              Total em notas extras: +{totalNotasExtras}
            </p>
          </>
        ) : (
          <p className={styles.avisoManual}>Nenhuma nota extra registrada.</p>
        )}
        <p className={styles.notasHint}>
          Não é possível abrir recurso para notas extras.
        </p>
      </div>
    </>
  );
};

const Page = ({ params }) => {
  const router = useRouter();
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [recurso, setRecurso] = useState(null);
  const requestIdRef = useRef(0);

  const fetchDetalhe = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getRecursoDetalhe(
        params.tenant,
        params.planoId,
        params.tipoNota,
      );
      if (requestId !== requestIdRef.current) return; // resposta de uma troca de aba anterior, já obsoleta
      setRecurso(data);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      const detail =
        error.response?.data?.message ||
        "Não foi possível abrir esta página de recurso.";
      toast.current?.show({
        severity: "warn",
        summary: "Recurso não disponível",
        detail,
        life: 4000,
      });
      router.replace(`/${params.tenant}/user/resultados-recursos`);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalhe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tenant, params.planoId, params.tipoNota]);

  const labelNota = LABELS_NOTA[params.tipoNota] ?? "Nota";

  return (
    <div className={styles.navContent}>
      <Toast ref={toast} position="top-right" />
      <div className={styles.content}>
        <Link
          href={`/${params.tenant}/user/resultados-recursos`}
          className={styles.voltar}
        >
          <RiArrowLeftLine />
          Voltar para Resultados e Recursos
        </Link>

        <div className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.eyebrow}>Recurso</span>
            <h6>Nota de {labelNota}</h6>
          </div>
        </div>

        <SuporteWhatsapp
          nome={getCurrentUserNome()}
          cpf={recurso?.cpfSolicitante}
          planoId={params.planoId}
          labelNota={labelNota}
          titulo={recurso?.titulo}
        />

        {loading ? (
          <Skeleton />
        ) : recurso ? (
          EH_PROJETO_OU_PLANO(params.tipoNota) ? (
            <RecursoProjetoPlano
              recurso={recurso}
              tenant={params.tenant}
              planoId={params.planoId}
              tipoNota={params.tipoNota}
              toast={toast}
              onEnviado={fetchDetalhe}
            />
          ) : (
            <RecursoParticipacao
              recurso={recurso}
              tenant={params.tenant}
              tipoNota={params.tipoNota}
              toast={toast}
              onAtualizado={(patch) =>
                setRecurso((prev) => ({ ...prev, ...patch }))
              }
            />
          )
        ) : null}
      </div>
    </div>
  );
};

export default Page;

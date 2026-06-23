"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.scss";
import {
  RiAwardLine,
  RiBookOpenLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiExternalLinkLine,
  RiFileTextLine,
  RiFlaskLine,
  RiFolder3Line,
  RiGroupLine,
  RiPrinterLine,
  RiTimeLine,
  RiUser3Line,
} from "@remixicon/react";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import NoData from "@/components/NoData";
import Button from "@/components/Button";
import { ProgressSpinner } from "primereact/progressspinner";
import BlockNoteContent from "@/components/BlockNoteContent";

// ─── Field value renderer ─────────────────────────────────────────────────────
const extractFileName = (url) => {
  if (!url) return "";
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  // strip leading timestamp_
  const withoutTs = last.replace(/^\d+_/, "");
  return withoutTs || last;
};

const FieldValue = ({ tipo, value }) => {
  if (!value || value === "") return <span className={styles.emptyValue}>—</span>;

  switch (tipo) {
    case "blockNote":
      return <BlockNoteContent value={value} />;
    case "arquivo":
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
          <RiFileTextLine size={13} />
          {extractFileName(value)}
          <RiExternalLinkLine size={11} />
        </a>
      );
    case "link":
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
          {value}
          <RiExternalLinkLine size={11} />
        </a>
      );
    case "checkbox":
    case "flag":
      return (
        <span className={value === "true" ? styles.boolTrue : styles.boolFalse}>
          {value === "true" ? "Sim" : "Não"}
        </span>
      );
    default:
      return <span className={styles.textValue}>{value}</span>;
  }
};

// ─── Respostas grid (used for projeto + plano responses) ─────────────────────
const RespostasSection = ({ respostas }) => {
  if (!respostas?.length) return null;
  const sorted = [...respostas].sort(
    (a, b) => (a.campo?.ordem ?? 999) - (b.campo?.ordem ?? 999)
  );
  return (
    <div className={styles.respostasGrid}>
      {sorted.map((r) => (
        <div
          key={r.id}
          className={`${styles.fieldBlock} ${
            r.campo?.tipo === "blockNote" || r.campo?.tipo === "textLong"
              ? styles.fullWidth
              : ""
          }`}
        >
          <span className={styles.fieldLabel}>{r.campo?.label ?? r.label ?? "Campo"}</span>
          <div className={styles.fieldValue}>
            <FieldValue tipo={r.campo?.tipo ?? "text"} value={r.value} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Ficha de Avaliação renderer ──────────────────────────────────────────────
const GrupoDisplay = ({ grupo, nivel = 0 }) => {
  const indentClass =
    nivel === 0
      ? styles.faGrupoPrincipal
      : nivel === 1
      ? styles.faGrupoSecundario
      : styles.faGrupoTerciario;

  return (
    <div className={`${styles.faGrupo} ${indentClass}`}>
      <div className={styles.faGrupoHeader}>
        <span className={styles.faGrupoLabel}>{grupo.label}</span>
        <span className={styles.faGrupoNota}>
          {grupo.nota ?? 0}
          <span className={styles.faGrupoNotaMax}> / {grupo.notaMax ?? 0} pts</span>
        </span>
      </div>

      {grupo.respostaCampos?.length > 0 && (
        <div className={styles.faItens}>
          {grupo.respostaCampos.map((item, idx) => (
            <div key={idx} className={styles.faItem}>
              <div className={styles.faItemHeader}>
                <span className={styles.faItemIndex}>Item {idx + 1}</span>
                {(grupo.notaPorItem != null || grupo.nota != null) && (
                  <span className={styles.faItemNota}>
                    +{grupo.notaPorItem ?? (grupo.nota / grupo.respostaCampos.length).toFixed(1)} pts
                  </span>
                )}
              </div>
              <div className={styles.faItemCampos}>
                {item
                  .filter((c) => c.value !== undefined && c.value !== null && c.value !== "")
                  .map((c, ci) => (
                    <div key={ci} className={styles.faItemCampo}>
                      <span className={styles.faItemCampoLabel}>{c.label}</span>
                      <span className={styles.faItemCampoValue}>
                        {typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {grupo.grupos?.length > 0 && (
        <div className={styles.faSubgrupos}>
          {grupo.grupos.map((sub, i) => (
            <GrupoDisplay key={i} grupo={sub} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const FichaAvaliacaoDisplay = ({ ficha }) => {
  if (!ficha) return null;
  return (
    <div className={styles.fichaAvaliacao}>
      <div className={styles.fichaHeader}>
        <RiAwardLine size={14} />
        <span className={styles.fichaHeaderLabel}>{ficha.label ?? "Ficha de Avaliação"}</span>
        <span className={styles.fichaNota}>
          {ficha.nota ?? 0}
          <span className={styles.fichaNotaMax}> / {ficha.notaMax ?? 0} pts</span>
        </span>
      </div>
      {ficha.grupos?.length > 0 && (
        <div className={styles.fichaGrupos}>
          {ficha.grupos.map((g, i) => (
            <GrupoDisplay key={i} grupo={g} nivel={0} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Cronograma table ─────────────────────────────────────────────────────────
const Cronograma = ({ items, titulo }) => {
  if (!items?.length) return null;
  const sorted = [...items].sort((a, b) =>
    (a.inicio ?? "").localeCompare(b.inicio ?? "")
  );
  return (
    <div className={styles.cronogramaBlock}>
      <div className={styles.cronogramaHeader}>
        <RiCalendarLine size={14} />
        <span>{titulo}</span>
      </div>
      <table className={styles.cronogramaTable}>
        <thead>
          <tr>
            <th>Início</th>
            <th>Fim</th>
            <th>Atividade</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a, i) => (
            <tr key={i}>
              <td className={styles.tdDate}>{a.inicio}</td>
              <td className={styles.tdDate}>{a.fim}</td>
              <td>{a.atividade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Ética / regulamentações ──────────────────────────────────────────────────
const flagLabel = (value, label) =>
  value ? (
    <span className={styles.eticaFlag}>{label}</span>
  ) : null;

const EticaSection = ({ projeto }) => {
  const {
    envolveHumanos, envolveAnimais, envolveOGM, envolvePatrimonioGenetico,
    submetidoComiteEtica, numeroProtocoloEtica, numeroCEPCONEP, numeroSISGEN,
    financiamentoExterno, parceriaComEmpresa, execucaoExterna, requerMaterial,
    AnexoProjeto = [],
  } = projeto;

  const temEtica =
    envolveHumanos || envolveAnimais || envolveOGM || envolvePatrimonioGenetico ||
    submetidoComiteEtica || numeroCEPCONEP || numeroSISGEN;
  const temOutros =
    financiamentoExterno || parceriaComEmpresa || execucaoExterna || requerMaterial;
  const temAnexos = AnexoProjeto?.length > 0;

  if (!temEtica && !temOutros && !temAnexos) return null;

  return (
    <div className={styles.eticaBlock}>
      <div className={styles.eticaHeader}>
        <RiFlaskLine size={14} />
        <span>Ética e Regulamentações</span>
      </div>
      <div className={styles.eticaBody}>
        {temEtica && (
          <div className={styles.eticaRow}>
            <span className={styles.eticaRowLabel}>Envolvimento</span>
            <div className={styles.eticaFlags}>
              {flagLabel(envolveHumanos, "Seres humanos")}
              {flagLabel(envolveAnimais, "Animais")}
              {flagLabel(envolveOGM, "OGM")}
              {flagLabel(envolvePatrimonioGenetico, "Patrimônio genético")}
              {flagLabel(submetidoComiteEtica, "Submetido a comitê de ética")}
            </div>
          </div>
        )}
        {(numeroProtocoloEtica || numeroCEPCONEP || numeroSISGEN) && (
          <div className={styles.eticaRow}>
            <span className={styles.eticaRowLabel}>Protocolos</span>
            <div className={styles.eticaMetas}>
              {numeroProtocoloEtica && (
                <span className={styles.eticaMeta}>
                  <span className={styles.eticaMetaLabel}>Protocolo Ética</span>
                  <span className={styles.eticaMetaValue}>{numeroProtocoloEtica}</span>
                </span>
              )}
              {numeroCEPCONEP && (
                <span className={styles.eticaMeta}>
                  <span className={styles.eticaMetaLabel}>CEP/CONEP</span>
                  <span className={styles.eticaMetaValue}>{numeroCEPCONEP}</span>
                </span>
              )}
              {numeroSISGEN && (
                <span className={styles.eticaMeta}>
                  <span className={styles.eticaMetaLabel}>SISGEN</span>
                  <span className={styles.eticaMetaValue}>{numeroSISGEN}</span>
                </span>
              )}
            </div>
          </div>
        )}
        {temOutros && (
          <div className={styles.eticaRow}>
            <span className={styles.eticaRowLabel}>Informações adicionais</span>
            <div className={styles.eticaFlags}>
              {flagLabel(financiamentoExterno, "Financiamento externo")}
              {flagLabel(parceriaComEmpresa, "Parceria com empresa")}
              {flagLabel(execucaoExterna, "Execução externa à instituição")}
              {flagLabel(requerMaterial, "Requer material")}
            </div>
          </div>
        )}
        {temAnexos && (
          <div className={styles.eticaRow}>
            <span className={styles.eticaRowLabel}>Anexos</span>
            <div className={styles.eticaAnexos}>
              {AnexoProjeto.map((a) => (
                <a
                  key={a.id}
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.fileLink}
                >
                  <RiFileTextLine size={13} />
                  {a.nomeAnexo || extractFileName(a.link)}
                  <RiExternalLinkLine size={11} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Respostas de participação ─────────────────────────────────────────────────
const ParticipacaoRespostas = ({ respostas }) => {
  if (!respostas?.length) return null;
  const sorted = [...respostas].sort(
    (a, b) => (a.campo?.ordem ?? 999) - (b.campo?.ordem ?? 999)
  );
  return (
    <div className={styles.participacaoRespostas}>
      <div className={styles.respostasGrid}>
        {sorted.map((r) => (
          <div
            key={r.id}
            className={`${styles.fieldBlock} ${
              r.campo?.tipo === "blockNote" || r.campo?.tipo === "textLong"
                ? styles.fullWidth
                : ""
            }`}
          >
            <span className={styles.fieldLabel}>{r.campo?.label ?? r.label ?? "Campo"}</span>
            <div className={styles.fieldValue}>
              <FieldValue tipo={r.campo?.tipo ?? "text"} value={r.value} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [inscricao, setInscricao] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const documentRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getInscricaoUserById(params.tenant, params.idInscricao);
        setInscricao(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idInscricao]);

  const generatePDF = async () => {
    if (!documentRef.current) return;
    setGeneratingPDF(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const totalH = (canvas.height / canvas.width) * pdfW;
      const imgData = canvas.toDataURL("image/jpeg", 0.97);

      pdf.addImage(imgData, "JPEG", 0, 0, pdfW, totalH);
      let remaining = totalH - pdfH;
      let offset = -pdfH;
      while (remaining > 0) {
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, offset, pdfW, totalH);
        offset -= pdfH;
        remaining -= pdfH;
      }

      const proto = String(inscricao.id).padStart(6, "0");
      pdf.save(`comprovante-${proto}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <ProgressSpinner style={{ width: "40px", height: "40px" }} />
        <p>Carregando comprovante...</p>
      </div>
    );

  if (notFound) return <NoData description="Inscrição não encontrada :/" />;
  if (!inscricao?.edital) return null;

  const { edital, participacoes = [], planosDeTrabalho = [], InscricaoProjeto = [] } = inscricao;
  const orientadores = participacoes.filter((p) => p.tipo === "orientador");
  const coorientadores = participacoes.filter((p) => p.tipo === "coorientador");
  const protocolo = String(inscricao.id).padStart(6, "0");

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <Button
          icon={RiPrinterLine}
          onClick={generatePDF}
          disabled={generatingPDF}
        >
          {generatingPDF ? "Gerando PDF..." : "Baixar PDF"}
        </Button>
      </div>

      <div className={styles.document} ref={documentRef}>
        {/* ── Document header ── */}
        <div className={styles.docHeader}>
          <div className={styles.docHeaderLeft}>
            <p className={styles.docPrograma}>Programa de Iniciação Científica</p>
            <h2 className={styles.docEdital}>{edital.titulo}</h2>
            <p className={styles.docAno}>Ano: {edital.ano}</p>
          </div>
          <div className={styles.docHeaderRight}>
            <div className={styles.protocolBox}>
              <span className={styles.protocolLabel}>Protocolo</span>
              <span className={styles.protocolValue}>#{protocolo}</span>
            </div>
            <div
              className={`${styles.statusBadge} ${
                inscricao.status === "enviada" ? styles.statusEnviada : styles.statusRascunho
              }`}
            >
              {inscricao.status === "enviada" ? (
                <>
                  <RiCheckboxCircleLine size={14} /> Enviada
                </>
              ) : (
                <>
                  <RiTimeLine size={14} /> Em elaboração
                </>
              )}
            </div>
          </div>
        </div>
        <div className={styles.docTitleBar}>
          <h1>Comprovante de Inscrição</h1>
        </div>

        {/* ── Orientadores ── */}
        {orientadores.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <RiUser3Line size={17} />
              <h3>Orientador{orientadores.length > 1 ? "es" : ""}</h3>
            </div>
            <div className={styles.participanteList}>
              {orientadores.map((o) => (
                <div key={o.id} className={`${styles.participanteCard} ${o.fichaAvaliacao ? styles.participanteCardWithFicha : ""}`}>
                  <div className={styles.participanteInfo}>
                    <span className={styles.participanteNome}>{o.user.nome}</span>
                    <span className={styles.participanteCpf}>CPF: {o.user.cpf}</span>
                    {o.user.cvLattes?.length > 0 && (
                      <a
                        href={o.user.cvLattes[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.lattesLink}
                      >
                        Currículo Lattes <RiExternalLinkLine size={11} />
                      </a>
                    )}
                  </div>
                  <ParticipacaoRespostas respostas={o.respostas} />
                  {o.fichaAvaliacao && (
                    <FichaAvaliacaoDisplay ficha={o.fichaAvaliacao} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Coorientadores ── */}
        {coorientadores.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <RiUser3Line size={17} />
              <h3>Coorientador{coorientadores.length > 1 ? "es" : ""}</h3>
            </div>
            <div className={styles.participanteList}>
              {coorientadores.map((c) => (
                <div key={c.id} className={`${styles.participanteCard} ${c.fichaAvaliacao ? styles.participanteCardWithFicha : ""}`}>
                  <div className={styles.participanteInfo}>
                    <span className={styles.participanteNome}>{c.user.nome}</span>
                    <span className={styles.participanteCpf}>CPF: {c.user.cpf}</span>
                  </div>
                  <ParticipacaoRespostas respostas={c.respostas} />
                  {c.fichaAvaliacao && (
                    <FichaAvaliacaoDisplay ficha={c.fichaAvaliacao} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Projetos ── */}
        {InscricaoProjeto.map((ip, pi) => {
          const { projeto } = ip;
          const planos = planosDeTrabalho.filter(
            (p) =>
              p.inscricaoProjeto?.projeto?.id === projeto.id ||
              p.projetoId === projeto.id
          );

          return (
            <section key={ip.id} className={`${styles.section} ${styles.projetoSection}`}>
              <div className={styles.sectionHeader}>
                <RiFolder3Line size={17} />
                <h3>Projeto {pi + 1}</h3>
              </div>

              <div className={styles.projetoCard}>
                {/* Meta */}
                <div className={styles.metaRow}>
                  <div className={styles.metaBlock}>
                    <span className={styles.metaLabel}>Título</span>
                    <span className={styles.metaValueStrong}>{projeto.titulo}</span>
                  </div>
                  {projeto.area && (
                    <div className={styles.metaBlock}>
                      <span className={styles.metaLabel}>Área</span>
                      <span className={styles.metaValue}>
                        {projeto.area.grandeArea?.grandeArea
                          ? `${projeto.area.grandeArea.grandeArea} — `
                          : ""}
                        {projeto.area.area}
                      </span>
                    </div>
                  )}
                </div>

                {/* Respostas do projeto */}
                <RespostasSection respostas={projeto.Resposta} />

                {/* Cronograma do projeto */}
                <Cronograma items={projeto.CronogramaProjeto} titulo="Cronograma do Projeto" />

                {/* Ética e regulamentações */}
                <EticaSection projeto={projeto} />

                {/* Planos de Trabalho */}
                {planos.map((plano, pli) => {
                  const alunos = plano.participacoes?.filter((p) => p.tipo === "aluno") ?? [];
                  const remunerados = alunos.filter((a) => a.solicitarBolsa === true);
                  const voluntarios = alunos.filter((a) => a.solicitarBolsa !== true);

                  return (
                    <div key={plano.id} className={styles.planoCard}>
                      <div className={styles.planoTitleBar}>
                        <RiBookOpenLine size={15} />
                        <span>Plano de Trabalho {pi + 1}.{pli + 1}</span>
                        {plano.categoria && (
                          <span
                            className={`${styles.categoriaPill} ${
                              plano.categoria === "REMUNERADO"
                                ? styles.catRemunerado
                                : styles.catVoluntario
                            }`}
                          >
                            {plano.categoria === "REMUNERADO" ? "Remunerado" : "Voluntário"}
                          </span>
                        )}
                      </div>

                      {/* Meta do plano */}
                      <div className={styles.metaRow}>
                        <div className={styles.metaBlock}>
                          <span className={styles.metaLabel}>Título</span>
                          <span className={styles.metaValueStrong}>{plano.titulo}</span>
                        </div>
                        {plano.area && (
                          <div className={styles.metaBlock}>
                            <span className={styles.metaLabel}>Área</span>
                            <span className={styles.metaValue}>
                              {plano.area.grandeArea?.grandeArea
                                ? `${plano.area.grandeArea.grandeArea} — `
                                : ""}
                              {plano.area.area}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Alunos */}
                      {alunos.length > 0 && (
                        <div className={styles.alunosBlock}>
                          {remunerados.length > 0 && (
                            <div className={styles.alunoGroup}>
                              <div className={styles.alunoGroupLabel}>
                                <RiAwardLine size={13} />
                                Bolsista{remunerados.length > 1 ? "s" : ""} / Remunerado{remunerados.length > 1 ? "s" : ""}
                              </div>
                              {remunerados.map((a) => (
                                <div key={a.id} className={`${styles.alunoRow} ${(a.fichaAvaliacao || a.respostas?.length) ? styles.alunoRowWithFicha : ""}`}>
                                  <div className={styles.alunoInfo}>
                                    <span className={styles.alunoNome}>{a.user.nome}</span>
                                    <span className={styles.alunoCpf}>CPF: {a.user.cpf}</span>
                                  </div>
                                  <ParticipacaoRespostas respostas={a.respostas} />
                                  {a.fichaAvaliacao && (
                                    <FichaAvaliacaoDisplay ficha={a.fichaAvaliacao} />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {voluntarios.length > 0 && (
                            <div className={styles.alunoGroup}>
                              <div className={styles.alunoGroupLabel}>
                                <RiGroupLine size={13} />
                                Voluntário{voluntarios.length > 1 ? "s" : ""}
                              </div>
                              {voluntarios.map((a) => (
                                <div key={a.id} className={`${styles.alunoRow} ${(a.fichaAvaliacao || a.respostas?.length) ? styles.alunoRowWithFicha : ""}`}>
                                  <div className={styles.alunoInfo}>
                                    <span className={styles.alunoNome}>{a.user.nome}</span>
                                    <span className={styles.alunoCpf}>CPF: {a.user.cpf}</span>
                                  </div>
                                  <ParticipacaoRespostas respostas={a.respostas} />
                                  {a.fichaAvaliacao && (
                                    <FichaAvaliacaoDisplay ficha={a.fichaAvaliacao} />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Respostas do plano */}
                      <RespostasSection respostas={plano.Resposta} />

                      {/* Cronograma do plano */}
                      <Cronograma
                        items={plano.CronogramaPlanoDeTrabalho}
                        titulo="Cronograma do Plano de Trabalho"
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* ── Rodapé ── */}
        <div className={styles.docFooter}>
          <p>
            Documento gerado pelo Sistema de Iniciação Científica — Protocolo #{protocolo}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;

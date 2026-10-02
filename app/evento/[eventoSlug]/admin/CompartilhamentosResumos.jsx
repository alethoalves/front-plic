"use client";
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Checkbox } from "primereact/checkbox";
import {
  RiCheckLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiFileExcelLine,
  RiLinkM,
  RiShareLine,
} from "@remixicon/react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import {
  criarCompartilhamentoResumos,
  getOpcoesCompartilhamentoResumos,
  listarCompartilhamentosResumos,
  listarFeedbacksCompartilhamento,
  previaCompartilhamentoResumos,
  revogarCompartilhamentoResumos,
  urlCompartilhamentoResumos,
} from "@/app/api/client/compartilhamentoResumos";
import {
  COMENTARIO_OPCOES,
  EXIBICAO_OPCOES,
  PREMIACAO_OPCOES,
  descreverFiltros,
} from "@/lib/compartilhamentoResumos";
import styles from "./CompartilhamentosResumos.module.scss";

// Links públicos (token, 60 dias) de "Resumos + Avaliações" — substituem o
// antigo download .html, que depois de enviado ficava fora do controle do admin.

const copiar = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
};

const formatarData = (d) => (d ? new Date(d).toLocaleDateString("pt-BR") : "—");

// ─── Modal "Novo link": configura e gera um link ─────────────────────────────

// instituicoes: [{ label, tenantSlug? , instituicaoParceiraId? }] — recortes possíveis
const GerarLinkCompartilhamento = ({ eventoSlug, instituicoes = [], onGerado }) => {
  const opcoesInstituicao = [
    { label: "Evento inteiro (todas as instituições)", value: "" },
    ...instituicoes.map((i) => ({
      label: i.label,
      value: i.instituicaoParceiraId ? `p:${i.instituicaoParceiraId}` : `t:${i.tenantSlug}`,
    })),
  ];
  const [instituicao, setInstituicao] = useState("");
  const [rotulo, setRotulo] = useState("");
  const [premiacao, setPremiacao] = useState([]);
  const [opcoesAreas, setOpcoesAreas] = useState({ grandeAreas: [], areas: [] });
  const [grandeAreas, setGrandeAreas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [comentario, setComentario] = useState(null);
  const [notaMin, setNotaMin] = useState(null);
  const [notaMax, setNotaMax] = useState(null);
  const [exibicaoComentarios, setExibicaoComentarios] = useState("AMBOS");
  const [permitirFeedback, setPermitirFeedback] = useState(false);

  const [total, setTotal] = useState(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(null);
  const [link, setLink] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const filtros = { premiacao, grandeAreas, areas, comentario, notaMin, notaMax };
  const recorte = {
    tenantSlug: instituicao.startsWith("t:") ? instituicao.slice(2) : undefined,
    instituicaoParceiraId: instituicao.startsWith("p:") ? Number(instituicao.slice(2)) : undefined,
  };

  // Prévia: quantos trabalhos o link mostraria (debounce para não disparar a cada tecla)
  useEffect(() => {
    let cancelado = false;
    setTotal(null);
    const timer = setTimeout(async () => {
      try {
        const n = await previaCompartilhamentoResumos(eventoSlug, { ...recorte, filtros });
        if (!cancelado) setTotal(n);
      } catch {
        if (!cancelado) setTotal(null);
      }
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    eventoSlug,
    recorte.tenantSlug,
    recorte.instituicaoParceiraId,
    premiacao,
    grandeAreas,
    areas,
    comentario,
    notaMin,
    notaMax,
  ]);

  // Opções de área/grande área: só as que têm trabalhos no evento
  useEffect(() => {
    getOpcoesCompartilhamentoResumos(eventoSlug)
      .then((dados) => setOpcoesAreas({ grandeAreas: dados.grandeAreas || [], areas: dados.areas || [] }))
      .catch((error) => console.error("Erro ao carregar áreas:", error));
  }, [eventoSlug]);

  // Com grandes áreas escolhidas, a lista de áreas se restringe a elas
  const areasDisponiveis = grandeAreas.length
    ? opcoesAreas.areas.filter((a) => grandeAreas.includes(a.grandeAreaId))
    : opcoesAreas.areas;

  const handleGrandeAreas = (selecionadas) => {
    setGrandeAreas(selecionadas);
    if (selecionadas.length) {
      const permitidas = new Set(
        opcoesAreas.areas.filter((a) => selecionadas.includes(a.grandeAreaId)).map((a) => a.id)
      );
      setAreas((atual) => atual.filter((id) => permitidas.has(id)));
    }
  };

  const togglePremiacao = (valor, marcado) =>
    setPremiacao((atual) => (marcado ? [...atual, valor] : atual.filter((p) => p !== valor)));

  const handleGerar = async () => {
    setGerando(true);
    setErro(null);
    try {
      const novo = await criarCompartilhamentoResumos(eventoSlug, {
        ...recorte,
        rotulo,
        filtros,
        exibicaoComentarios,
        permitirFeedback,
      });
      setLink(novo);
      onGerado?.();
    } catch (error) {
      setErro(error?.response?.data?.message || "Erro ao gerar o link.");
    } finally {
      setGerando(false);
    }
  };

  const handleCopiar = async () => {
    if (await copiar(urlCompartilhamentoResumos(link.token))) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  if (link) {
    return (
      <div className={styles.gerar}>
        <p className={styles.label}>Link gerado (válido até {formatarData(link.validade)})</p>
        <div className={styles.urlBox}>
          <span className={styles.url}>{urlCompartilhamentoResumos(link.token)}</span>
        </div>
        <Button
          onClick={handleCopiar}
          icon={copiado ? RiCheckLine : RiFileCopyLine}
          className="btn-primary mt-1"
          type="button"
        >
          {copiado ? "Copiado!" : "Copiar link"}
        </Button>
        <p className={`${styles.ajuda} mt-1`}>
          Você pode revogar este link a qualquer momento em &quot;Links compartilhados&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.gerar}>
      <label className={styles.label} htmlFor="instituicaoCompartilhamento">
        Instituição
      </label>
      <Dropdown
        inputId="instituicaoCompartilhamento"
        className={styles.input}
        value={instituicao}
        options={opcoesInstituicao}
        optionLabel="label"
        optionValue="value"
        onChange={(e) => setInstituicao(e.value ?? "")}
        filter={opcoesInstituicao.length > 8}
      />

      <label className={`${styles.label} mt-2`} htmlFor="rotuloCompartilhamento">
        Rótulo (opcional)
      </label>
      <InputText
        id="rotuloCompartilhamento"
        className={styles.input}
        value={rotulo}
        maxLength={120}
        onChange={(e) => setRotulo(e.target.value)}
        placeholder="Ex.: Comissão de premiação"
      />

      <span className={`${styles.label} mt-2`}>Premiação (ao menos uma)</span>
      <div className={styles.checks}>
        {PREMIACAO_OPCOES.map((o) => (
          <label key={o.value} className={styles.check}>
            <Checkbox
              checked={premiacao.includes(o.value)}
              onChange={(e) => togglePremiacao(o.value, e.checked)}
            />
            {o.label}
          </label>
        ))}
      </div>

      <label className={`${styles.label} mt-2`} htmlFor="filtroGrandeAreas">
        Grande área
      </label>
      <MultiSelect
        inputId="filtroGrandeAreas"
        className={styles.input}
        value={grandeAreas}
        options={opcoesAreas.grandeAreas}
        optionLabel="nome"
        optionValue="id"
        onChange={(e) => handleGrandeAreas(e.value || [])}
        placeholder="Todas as grandes áreas"
        display="chip"
        filter
      />

      <label className={`${styles.label} mt-2`} htmlFor="filtroAreas">
        Área
      </label>
      <MultiSelect
        inputId="filtroAreas"
        className={styles.input}
        value={areas}
        options={areasDisponiveis}
        optionLabel="nome"
        optionValue="id"
        onChange={(e) => setAreas(e.value || [])}
        placeholder={grandeAreas.length ? "Todas as áreas das grandes áreas escolhidas" : "Todas as áreas"}
        display="chip"
        filter
      />

      <label className={`${styles.label} mt-2`} htmlFor="filtroComentario">
        Comentário dos avaliadores
      </label>
      <Dropdown
        inputId="filtroComentario"
        className={styles.input}
        value={comentario}
        options={COMENTARIO_OPCOES}
        optionLabel="label"
        optionValue="value"
        onChange={(e) => setComentario(e.value ?? null)}
      />

      <span className={`${styles.label} mt-2`}>Faixa de nota final</span>
      <div className={styles.faixa}>
        <InputNumber
          className={styles.input}
          inputClassName={styles.input}
          value={notaMin}
          onValueChange={(e) => setNotaMin(e.value)}
          placeholder="Mínima"
          mode="decimal"
          maxFractionDigits={2}
          locale="pt-BR"
        />
        <span>até</span>
        <InputNumber
          className={styles.input}
          inputClassName={styles.input}
          value={notaMax}
          onValueChange={(e) => setNotaMax(e.value)}
          placeholder="Máxima"
          mode="decimal"
          maxFractionDigits={2}
          locale="pt-BR"
        />
      </div>

      <label className={`${styles.label} mt-2`} htmlFor="exibicaoComentarios">
        Comentários exibidos no link
      </label>
      <Dropdown
        inputId="exibicaoComentarios"
        className={styles.input}
        value={exibicaoComentarios}
        options={EXIBICAO_OPCOES}
        optionLabel="label"
        optionValue="value"
        onChange={(e) => setExibicaoComentarios(e.value ?? "AMBOS")}
      />

      <label className={`${styles.check} mt-2`}>
        <Checkbox checked={permitirFeedback} onChange={(e) => setPermitirFeedback(e.checked)} />
        Quem acessar pode avaliar cada trabalho (estrelas + comentário, visíveis a todos com o link)
      </label>

      <p className={`${styles.previa} mt-2`}>
        {total == null
          ? "Calculando trabalhos..."
          : `${total} ${total === 1 ? "trabalho atende" : "trabalhos atendem"} a esses critérios hoje.`}
      </p>

      <Button
        onClick={handleGerar}
        icon={RiLinkM}
        className="btn-secondary mt-1"
        type="button"
        loading={gerando}
        disabled={total === 0}
        title={total === 0 ? "Nenhum trabalho atende aos filtros" : undefined}
      >
        Gerar link (válido por 60 dias)
      </Button>
      {erro && <p className={`${styles.erro} mt-1`}>{erro}</p>}
    </div>
  );
};

// Botão do cabeçalho da seção "Links compartilhados" + modal de geração
export const NovoLinkCompartilhamento = ({ eventoSlug, instituicoes, onGerado }) => {
  const [aberto, setAberto] = useState(false);
  return (
    <div className={styles.novoLink}>
      <Button onClick={() => setAberto(true)} icon={RiShareLine} className="btn-secondary" type="button">
        Novo link
      </Button>
      <Modal isOpen={aberto} onClose={() => setAberto(false)}>
        <h4>Compartilhar Resumos + Avaliações</h4>
        <p className="mb-2">Escolha o que o link vai mostrar. Ele expira em 60 dias.</p>
        {aberto && (
          <GerarLinkCompartilhamento eventoSlug={eventoSlug} instituicoes={instituicoes} onGerado={onGerado} />
        )}
      </Modal>
    </div>
  );
};

// ─── Painel do dashboard: lista, exporta feedbacks e revoga links ────────────

const STATUS_LABEL = { ATIVO: "Ativo", EXPIRADO: "Expirado", REVOGADO: "Revogado" };
const EXIBICAO_CURTA = { AMBOS: "original e IA", DEPURADO: "só IA", ORIGINAL: "só original", NENHUM: "ocultos" };

const exportarFeedbacks = async (eventoSlug, link) => {
  const feedbacks = await listarFeedbacksCompartilhamento(eventoSlug, link.id);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Feedbacks");
  sheet.columns = [
    { header: "ID do trabalho", key: "submissaoId", width: 14 },
    { header: "Título", key: "titulo", width: 60 },
    { header: "Nome", key: "nome", width: 30 },
    { header: "Estrelas", key: "estrelas", width: 10 },
    { header: "Comentário", key: "comentario", width: 80 },
    { header: "Data", key: "data", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };
  feedbacks.forEach((f) => sheet.addRow({ ...f, data: formatarData(f.updatedAt) }));
  const buffer = await workbook.xlsx.writeBuffer();
  const sufixo = (link.rotulo || `link_${link.id}`).replace(/[^\w-]+/g, "_");
  saveAs(new Blob([buffer]), `feedbacks_${eventoSlug}_${sufixo}.xlsx`);
};

export const PainelCompartilhamentos = ({ eventoSlug, atualizarEm }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [copiadoId, setCopiadoId] = useState(null);
  const [exportandoId, setExportandoId] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      setLinks(await listarCompartilhamentosResumos(eventoSlug));
    } catch (error) {
      console.error("Erro ao listar links compartilhados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoSlug, atualizarEm]);

  const handleRevogar = async (id) => {
    if (confirmandoId !== id) {
      setConfirmandoId(id);
      return;
    }
    setConfirmandoId(null);
    try {
      await revogarCompartilhamentoResumos(eventoSlug, id);
      await carregar();
    } catch (error) {
      console.error("Erro ao revogar link:", error);
    }
  };

  const handleCopiar = async (link) => {
    if (await copiar(urlCompartilhamentoResumos(link.token))) {
      setCopiadoId(link.id);
      setTimeout(() => setCopiadoId(null), 2000);
    }
  };

  const handleExportar = async (link) => {
    setExportandoId(link.id);
    try {
      await exportarFeedbacks(eventoSlug, link);
    } catch (error) {
      console.error("Erro ao exportar feedbacks:", error);
    } finally {
      setExportandoId(null);
    }
  };

  const linkBody = (l) => (
    <div className={styles.celulaLink}>
      <strong>{l.rotulo || "Sem rótulo"}</strong>
      <span>{l.recorte ? l.recorte.sigla?.toUpperCase() : "Evento inteiro"}</span>
      <span className={styles.criadoPor}>
        {l.criadoPor || "—"} · {formatarData(l.createdAt)}
      </span>
    </div>
  );

  const configuracaoBody = (l) => {
    const filtros = descreverFiltros(l.filtros);
    return (
      <div className={styles.celulaLink}>
        <span>{filtros.length ? filtros.join(" · ") : "Sem filtros"}</span>
        <span className={styles.criadoPor}>
          Comentários: {EXIBICAO_CURTA[l.exibicaoComentarios] || l.exibicaoComentarios}
          {l.permitirFeedback ? " · aceita avaliações" : ""}
        </span>
      </div>
    );
  };

  const statusBody = (l) => (
    <span className={`${styles.status} ${styles[`status${l.status}`]}`}>{STATUS_LABEL[l.status]}</span>
  );

  const acessosBody = (l) => (
    <span
      title={l.ultimoAcessoEm ? `Último acesso: ${new Date(l.ultimoAcessoEm).toLocaleString("pt-BR")}` : undefined}
    >
      {l.acessos}
    </span>
  );

  const feedbacksBody = (l) => (l.permitirFeedback ? l.totalFeedbacks : "—");

  const acoesBody = (l) => (
    <div className={styles.acoes}>
      {l.status === "ATIVO" && (
        <Button
          onClick={() => handleCopiar(l)}
          icon={copiadoId === l.id ? RiCheckLine : RiFileCopyLine}
          className="btn-secondary"
          type="button"
          title="Copiar link"
        />
      )}
      {l.totalFeedbacks > 0 && (
        <Button
          onClick={() => handleExportar(l)}
          icon={RiFileExcelLine}
          className="btn-secondary"
          type="button"
          loading={exportandoId === l.id}
          title="Exportar avaliações dos acessantes (.xlsx) — são apagadas quando o link expira"
        />
      )}
      {l.status === "ATIVO" && (
        <Button
          onClick={() => handleRevogar(l.id)}
          icon={RiDeleteBinLine}
          className={confirmandoId === l.id ? "btn-error" : "btn-error-outline"}
          type="button"
          title={confirmandoId === l.id ? "Clique de novo para confirmar" : "Revogar link"}
        >
          {confirmandoId === l.id ? "Confirmar" : null}
        </Button>
      )}
    </div>
  );

  return (
    <DataTable
      className={styles.eventoTable}
      value={links}
      loading={loading}
      dataKey="id"
      paginator={links.length > 10}
      rows={10}
      emptyMessage='Nenhum link compartilhado ainda. Use "Novo link" para gerar.'
    >
      <Column header="Link" body={linkBody} />
      <Column header="Conteúdo" body={configuracaoBody} />
      <Column header="Expira em" body={(l) => formatarData(l.validade)} />
      <Column header="Acessos" body={acessosBody} />
      <Column header="Avaliações" body={feedbacksBody} />
      <Column header="Status" body={statusBody} />
      <Column header="Ações" body={acoesBody} style={{ width: "200px" }} />
    </DataTable>
  );
};

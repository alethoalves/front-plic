"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Tag } from "primereact/tag";
import {
  RiFileExcelLine,
  RiEyeLine,
  RiHourglassLine,
  RiSearchEyeLine,
  RiCheckboxCircleLine,
  RiAwardLine,
  RiLoginCircleLine,
  RiUserUnfollowLine,
  RiMapPinLine,
  RiLinkUnlinkM,
  RiErrorWarningLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "@remixicon/react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";
import ModalSubmissaoAdmin from "@/components/ModalSubmissaoAdmin";
import { getListaSubmissao, updateSubmissaoStatus } from "@/app/api/client/submissao";
import { getSubsessaoById } from "@/app/api/client/subsessoes";
import { vincularSubmissao, desvincularSubmissao } from "@/app/api/client/square";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";
import { formatarData, formatarHora, agoraNoHorarioBrasilia } from "@/lib/formatarDatas";
import { FilterMatchMode } from "primereact/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import styles from "./SubmissoesTable.module.scss";

const STATUS_LABEL = {
  AGUARDANDO_AVALIACAO: "Aguardando avaliação",
  EM_AVALIACAO: "Em avaliação",
  AVALIADA: "Avaliada",
  SELECIONADA: "Selecionada",
  DISTRIBUIDA: "Checkin pendente",
  AUSENTE: "Ausente",
};

export const statusLabel = (status) => STATUS_LABEL[status] || status || "—";

const STATUS_ICON = {
  AGUARDANDO_AVALIACAO: RiHourglassLine,
  EM_AVALIACAO: RiSearchEyeLine,
  AVALIADA: RiCheckboxCircleLine,
  SELECIONADA: RiAwardLine,
  DISTRIBUIDA: RiLoginCircleLine,
  AUSENTE: RiUserUnfollowLine,
};

const STATUS_COR_CLASSE = {
  AUSENTE: "statusCorAusente",
  DISTRIBUIDA: "statusCorCheckinPendente",
  EM_AVALIACAO: "statusCorEmAvaliacao",
  AVALIADA: "statusCorAvaliada",
};

// Sufixo usado pra montar as classes do quadrado de ícone (ex.:
// "statusIconBtnAusente" / "statusIconBtnAusenteAtivo" no module.scss).
const STATUS_COR_ICONE = {
  AUSENTE: "Ausente",
  DISTRIBUIDA: "CheckinPendente",
  AGUARDANDO_AVALIACAO: "AguardandoAvaliacao",
  EM_AVALIACAO: "EmAvaliacao",
  AVALIADA: "Avaliada",
};

// SELECIONADA fica de fora — é resultado do fluxo de premiação, não faz
// sentido como troca manual rápida aqui (mesmo critério do
// ModalSubmissaoAdmin, que também não oferece essa opção).
const STATUS_ALTERAVEIS = [
  { value: "AUSENTE", label: "Ausente" },
  { value: "DISTRIBUIDA", label: "Checkin pendente" },
  { value: "AGUARDANDO_AVALIACAO", label: "Aguardando avaliação" },
  { value: "EM_AVALIACAO", label: "Em avaliação" },
  { value: "AVALIADA", label: "Avaliada" },
];

// Tabela de submissões usada pela página "Submissão" do admin — lista,
// filtros, pôster, status e exportação, com espaço pra colunas extras
// específicas (ex.: atribuir/retirar avaliador) via `colunasExtras`. Um
// `ref` expõe `atualizarStatusSubmissao` pra quem, de fora, muda o status
// de uma submissão e precisa refletir isso aqui sem refetch.
const SubmissoesTable = forwardRef(
  ({ eventoSlug, colunasExtras, enriquecerLinha, renderCardExtra }, ref) => {
  const [loading, setLoading] = useState(false);
  const [submissoes, setSubmissoes] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [isExportando, setIsExportando] = useState(false);

  // Paginação controlada (em vez de deixar o DataTable paginar por conta
  // própria) — pra lista de cards do mobile (@include responsive(xs) em
  // SubmissoesTable.module.scss) mostrar exatamente a mesma página que a
  // tabela mostraria, sem duplicar a lógica de paginação.
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);

  const [filtroAreaIds, setFiltroAreaIds] = useState([]);
  const [filtroCategorias, setFiltroCategorias] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState([]);
  const [filtroSubsessaoIds, setFiltroSubsessaoIds] = useState([]);

  const [submissaoSelecionadaId, setSubmissaoSelecionadaId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [statusAtualizandoId, setStatusAtualizandoId] = useState(null);
  // { rowData, novoStatus } quando o admin tenta voltar pra "Aguardando
  // avaliação" fora da janela da subsessão — pede confirmação antes de aplicar.
  const [confirmacaoStatusPendente, setConfirmacaoStatusPendente] = useState(null);

  // Seletor de pôster (mapa de assentos) pra submissões ainda sem pôster
  const [submissaoParaAlocar, setSubmissaoParaAlocar] = useState(null);
  const [subsessaoPosteres, setSubsessaoPosteres] = useState(null);
  const [carregandoPosteres, setCarregandoPosteres] = useState(false);
  const [alocandoPosterId, setAlocandoPosterId] = useState(null);

  // Confirmação de desvincular submissão de um pôster
  const [submissaoParaDesvincular, setSubmissaoParaDesvincular] = useState(null);
  const [desvinculando, setDesvinculando] = useState(false);
  const [erroDesvincular, setErroDesvincular] = useState("");

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "Resumo.titulo": { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const orientadoresLabel = (submissao) =>
    (submissao.Resumo?.participacoes || [])
      .filter((item) => item.cargo === "ORIENTADOR" || item.cargo === "COORIENTADOR")
      .map((item) => item.user?.nome)
      .filter(Boolean)
      .join(", ");

  const alunosLabel = (submissao) =>
    (submissao.Resumo?.participacoes || [])
      .filter((item) => item.cargo === "AUTOR" || item.cargo === "COAUTOR")
      .map((item) => item.user?.nome)
      .filter(Boolean)
      .join(", ");

  const dataTableRef = useRef(null);

  const areaBodyTemplate = (rowData) => rowData?.Resumo?.area?.area || "Sem área";

  const subsessaoLabel = (submissao) => {
    const subsessao = submissao?.subsessao;
    if (!subsessao) return null;
    return `${subsessao.sessaoApresentacao?.titulo} — ${formatarData(
      subsessao.inicio
    )} ${formatarHora(subsessao.inicio)}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getListaSubmissao(eventoSlug);
      const comBusca = (response || []).map((submissao) => ({
        ...submissao,
        participantesBusca: (submissao.Resumo?.participacoes || [])
          .map((item) => `${item.user?.nome || ""} ${item.user?.cpf || ""}`)
          .join(" "),
        // Campos pré-computados só pra ordenação das colunas cujo valor
        // exibido não é uma propriedade simples (vem de uma função) — o
        // PrimeReact não reordena de forma confiável quando sortField é
        // uma função nesta versão, então precisa ser um campo real.
        statusOrdenacao: statusLabel(submissao.status),
        posterNumero: submissao.square?.[0]?.numero,
        subsessaoOrdenacao: subsessaoLabel(submissao) || "",
        areaOrdenacao: areaBodyTemplate(submissao),
        instituicaoOrdenacao: getInstituicaoSigla(submissao),
      }));
      setSubmissoes(comBusca);
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoSlug]);

  useImperativeHandle(ref, () => ({
    recarregar: fetchData,
    atualizarStatusSubmissao: (id, novoStatus) => {
      setSubmissoes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: novoStatus } : s))
      );
    },
  }));

  const opcoesArea = useMemo(() => {
    const porId = new Map();
    submissoes.forEach((submissao) => {
      const area = submissao.Resumo?.area;
      if (!area || porId.has(area.area)) return;
      porId.set(area.area, {
        value: area.area,
        label: `${area.area} (${area.grandeArea?.grandeArea})`,
      });
    });
    return [...porId.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [submissoes]);

  const opcoesCategoria = useMemo(() => {
    const categorias = new Set(submissoes.map((s) => s.categoria).filter(Boolean));
    return [...categorias].sort().map((categoria) => ({ value: categoria, label: categoria }));
  }, [submissoes]);

  const opcoesStatus = useMemo(() => {
    const statusPresentes = new Set(submissoes.map((s) => s.status).filter(Boolean));
    return [...statusPresentes]
      .map((status) => ({ value: status, label: statusLabel(status) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [submissoes]);

  const opcoesSubsessao = useMemo(() => {
    const porLabel = new Map();
    submissoes.forEach((submissao) => {
      const subsessao = submissao.subsessao;
      if (!subsessao) return;
      const label = `${subsessao.sessaoApresentacao?.titulo} — ${formatarData(
        subsessao.inicio
      )} ${formatarHora(subsessao.inicio)}`;
      if (!porLabel.has(label)) {
        porLabel.set(label, { value: label, label });
      }
    });
    return [...porLabel.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [submissoes]);

  // Campos extras que a página que usa a tabela quer anexar a cada linha
  // (ex.: um valor pra ordenar por "tempo em atribuição" na Distribuição) —
  // precisam ser uma propriedade REAL no objeto da linha pra `sortField`
  // funcionar (ver comentário em fetchData sobre sortField-como-função não
  // ordenar de forma confiável nesta versão do PrimeReact).
  const submissoesEnriquecidas = useMemo(() => {
    if (!enriquecerLinha) return submissoes;
    return submissoes.map((submissao) => ({ ...submissao, ...enriquecerLinha(submissao) }));
  }, [submissoes, enriquecerLinha]);

  const submissoesFiltradas = useMemo(() => {
    // Mesmo critério de busca do `globalFilterFields` do DataTable —
    // replicado aqui (em vez de deixar só o PrimeReact filtrar) pra lista
    // de cards do mobile mostrar exatamente o mesmo resultado da tabela (o
    // DataTable filtra internamente o `value` que ele recebe, então a
    // busca não aparecia em `submissoesFiltradas`).
    const termoBusca = globalFilterValue.trim().toLowerCase();

    return submissoesEnriquecidas.filter((submissao) => {
      if (filtroAreaIds.length > 0 && !filtroAreaIds.includes(submissao.Resumo?.area?.area)) {
        return false;
      }
      if (filtroCategorias.length > 0 && !filtroCategorias.includes(submissao.categoria)) {
        return false;
      }
      if (filtroStatus.length > 0 && !filtroStatus.includes(submissao.status)) {
        return false;
      }
      if (
        filtroSubsessaoIds.length > 0 &&
        !filtroSubsessaoIds.includes(subsessaoLabel(submissao))
      ) {
        return false;
      }
      if (
        termoBusca &&
        !(submissao.Resumo?.titulo || "").toLowerCase().includes(termoBusca) &&
        !(submissao.participantesBusca || "").toLowerCase().includes(termoBusca)
      ) {
        return false;
      }
      return true;
    });
  }, [
    submissoesEnriquecidas,
    filtroAreaIds,
    filtroCategorias,
    filtroStatus,
    filtroSubsessaoIds,
    globalFilterValue,
  ]);

  // Volta pra primeira página sempre que um filtro muda ou os dados são
  // recarregados — sem isso, `first` podia apontar pra além do fim da
  // lista nova e a página (tabela ou cards) ficava em branco.
  useEffect(() => {
    setFirst(0);
  }, [filtroAreaIds, filtroCategorias, filtroStatus, filtroSubsessaoIds, globalFilterValue, eventoSlug]);

  const totalFiltradas = submissoesFiltradas.length;
  const submissoesPaginaAtual = useMemo(
    () => submissoesFiltradas.slice(first, first + rows),
    [submissoesFiltradas, first, rows]
  );

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    const _filters = { ...filters };
    _filters.global.value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const abrirDetalhe = (submissao) => {
    setSubmissaoSelecionadaId(submissao.id);
    setModalAberto(true);
  };

  const fecharDetalhe = () => {
    setModalAberto(false);
  };

  const abrirSeletorDePoster = async (submissao) => {
    const idSubsessao = submissao.subsessao?.id;
    if (!idSubsessao) return;
    setSubmissaoParaAlocar(submissao);
    setSubsessaoPosteres(null);
    setCarregandoPosteres(true);
    try {
      const subsessao = await getSubsessaoById(eventoSlug, idSubsessao);
      subsessao.Square.sort((a, b) => a.numero - b.numero);
      setSubsessaoPosteres(subsessao);
    } catch (error) {
      console.error("Erro ao buscar pôsteres da subsessão:", error);
    } finally {
      setCarregandoPosteres(false);
    }
  };

  const fecharSeletorDePoster = () => {
    setSubmissaoParaAlocar(null);
    setSubsessaoPosteres(null);
  };

  const selecionarPoster = async (square) => {
    if (!submissaoParaAlocar || square.submissaoId) return;
    setAlocandoPosterId(square.id);
    try {
      await vincularSubmissao(eventoSlug, submissaoParaAlocar.id, square.id);
      setSubmissoes((prev) =>
        prev.map((s) =>
          s.id === submissaoParaAlocar.id
            ? { ...s, square: [{ ...square, submissaoId: s.id }] }
            : s
        )
      );
      fecharSeletorDePoster();
    } catch (error) {
      console.error("Erro ao alocar pôster:", error);
    } finally {
      setAlocandoPosterId(null);
    }
  };

  const confirmarDesvincularPoster = async () => {
    if (!submissaoParaDesvincular) return;
    const idSquare = submissaoParaDesvincular.square?.[0]?.id;
    if (!idSquare) return;
    setDesvinculando(true);
    setErroDesvincular("");
    try {
      await desvincularSubmissao(eventoSlug, submissaoParaDesvincular.id, idSquare);
      setSubmissoes((prev) =>
        prev.map((s) => (s.id === submissaoParaDesvincular.id ? { ...s, square: [] } : s))
      );
      setSubmissaoParaDesvincular(null);
    } catch (error) {
      console.error("Erro ao desvincular pôster:", error);
      setErroDesvincular("Erro ao desvincular a submissão. Tente novamente.");
    } finally {
      setDesvinculando(false);
    }
  };

  const aplicarMudancaStatus = async (rowData, novoStatus) => {
    setStatusAtualizandoId(rowData.id);
    try {
      await updateSubmissaoStatus(eventoSlug, rowData.id, novoStatus);
      setSubmissoes((prev) =>
        prev.map((s) => (s.id === rowData.id ? { ...s, status: novoStatus } : s))
      );
    } catch (error) {
      console.error("Erro ao atualizar status da submissão:", error);
    } finally {
      setStatusAtualizandoId(null);
    }
  };

  const ehParticipacaoDeAluno = (participacao) =>
    participacao.cargo === "AUTOR" || participacao.cargo === "COAUTOR";

  // Avisos que pedem confirmação extra antes de voltar uma submissão pra
  // "Aguardando avaliação" — nenhum deles impede a ação, só confirma que o
  // admin sabe do que está fazendo.
  const avisosParaAguardandoAvaliacao = (rowData) => {
    const avisos = [];

    // 1) Fora da janela da subsessão: em tese é quando o avaliador teria a
    // submissão em mãos pra avaliar. Sessão que já passou ou nem começou
    // ainda pode ser uma reavaliação/correção legítima, só avisa.
    const subsessao = rowData.subsessao;
    if (subsessao?.inicio && subsessao?.fim) {
      const agora = agoraNoHorarioBrasilia();
      const dentroDoHorario =
        agora >= new Date(subsessao.inicio) && agora <= new Date(subsessao.fim);
      if (!dentroDoHorario) {
        avisos.push(
          `A sessão "${subsessao.sessaoApresentacao?.titulo || ""}" está marcada para ${formatarData(
            subsessao.inicio
          )}, ${formatarHora(subsessao.inicio)} às ${formatarHora(
            subsessao.fim
          )} (horário de Brasília) — agora está fora dessa janela.`
        );
      }
    }

    // 2) Um aluno (autor/coautor) desta submissão já tem outra submissão
    // aguardando avaliação — pode ser proposital (mais de um trabalho), mas
    // também pode ser engano, então confirma.
    const cpfsAlunos = new Set(
      (rowData.Resumo?.participacoes || [])
        .filter(ehParticipacaoDeAluno)
        .map((p) => p.user?.cpf)
        .filter(Boolean)
    );

    if (cpfsAlunos.size > 0) {
      const outraSubmissao = submissoes.find(
        (s) =>
          s.id !== rowData.id &&
          s.status === "AGUARDANDO_AVALIACAO" &&
          (s.Resumo?.participacoes || []).some(
            (p) => ehParticipacaoDeAluno(p) && cpfsAlunos.has(p.user?.cpf)
          )
      );

      if (outraSubmissao) {
        avisos.push(
          `Um dos alunos desta submissão também participa de "${
            outraSubmissao.Resumo?.titulo || "outra submissão"
          }", que já está aguardando avaliação.`
        );
      }
    }

    return avisos;
  };

  const handleStatusChange = (rowData, novoStatus) => {
    if (rowData.status === novoStatus || statusAtualizandoId) return;

    if (novoStatus === "AGUARDANDO_AVALIACAO") {
      const avisos = avisosParaAguardandoAvaliacao(rowData);
      if (avisos.length > 0) {
        setConfirmacaoStatusPendente({ rowData, novoStatus, avisos });
        return;
      }
    }

    aplicarMudancaStatus(rowData, novoStatus);
  };

  const confirmarMudancaStatusPendente = () => {
    if (!confirmacaoStatusPendente) return;
    const { rowData, novoStatus } = confirmacaoStatusPendente;
    setConfirmacaoStatusPendente(null);
    aplicarMudancaStatus(rowData, novoStatus);
  };

  const instituicaoBodyTemplate = (rowData) => getInstituicaoSigla(rowData);

  const subsessaoBodyTemplate = (rowData) => {
    const subsessao = rowData.subsessao;
    if (!subsessao) return "—";
    return (
      <div className={styles.subsessaoCell}>
        <p>{subsessao.sessaoApresentacao?.titulo}</p>
        <p className={styles.subsessaoDataHora}>
          {formatarData(subsessao.inicio)} {formatarHora(subsessao.inicio)}
        </p>
      </div>
    );
  };

  const participantesBodyTemplate = (rowData) => {
    const orientadores = orientadoresLabel(rowData);
    const alunos = alunosLabel(rowData);
    return (
      <div className={styles.participantesCell}>
        {orientadores && (
          <p>
            <strong>Orientadores: </strong>
            {orientadores}
          </p>
        )}
        {alunos && (
          <p>
            <strong>Alunos: </strong>
            {alunos}
          </p>
        )}
        {!orientadores && !alunos && "—"}
      </div>
    );
  };

  const statusBodyTemplate = (rowData) => {
    const atualizando = statusAtualizandoId === rowData.id;
    const ehAlteravel = STATUS_ALTERAVEIS.some((opcao) => opcao.value === rowData.status);
    const corClasse = STATUS_COR_CLASSE[rowData.status];

    return (
      <div className={styles.statusCell}>
        <p className={`${styles.statusAtual} ${corClasse ? styles[corClasse] : ""}`}>
          {statusLabel(rowData.status)}
        </p>
        <div className={styles.statusIcones}>
          {STATUS_ALTERAVEIS.map(({ value, label }) => {
            const Icon = STATUS_ICON[value];
            const ativo = rowData.status === value;
            const corSufixo = STATUS_COR_ICONE[value];
            return (
              <button
                key={value}
                type="button"
                title={label}
                disabled={atualizando}
                className={`${styles.statusIconBtn} ${
                  ativo ? styles[`statusIconBtn${corSufixo}Ativo`] : ""
                }`}
                onClick={() => handleStatusChange(rowData, value)}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
        {!ehAlteravel && <p className={styles.statusAviso}>Definido automaticamente</p>}
      </div>
    );
  };

  const posterNumeroBodyTemplate = (rowData) => {
    const numero = rowData.square?.[0]?.numero;
    if (numero != null) {
      return (
        <span className={styles.posterOcupadoCell}>
          {numero}
          <button
            type="button"
            className={styles.desvincularBtn}
            title="Desvincular pôster"
            onClick={() => setSubmissaoParaDesvincular(rowData)}
          >
            <RiLinkUnlinkM size={14} />
          </button>
        </span>
      );
    }
    if (!rowData.subsessao?.id) return "—";
    return (
      <span
        className={styles.posterVazio}
        onClick={() => abrirSeletorDePoster(rowData)}
        title="Selecionar pôster"
      >
        <RiMapPinLine size={14} />
      </span>
    );
  };

  const premioBodyTemplate = (rowData) => (
    <div className="flex gap-1">
      {rowData.premio && <Tag severity="warning" value="Premiado" />}
      {rowData.indicacaoPremio && <Tag severity="info" value="Indicação" />}
      {rowData.mencaoHonrosa && <Tag severity="success" value="Menção honrosa" />}
    </div>
  );

  const acoesBodyTemplate = (rowData) => (
    <div
      className={`${styles.verAcao} cursor-pointer`}
      onClick={() => abrirDetalhe(rowData)}
      title="Ver submissão"
    >
      <RiEyeLine size={18} />
    </div>
  );

  const exportExcel = async () => {
    setIsExportando(true);
    try {
      const dados = dataTableRef.current?.getFilteredValue?.() ?? submissoesFiltradas;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Submissões");
      worksheet.columns = [
        { header: "Título", key: "titulo", width: 40 },
        { header: "Orientadores", key: "orientadores", width: 30 },
        { header: "Alunos", key: "alunos", width: 30 },
        { header: "Área", key: "area", width: 25 },
        { header: "Instituição", key: "instituicao", width: 20 },
        { header: "Categoria", key: "categoria", width: 15 },
        { header: "Subsessão", key: "subsessao", width: 35 },
        { header: "Status", key: "status", width: 20 },
        { header: "Pôster", key: "poster", width: 10 },
        { header: "Nota Final", key: "notaFinal", width: 12 },
        { header: "Premiado", key: "premio", width: 10 },
        { header: "Indicação a Prêmio", key: "indicacaoPremio", width: 15 },
        { header: "Menção Honrosa", key: "mencaoHonrosa", width: 15 },
      ];
      dados.forEach((submissao) => {
        worksheet.addRow({
          titulo: submissao.Resumo?.titulo || "Sem título",
          orientadores: orientadoresLabel(submissao) || "—",
          alunos: alunosLabel(submissao) || "—",
          area: areaBodyTemplate(submissao),
          instituicao: getInstituicaoSigla(submissao),
          categoria: submissao.categoria || "—",
          subsessao: subsessaoLabel(submissao) || "—",
          status: statusLabel(submissao.status),
          poster: submissao.square?.[0]?.numero ?? "—",
          notaFinal: submissao.notaFinal ?? "N/A",
          premio: submissao.premio ? "Sim" : "Não",
          indicacaoPremio: submissao.indicacaoPremio ? "Sim" : "Não",
          mencaoHonrosa: submissao.mencaoHonrosa ? "Sim" : "Não",
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Submissoes-${eventoSlug}.xlsx`);
    } finally {
      setIsExportando(false);
    }
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <InputText
        className={`${styles.eventoInput} w-100`}
        value={globalFilterValue}
        onChange={onGlobalFilterChange}
        placeholder="Buscar por título, nome ou CPF..."
      />
      <Button
        icon={RiFileExcelLine}
        onClick={exportExcel}
        className="btn-secondary ml-2"
        disabled={isExportando}
      >
        {isExportando ? "Exportando..." : "Exportar"}
      </Button>
    </div>
  );

  if (loading && submissoes.length === 0) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <>
      <ModalSubmissaoAdmin
        isOpen={modalAberto}
        onClose={fecharDetalhe}
        eventoSlug={eventoSlug}
        idSubmissao={submissaoSelecionadaId}
        onDataUpdated={fetchData}
      />

      <ModalDelete
        isOpen={!!submissaoParaDesvincular}
        onClose={() => {
          setSubmissaoParaDesvincular(null);
          setErroDesvincular("");
        }}
        icon={RiLinkUnlinkM}
        title="Desvincular pôster?"
        confirmationText={`Isso vai remover "${
          submissaoParaDesvincular?.Resumo?.titulo || "esta submissão"
        }" do pôster nº ${submissaoParaDesvincular?.square?.[0]?.numero}. Ela volta a ficar sem pôster atribuído.`}
        errorDelete={erroDesvincular}
        handleDelete={confirmarDesvincularPoster}
        txtBtn={desvinculando ? "Desvinculando..." : "Desvincular"}
      />

      <ModalDelete
        isOpen={!!confirmacaoStatusPendente}
        onClose={() => setConfirmacaoStatusPendente(null)}
        icon={RiErrorWarningLine}
        title="Confirmar mudança de status"
        confirmationText={`${(confirmacaoStatusPendente?.avisos || []).join(" ")} Confirma mudar mesmo assim para "Aguardando avaliação"?`}
        handleDelete={confirmarMudancaStatusPendente}
        txtBtn="Confirmar"
      />

      <Modal isOpen={!!submissaoParaAlocar} onClose={fecharSeletorDePoster} size="large">
        <div className={styles.mapaPosteresHead}>
          <div className={styles.mapaPosteresIcon}>
            <RiMapPinLine />
          </div>
          <h4>Selecionar Pôster</h4>
          {submissaoParaAlocar && (
            <>
              <p className={styles.mapaPosteresTitulo}>{submissaoParaAlocar.Resumo?.titulo}</p>
              <p className={styles.mapaPosteresSubsessao}>
                {subsessaoLabel(submissaoParaAlocar) || "Sem subsessão"}
              </p>
            </>
          )}
        </div>

        {carregandoPosteres && (
          <p className={styles.mapaPosteresCarregando}>Carregando pôsteres...</p>
        )}

        {!carregandoPosteres && subsessaoPosteres && (
          <>
            <div className={styles.mapaPosteresLegenda}>
              <span>
                <i className={styles.legendaDisponivel} /> Disponível
              </span>
              <span>
                <i className={styles.legendaOcupado} /> Ocupado
              </span>
            </div>
            {subsessaoPosteres.Square.length === 0 ? (
              <p className={styles.mapaPosteresVazio}>
                Nenhum pôster gerado ainda pra esta subsessão.
              </p>
            ) : (
              <div className={styles.mapaPosteres}>
                {subsessaoPosteres.Square.map((square) => {
                  const ocupado = !!square.submissaoId;
                  return (
                    <button
                      key={square.id}
                      type="button"
                      disabled={ocupado || alocandoPosterId === square.id}
                      title={ocupado ? square.submissao?.Resumo?.titulo || "Ocupado" : "Selecionar este pôster"}
                      className={`${styles.posterAssento} ${
                        ocupado ? styles.posterOcupado : styles.posterDisponivel
                      }`}
                      onClick={() => selecionarPoster(square)}
                    >
                      {square.numero}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Modal>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h6>Filtros</h6>
          <p>Refine a lista por área, categoria, status ou subsessão.</p>
        </div>

        <div className={styles.filterBar}>
          <div>
            <label className={styles.eventoLabel}>Área</label>
            <MultiSelect
              value={filtroAreaIds}
              options={opcoesArea}
              onChange={(e) => setFiltroAreaIds(e.value)}
              placeholder="Todas as áreas"
              filter
              className="w-100"
              display="chip"
            />
          </div>
          <div>
            <label className={styles.eventoLabel}>Categoria</label>
            <MultiSelect
              value={filtroCategorias}
              options={opcoesCategoria}
              onChange={(e) => setFiltroCategorias(e.value)}
              placeholder="Todas as categorias"
              filter
              className="w-100"
              display="chip"
            />
          </div>
          <div>
            <label className={styles.eventoLabel}>Status</label>
            <MultiSelect
              value={filtroStatus}
              options={opcoesStatus}
              onChange={(e) => setFiltroStatus(e.value)}
              placeholder="Todos os status"
              filter
              className="w-100"
              display="chip"
            />
          </div>
          <div>
            <label className={styles.eventoLabel}>Subsessão</label>
            <MultiSelect
              value={filtroSubsessaoIds}
              options={opcoesSubsessao}
              onChange={(e) => setFiltroSubsessaoIds(e.value)}
              placeholder="Todas as subsessões"
              filter
              className="w-100"
              display="chip"
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h6>Submissões</h6>
          <p>Busque, ordene e exporte a lista de submissões.</p>
        </div>

        <p className={styles.contador}>
          {totalFiltradas} de {submissoes.length}{" "}
          {submissoes.length === 1 ? "submissão" : "submissões"}
        </p>

        <div className={styles.tableWrapper}>
          <DataTable
            ref={dataTableRef}
            className={styles.eventoTable}
            value={submissoesFiltradas}
            paginator
            first={first}
            rows={rows}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onPage={(e) => {
              setFirst(e.first);
              setRows(e.rows);
            }}
            loading={loading}
            filters={filters}
            globalFilterFields={["Resumo.titulo", "participantesBusca"]}
            header={header}
            emptyMessage="Nenhuma submissão encontrada."
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} submissões"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          >
            <Column header="Ver" body={acoesBodyTemplate} style={{ width: "60px", textAlign: "center" }} />
            <Column
              header="Status"
              body={statusBodyTemplate}
              sortable
              sortField="statusOrdenacao"
              style={{ width: "240px", maxWidth: "240px" }}
            />
            <Column
              header="Pôster"
              body={posterNumeroBodyTemplate}
              sortable
              sortField="posterNumero"
              style={{ width: "80px", textAlign: "center" }}
            />
            <Column
              header="Subsessão"
              body={subsessaoBodyTemplate}
              sortable
              sortField="subsessaoOrdenacao"
              style={{ minWidth: "220px" }}
            />
            <Column
              header="Participantes"
              body={participantesBodyTemplate}
              style={{ width: "350px", maxWidth: "350px" }}
            />
            <Column
              field="Resumo.titulo"
              header="Título"
              body={(rowData) => <span className={styles.tituloCell}>{rowData.Resumo?.titulo}</span>}
              sortable
              style={{ width: "200px", maxWidth: "200px" }}
            />
            <Column header="Área" body={areaBodyTemplate} sortable sortField="areaOrdenacao" />
            <Column
              header="Instituição"
              body={instituicaoBodyTemplate}
              sortable
              sortField="instituicaoOrdenacao"
            />
            <Column field="categoria" header="Categoria" sortable />
            <Column field="notaFinal" header="Nota Final" sortable />
            <Column header="Prêmio" body={premioBodyTemplate} />
            {colunasExtras}
          </DataTable>
        </div>

        <div className={styles.cardList}>
          {loading && submissoes.length > 0 && <p className={styles.contador}>Atualizando...</p>}
          {totalFiltradas === 0 && (
            <p className={styles.contador}>Nenhuma submissão encontrada.</p>
          )}
          {submissoesPaginaAtual.map((rowData) => (
            <div key={rowData.id} className={styles.cardItem}>
              <div className={styles.cardHead}>
                <span className={styles.tituloCell}>{rowData.Resumo?.titulo}</span>
                <button
                  type="button"
                  className={styles.cardVerBtn}
                  title="Ver submissão"
                  onClick={() => abrirDetalhe(rowData)}
                >
                  <RiEyeLine size={20} />
                </button>
              </div>

              {statusBodyTemplate(rowData)}

              <div className={styles.cardRow}>
                <span className={styles.cardRowLabel}>Pôster</span>
                {posterNumeroBodyTemplate(rowData)}
              </div>

              {subsessaoBodyTemplate(rowData)}
              {participantesBodyTemplate(rowData)}

              <div className={styles.cardInfoGrid}>
                <div>
                  <span className={styles.cardRowLabel}>Área</span>
                  <p>{areaBodyTemplate(rowData)}</p>
                </div>
                <div>
                  <span className={styles.cardRowLabel}>Instituição</span>
                  <p>{instituicaoBodyTemplate(rowData)}</p>
                </div>
                <div>
                  <span className={styles.cardRowLabel}>Categoria</span>
                  <p>{rowData.categoria || "—"}</p>
                </div>
                <div>
                  <span className={styles.cardRowLabel}>Nota Final</span>
                  <p>{rowData.notaFinal ?? "—"}</p>
                </div>
              </div>

              {premioBodyTemplate(rowData)}

              {renderCardExtra && (
                <div className={styles.cardExtra}>{renderCardExtra(rowData)}</div>
              )}
            </div>
          ))}

          {totalFiltradas > 0 && (
            <div className={styles.cardPager}>
              <button
                type="button"
                className={styles.cardPagerBtn}
                disabled={first === 0}
                onClick={() => setFirst(Math.max(0, first - rows))}
              >
                <RiArrowLeftSLine size={20} /> Anterior
              </button>
              <span className={styles.contador}>
                {first + 1}–{Math.min(first + rows, totalFiltradas)} de {totalFiltradas}
              </span>
              <button
                type="button"
                className={styles.cardPagerBtn}
                disabled={first + rows >= totalFiltradas}
                onClick={() => setFirst(first + rows)}
              >
                Próxima <RiArrowRightSLine size={20} />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
});

SubmissoesTable.displayName = "SubmissoesTable";

export default SubmissoesTable;

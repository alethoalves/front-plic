"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { Checkbox } from "primereact/checkbox";
import {
  getParticipacoesByTenant,
  getParticipacao,
  aprovarParticipacoes,
  reprovarParticipacoes,
  exportarParticipacoes,
  baixarModeloNotasExtras,
  importarNotasExtras,
  editarRespostaCampoGestor,
} from "@/app/api/client/participacao";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import { getFormulario } from "@/app/api/client/formulario";
import {
  getConfiguracaoTabela,
  upsertConfiguracaoTabela,
} from "@/app/api/client/configuracaoTabela";
import {
  getOpcoesAluno,
  getOpcoesLotacao,
  atualizarCampoUserTenant,
} from "@/app/api/client/userTenant";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  formatStatusText,
  renderStatusTagWithJustificativa,
} from "@/lib/tagUtils";
import {
  statusClassificacaoFilterTemplate,
  notaRowFilterTemplate,
  inteiroRowFilterTemplate,
  ordenarColunasPorChave,
} from "@/lib/tableTemplates";
import { statusOptions } from "@/lib/statusOptions";
import generateLattesText from "@/lib/generateLattesText";
import { comRetry } from "@/lib/retry";
import {
  formatarValorCampoDinamico,
  TIPOS_NAO_SELECIONAVEIS,
} from "@/lib/formularioDinamico";
import {
  renderEditorDinamico,
  tipoEditorParaCampoFormulario,
  TURNO_OPTIONS,
  SIM_NAO_OPTIONS,
} from "@/lib/editorInlineDinamico";
import Modal from "@/components/Modal";
import FileInput from "@/components/FileInput";
import CampoModalEditavel from "@/components/CampoModalEditavel";
import GrupoAvaliacao from "@/components/participacao/GrupoAvaliacao";
import {
  RiUser2Line,
  RiFileTextLine,
  RiStarLine,
  RiListCheck2,
  RiExternalLinkLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiCloseLargeLine,
  RiSettings5Line,
  RiAddCircleLine,
  RiEditLine,
} from "@remixicon/react";
import styles from "./page.module.scss";

const BATCH_SIZE = 20;
const CHAVE_CONFIG_COLUNAS = "colunasExtraAlunoSelecao";
const CHAVE_ORDEM_COLUNAS = "ordemColunasAlunoSelecao";
const CHAVE_LOCAL_FILTROS_ORDENACAO = "filtrosOrdenacaoAlunoSelecao";
const MENSAGEM_CAMPO_NAO_APLICAVEL = "Não se aplica a este edital";
const BOLSA_OPTIONS = [
  { label: "Sim", value: true },
  { label: "Não", value: false },
];

// Catálogo fixo de campos do UserTenant (dados institucionais do usuário, já filtrados
// por tenant+ano na consulta) que o gestor pode escolher como coluna extra da tabela.
// Curso, Matrícula, Rendimento Acadêmico e Forma de Ingresso ficam de fora daqui porque
// já são colunas fixas (sempre visíveis) mais abaixo.
// `campoDb`: nome exato do campo no Prisma (usado por atualizarCampoUserTenant).
// `tipoEditor`/`opcoesKey`: definem o editor inline da célula (resolvido via
// OPCOES_POR_CHAVE no componente). Campos sem `tipoEditor` não são editáveis.
const USER_TENANT_CAMPOS = [
  { id: "campus", label: "Campus", getValor: (ut) => ut?.campus?.campus || "-", campoDb: "campusId", tipoEditor: "select", opcoesKey: "campus" },
  { id: "cargo", label: "Cargo", getValor: (ut) => ut?.cargo?.cargo || "-", campoDb: "cargoId", tipoEditor: "select", opcoesKey: "cargo" },
  { id: "lotacao", label: "Lotação", getValor: (ut) => ut?.lotacao?.lotacao || "-", campoDb: "lotacaoId", tipoEditor: "select", opcoesKey: "lotacao" },
  { id: "turno", label: "Turno", getValor: (ut) => ut?.turno || "-", campoDb: "turno", tipoEditor: "select", opcoesKey: "turno" },
  { id: "semestre", label: "Semestre", getValor: (ut) => ut?.semestre ?? "-", campoDb: "semestre", tipoEditor: "number" },
  {
    id: "participacaoExterna",
    label: "Participação Externa",
    getValor: (ut) => (ut ? (ut.participacaoExterna ? "Sim" : "Não") : "-"),
    campoDb: "participacaoExterna",
    tipoEditor: "select",
    opcoesKey: "simNao",
  },
  {
    id: "instituicaoExterna",
    label: "Instituição Externa",
    getValor: (ut) => ut?.instituicaoExterna || "-",
    campoDb: "instituicaoExterna",
    tipoEditor: "text",
  },
  {
    id: "historicoEscolarUrl",
    label: "Histórico Escolar",
    tipo: "arquivo",
    getValor: (ut) => (ut?.historicoEscolarUrl ? "Arquivo anexado" : "-"),
    getUrl: (ut) => ut?.historicoEscolarUrl || null,
  },
  { id: "banco", label: "Banco", getValor: (ut) => ut?.banco || "-", campoDb: "banco", tipoEditor: "text" },
  { id: "agencia", label: "Agência", getValor: (ut) => ut?.agencia || "-", campoDb: "agencia", tipoEditor: "text" },
  { id: "conta", label: "Conta", getValor: (ut) => ut?.conta || "-", campoDb: "conta", tipoEditor: "text" },
];

// Renderiza uma célula de coluna dinâmica como link clicável quando há uma URL
// por trás do valor exibido (campo do tipo "link"/"arquivo", ou UserTenant com getUrl).
const renderCelulaComLink = (valor, url, textoLink) => {
  if (!url) return valor;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.externalLink}
      onClick={(e) => e.stopPropagation()}
    >
      <RiExternalLinkLine size={14} />
      {textoLink}
    </a>
  );
};

// -------- Página principal --------
const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itens, setItens] = useState([]);
  const [filteredItens, setFilteredItens] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [motivoReprova, setMotivoReprova] = useState("");
  const [displayReprovarDialog, setDisplayReprovarDialog] = useState(false);
  const [loadingAprovar, setLoadingAprovar] = useState(false);
  const [loadingReprovar, setLoadingReprovar] = useState(false);
  const [loadingExportar, setLoadingExportar] = useState(false);
  const [progress, setProgress] = useState(0);
  const [justificativasAtuais, setJustificativasAtuais] = useState("");
  const [showJustificativas, setShowJustificativas] = useState(false);
  const [editaisOptions, setEditaisOptions] = useState([]);
  const [cursosOptions, setCursosOptions] = useState([]);
  const [formasIngressoOptions, setFormasIngressoOptions] = useState([]);

  // Notas extras (planilha)
  const [baixandoModelo, setBaixandoModelo] = useState(false);
  const [showImportarNotasModal, setShowImportarNotasModal] = useState(false);
  const [arquivoNotasExtras, setArquivoNotasExtras] = useState(null);
  const [enviandoNotasExtras, setEnviandoNotasExtras] = useState(false);
  const [errosImportacaoNotas, setErrosImportacaoNotas] = useState([]);

  // Opções de dropdown pra edição inline de campos de UserTenant ligados a listas
  const [opcoesCursos, setOpcoesCursos] = useState([]);
  const [opcoesCampus, setOpcoesCampus] = useState([]);
  const [opcoesCargo, setOpcoesCargo] = useState([]);
  const [opcoesLotacao, setOpcoesLotacao] = useState([]);
  const [opcoesFormaIngresso, setOpcoesFormaIngresso] = useState([]);

  // Colunas dinâmicas (respostas do formulário de aluno, que pode variar por edital)
  const [editaisFormInfo, setEditaisFormInfo] = useState([]);
  const [campoPorId, setCampoPorId] = useState(new Map());
  const [editalParaCampoIds, setEditalParaCampoIds] = useState(new Map());
  const [gruposCamposPicker, setGruposCamposPicker] = useState([]);
  const [colunasSelecionadas, setColunasSelecionadas] = useState([]);
  const [userTenantSelecionadas, setUserTenantSelecionadas] = useState([]);
  const [ordemColunas, setOrdemColunas] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [draftColunas, setDraftColunas] = useState([]);
  const [draftUserTenantColunas, setDraftUserTenantColunas] = useState([]);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  // Modal de detalhes
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const dataTableRef = useRef(null);
  const toast = useRef(null);

  const getCurso = (item) => item.user?.UserTenant?.[0]?.curso?.curso || "N/A";
  const getFormaIngresso = (item) =>
    item.user?.UserTenant?.[0]?.formaIngresso?.formaIngresso || "N/A";
  const getMatricula = (item) => item.user?.UserTenant?.[0]?.matricula || "N/A";
  const getEditalTitulo = (item) => item.inscricao?.edital?.titulo || "N/A";

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "inscricao.edital.titulo": { value: null, matchMode: FilterMatchMode.IN },
    "planoDeTrabalho.statusClassificacao": { value: null, matchMode: FilterMatchMode.IN },
    statusParticipacao: { value: null, matchMode: FilterMatchMode.IN },
    "user.nome": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "user.cpf": { value: null, matchMode: FilterMatchMode.CONTAINS },
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "inscricao.id": { value: null, matchMode: FilterMatchMode.CONTAINS },
    curso: { value: null, matchMode: FilterMatchMode.IN },
    formaIngresso: { value: null, matchMode: FilterMatchMode.IN },
    matricula: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ira: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
    solicitarBolsa: { value: null, matchMode: FilterMatchMode.IN },
    "fichaAvaliacao.nota": { value: [undefined, undefined], matchMode: "intervalo_numerico" },
    totalNotasExtras: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
    quantidadeNotasExtras: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
    notaTotalGeral: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
    solicitacoesBolsaCpf: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const todasParticipacoes = await getParticipacoesByTenant(
        params.tenant,
        "aluno",
        params.ano
      );
      // Só inscrições já enviadas contam pra seleção de alunos.
      const participacoes = todasParticipacoes.filter(
        (item) => item.inscricao?.status === "enviada"
      );

      const editaisUnicos = [
        ...new Set(participacoes.map((item) => getEditalTitulo(item))),
      ]
        .filter(Boolean)
        .map((e) => ({ label: e, value: e }));
      setEditaisOptions(editaisUnicos);

      const cursosUnicos = [...new Set(participacoes.map((item) => getCurso(item)))]
        .filter(Boolean)
        .map((curso) => ({ label: curso, value: curso }));
      setCursosOptions(cursosUnicos);

      const formasIngressoUnicas = [
        ...new Set(participacoes.map((item) => getFormaIngresso(item))),
      ]
        .filter(Boolean)
        .map((f) => ({ label: f, value: f }));
      setFormasIngressoOptions(formasIngressoUnicas);

      const editaisMap = new Map();
      participacoes.forEach((item) => {
        const edital = item.inscricao?.edital;
        if (edital?.id != null && !editaisMap.has(edital.id)) {
          editaisMap.set(edital.id, {
            id: edital.id,
            titulo: edital.titulo,
            formAlunoId: edital.formAlunoId || null,
          });
        }
      });
      setEditaisFormInfo([...editaisMap.values()]);

      // Quantas participações desse CPF (nesse ano/listagem) pediram bolsa —
      // ajuda o gestor a notar o mesmo CPF solicitando bolsa em mais de uma
      // inscrição/edital. Conta sobre a mesma lista já filtrada (só "enviada").
      const solicitacoesBolsaPorCpf = new Map();
      participacoes.forEach((item) => {
        if (!item.solicitarBolsa) return;
        const cpf = item.user?.cpf;
        if (!cpf) return;
        solicitacoesBolsaPorCpf.set(cpf, (solicitacoesBolsaPorCpf.get(cpf) || 0) + 1);
      });

      const normalizado = participacoes.map((item) => {
        const totalNotasExtras = (item.NotaExtraParticipacao || []).reduce(
          (soma, nota) => soma + nota.valor,
          0
        );
        const quantidadeNotasExtras = item.NotaExtraParticipacao?.length ?? 0;
        return {
          ...item,
          editalTitulo: getEditalTitulo(item),
          curso: getCurso(item),
          formaIngresso: getFormaIngresso(item),
          matricula: getMatricula(item),
          ira: item.user?.UserTenant?.[0]?.rendimentoAcademico ?? null,
          totalNotasExtras,
          quantidadeNotasExtras,
          notaTotalGeral: (item.fichaAvaliacao?.nota ?? 0) + totalNotasExtras,
          solicitacoesBolsaCpf: item.user?.cpf ? solicitacoesBolsaPorCpf.get(item.user.cpf) || 0 : 0,
        };
      });
      setItens(normalizado);
      setFilteredItens(normalizado);
    } catch (err) {
      console.error("Erro ao buscar participações de alunos:", err);
      setError("Erro ao buscar participações de alunos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.tenant, params.ano]);

  useEffect(() => {
    const fetchOpcoes = async () => {
      try {
        const [opcoesAlunoResp, lotacoes] = await Promise.all([
          getOpcoesAluno(params.tenant),
          getOpcoesLotacao(params.tenant),
        ]);
        setOpcoesCursos(opcoesAlunoResp?.cursos || []);
        setOpcoesCampus(opcoesAlunoResp?.campus || []);
        setOpcoesCargo(opcoesAlunoResp?.cargos || []);
        setOpcoesFormaIngresso(opcoesAlunoResp?.formasIngresso || []);
        setOpcoesLotacao(lotacoes || []);
      } catch (err) {
        console.error("Erro ao carregar opções de UserTenant:", err);
      }
    };
    fetchOpcoes();
  }, [params.tenant]);

  const OPCOES_POR_CHAVE = {
    curso: opcoesCursos,
    campus: opcoesCampus,
    cargo: opcoesCargo,
    lotacao: opcoesLotacao,
    formaIngresso: opcoesFormaIngresso,
    turno: TURNO_OPTIONS,
    simNao: SIM_NAO_OPTIONS,
  };

  useEffect(() => {
    if (editaisFormInfo.length === 0) return;
    const fetchColunasDinamicas = async () => {
      try {
        const formAlunoIds = [
          ...new Set(editaisFormInfo.map((e) => e.formAlunoId).filter(Boolean)),
        ];
        const [formularios, configuracao, configuracaoOrdem] = await Promise.all([
          Promise.all(formAlunoIds.map((id) => getFormulario(params.tenant, id))),
          getConfiguracaoTabela(params.tenant, CHAVE_CONFIG_COLUNAS),
          getConfiguracaoTabela(params.tenant, CHAVE_ORDEM_COLUNAS),
        ]);

        const campoPorIdMap = new Map();
        const editalParaCampoIdsMap = new Map();
        const grupos = [];

        editaisFormInfo.forEach((edital) => {
          const formulario = formularios.find((f) => f?.id === edital.formAlunoId);
          const campos = (formulario?.campos || []).sort(
            (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
          );
          editalParaCampoIdsMap.set(edital.id, new Set(campos.map((c) => c.id)));
          campos.forEach((campo) => {
            if (!campoPorIdMap.has(campo.id)) campoPorIdMap.set(campo.id, campo);
          });
          const camposSelecionaveis = campos.filter(
            (c) => !TIPOS_NAO_SELECIONAVEIS.includes(c.tipo)
          );
          if (camposSelecionaveis.length > 0) {
            grupos.push({
              editalId: edital.id,
              editalTitulo: edital.titulo,
              campos: camposSelecionaveis,
            });
          }
        });

        setCampoPorId(campoPorIdMap);
        setEditalParaCampoIds(editalParaCampoIdsMap);
        setGruposCamposPicker(grupos);
        setColunasSelecionadas(configuracao?.campoIds || []);
        setUserTenantSelecionadas(configuracao?.userTenantCampos || []);
        setOrdemColunas(configuracaoOrdem?.ordem || []);
      } catch (err) {
        console.error("Erro ao carregar colunas dinâmicas do formulário de aluno:", err);
      }
    };
    fetchColunasDinamicas();
  }, [editaisFormInfo, params.tenant]);

  // Recebe a linha diretamente (não um evento de clique do PrimeReact) — só é
  // chamada pelo botão dedicado da última coluna, não mais pela linha inteira,
  // pra não conflitar com o clique que abre os editores das células editáveis.
  const handleRowClick = async (row) => {
    setModalVisible(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const [fullParticipacao, inscricao] = await Promise.all([
        getParticipacao(params.tenant, row.id, params.ano),
        getInscricaoUserById(params.tenant, row.inscricao?.id),
      ]);
      let formularioCampos = [];
      if (inscricao?.edital?.formAlunoId) {
        const form = await getFormulario(params.tenant, inscricao.edital.formAlunoId);
        formularioCampos = (form?.campos || []).sort(
          (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
        );
      }
      setDetailData({ participacao: fullParticipacao, formularioCampos });
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível carregar os detalhes do aluno.",
        life: 4000,
      });
      setModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    const _f = { ...filters };
    _f["global"].value = value;
    setFilters(_f);
    setGlobalFilterValue(value);
  };

  const processarEmLotes = async (ids, callback) => {
    const total = ids.length;
    for (let i = 0; i < total; i += BATCH_SIZE) {
      await callback(ids.slice(i, i + BATCH_SIZE));
      setProgress(Math.round(((i + BATCH_SIZE) / total) * 100));
    }
  };

  const handleAprovar = async () => {
    if (!selectedItems.length) {
      toast.current.show({ severity: "warn", summary: "Aviso", detail: "Selecione pelo menos um item para aprovar", life: 3000 });
      return;
    }
    setLoadingAprovar(true);
    setProgress(0);
    let aprovados = [];
    try {
      await processarEmLotes(selectedItems.map((i) => i.id), async (lote) => {
        const r = await aprovarParticipacoes(params.tenant, lote);
        const ignoradas = r.participacoesIgnoradas || [];
        aprovados.push(...lote.filter((id) => !ignoradas.includes(id)));
        if (ignoradas.length)
          toast.current.show({ severity: "warn", summary: "Atenção", detail: `${ignoradas.length} ignoradas`, life: 4000 });
      });
      toast.current.show({ severity: "success", summary: "Sucesso", detail: `${aprovados.length} aprovadas!`, life: 5000 });
      const updated = itens.map((i) =>
        aprovados.includes(i.id) ? { ...i, statusParticipacao: "APROVADA", justificativa: null } : i
      );
      setItens(updated);
      setFilteredItens(updated);
      setSelectedItems([]);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: err.response?.data?.message || "Erro ao aprovar", life: 5000 });
    } finally {
      setLoadingAprovar(false);
    }
  };

  const handleReprovar = () => {
    if (!selectedItems.length) {
      toast.current.show({ severity: "warn", summary: "Aviso", detail: "Selecione pelo menos um item para reprovar", life: 3000 });
      return;
    }
    setDisplayReprovarDialog(true);
  };

  const confirmarReprova = async () => {
    if (!motivoReprova.trim()) {
      toast.current.show({ severity: "error", summary: "Erro", detail: "Digite o motivo", life: 3000 });
      return;
    }
    setLoadingReprovar(true);
    setProgress(0);
    let reprovados = [];
    try {
      await processarEmLotes(selectedItems.map((i) => i.id), async (lote) => {
        const r = await reprovarParticipacoes(params.tenant, lote, motivoReprova);
        const ignoradas = r.participacoesIgnoradas || [];
        reprovados.push(...lote.filter((id) => !ignoradas.includes(id)));
        if (ignoradas.length)
          toast.current.show({ severity: "warn", summary: "Atenção", detail: `${ignoradas.length} ignoradas`, life: 4000 });
      });
      toast.current.show({ severity: "success", summary: "Sucesso", detail: `${reprovados.length} reprovadas!`, life: 5000 });
      const updated = itens.map((i) =>
        reprovados.includes(i.id) ? { ...i, statusParticipacao: "RECUSADA", justificativa: motivoReprova } : i
      );
      setItens(updated);
      setFilteredItens(updated);
      setSelectedItems([]);
      setMotivoReprova("");
      setDisplayReprovarDialog(false);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: err.response?.data?.message || "Erro ao reprovar", life: 5000 });
    } finally {
      setLoadingReprovar(false);
    }
  };

  useEffect(() => { setSelectedItems([]); }, [filters]);

  const handleExportar = async () => {
    setLoadingExportar(true);
    try {
      await exportarParticipacoes(params.tenant, "aluno", params.ano);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: "Não foi possível exportar.", life: 4000 });
    } finally {
      setLoadingExportar(false);
    }
  };

  const handleBaixarModelo = async () => {
    setBaixandoModelo(true);
    try {
      await baixarModeloNotasExtras(params.tenant, "aluno", params.ano);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: "Não foi possível baixar o modelo.", life: 4000 });
    } finally {
      setBaixandoModelo(false);
    }
  };

  const handleImportarNotasExtras = async () => {
    if (!arquivoNotasExtras) {
      toast.current.show({ severity: "warn", summary: "Aviso", detail: "Selecione um arquivo.", life: 3000 });
      return;
    }
    setEnviandoNotasExtras(true);
    setErrosImportacaoNotas([]);
    try {
      const resultado = await importarNotasExtras(params.tenant, "aluno", params.ano, arquivoNotasExtras);
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: `${resultado.processadas} nota(s) extra(s) lançada(s).`,
        life: 6000,
      });
      setShowImportarNotasModal(false);
      setArquivoNotasExtras(null);
      fetchData();
    } catch (err) {
      const erros = err.response?.data?.erros;
      if (erros?.length) {
        setErrosImportacaoNotas(erros);
        toast.current.show({
          severity: "error",
          summary: "Planilha com erros",
          detail: `${erros.length} linha(s) com problema. Nenhuma nota foi importada.`,
          life: 6000,
        });
      } else {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: err.response?.data?.message || "Não foi possível importar as notas extras.",
          life: 5000,
        });
      }
    } finally {
      setEnviandoNotasExtras(false);
    }
  };

  // Salva a edição inline de uma célula (resposta de formulário, campo de UserTenant,
  // ou uma das 4 colunas fixas editáveis: matrícula/curso/forma de ingresso/IRA). Não
  // escreve em rowData antes de confirmar — se der erro, a célula volta sozinha ao
  // valor antigo (o valor exibido só muda no refetch).
  // Aplica `patch` só na linha editada (por id), em itens e filteredItens, sem
  // recarregar a tabela inteira — evita o flash da barra de progresso a cada edição.
  const patchLinha = (id, patch) => {
    setItens((prev) => prev.map((item) => (item.id === id ? patch(item) : item)));
    setFilteredItens((prev) => prev.map((item) => (item.id === id ? patch(item) : item)));
  };

  const CAMPO_DB_COLUNA_FIXA = {
    matricula: "matricula",
    ira: "rendimentoAcademico",
    curso: "cursoId",
    formaIngresso: "formaIngressoId",
  };

  const handleCellEditComplete = async (e) => {
    const { rowData, newValue, value, field } = e;
    // O PrimeReact dispara esse evento sempre que sai do modo de edição (inclusive
    // só clicando pra fora sem mudar nada) — sem essa checagem, qualquer clique de
    // exploração na tabela dispararia um salvamento à toa.
    if (newValue === value) return;
    // Matrícula/IRA são campos de texto/número livre (digitação), diferente de
    // curso/forma de ingresso (dropdown, onde o valor exibido é o label, não o
    // id enviado ao back) — pra esses dois dá pra aplicar o valor digitado na
    // hora, sem esperar o servidor, e reverter se a chamada falhar.
    const camposDigitacaoOtimista = ["matricula", "ira"];
    if (camposDigitacaoOtimista.includes(field)) {
      patchLinha(rowData.id, (item) => ({ ...item, [field]: newValue }));
    }
    try {
      if (field.startsWith("campo_")) {
        const campoId = parseInt(field.replace("campo_", ""), 10);
        await comRetry(() => editarRespostaCampoGestor(params.tenant, rowData.id, campoId, newValue));
        const valorSalvo = Array.isArray(newValue) ? JSON.stringify(newValue) : String(newValue);
        patchLinha(rowData.id, (item) => {
          const respostas = item.respostas ? [...item.respostas] : [];
          const idx = respostas.findIndex((r) => r.campoId === campoId);
          if (idx >= 0) respostas[idx] = { ...respostas[idx], value: valorSalvo };
          else respostas.push({ campoId, value: valorSalvo });
          return { ...item, respostas };
        });
      } else if (field.startsWith("userTenant_")) {
        const campoId = field.replace("userTenant_", "");
        const campo = USER_TENANT_CAMPOS.find((c) => c.id === campoId);
        if (!campo?.campoDb) return;
        const userTenantAtualizado = await comRetry(() =>
          atualizarCampoUserTenant(params.tenant, rowData.user?.id, params.ano, campo.campoDb, newValue)
        );
        patchLinha(rowData.id, (item) => ({
          ...item,
          user: { ...item.user, UserTenant: [userTenantAtualizado] },
        }));
      } else if (CAMPO_DB_COLUNA_FIXA[field]) {
        const userTenantAtualizado = await comRetry(() =>
          atualizarCampoUserTenant(params.tenant, rowData.user?.id, params.ano, CAMPO_DB_COLUNA_FIXA[field], newValue)
        );
        patchLinha(rowData.id, (item) => ({
          ...item,
          user: { ...item.user, UserTenant: [userTenantAtualizado] },
          curso: userTenantAtualizado?.curso?.curso || "N/A",
          formaIngresso: userTenantAtualizado?.formaIngresso?.formaIngresso || "N/A",
          matricula: userTenantAtualizado?.matricula || "N/A",
          ira: userTenantAtualizado?.rendimentoAcademico ?? null,
        }));
      }
    } catch (err) {
      if (camposDigitacaoOtimista.includes(field)) {
        patchLinha(rowData.id, (item) => ({ ...item, [field]: value }));
      }
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: err.response?.data?.message || "Não foi possível salvar a edição.",
        life: 5000,
      });
    }
  };

  const abrirConfigModal = () => {
    setDraftColunas(colunasSelecionadas);
    setDraftUserTenantColunas(userTenantSelecionadas);
    setShowConfigModal(true);
  };

  const toggleCampoDraft = (campoId, checked) => {
    setDraftColunas((prev) =>
      checked ? [...prev, campoId] : prev.filter((id) => id !== campoId)
    );
  };

  const toggleUserTenantCampoDraft = (campoId, checked) => {
    setDraftUserTenantColunas((prev) =>
      checked ? [...prev, campoId] : prev.filter((id) => id !== campoId)
    );
  };

  const salvarConfigColunas = async () => {
    setSalvandoConfig(true);
    try {
      await upsertConfiguracaoTabela(params.tenant, CHAVE_CONFIG_COLUNAS, {
        campoIds: draftColunas,
        userTenantCampos: draftUserTenantColunas,
      });
      setColunasSelecionadas(draftColunas);
      setUserTenantSelecionadas(draftUserTenantColunas);
      setShowConfigModal(false);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao salvar a configuração de colunas.",
        life: 3000,
      });
    } finally {
      setSalvandoConfig(false);
    }
  };

  // Salva em segundo plano (sem travar a tabela) — se falhar, mantém a ordem
  // visual e só avisa por toast, mesmo padrão da edição inline de células.
  const handleColReorder = (e) => {
    const novaOrdem = e.columns.map((c) => c.props.field).filter(Boolean);
    setOrdemColunas(novaOrdem);
    upsertConfiguracaoTabela(params.tenant, CHAVE_ORDEM_COLUNAS, { ordem: novaOrdem }).catch(() => {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível salvar a ordem das colunas.",
        life: 3000,
      });
    });
  };

  // Filtros e ordenação (sort) são preferência pessoal do gestor, salvos só
  // localmente no navegador (não compartilhados entre gestores, ao contrário
  // da ordem das colunas). Guarda só esses dois pedaços do estado da tabela —
  // nunca `columnOrder`, que já é controlado por `ordemColunas` (backend).
  const salvarEstadoLocalTabela = (state) => {
    try {
      localStorage.setItem(
        `${CHAVE_LOCAL_FILTROS_ORDENACAO}_${params.tenant}`,
        JSON.stringify({
          filters: state.filters,
          sortField: state.sortField,
          sortOrder: state.sortOrder,
          multiSortMeta: state.multiSortMeta,
        })
      );
    } catch {
      // localStorage indisponível (modo privado, quota etc.) — ignora
    }
  };

  // O PrimeReact sempre mexe em first/rows (paginação) quando restaura QUALQUER
  // estado salvo, mesmo que a gente não tenha salvo esses campos — sem valor
  // aqui, ele seta first/rows como undefined e a paginação quebra (NaN, tabela
  // vazia). Por isso sempre devolve first/rows válidos, mesmo sem nada salvo.
  const restaurarEstadoLocalTabela = () => {
    try {
      const salvo = localStorage.getItem(`${CHAVE_LOCAL_FILTROS_ORDENACAO}_${params.tenant}`);
      return { first: 0, rows: 10, ...(salvo ? JSON.parse(salvo) : {}) };
    } catch {
      return { first: 0, rows: 10 };
    }
  };

  // Achata as respostas dos campos dinâmicos e os dados de UserTenant selecionados num
  // campo raso por linha (`campo_<id>` / `userTenant_<id>`), pra usar sort/filter nativos
  // do PrimeReact. Como o formulário de aluno é por edital, uma linha só recebe o valor
  // da resposta se o edital dela realmente usa o formulário dono desse campo — senão
  // mostra uma mensagem distinta de "sem resposta". Os campos de UserTenant não dependem
  // do edital (já vêm filtrados por tenant+ano na consulta).
  const anexarColunasExtras = (lista) => {
    if (colunasSelecionadas.length === 0 && userTenantSelecionadas.length === 0) return lista;
    return lista.map((item) => {
      const editalId = item.inscricao?.edital?.id;
      const extras = {};
      colunasSelecionadas.forEach((campoId) => {
        const campo = campoPorId.get(campoId);
        if (!campo) return;
        const aplicavel = editalParaCampoIds.get(editalId)?.has(campoId);
        extras[`campo_${campoId}`] = aplicavel
          ? formatarValorCampoDinamico(
              item.respostas?.find((r) => r.campoId === campoId),
              campo.tipo
            )
          : MENSAGEM_CAMPO_NAO_APLICAVEL;
      });
      const userTenant = item.user?.UserTenant?.[0];
      userTenantSelecionadas.forEach((campoId) => {
        const campo = USER_TENANT_CAMPOS.find((c) => c.id === campoId);
        if (!campo) return;
        extras[`userTenant_${campoId}`] = campo.getValor(userTenant);
      });
      return { ...item, ...extras };
    });
  };

  const filteredItensComCamposDinamicos = useMemo(
    () => anexarColunasExtras(filteredItens),
    [filteredItens, colunasSelecionadas, campoPorId, editalParaCampoIds, userTenantSelecionadas]
  );

  // Versão sobre a lista completa (não a filtrada) — usada pelo modal de
  // detalhes, pra linha continuar aparecendo lá mesmo se estiver fora do
  // filtro atual da tabela.
  const itensComCamposDinamicos = useMemo(
    () => anexarColunasExtras(itens),
    [itens, colunasSelecionadas, campoPorId, editalParaCampoIds, userTenantSelecionadas]
  );

  const filtersEfetivos = useMemo(() => {
    const merged = { ...filters };
    colunasSelecionadas.forEach((campoId) => {
      const field = `campo_${campoId}`;
      if (!merged[field]) {
        merged[field] = { value: null, matchMode: FilterMatchMode.CONTAINS };
      }
    });
    userTenantSelecionadas.forEach((campoId) => {
      const field = `userTenant_${campoId}`;
      if (!merged[field]) {
        merged[field] = { value: null, matchMode: FilterMatchMode.CONTAINS };
      }
    });
    return merged;
  }, [filters, colunasSelecionadas, userTenantSelecionadas]);

  const renderHeader = () => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block"><p>Busque por palavra-chave:</p></label>
      </div>
      <div className="flex align-items-center gap-2">
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Pesquisar..."
          style={{ width: "100%" }}
        />
        <RiSettings5Line
          className={styles.configIcon}
          onClick={abrirConfigModal}
          title="Configurar colunas extras"
        />
      </div>
      {selectedItems.length > 0 && (
        <div className="flex justify-start gap-2 mt-2">
          <Button
            label={`Aprovar (${selectedItems.length})`}
            icon="pi pi-check"
            className="p-button-success mr-2"
            onClick={handleAprovar}
            loading={loadingAprovar}
          />
          <Button
            label={`Reprovar (${selectedItems.length})`}
            icon="pi pi-times"
            className="p-button-danger"
            onClick={handleReprovar}
          />
          {loadingAprovar && (
            <div className="mt-2">
              <ProgressBar value={progress} style={{ height: "6px" }} showValue={false} />
              <small className="block text-center mt-1">{progress}% completo</small>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ---- Conteúdo do Modal ----
  const renderModalContent = () => {
    if (detailLoading) {
      return (
        <div className={styles.loadingCenter}>
          <ProgressSpinner style={{ width: 48, height: 48 }} />
        </div>
      );
    }

    if (!detailData) return null;

    const { participacao, formularioCampos } = detailData;
    const {
      user,
      fichaAvaliacao,
      respostas,
      statusParticipacao,
      justificativa,
      inscricao,
      NotaExtraParticipacao: notasExtras,
    } = participacao;
    const totalNotasExtras = (notasExtras || []).reduce((soma, n) => soma + n.valor, 0);
    const lattesMaisRecente = user?.cvLattes?.length
      ? user.cvLattes[user.cvLattes.length - 1]
      : null;
    const lattesInfo = lattesMaisRecente ? generateLattesText(lattesMaisRecente.url) : null;

    // Linha "ao vivo": vem de `itens` (mesma fonte da tabela), não de um
    // snapshot congelado — assim, quando uma edição feita aqui no modal
    // atualiza `itens` (via handleCellEditComplete/patchLinha), essa seção
    // reflete o valor novo sozinha, sem recarregar o modal.
    const linhaModal = itensComCamposDinamicos.find((i) => i.id === participacao.id);
    const salvarCampoModal = ({ field, newValue, value }) =>
      handleCellEditComplete({ rowData: linhaModal, newValue, value, field });

    return (
      <>
        {/* Header com gradiente */}
        <div className={styles.detailHeader}>
          <div className={styles.closeBtn} onClick={() => setModalVisible(false)}>
            <RiCloseLargeLine />
          </div>
          <div className={styles.headerTop}>
            <div className={styles.avatar}>
              {user?.nome?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className={styles.headerInfo}>
              <h4>{user?.nome || "—"}</h4>
              <p>Aluno · {inscricao?.edital?.titulo || ""}</p>
            </div>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusBadge}>{formatStatusText(statusParticipacao)}</span>
          </div>
          {justificativa && (
            <p className={styles.justificativa}>Justificativa: {justificativa}</p>
          )}
        </div>

        {/* Corpo */}
        <div className={styles.modalBody}>

          {/* Dados da Tabela — espelha as colunas visíveis na tabela, com
              edição inline nas que permitem edição */}
          {linhaModal && (
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}><RiEditLine size={18} /></div>
                <h6>Dados da Tabela</h6>
              </div>
              <div className={styles.boxContent}>
                <div className={styles.fieldGrid}>
                  {colunasOrdenadas.map((coluna) => (
                    <CampoModalEditavel
                      key={coluna.key}
                      coluna={coluna}
                      linha={linhaModal}
                      onSalvar={salvarCampoModal}
                      styles={styles}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dados Pessoais */}
          <div className={styles.box}>
            <div className={styles.header}>
              <div className={styles.icon}><RiUser2Line size={18} /></div>
              <h6>Dados Pessoais</h6>
            </div>
            <div className={styles.boxContent}>
              <div className={styles.fieldGrid}>
                {[
                  { label: "CPF", value: user?.cpf },
                  { label: "E-mail", value: user?.email },
                  { label: "Telefone", value: user?.telefone },
                  { label: "Edital", value: inscricao?.edital?.titulo },
                ]
                  .filter((f) => f.value)
                  .map((field, i) => (
                    <div key={i} className={styles.field}>
                      <p className={styles.fieldLabel}>{field.label}</p>
                      <p className={styles.fieldValue}>{field.value}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Currículo Lattes */}
          <div className={styles.box}>
            <div className={styles.header}>
              <div className={styles.icon}><RiFileTextLine size={18} /></div>
              <h6>Currículo Lattes</h6>
            </div>
            <div className={styles.boxContent}>
              {lattesMaisRecente ? (
                <>
                  <div className={styles.lattesItem}>
                    <RiCheckboxCircleLine size={18} className={styles.lattesOk} />
                    <span>Currículo enviado</span>
                  </div>
                  {lattesInfo?.formattedDate && (
                    <p className={styles.lattesDate}>
                      Enviado em {lattesInfo.formattedDate} às {lattesInfo.formattedTime}
                    </p>
                  )}
                  <a
                    href={lattesMaisRecente.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.externalLink}
                  >
                    <RiExternalLinkLine size={15} />
                    Visualizar CV Lattes
                  </a>
                  {user?.identificadorLattes && (
                    <a
                      href={`https://lattes.cnpq.br/${user.identificadorLattes}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.externalLink}
                    >
                      <RiExternalLinkLine size={15} />
                      Visualizar Lattes (CNPq)
                    </a>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.lattesItem}>
                    <RiCloseCircleLine size={18} className={styles.lattesMissing} />
                    <span>Nenhum currículo enviado</span>
                  </div>
                  {user?.identificadorLattes && (
                    <a
                      href={`https://lattes.cnpq.br/${user.identificadorLattes}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.externalLink}
                    >
                      <RiExternalLinkLine size={15} />
                      Visualizar Lattes (CNPq)
                    </a>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ficha de Avaliação Lattes */}
          {fichaAvaliacao && (
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}><RiStarLine size={18} /></div>
                <h6>Ficha de Avaliação Lattes</h6>
                <span className={styles.totalBadge}>
                  {fichaAvaliacao.nota ?? 0} / {fichaAvaliacao.notaMax ?? 0}
                </span>
              </div>
              <div className={styles.boxContent}>
                {fichaAvaliacao.grupos?.length > 0 ? (
                  fichaAvaliacao.grupos.map((grupo, i) => (
                    <GrupoAvaliacao key={i} grupo={grupo} nivel={0} />
                  ))
                ) : (
                  <p className={styles.emptyState}>Nenhum item de avaliação.</p>
                )}
              </div>
            </div>
          )}

          {/* Notas Extras */}
          <div className={styles.box}>
            <div className={styles.header}>
              <div className={styles.icon}><RiAddCircleLine size={18} /></div>
              <h6>Notas Extras</h6>
              {notasExtras?.length > 0 && (
                <span className={styles.totalBadge}>{totalNotasExtras}</span>
              )}
            </div>
            <div className={styles.boxContent}>
              {(notasExtras?.length ?? 0) === 0 ? (
                <p className={styles.emptyState}>Nenhuma nota extra lançada.</p>
              ) : (
                notasExtras.map((nota) => (
                  <div key={nota.id} className={styles.respostaItem}>
                    <p className={styles.respostaLabel}>
                      {nota.valor} pt{nota.valor === 1 ? "" : "s"}
                      {nota.user?.nome ? ` · lançada por ${nota.user.nome}` : ""}
                      {nota.createdAt ? ` · ${new Date(nota.createdAt).toLocaleDateString("pt-BR")}` : ""}
                    </p>
                    {nota.observacao && (
                      <div className={styles.respostaValue}>{nota.observacao}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Respostas ao Formulário */}
          {formularioCampos.length > 0 && (
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}><RiListCheck2 size={18} /></div>
                <h6>Respostas ao Formulário</h6>
              </div>
              <div className={styles.boxContent}>
                {(respostas?.length ?? 0) === 0 ? (
                  <p className={styles.emptyState}>Nenhuma resposta enviada.</p>
                ) : (
                  formularioCampos.map((campo) => {
                    const resposta = respostas?.find((r) => r.campoId === campo.id);
                    if (!resposta) return null;
                    const valor = resposta.value;
                    const valorExibido = (() => {
                      if (typeof valor === "boolean") return valor ? "Sim" : "Não";
                      if (!valor) return "—";
                      if (typeof valor === "string" && valor.startsWith("http")) {
                        return (
                          <a
                            href={valor}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.externalLink}
                          >
                            <RiExternalLinkLine size={14} />
                            Ver arquivo
                          </a>
                        );
                      }
                      try {
                        const parsed = JSON.parse(valor);
                        if (Array.isArray(parsed)) return parsed.join(", ");
                      } catch {}
                      return String(valor);
                    })();
                    return (
                      <div key={campo.id} className={styles.respostaItem}>
                        <p className={styles.respostaLabel}>{campo.label}</p>
                        <div className={styles.respostaValue}>{valorExibido}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  // Colunas fixas com `key` == `field`, reunidas com as dinâmicas num único
  // array pra poder ordenar conforme `ordemColunas` (persistido por tenant).
  const colunasFixas = [
    <Column key="id" field="id" header="ID" sortable filter filterPlaceholder="Filtrar por ID" showFilterMenu={false} style={{ width: "6rem" }} />,
    <Column key="inscricao.id" field="inscricao.id" header="ID Inscrição" sortable filter filterPlaceholder="Filtrar por ID" showFilterMenu={false} body={(rowData) => rowData.inscricao?.id ?? "-"} style={{ width: "6rem" }} />,
    <Column key="editalTitulo" field="editalTitulo" header="Edital" sortable filter filterField="inscricao.edital.titulo" filterElement={(options) => statusClassificacaoFilterTemplate(options, editaisOptions)} body={(rowData) => rowData.inscricao?.edital?.titulo || "N/A"} showFilterMenu={false} />,
    <Column
      key="planoDeTrabalho.statusClassificacao"
      field="planoDeTrabalho.statusClassificacao"
      header="Status Plano de Trabalho"
      sortable
      filter
      showFilterMenu={false}
      filterElement={(options) => statusClassificacaoFilterTemplate(options, statusOptions.classificacao)}
      body={(rowData) =>
        renderStatusTagWithJustificativa(
          rowData.planoDeTrabalho?.statusClassificacao,
          rowData.planoDeTrabalho?.justificativa,
          {
            onShowJustificativa: (j) => { setJustificativasAtuais(j); setShowJustificativas(true); },
          }
        )
      }
    />,
    <Column
      key="statusParticipacao"
      field="statusParticipacao"
      header="Status Participação"
      sortable
      filter
      showFilterMenu={false}
      filterElement={(options) => statusClassificacaoFilterTemplate(options, statusOptions.participacao)}
      body={(rowData) => (
        <div onClick={(e) => e.stopPropagation()}>
          {renderStatusTagWithJustificativa(rowData.statusParticipacao, rowData.justificativa, {
            onShowJustificativa: (j) => { setJustificativasAtuais(j); setShowJustificativas(true); },
          })}
        </div>
      )}
    />,
    <Column key="user.nome" field="user.nome" header="Nome" sortable filter filterPlaceholder="Buscar por nome" filterField="user.nome" showFilterMenu={false} />,
    <Column key="user.cpf" field="user.cpf" header="CPF" sortable filter filterPlaceholder="Buscar por CPF" filterField="user.cpf" showFilterMenu={false} style={{ minWidth: "180px" }} />,
    <Column
      key="curso"
      field="curso"
      header="Curso"
      sortable
      filter
      filterElement={(options) => statusClassificacaoFilterTemplate(options, cursosOptions)}
      showFilterMenu={false}
      editor={(options) => renderEditorDinamico("select", opcoesCursos, options)}
      editorTipo="select"
      body={(rowData) => rowData.curso}
    />,
    <Column
      key="formaIngresso"
      field="formaIngresso"
      header="Forma de Ingresso"
      sortable
      filter
      filterElement={(options) => statusClassificacaoFilterTemplate(options, formasIngressoOptions)}
      showFilterMenu={false}
      editor={(options) => renderEditorDinamico("select", opcoesFormaIngresso, options)}
      editorTipo="select"
      body={(rowData) => rowData.formaIngresso}
    />,
    <Column
      key="matricula"
      field="matricula"
      header="Matrícula"
      sortable
      filter
      filterPlaceholder="Filtrar matrícula"
      showFilterMenu={false}
      editor={(options) => renderEditorDinamico("text", [], options)}
      editorTipo="text"
      body={(rowData) => rowData.matricula}
    />,
    <Column
      key="ira"
      field="ira"
      header="Rendimento Acadêmico"
      sortable
      filter
      filterElement={notaRowFilterTemplate}
      filterMatchMode="intervalo_numerico"
      dataType="numeric"
      showFilterMenu={false}
      editor={(options) => renderEditorDinamico("number", [], options)}
      editorTipo="number"
      body={(rowData) => rowData.ira ?? "-"}
      style={{ width: "8rem" }}
    />,
    <Column key="solicitarBolsa" field="solicitarBolsa" header="Bolsa Solicitada" sortable filter filterElement={(options) => statusClassificacaoFilterTemplate(options, BOLSA_OPTIONS)} showFilterMenu={false} body={(rowData) => (rowData.solicitarBolsa ? "Sim" : "Não")} style={{ width: "8rem" }} />,
    <Column key="solicitacoesBolsaCpf" field="solicitacoesBolsaCpf" header="Bolsas Solicitadas (CPF)" sortable filter filterElement={inteiroRowFilterTemplate} filterMatchMode="intervalo_numerico" dataType="numeric" showFilterMenu={false} style={{ textAlign: "center", width: "7rem" }} />,
    <Column key="fichaAvaliacao.nota" field="fichaAvaliacao.nota" header="Nota Total (Ficha)" sortable filter filterElement={notaRowFilterTemplate} filterMatchMode="intervalo_numerico" dataType="numeric" showFilterMenu={false} body={(rowData) => rowData.fichaAvaliacao?.nota ?? "-"} style={{ textAlign: "center", width: "7rem" }} />,
    <Column key="totalNotasExtras" field="totalNotasExtras" header="Total Notas Extras" sortable filter filterElement={notaRowFilterTemplate} filterMatchMode="intervalo_numerico" dataType="numeric" showFilterMenu={false} style={{ textAlign: "center", width: "7rem" }} />,
    <Column key="quantidadeNotasExtras" field="quantidadeNotasExtras" header="Qtd. Notas Extras" sortable filter filterElement={inteiroRowFilterTemplate} filterMatchMode="intervalo_numerico" dataType="numeric" showFilterMenu={false} style={{ textAlign: "center", width: "7rem" }} />,
    <Column key="notaTotalGeral" field="notaTotalGeral" header="Nota Total Geral" sortable filter filterElement={notaRowFilterTemplate} filterMatchMode="intervalo_numerico" dataType="numeric" showFilterMenu={false} style={{ textAlign: "center", width: "7rem" }} />,
  ];

  const colunasDinamicasFormulario = colunasSelecionadas.map((campoId) => {
    const campo = campoPorId.get(campoId);
    if (!campo) return null;
    const field = `campo_${campoId}`;
    const tipoEditorCampo = tipoEditorParaCampoFormulario(campo.tipo);
    const opcoesEditorCampo =
      campo.tipo === "flag"
        ? SIM_NAO_OPTIONS
        : (campo.opcoes || []).map((o) => ({ label: o.label, value: o.label }));
    return (
      <Column
        key={field}
        field={field}
        header={campo.label}
        sortable
        filter
        filterPlaceholder={`Filtrar por ${campo.label.toLowerCase()}`}
        filterField={field}
        showFilterMenu={false}
        editor={
          tipoEditorCampo
            ? (options) => renderEditorDinamico(tipoEditorCampo, opcoesEditorCampo, options)
            : undefined
        }
        editorTipo={tipoEditorCampo}
        body={(rowData) => {
          const valor = rowData[field];
          if (valor === MENSAGEM_CAMPO_NAO_APLICAVEL) {
            return <span className={styles.naoAplicavel}>{valor}</span>;
          }
          if (campo.tipo === "link" || campo.tipo === "arquivo") {
            const resposta = rowData.respostas?.find((r) => r.campoId === campoId);
            return renderCelulaComLink(
              valor,
              resposta?.value,
              campo.tipo === "link" ? "Abrir link" : "Ver arquivo"
            );
          }
          return valor;
        }}
        style={{ minWidth: "10rem" }}
      />
    );
  }).filter(Boolean);

  const colunasDinamicasUserTenant = userTenantSelecionadas.map((campoId) => {
    const campo = USER_TENANT_CAMPOS.find((c) => c.id === campoId);
    if (!campo) return null;
    const field = `userTenant_${campoId}`;
    const opcoesEditorCampo = campo.opcoesKey ? OPCOES_POR_CHAVE[campo.opcoesKey] : [];
    return (
      <Column
        key={field}
        field={field}
        header={campo.label}
        sortable
        filter
        filterPlaceholder={`Filtrar por ${campo.label.toLowerCase()}`}
        filterField={field}
        showFilterMenu={false}
        editor={
          campo.tipoEditor
            ? (options) => renderEditorDinamico(campo.tipoEditor, opcoesEditorCampo, options)
            : undefined
        }
        editorTipo={campo.tipoEditor}
        body={(rowData) => {
          const valor = rowData[field];
          if (campo.tipo === "link" || campo.tipo === "arquivo") {
            const userTenant = rowData.user?.UserTenant?.[0];
            return renderCelulaComLink(
              valor,
              campo.getUrl?.(userTenant),
              campo.tipo === "link" ? "Abrir link" : "Ver arquivo"
            );
          }
          return valor;
        }}
        style={{ minWidth: "10rem" }}
      />
    );
  }).filter(Boolean);

  const colunasOrdenadas = ordenarColunasPorChave(
    [...colunasFixas, ...colunasDinamicasFormulario, ...colunasDinamicasUserTenant],
    ordemColunas
  );

  return (
    <main>
      <Toast ref={toast} />

      {/* Modal de detalhes do aluno */}
      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        size="large"
        noPadding={true}
        showIconClose={false}
      >
        {renderModalContent()}
      </Modal>

      <Card className="custom-card">
        <div className="flex-space pt-2 pr-2 pl-2">
          <h5 className="m-0">Seleção de Alunos</h5>
          <div className="flex gap-2">
            <Button
              label="Baixar Modelo (Notas Extras)"
              icon="pi pi-file-excel"
              className="p-button-outlined p-button-sm"
              onClick={handleBaixarModelo}
              loading={baixandoModelo}
            />
            <Button
              label="Importar Notas Extras"
              icon="pi pi-upload"
              className="p-button-outlined p-button-sm"
              onClick={() => setShowImportarNotasModal(true)}
            />
            <Button
              label="Exportar Excel"
              icon="pi pi-download"
              className="p-button-outlined p-button-sm"
              onClick={handleExportar}
              loading={loadingExportar}
            />
          </div>
        </div>
        {loading ? (
          <div className="pr-2 pl-2 pb-2 pt-2">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          </div>
        ) : error ? (
          <Message severity="error" text={error} />
        ) : (
          <DataTable
            ref={dataTableRef}
            className={styles.tabelaQuebraCabecalho}
            value={filteredItensComCamposDinamicos}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            scrollable
            selectionMode="checkbox"
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            dataKey="id"
            sortMode="multiple"
            reorderableColumns
            onColReorder={handleColReorder}
            stateStorage="custom"
            customSaveState={salvarEstadoLocalTabela}
            customRestoreState={restaurarEstadoLocalTabela}
            header={renderHeader()}
            filters={filtersEfetivos}
            onFilter={(e) => {
              setFilters(e.filters);
              setFilteredItens(e.filteredValue || itens);
              setSelectedItems([]);
            }}
            filterDisplay="row"
            globalFilterFields={[
              "inscricao.edital.titulo",
              "user.nome",
              "user.cpf",
              "curso",
              "formaIngresso",
              "matricula",
              ...colunasSelecionadas.map((campoId) => `campo_${campoId}`),
              ...userTenantSelecionadas.map((campoId) => `userTenant_${campoId}`),
            ]}
            emptyMessage="Nenhuma participação encontrada."
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
          >
            <Column selectionMode="multiple" frozen headerStyle={{ width: "3rem" }} />
            {colunasOrdenadas}
            <Column
              header=""
              frozen
              alignFrozen="right"
              body={(rowData) => (
                <Button
                  icon="pi pi-chevron-right"
                  className="p-button-text p-button-plain p-button-sm"
                  style={{ color: "#94a3b8" }}
                  title="Ver detalhes"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(rowData);
                  }}
                />
              )}
              style={{ width: "3rem" }}
            />
          </DataTable>
        )}
      </Card>

      {/* Dialog Reprovar */}
      <Dialog
        header="Confirmar Reprovação"
        visible={displayReprovarDialog}
        onHide={() => { setDisplayReprovarDialog(false); setMotivoReprova(""); setProgress(0); }}
        style={{ width: "450px" }}
        footer={
          <div>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={() => { setDisplayReprovarDialog(false); setMotivoReprova(""); }} />
            <Button label="Confirmar" icon="pi pi-check" className="p-button-danger" onClick={confirmarReprova} loading={loadingReprovar} autoFocus />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="motivo">Motivo da reprovação</label>
            <InputTextarea
              id="motivo"
              value={motivoReprova}
              onChange={(e) => setMotivoReprova(e.target.value)}
              rows={3}
              autoResize
              placeholder="Digite o motivo..."
            />
          </div>
        </div>
        {loadingReprovar && (
          <div className="mt-3">
            <ProgressBar value={progress} style={{ height: "6px" }} showValue={false} />
            <small className="block text-center mt-1">{progress}% completo</small>
          </div>
        )}
      </Dialog>

      {/* Dialog Justificativa */}
      <Dialog
        header="Justificativa"
        visible={showJustificativas}
        style={{ width: "50vw" }}
        onHide={() => setShowJustificativas(false)}
      >
        <div style={{ whiteSpace: "pre-line", marginBottom: 12 }}>{justificativasAtuais}</div>
      </Dialog>

      {/* Modal de configuração de colunas extras (respostas do formulário de aluno) */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        size="small"
      >
        <div className={styles.configModal}>
          <h5 className="mb-2">Configurar colunas extras</h5>

          <p className={styles.grupoCamposTitulo}>Respostas do formulário de aluno</p>
          {gruposCamposPicker.length === 0 ? (
            <p className="mb-2">Nenhum campo de formulário disponível para os editais listados.</p>
          ) : (
            gruposCamposPicker.map((grupo) => (
              <div key={grupo.editalId} className={styles.grupoCampos}>
                <p className={styles.grupoCamposSubtitulo}>{grupo.editalTitulo}</p>
                <ul className={styles.camposList}>
                  {grupo.campos.map((campo) => (
                    <li key={campo.id} className="flex align-items-center gap-2 mb-2">
                      <Checkbox
                        inputId={`campo-${campo.id}`}
                        checked={draftColunas.includes(campo.id)}
                        onChange={(e) => toggleCampoDraft(campo.id, e.checked)}
                      />
                      <label htmlFor={`campo-${campo.id}`}>{campo.label}</label>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}

          <p className={styles.grupoCamposTitulo}>
            Dados institucionais do usuário ({params.ano})
          </p>
          <ul className={styles.camposList}>
            {USER_TENANT_CAMPOS.map((campo) => (
              <li key={campo.id} className="flex align-items-center gap-2 mb-2">
                <Checkbox
                  inputId={`userTenant-${campo.id}`}
                  checked={draftUserTenantColunas.includes(campo.id)}
                  onChange={(e) => toggleUserTenantCampoDraft(campo.id, e.checked)}
                />
                <label htmlFor={`userTenant-${campo.id}`}>{campo.label}</label>
              </li>
            ))}
          </ul>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              label="Cancelar"
              className="p-button-text"
              onClick={() => setShowConfigModal(false)}
            />
            <Button label="Salvar" onClick={salvarConfigColunas} loading={salvandoConfig} />
          </div>
        </div>
      </Modal>

      {/* Modal de importação de notas extras */}
      <Modal
        isOpen={showImportarNotasModal}
        onClose={() => { setShowImportarNotasModal(false); setArquivoNotasExtras(null); setErrosImportacaoNotas([]); }}
        size="small"
      >
        <div className={styles.configModal}>
          <h5 className="mb-2">Importar Notas Extras</h5>
          <p className="mb-2">
            Baixe o modelo, preencha as colunas “Nota Extra” (número) e “Observação Nota Extra”
            (texto, até 200 caracteres) e envie a planilha aqui. Cada envio soma uma nova nota
            extra por participação — não substitui lançamentos anteriores. Se qualquer linha
            estiver com problema, nenhuma nota é importada.
          </p>
          <FileInput
            label="Planilha preenchida (.xlsx)"
            onFileSelect={(file) => { setArquivoNotasExtras(file); setErrosImportacaoNotas([]); }}
            disabled={enviandoNotasExtras}
          />
          {errosImportacaoNotas.length > 0 && (
            <div className="mt-2">
              <p className={styles.grupoCamposTitulo}>
                {errosImportacaoNotas.length} erro(s) — nada foi importado
              </p>
              <ul className={styles.camposList}>
                {errosImportacaoNotas.map((erro, i) => (
                  <li key={i} className={styles.erroImportacao}>
                    Linha {erro.linha} (ID {erro.id ?? "-"}): {erro.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-content-end gap-2 mt-3">
            <Button
              label="Cancelar"
              className="p-button-text"
              onClick={() => { setShowImportarNotasModal(false); setArquivoNotasExtras(null); setErrosImportacaoNotas([]); }}
            />
            <Button
              label="Enviar"
              onClick={handleImportarNotasExtras}
              loading={enviandoNotasExtras}
              disabled={!arquivoNotasExtras}
            />
          </div>
        </div>
      </Modal>
    </main>
  );
};

export default Page;

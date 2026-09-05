"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
} from "@remixicon/react";
import Button from "@/components/Button";
import ModalSubmissaoAdmin from "@/components/ModalSubmissaoAdmin";
import {
  getListaSubmissao,
  updateSubmissaoStatus,
} from "@/app/api/client/submissao";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import { FilterMatchMode } from "primereact/api";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import styles from "./page.module.scss";

const STATUS_LABEL = {
  AGUARDANDO_AVALIACAO: "Aguardando avaliação",
  EM_AVALIACAO: "Em avaliação",
  AVALIADA: "Avaliada",
  SELECIONADA: "Selecionada",
  DISTRIBUIDA: "Checkin pendente",
  AUSENTE: "Ausente",
};

const statusLabel = (status) => STATUS_LABEL[status] || status || "—";

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
// "statusIconBtnAusente" / "statusIconBtnAusenteAtivo" no page.module.scss).
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

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [submissoes, setSubmissoes] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [isExportando, setIsExportando] = useState(false);

  const [filtroAreaIds, setFiltroAreaIds] = useState([]);
  const [filtroCategorias, setFiltroCategorias] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState([]);
  const [filtroSubsessaoIds, setFiltroSubsessaoIds] = useState([]);

  const [submissaoSelecionadaId, setSubmissaoSelecionadaId] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [statusAtualizandoId, setStatusAtualizandoId] = useState(null);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "Resumo.titulo": { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const orientadoresLabel = (submissao) =>
    (submissao.Resumo?.participacoes || [])
      .filter(
        (item) => item.cargo === "ORIENTADOR" || item.cargo === "COORIENTADOR",
      )
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

  const fetchData = async (eventoSlug) => {
    setLoading(true);
    try {
      const response = await getListaSubmissao(eventoSlug);
      const comBusca = (response || []).map((submissao) => ({
        ...submissao,
        participantesBusca: (submissao.Resumo?.participacoes || [])
          .map((item) => `${item.user?.nome || ""} ${item.user?.cpf || ""}`)
          .join(" "),
      }));
      setSubmissoes(comBusca);
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(params.eventoSlug);
  }, [params.eventoSlug]);

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
    const categorias = new Set(
      submissoes.map((s) => s.categoria).filter(Boolean),
    );
    return [...categorias]
      .sort()
      .map((categoria) => ({ value: categoria, label: categoria }));
  }, [submissoes]);

  const opcoesStatus = useMemo(() => {
    const statusPresentes = new Set(
      submissoes.map((s) => s.status).filter(Boolean),
    );
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
        subsessao.inicio,
      )} ${formatarHora(subsessao.inicio)}`;
      if (!porLabel.has(label)) {
        porLabel.set(label, { value: label, label });
      }
    });
    return [...porLabel.values()].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [submissoes]);

  const subsessaoLabel = (submissao) => {
    const subsessao = submissao.subsessao;
    if (!subsessao) return null;
    return `${subsessao.sessaoApresentacao?.titulo} — ${formatarData(
      subsessao.inicio,
    )} ${formatarHora(subsessao.inicio)}`;
  };

  const submissoesFiltradas = useMemo(() => {
    return submissoes.filter((submissao) => {
      if (
        filtroAreaIds.length > 0 &&
        !filtroAreaIds.includes(submissao.Resumo?.area?.area)
      ) {
        return false;
      }
      if (
        filtroCategorias.length > 0 &&
        !filtroCategorias.includes(submissao.categoria)
      ) {
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
      return true;
    });
  }, [
    submissoes,
    filtroAreaIds,
    filtroCategorias,
    filtroStatus,
    filtroSubsessaoIds,
  ]);

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

  const handleStatusChange = async (rowData, novoStatus) => {
    if (rowData.status === novoStatus || statusAtualizandoId) return;
    setStatusAtualizandoId(rowData.id);
    try {
      await updateSubmissaoStatus(params.eventoSlug, rowData.id, novoStatus);
      setSubmissoes((prev) =>
        prev.map((s) =>
          s.id === rowData.id ? { ...s, status: novoStatus } : s
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar status da submissão:", error);
    } finally {
      setStatusAtualizandoId(null);
    }
  };

  const areaBodyTemplate = (rowData) =>
    rowData.Resumo?.area?.area || "Sem área";

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
    const ehAlteravel = STATUS_ALTERAVEIS.some(
      (opcao) => opcao.value === rowData.status
    );
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
        {!ehAlteravel && (
          <p className={styles.statusAviso}>Definido automaticamente</p>
        )}
      </div>
    );
  };

  const posterNumeroBodyTemplate = (rowData) =>
    rowData.square?.[0]?.numero ?? "—";

  const premioBodyTemplate = (rowData) => (
    <div className="flex gap-1">
      {rowData.premio && <Tag severity="warning" value="Premiado" />}
      {rowData.indicacaoPremio && <Tag severity="info" value="Indicação" />}
      {rowData.mencaoHonrosa && (
        <Tag severity="success" value="Menção honrosa" />
      )}
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
      const dados =
        dataTableRef.current?.getFilteredValue?.() ?? submissoesFiltradas;

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
          poster: posterNumeroBodyTemplate(submissao),
          notaFinal: submissao.notaFinal ?? "N/A",
          premio: submissao.premio ? "Sim" : "Não",
          indicacaoPremio: submissao.indicacaoPremio ? "Sim" : "Não",
          mencaoHonrosa: submissao.mencaoHonrosa ? "Sim" : "Não",
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Submissoes-${params.eventoSlug}.xlsx`);
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
    <div className={styles.navContent}>
      <ModalSubmissaoAdmin
        isOpen={modalAberto}
        onClose={fecharDetalhe}
        eventoSlug={params.eventoSlug}
        idSubmissao={submissaoSelecionadaId}
        onDataUpdated={() => fetchData(params.eventoSlug)}
      />

      <div className={styles.dashboard}>
        <div className={styles.tituloPagina}>
          <h5>Lista de Submissões</h5>
        </div>

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
            {submissoesFiltradas.length} de {submissoes.length}{" "}
            {submissoes.length === 1 ? "submissão" : "submissões"}
          </p>

          <DataTable
            ref={dataTableRef}
            className={styles.eventoTable}
            value={submissoesFiltradas}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            loading={loading}
            filters={filters}
            globalFilterFields={["Resumo.titulo", "participantesBusca"]}
            header={header}
            emptyMessage="Nenhuma submissão encontrada."
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} submissões"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          >
            <Column
              header="Ver"
              body={acoesBodyTemplate}
              style={{ width: "60px", textAlign: "center" }}
            />
            <Column
              header="Status"
              body={statusBodyTemplate}
              sortable
              sortField={(rowData) => statusLabel(rowData.status)}
              style={{ width: "240px", maxWidth: "240px" }}
            />
            <Column
              header="Pôster"
              body={posterNumeroBodyTemplate}
              style={{ width: "80px", textAlign: "center" }}
            />
            <Column
              header="Subsessão"
              body={subsessaoBodyTemplate}
              sortable
              sortField={(rowData) => subsessaoLabel(rowData) || ""}
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
              body={(rowData) => (
                <span className={styles.tituloCell}>
                  {rowData.Resumo?.titulo}
                </span>
              )}
              sortable
              style={{ width: "200px", maxWidth: "200px" }}
            />
            <Column
              header="Área"
              body={areaBodyTemplate}
              sortable
              sortField={(rowData) => areaBodyTemplate(rowData)}
            />
            <Column
              header="Instituição"
              body={instituicaoBodyTemplate}
              sortable
              sortField={(rowData) => getInstituicaoSigla(rowData)}
            />
            <Column field="categoria" header="Categoria" sortable />
            <Column field="notaFinal" header="Nota Final" sortable />
            <Column header="Prêmio" body={premioBodyTemplate} />
          </DataTable>
        </section>
      </div>
    </div>
  );
};

export default Page;

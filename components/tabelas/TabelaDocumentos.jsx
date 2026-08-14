"use client";
// HOOKS
import { useEffect, useState, useRef } from "react";

// PRIMEREACT
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

// SERVIÇOS
import {
  getAllDocumentos,
  recusarDocumento,
  deleteDocumentoNaoAssinado,
} from "@/app/api/client/documentos";
import { formatStatusText, getSeverityByStatus } from "@/lib/tagUtils";
import { statusClassificacaoFilterTemplate } from "@/lib/tableTemplates";
import styles from "./TabelaDocumentos.module.scss";

// Tamanho do lote de exclusões simultâneas ao excluir em massa, pra não
// disparar todas as requisições de uma vez só.
const BATCH_SIZE_EXCLUSAO = 5;

const TIPO_DOCUMENTO_OPCOES = [
  "EXTERNO",
  "TERMO",
  "DECLARACAO",
  "FORMULARIO",
].map((tipo) => ({ label: formatStatusText(tipo), value: tipo }));

const STATUS_DOCUMENTO_OPCOES = [
  "PENDENTE",
  "ENVIADO",
  "ACEITO",
  "RECUSADO",
  "AGUARDANDO_VALIDACAO",
].map((status) => ({ label: formatStatusText(status), value: status }));

// Status em que o documento ainda pode ser recusado pelo gestor (tudo que não é ACEITO).
const STATUS_RECUSAVEIS = ["PENDENTE", "ENVIADO", "AGUARDANDO_VALIDACAO"];
// Status em que o documento pode ser excluído (mesma regra do backend).
const STATUS_EXCLUIVEIS = ["PENDENTE", "RECUSADO"];

const TabelaDocumentos = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [expandedRows, setExpandedRows] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [excluindoSelecionados, setExcluindoSelecionados] = useState(false);
  const [progressoExclusao, setProgressoExclusao] = useState(0);

  const toast = useRef(null);

  // FILTROS
  const [filters, setFilters] = useState({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    "documentoTemplate.tipoDocumento": { value: [], matchMode: FilterMatchMode.IN },
    status: { value: [], matchMode: FilterMatchMode.IN },
  });

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const documentos = await getAllDocumentos(params.tenant, params.ano);

      const documentosProcessados = (documentos || []).map((doc) => {
        // Documentos de justificativa de ausência (acaoAposAssinaturas ===
        // JUSTIFICAR_AUSENCIA_SUBMISSAO) não têm participacaoId nem
        // inscricaoProjetoId — o único vínculo com aluno/plano vem daqui.
        const planoJustificativa =
          doc.justificativaApresentacaoCongresso?.planoDeTrabalho;
        const alunoJustificativa = planoJustificativa?.participacoes?.[0]?.user;

        const pessoa =
          doc.participacao?.user?.nome ??
          doc.inscricaoProjeto?.inscricao?.proponente?.nome ??
          alunoJustificativa?.nome ??
          "—";

        const planoDeTrabalho = doc.participacao?.planoDeTrabalho?.titulo
          ? doc.participacao.planoDeTrabalho.titulo
          : doc.inscricaoProjeto?.projeto?.titulo
          ? `Projeto: ${doc.inscricaoProjeto.projeto.titulo}`
          : planoJustificativa?.titulo ?? "—";

        const totalAssinaturas = doc.assinaturas?.length ?? 0;
        const assinadas =
          doc.assinaturas?.filter((a) => a.dataAssinatura).length ?? 0;

        return {
          ...doc,
          pessoa,
          planoDeTrabalho,
          assinaturasResumo: `${assinadas}/${totalAssinaturas}`,
        };
      });

      setItens(documentosProcessados);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar documentos",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, params.ano]);

  // HANDLERS
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const handleRecusar = (rowData) => {
    confirmDialog({
      message: `Recusar o documento #${rowData.id}? O status ficará como Recusado e o documento passará a poder ser excluído.`,
      header: "Recusar documento",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim, recusar",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          await recusarDocumento(params.tenant, rowData.id);
          toast.current?.show({
            severity: "success",
            summary: "Sucesso",
            detail: "Documento recusado com sucesso",
            life: 3000,
          });
          fetchInitialData();
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Erro",
            detail:
              error?.response?.data?.message || "Falha ao recusar documento",
            life: 3000,
          });
        }
      },
    });
  };

  const handleExcluir = (rowData) => {
    confirmDialog({
      message: `Excluir definitivamente o documento #${rowData.id}? Esta ação não pode ser desfeita.`,
      header: "Excluir documento",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim, excluir",
      rejectLabel: "Cancelar",
      accept: async () => {
        try {
          await deleteDocumentoNaoAssinado(params.tenant, rowData.id);
          toast.current?.show({
            severity: "success",
            summary: "Sucesso",
            detail: "Documento excluído com sucesso",
            life: 3000,
          });
          setItens((prev) => prev.filter((item) => item.id !== rowData.id));
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Erro",
            detail:
              error?.response?.data?.message || "Falha ao excluir documento",
            life: 3000,
          });
        }
      },
    });
  };

  const handleExcluirSelecionados = () => {
    const idsSelecionados = selectedItems.map((item) => item.id);
    if (!idsSelecionados.length) return;

    confirmDialog({
      message: `Excluir definitivamente ${idsSelecionados.length} documento(s) selecionado(s)? Esta ação não pode ser desfeita.`,
      header: "Excluir documentos selecionados",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim, excluir",
      rejectLabel: "Cancelar",
      accept: async () => {
        setExcluindoSelecionados(true);
        setProgressoExclusao(0);
        const excluidos = [];
        const falhas = [];

        try {
          const total = idsSelecionados.length;
          for (let i = 0; i < total; i += BATCH_SIZE_EXCLUSAO) {
            const lote = idsSelecionados.slice(i, i + BATCH_SIZE_EXCLUSAO);
            const resultados = await Promise.allSettled(
              lote.map((id) => deleteDocumentoNaoAssinado(params.tenant, id))
            );
            resultados.forEach((resultado, index) => {
              if (resultado.status === "fulfilled") {
                excluidos.push(lote[index]);
              } else {
                falhas.push(lote[index]);
              }
            });
            setProgressoExclusao(
              Math.round((Math.min(i + BATCH_SIZE_EXCLUSAO, total) / total) * 100)
            );
          }

          toast.current?.show({
            severity: falhas.length ? "warn" : "success",
            summary: falhas.length ? "Concluído com falhas" : "Sucesso",
            detail: `${excluidos.length} documento(s) excluído(s)${
              falhas.length ? `, ${falhas.length} não puderam ser excluídos` : ""
            }.`,
            life: 4000,
          });

          setItens((prev) => prev.filter((item) => !excluidos.includes(item.id)));
          setSelectedItems((prev) =>
            prev.filter((item) => !excluidos.includes(item.id))
          );
        } finally {
          setExcluindoSelecionados(false);
        }
      },
    });
  };

  // TEMPLATES
  const renderHeader = () => {
    return (
      <div className="flex flex-wrap justify-content-between align-items-center">
        <InputText
          className="w-100"
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Pesquisar por nome, ID ou plano de trabalho..."
        />
      </div>
    );
  };

  const statusBodyTemplate = (rowData) => (
    <Tag rounded severity={getSeverityByStatus(rowData.status)}>
      {formatStatusText(rowData.status)}
    </Tag>
  );

  const acoesBodyTemplate = (rowData) => (
    <div className="flex gap-1">
      {STATUS_RECUSAVEIS.includes(rowData.status) && (
        <Button
          label="Recusar"
          icon="pi pi-times-circle"
          className="p-button-warning p-button-sm"
          onClick={() => handleRecusar(rowData)}
        />
      )}
      {STATUS_EXCLUIVEIS.includes(rowData.status) && (
        <Button
          label="Excluir"
          icon="pi pi-trash"
          className="p-button-danger p-button-sm"
          onClick={() => handleExcluir(rowData)}
        />
      )}
    </div>
  );

  const rowExpansionTemplate = (rowData) => (
    <div className="p-3">
      <h6>Assinaturas</h6>
      <ul>
        {(rowData.assinaturas || []).map((assinatura) => (
          <li key={assinatura.id}>
            <strong>{formatStatusText(assinatura.tipoSignatario)}</strong>
            {" — "}
            {assinatura.user?.nome || "Não definido"}:{" "}
            {assinatura.dataAssinatura
              ? `Assinado em ${new Date(
                  assinatura.dataAssinatura
                ).toLocaleDateString("pt-BR")}`
              : "Pendente"}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <Card className="custom-card mb-2 mt-2 pt-1">
        {loading ? (
          <div className="pr-2 pl-2 pb-2 pt-2">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          </div>
        ) : (
          <>
          {selectedItems.length > 0 && (
            <div className={`flex align-items-center gap-2 mb-2 ${styles.acaoLote}`}>
              <span>{selectedItems.length} documento(s) selecionado(s)</span>
              <Button
                label="Excluir selecionados"
                icon="pi pi-trash"
                className="p-button-danger p-button-sm"
                onClick={handleExcluirSelecionados}
                disabled={excluindoSelecionados}
              />
            </div>
          )}
          {excluindoSelecionados && (
            <ProgressBar value={progressoExclusao} style={{ height: "6px" }} className="mb-2" />
          )}
          <DataTable
            value={itens}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            scrollable
            selectionMode="checkbox"
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            isDataSelectable={(e) => STATUS_EXCLUIVEIS.includes(e.data.status)}
            dataKey="id"
            header={renderHeader()}
            filters={filters}
            onFilter={(e) => {
              setFilters(e.filters);
              setSelectedItems([]);
            }}
            filterDisplay="row"
            globalFilterFields={[
              "id",
              "pessoa",
              "planoDeTrabalho",
              "documentoTemplate.titulo",
            ]}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data)}
            rowExpansionTemplate={rowExpansionTemplate}
            emptyMessage="Nenhum documento encontrado."
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column expander style={{ width: "3rem" }} />
            <Column field="id" header="ID" sortable filter filterField="id" />
            <Column
              field="documentoTemplate.tipoDocumento"
              header="Tipo de Documento"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, TIPO_DOCUMENTO_OPCOES)
              }
              showFilterMenu={false}
              filterField="documentoTemplate.tipoDocumento"
              body={(rowData) =>
                formatStatusText(rowData.documentoTemplate?.tipoDocumento)
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="documentoTemplate.titulo"
              header="Documento"
              sortable
              body={(rowData) => rowData.documentoTemplate?.titulo || "—"}
            />
            <Column field="pessoa" header="Pessoa" sortable />
            <Column
              field="planoDeTrabalho"
              header="Plano de Trabalho"
              sortable
            />
            <Column
              field="status"
              header="Status"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, STATUS_DOCUMENTO_OPCOES)
              }
              showFilterMenu={false}
              filterField="status"
              body={statusBodyTemplate}
              style={{ width: "12rem" }}
            />
            <Column
              field="assinaturasResumo"
              header="Assinaturas"
              style={{ width: "8rem", textAlign: "center" }}
            />
            <Column header="Ações" body={acoesBodyTemplate} style={{ width: "14rem" }} />
          </DataTable>
          </>
        )}
      </Card>
      <ConfirmDialog />
      <Toast ref={toast} />
    </>
  );
};

export default TabelaDocumentos;

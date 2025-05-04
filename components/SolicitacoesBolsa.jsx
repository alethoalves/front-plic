"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  getVinculosByTenant,
  processarSolicitacoesBolsa,
} from "@/app/api/client/bolsa";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressBar } from "primereact/progressbar";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import styles from "./SolicitacoesBolsa.module.scss";
import { InputText } from "primereact/inputtext";
import { FilterService } from "primereact/api";
import {
  notaRowFilterTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import {
  formatStatusText,
  getSeverityByStatus,
  renderStatusTagWithJustificativa,
} from "@/lib/tagUtils";
import { aprovarVinculo, recusarVinculo } from "@/app/api/client/bolsa";
import { statusOptions } from "@/lib/statusOptions";

FilterService.register("intervalo", (value, filters) => {
  const [min, max] = filters || [null, null];
  if (min === null && max === null) return true;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
});
const getInitialFilters = () => ({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  "participacao.inscricao.edital.titulo": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  "participacao.planoDeTrabalho.statusClassificacao": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  "participacao.statusParticipacao": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  "solicitacaoBolsa.status": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  orientadores: {
    // Novo filtro para orientadores
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  status: { value: null, matchMode: FilterMatchMode.IN },
  "participacao.user.nome": {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  vinculosAprovados: {
    value: [null, null],
    matchMode: "intervalo",
  },
  notaTotal: {
    value: [null, null],
    matchMode: "intervalo",
  },
  rendimentoAcademico: {
    value: [null, null],
    matchMode: "intervalo",
  },
  "solicitacaoBolsa.ordemRecebimentoBolsa": {
    value: [null, null],
    matchMode: "intervalo",
  },
});
const SolicitacoesBolsa = ({}) => {
  const params = useParams();
  const { tenant, ano } = params;
  const toast = useRef(null);

  // Estados principais
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingProcessar, setLoadingProcessar] = useState(false);
  const [progressProcessar, setProgressProcessar] = useState(0);
  // Estados para diálogos
  const [displayNegarDialog, setDisplayNegarDialog] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [editaisOptions, setEditaisOptions] = useState([]);
  const [classificacaoStatusOptions, setClassificacaoStatusOptions] = useState(
    []
  );
  const [solicitacaoStatusOptions, setSolicitacaoStatusOptions] = useState([]);
  const [vinculoStatusOptions, setVinculoStatusOptions] = useState([]);
  const [participacaoStatusOptions, setParticipacaoStatusOptions] = useState(
    []
  );
  const [loadingAprovarVinculo, setLoadingAprovarVinculo] = useState(false);
  const [loadingRecusarVinculo, setLoadingRecusarVinculo] = useState(false);

  // Estados para loading
  const [loadingNegar, setLoadingNegar] = useState(false);
  const [progress, setProgress] = useState(0);
  // Estados para o diálogo de justificativa
  const [displayJustificativaDialog, setDisplayJustificativaDialog] =
    useState(false);
  const [justificativaAtual, setJustificativaAtual] = useState("");

  // Função para mostrar o diálogo
  const showJustificativaDialog = (justificativa) => {
    setJustificativaAtual(justificativa);
    setDisplayJustificativaDialog(true);
  };

  // Efeito para disponibilizar a função globalmente
  useEffect(() => {
    window.showJustificativaDialog = showJustificativaDialog;
    return () => {
      delete window.showJustificativaDialog;
    };
  }, []);
  // Estados para diálogos
  // Filtros
  // Estado dos filtros usando a função utilitária
  const [filters, setFilters] = useState(getInitialFilters());
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const handleProcessarSolicitacoes = async () => {
    setLoadingProcessar(true);
    setProgressProcessar(0);

    try {
      const ids = processedData
        .map((item) => item.solicitacaoBolsa?.id)
        .filter(Boolean);

      // Dividir em lotes de 10 IDs
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize));
      }

      let totalProcessed = 0;

      for (const batch of batches) {
        try {
          const response = await processarSolicitacoesBolsa(tenant, batch);

          toast.current.show({
            severity: "success",
            summary: "Processado",
            detail: `Lote de ${batch.length} solicitações processado com sucesso`,
            life: 3000,
          });

          totalProcessed += batch.length;
          setProgressProcessar(Math.round((totalProcessed / ids.length) * 100));

          // Atualizar os dados após cada lote
          const updatedData = await getVinculosByTenant(tenant, ano);
          setProcessedData(updatedData);
        } catch (error) {
          console.error("Erro no lote:", error);
          toast.current.show({
            severity: "error",
            summary: "Erro no lote",
            detail: error.message || "Erro ao processar lote de solicitações",
            life: 4000,
          });
        }
      }

      toast.current.show({
        severity: "success",
        summary: "Concluído",
        detail: `Processamento concluído! ${totalProcessed} de ${ids.length} solicitações processadas`,
        life: 5000,
      });
    } catch (error) {
      console.error("Erro geral:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.message || "Erro ao processar solicitações",
        life: 4000,
      });
    } finally {
      setLoadingProcessar(false);
      setProgressProcessar(0);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };
  const clearFilters = () => {
    setFilters(getInitialFilters());
    setGlobalFilterValue("");
  };

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        setLoading(true);
        const rawData = await getVinculosByTenant(tenant, ano);
        console.log(rawData);
        // Extrair editais únicos
        const editaisUnicos = [
          ...new Set(
            rawData.map(
              (item) => item.participacao?.inscricao?.edital?.titulo || "N/A"
            )
          ),
        ]
          .filter(Boolean)
          .map((edital) => ({ label: edital, value: edital }));

        setEditaisOptions(editaisUnicos);

        setClassificacaoStatusOptions(statusOptions.classificacao);

        setParticipacaoStatusOptions(statusOptions.participacao);

        setSolicitacaoStatusOptions(statusOptions.solicitacao);

        setVinculoStatusOptions(statusOptions.vinculo);
        const countVinculosAprovadosPorAluno = (data) => {
          const contagemPorAluno = {};

          data.forEach((item) => {
            const alunoId = item.participacao?.user?.id;
            if (alunoId) {
              if (!contagemPorAluno[alunoId]) {
                contagemPorAluno[alunoId] = 0;
              }
              if (item.status === "APROVADO") {
                contagemPorAluno[alunoId]++;
              }
            }
          });

          return contagemPorAluno;
        };
        // Primeiro conta os vínculos aprovados por aluno
        const contagemAprovados = countVinculosAprovadosPorAluno(rawData);
        const rawDataComNotaTotal = rawData.map((item) => {
          const plano = item.participacao?.planoDeTrabalho;
          const notaTotal = plano
            ? (
                (plano.notaAluno || 0) +
                (plano.notaOrientador || 0) +
                (plano.notaPlano || 0) +
                (plano.notaProjeto || 0)
              ).toFixed(4)
            : null;
          const alunoId = item.participacao?.user?.id;
          const orientadores =
            item.participacao?.inscricao?.participacoes
              ?.map((part) => part.user?.nome)
              .filter(Boolean)
              .join(", ") || "N/A";
          return {
            ...item,
            notaTotal: notaTotal ? parseFloat(notaTotal) : null,
            rendimentoAcademico:
              item.participacao.user.UserTenant[0].rendimentoAcademico,
            vinculosAprovados: alunoId ? contagemAprovados[alunoId] || 0 : 0,
            orientadores,
          };
        });

        setProcessedData(rawDataComNotaTotal);
      } catch (err) {
        setError(err);
        console.error("Failed to fetch solicitacoes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAndProcessData();
  }, [tenant, ano]);

  const handleAprovarVinculo = async () => {
    if (selectedItems.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Selecione pelo menos um vínculo para aprovar",
        life: 3000,
      });
      return;
    }

    setLoadingAprovarVinculo(true);

    try {
      let sucesso = 0;

      for (const item of selectedItems) {
        const response = await aprovarVinculo(tenant, item.id);

        toast.current.show({
          severity: response.status === "success" ? "success" : "error",
          summary: "Resultado",
          detail: response.message,
          life: 4000,
        });

        if (response.status === "success") {
          sucesso++;

          setProcessedData((prevData) =>
            prevData.map((prevItem) =>
              prevItem.id === item.id
                ? {
                    ...prevItem,
                    status: "APROVADO",
                    statusFormatado: "Aprovado",
                  }
                : prevItem
            )
          );
        }
      }

      toast.current.show({
        severity: sucesso === selectedItems.length ? "success" : "warn",
        summary: "Finalizado",
        detail: `${sucesso} de ${selectedItems.length} vínculos aprovados`,
        life: 5000,
      });

      setSelectedItems([]);
    } catch (error) {
      console.error("Erro geral:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.response.data.message || "Erro ao processar aprovação",
        life: 4000,
      });
    } finally {
      setLoadingAprovarVinculo(false);
    }
  };

  const confirmarRecusaVinculo = async () => {
    if (!justificativa.trim()) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Digite o motivo da recusa",
        life: 3000,
      });
      return;
    }

    setLoadingRecusarVinculo(true);

    try {
      let sucesso = 0;

      for (const item of selectedItems) {
        const response = await recusarVinculo(tenant, item.id, justificativa);

        toast.current.show({
          severity: response.status === "success" ? "success" : "error",
          summary: "Resultado",
          detail: response.message,
          life: 4000,
        });

        if (response.status === "success") {
          sucesso++;

          setProcessedData((prevData) =>
            prevData.map((prevItem) =>
              prevItem.id === item.id
                ? {
                    ...prevItem,
                    status: "RECUSADO",
                    statusFormatado: "Recusado",
                    motivoRecusa: justificativa,
                  }
                : prevItem
            )
          );
        }
      }

      toast.current.show({
        severity: sucesso === selectedItems.length ? "success" : "warn",
        summary: "Finalizado",
        detail: `${sucesso} de ${selectedItems.length} vínculos recusados`,
        life: 5000,
      });

      setJustificativa("");
      setDisplayNegarDialog(false);
      setSelectedItems([]);
    } catch (error) {
      console.error("Erro geral:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.response.data.message || "Erro ao processar recusas",
        life: 4000,
      });
    } finally {
      setLoadingRecusarVinculo(false);
    }
  };

  const handleRecusarVinculo = async () => {
    if (selectedItems.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Selecione pelo menos um vínculo para recusar",
        life: 3000,
      });
      return;
    }

    setDisplayNegarDialog(true);
  };
  const hasSolicitacoesEmAnalise = processedData.some(
    (item) => item.solicitacaoBolsa?.status === "EM_ANALISE"
  );
  const renderHeader = () => {
    return (
      <div className="justify-content-between align-items-center">
        <span className="p-input-icon-left flex flex-wrap gap-1 mb-2">
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
          <Button
            icon="pi pi-filter-slash"
            label="Limpar Filtros"
            onClick={clearFilters}
            className="p-button-outlined p-button-secondary"
          />
          {hasSolicitacoesEmAnalise && (
            <Button
              label={`Processar Solicitações`}
              icon="pi pi-cog"
              className="p-button-info"
              onClick={handleProcessarSolicitacoes}
              loading={loadingProcessar}
            />
          )}
          {loadingProcessar && (
            <div className="mt-2">
              <ProgressBar
                value={progressProcessar}
                showValue={false}
                style={{ height: "6px" }}
              />
              <small className="block text-center mt-1">
                Processando... {progressProcessar}%
              </small>
            </div>
          )}
        </span>

        {selectedItems.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {/* Add the new buttons here */}
            <Button
              label={`Aprovar Vínculo (${selectedItems.length})`}
              icon="pi pi-check-circle"
              className="p-button-success"
              onClick={handleAprovarVinculo}
              loading={loadingAprovarVinculo}
            />
            <Button
              label={`Recusar Vínculo (${selectedItems.length})`}
              icon="pi pi-ban"
              className="p-button-danger"
              onClick={handleRecusarVinculo}
              loading={loadingRecusarVinculo}
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-2">
        <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.SolicitacoesBolsa}>
        Erro ao carregar solicitações
      </div>
    );
  }

  return (
    <div className={styles.SolicitacoesBolsa}>
      <Toast ref={toast} />
      {processedData.length === 0 ? (
        <div className="p-2">
          <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
        </div>
      ) : (
        <Card>
          <h5 className="pt-2 pl-2 pr-2">Solicitações de Bolsa</h5>
          <DataTable
            value={processedData}
            stripedRows
            scrollable
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="Nenhuma solicitação encontrada"
            resizableColumns
            columnResizeMode="expand"
            sortMode="multiple"
            selectionMode="checkbox"
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            dataKey="id"
            header={renderHeader}
            filters={filters}
            globalFilterFields={["nomeParticipante", "orientadores"]}
            onFilter={(e) => {
              setFilters(e.filters);
              //setFilteredItens(e.filteredValue || itens);
              setSelectedItems([]); // limpa a seleção com os novos filtros aplicados
            }}
            filterDisplay="row"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
          >
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3rem" }}
              frozen
            />

            <Column
              field="participacao.inscricao.edital.titulo"
              header="Edital"
              sortable
              filter
              filterField="participacao.inscricao.edital.titulo"
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, editaisOptions)
              }
              showFilterMenu={false}
            />

            <Column
              field="participacao.planoDeTrabalho.statusClassificacao"
              header="Status Plano"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  classificacaoStatusOptions
                )
              }
              showFilterMenu={false}
              filterField="participacao.planoDeTrabalho.statusClassificacao"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.participacao.planoDeTrabalho.statusClassificacao,
                  rowData.participacao.planoDeTrabalho.justificativa,
                  {
                    onShowJustificativa: showJustificativaDialog,
                  }
                )
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="participacao.statusParticipacao"
              header="Status Aluno"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  participacaoStatusOptions
                )
              }
              showFilterMenu={false}
              filterField="participacao.statusParticipacao"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.participacao.statusParticipacao,
                  rowData.participacao.justificativa,
                  {
                    onShowJustificativa: showJustificativaDialog,
                  }
                )
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="solicitacaoBolsa.status"
              header="Status solicitação de bolsa"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  solicitacaoStatusOptions
                )
              }
              showFilterMenu={false}
              filterField="solicitacaoBolsa.status"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.solicitacaoBolsa.status,
                  rowData.solicitacaoBolsa.justificativa,
                  {
                    onShowJustificativa: showJustificativaDialog,
                  }
                )
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="status"
              header="Status vinculação de bolsa"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, vinculoStatusOptions)
              }
              showFilterMenu={false}
              filterField="status"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.status,
                  rowData.motivoRecusa,
                  {
                    onShowJustificativa: showJustificativaDialog,
                  }
                )
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="participacao.user.nome"
              header="Aluno"
              sortable
              filter
              showFilterMenu={true}
              filterField="participacao.user.nome"
              filterPlaceholder="Filtrar por nome"
            />
            <Column
              field="orientadores"
              header="Orientador"
              sortable
              filter
              showFilterMenu={true}
              filterField="orientadores"
              filterPlaceholder="Filtrar por nome"
            />
            <Column
              field="vinculosAprovados"
              header="Bolsas Aprovadas por aluno"
              body={(rowData) => (
                <Tag
                  severity={rowData.vinculosAprovados > 0 ? "success" : "info"}
                  value={rowData.vinculosAprovados}
                />
              )}
              sortable
              style={{ textAlign: "center", width: "8rem" }}
            />
            <Column
              field="notaTotal"
              header="Nota Total"
              showFilterMenu={false}
              sortable
              filter
              filterField="notaTotal"
              filterElement={notaRowFilterTemplate}
              filterMatchMode="intervalo"
              dataType="numeric"
              body={(rowData) =>
                rowData.notaTotal !== null
                  ? rowData.notaTotal?.toFixed(4)
                  : "N/A"
              }
              style={{ textAlign: "center", width: "8rem" }}
            />
            <Column
              field="rendimentoAcademico"
              header="Rendimento Acadêmico"
              showFilterMenu={false}
              sortable
              filter
              filterField="rendimentoAcademico"
              filterElement={notaRowFilterTemplate}
              filterMatchMode="intervalo"
              dataType="numeric"
              body={(rowData) => rowData.rendimentoAcademico}
              style={{ textAlign: "center", width: "8rem" }}
            />

            <Column
              field="solicitacaoBolsa.ordemRecebimentoBolsa"
              header="Ordem da Bolsa"
              body={(rowData) => rowData.solicitacaoBolsa.ordemRecebimentoBolsa}
              sortable
              filter
              filterField="solicitacaoBolsa.ordemRecebimentoBolsa"
              filterMatchMode="intervalo"
              filterElement={notaRowFilterTemplate}
              dataType="numeric"
              style={{ textAlign: "left" }}
            />
          </DataTable>
        </Card>
      )}
      <Dialog
        header="Justificativa"
        visible={displayJustificativaDialog}
        style={{ width: "50vw" }}
        onHide={() => setDisplayJustificativaDialog(false)}
        footer={
          <Button
            label="Fechar"
            icon="pi pi-times"
            onClick={() => setDisplayJustificativaDialog(false)}
            className="p-button-text"
          />
        }
      >
        <div className="p-fluid">{justificativaAtual}</div>
      </Dialog>
      <Dialog
        header="Confirmar Recusa"
        visible={displayNegarDialog}
        style={{ width: "450px" }}
        onHide={() => {
          setDisplayNegarDialog(false);
          setJustificativa("");
        }}
        footer={
          <div>
            {(loadingNegar || loadingRecusarVinculo) && (
              <div className="mb-3">
                <ProgressBar value={progress} showValue={false} />
                <small className="block text-center mt-1">
                  {progress}% completo
                </small>
              </div>
            )}
            <div className="flex justify-content-end gap-2">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => {
                  setDisplayNegarDialog(false);
                  setJustificativa("");
                }}
                disabled={loadingNegar || loadingRecusarVinculo}
              />
              <Button
                label={
                  loadingNegar || loadingRecusarVinculo
                    ? "Processando..."
                    : "Confirmar"
                }
                icon={!(loadingNegar || loadingRecusarVinculo) && "pi pi-check"}
                className="p-button-danger"
                onClick={confirmarRecusaVinculo} // Fixed this line
                loading={loadingNegar || loadingRecusarVinculo}
                autoFocus
                disabled={loadingNegar || loadingRecusarVinculo}
              />
            </div>
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="justificativa">
              {loadingRecusarVinculo
                ? "Motivo da Recusa"
                : "Justificativa para Negação"}
            </label>
            <InputTextarea
              id="justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
              autoResize
              placeholder={
                loadingRecusarVinculo
                  ? "Digite o motivo da recusa..."
                  : "Digite a justificativa para negação..."
              }
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default SolicitacoesBolsa;

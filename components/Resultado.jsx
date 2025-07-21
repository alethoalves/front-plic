"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  ativarOuPendenteParticipacao,
  getParticipacoesByTenant,
} from "@/app/api/client/participacao";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { FilterService } from "primereact/api";
import styles from "./Resultado.module.scss";
import { Card } from "primereact/card";
import Modal from "./Modal";
import ParticipacaoGestorController from "./participacao/ParticipacaoGestorController";
import { statusOptions } from "@/lib/statusOptions";
import {
  notaRowFilterTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import { renderStatusTagWithJustificativa } from "@/lib/tagUtils";
const getInitialFilters = () => ({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  "inscricao.edital.titulo": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  "user.nome": {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  "planoDeTrabalho.statusClassificacao": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  statusParticipacao: {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  orientadores: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  notaTotal: {
    value: [null, null],
    matchMode: "intervalo",
  },
});
// ==============================================
// FILTROS PERSONALIZADOS
// ==============================================

/**
 * Registra filtro personalizado para intervalo de notas
 */
FilterService.register("intervalo", (value, filters) => {
  const [min, max] = filters || [null, null];

  if (min === null && max === null) return true; // Sem filtro
  if (min !== null && value < min) return false; // Valor abaixo do mínimo
  if (max !== null && value > max) return false; // Valor acima do máximo
  return true; // Passou no filtro
});

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

const Resultado = ({}) => {
  // ==============================================
  // ESTADOS E REFS
  // ==============================================
  const params = useParams();
  const { tenant, ano } = params;
  const toast = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ← Adicione esta linha
  const [selectedRowData, setSelectedRowData] = useState(null); // Novo estado

  // Estados para dados e carregamento
  const [participacoes, setParticipacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editaisOptions, setEditaisOptions] = useState([]);
  const [classificacaoStatusOptions, setClassificacaoStatusOptions] = useState(
    []
  );
  const [solicitacaoStatusOptions, setSolicitacaoStatusOptions] = useState([]);
  const [vinculoStatusOptions, setVinculoStatusOptions] = useState([]);
  const [participacaoStatusOptions, setParticipacaoStatusOptions] = useState(
    []
  );
  // Estados para filtros
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState(getInitialFilters());
  const [selectedParticipacoes, setSelectedParticipacoes] = useState([]);
  const [loadingAtivacao, setLoadingAtivacao] = useState(false);
  // Estados para modal de justificativas
  const [showJustificativas, setShowJustificativas] = useState(false);
  const [justificativasAtuais, setJustificativasAtuais] = useState("");

  // ==============================================
  // EFEITOS
  // ==============================================
  const onSelectionChange = (e) => {
    setSelectedParticipacoes(e.value);
  };
  const handleAtivarParticipacoes = async () => {
    if (selectedParticipacoes.length === 0) {
      showToast(
        "warn",
        "Aviso",
        "Selecione pelo menos uma participação para ativar"
      );
      return;
    }

    try {
      setLoadingAtivacao(true);

      // Executa todas as requisições em paralelo
      const results = await Promise.all(
        selectedParticipacoes.map(async (participacao) => {
          try {
            const resultado = await ativarOuPendenteParticipacao(
              tenant,
              participacao.id,
              null
            );

            return { success: true, id: participacao.id };
          } catch (error) {
            console.error(
              `Erro ao ativar participação ${participacao.id}:`,
              error
            );
            return { success: false, id: participacao.id, error };
          }
        })
      );

      // Verifica os resultados
      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      if (errorCount === 0) {
        showToast(
          "success",
          "Sucesso",
          `${successCount} participações ativadas com sucesso!`
        );
      } else if (successCount === 0) {
        showToast(
          "error",
          "Erro",
          "Falha ao ativar as participações selecionadas"
        );
      } else {
        showToast(
          "warn",
          "Parcial",
          `${successCount} participações ativadas, ${errorCount} falhas`
        );
      }

      // Atualiza os dados
      await getParticipacoes();
      setSelectedParticipacoes([]);
    } catch (error) {
      console.error("Erro ao ativar participações:", error);
      showToast(
        "error",
        "Erro",
        "Ocorreu um erro ao tentar ativar as participações"
      );
    } finally {
      setLoadingAtivacao(false);
    }
  };
  const [loadingAtivacaoVinculo, setLoadingAtivacaoVinculo] = useState(false);
  // Função para ativar os vínculos das participações selecionadas
  const handleAtivarVinculos = async () => {
    if (selectedParticipacoes.length === 0) {
      showToast(
        "warn",
        "Aviso",
        "Selecione pelo menos uma participação para ativar o vínculo"
      );
      return;
    }

    try {
      setLoadingAtivacaoVinculo(true);

      // Filtra participações que têm vínculo
      const participacoesComVinculo = selectedParticipacoes.filter(
        (p) => p.VinculoSolicitacaoBolsa?.length > 0
      );

      if (participacoesComVinculo.length === 0) {
        showToast(
          "warn",
          "Aviso",
          "Nenhuma das participações selecionadas possui vínculo para ativar"
        );
        return;
      }

      // Executa todas as requisições em paralelo
      const results = await Promise.all(
        participacoesComVinculo.map(async (participacao) => {
          try {
            const vinculoId = participacao.VinculoSolicitacaoBolsa[0]?.id;
            if (!vinculoId) {
              return {
                success: false,
                id: participacao.id,
                error: "ID do vínculo não encontrado",
              };
            }

            const resultado = await ativarVinculo(tenant, vinculoId);
            return { success: true, id: participacao.id };
          } catch (error) {
            console.error(
              `Erro ao ativar vínculo da participação ${participacao.id}:`,
              error
            );
            return { success: false, id: participacao.id, error };
          }
        })
      );

      // Verifica os resultados
      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      if (errorCount === 0) {
        showToast(
          "success",
          "Sucesso",
          `${successCount} vínculos ativados com sucesso!`
        );
      } else if (successCount === 0) {
        showToast("error", "Erro", "Falha ao ativar os vínculos selecionados");
      } else {
        showToast(
          "warn",
          "Parcial",
          `${successCount} vínculos ativados, ${errorCount} falhas`
        );
      }

      // Atualiza os dados
      await getParticipacoes();
      setSelectedParticipacoes([]);
    } catch (error) {
      console.error("Erro ao ativar vínculos:", error);
      showToast(
        "error",
        "Erro",
        "Ocorreu um erro ao tentar ativar os vínculos"
      );
    } finally {
      setLoadingAtivacaoVinculo(false);
    }
  };

  const getParticipacoes = async () => {
    const response = await getParticipacoesByTenant(tenant, "aluno", ano);
    // Processa os dados recebidos
    const comColunasVirtuais = response.map((p) => {
      const plano = p.planoDeTrabalho;
      const notaTotal = plano
        ? (
            (plano.notaAluno || 0) +
            (plano.notaOrientador || 0) +
            (plano.notaPlano || 0) +
            (plano.notaProjeto || 0)
          ).toFixed(4)
        : null;
      return {
        ...p,
        notaTotal: notaTotal ? parseFloat(notaTotal) : null,
        orientadores:
          p.inscricao.participacoes
            ?.map((part) => part.user?.nome)
            .filter(Boolean)
            .join(", ") || "N/A",
      };
    });
    /**
     * Prepara as opções para os filtros do DataTable
     */
    const prepareFilterOptions = (data) => {
      // Edital
      const editaisUnicos = [
        ...new Set(data.map((p) => p.inscricao?.edital?.titulo)),
      ].filter(Boolean);
      setEditaisOptions(
        editaisUnicos.map((edital) => ({ label: edital, value: edital }))
      );
      setClassificacaoStatusOptions(statusOptions.classificacao);

      setParticipacaoStatusOptions(statusOptions.participacao);

      setSolicitacaoStatusOptions(statusOptions.solicitacao);

      setVinculoStatusOptions(statusOptions.vinculo);

      // Resultado Final
      const resultadosUnicos = [
        ...new Set(
          data
            .map((p) => p.resultadoFinal?.label)
            .filter((label) => label !== undefined && label !== null)
        ),
      ];
    };
    setParticipacoes(comColunasVirtuais);
    console.log(comColunasVirtuais);
    // Prepara opções para filtros
    prepareFilterOptions(comColunasVirtuais);
  };
  useEffect(() => {
    const fetchParticipacoes = async () => {
      try {
        setLoading(true);
        await getParticipacoes();
      } catch (error) {
        console.error("Erro ao buscar participações:", error);
        showToast("error", "Erro", "Falha ao carregar dados das participações");
      } finally {
        setLoading(false);
      }
    };

    fetchParticipacoes();
  }, [tenant, ano]);

  // ==============================================
  // MANIPULAÇÃO DE FILTROS
  // ==============================================

  /**
   * Limpa todos os filtros aplicados
   */
  const clearFilters = () => {
    setFilters(getInitialFilters());
    setGlobalFilterValue("");
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // ==============================================
  // UTILITÁRIOS
  // ==============================================

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  // ==============================================
  // RENDERIZAÇÃO DO HEADER
  // ==============================================

  const renderHeader = () => {
    return (
      <div className="flex justify-content-between align-items-center">
        <Button
          icon="pi pi-filter-slash"
          label="Limpar Filtros"
          onClick={clearFilters}
          className="p-button-outlined p-button-secondary"
        />
        {selectedParticipacoes.length > 0 && (
          <>
            <Button
              icon="pi pi-check-circle"
              label="Ativar"
              onClick={handleAtivarParticipacoes}
              loading={loadingAtivacao}
              className="p-button-success"
            />
            <Button
              icon="pi pi-link"
              label="Ativar Vínculo"
              onClick={handleAtivarVinculos}
              loading={loadingAtivacaoVinculo}
              className="p-button-help"
              tooltip="Ativar vínculo de bolsa das participações selecionadas"
              tooltipOptions={{ position: "bottom" }}
            />
          </>
        )}
        <IconField iconPosition="left" className="ml-2">
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
        </IconField>
      </div>
    );
  };

  const header = renderHeader();

  // ==============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ==============================================
  const [displayJustificativaDialog, setDisplayJustificativaDialog] =
    useState(false);
  const [justificativaAtual, setJustificativaAtual] = useState("");
  const showJustificativaDialog = (justificativa) => {
    setJustificativaAtual(justificativa);
    setDisplayJustificativaDialog(true);
  };
  return (
    <div className={styles.resultado}>
      <Toast ref={toast} />

      <Card>
        <h5 className="pl-2 pr-2 pt-2">Resultado Final por Aluno</h5>
        {loading ? (
          <div className="p-2">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          </div>
        ) : (
          <DataTable
            value={participacoes}
            scrollable
            stripedRows
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="Nenhum dado disponível"
            filters={filters}
            globalFilterFields={["user.nome", "inscricao.proponente.nome"]}
            header={header}
            filterDisplay="row"
            onRowClick={(e) => {
              if (!e.originalEvent.target.closest(".p-checkbox")) {
                setSelectedRowData(e.data);
                setIsModalOpen(true);
              }
            }}
            rowClassName={styles.clickableRow}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
            selection={selectedParticipacoes}
            onSelectionChange={onSelectionChange}
            dataKey="id"
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column
              field="inscricao.edital.titulo"
              header="Edital"
              sortable
              filter
              filterField="inscricao.edital.titulo"
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, editaisOptions)
              }
              showFilterMenu={false}
            />
            <Column
              field="planoDeTrabalho.titulo"
              header="Plano de Trabalho"
              showFilterMenu={false}
              sortable
              style={{ width: "280px", maxWidth: "280px" }}
              bodyStyle={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
            <Column
              header="Orientador"
              field="orientadores"
              filter
              sortable
              filterPlaceholder="Buscar por nome"
            />
            <Column
              field="user.nome"
              header="Aluno"
              filter
              filterPlaceholder="Buscar por nome"
              sortable
            />
            <Column
              field="planoDeTrabalho.statusClassificacao"
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
              filterField="planoDeTrabalho.statusClassificacao"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.planoDeTrabalho.statusClassificacao,
                  rowData.planoDeTrabalho.justificativa,
                  {
                    onShowJustificativa: showJustificativaDialog,
                  }
                )
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="statusParticipacao"
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
              filterField="statusParticipacao"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.statusParticipacao,
                  rowData.justificativa,
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
                rowData.VinculoSolicitacaoBolsa.length > 0
                  ? renderStatusTagWithJustificativa(
                      rowData.VinculoSolicitacaoBolsa[
                        rowData.VinculoSolicitacaoBolsa.length - 1
                      ]?.status,
                      rowData.VinculoSolicitacaoBolsa[
                        rowData.VinculoSolicitacaoBolsa.length - 1
                      ]?.motivoRecusa,
                      {
                        onShowJustificativa: showJustificativaDialog,
                      }
                    )
                  : "Voluntária"
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="status"
              header="Fonte pagadora"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, vinculoStatusOptions)
              }
              showFilterMenu={false}
              filterField="status"
              body={(rowData) =>
                rowData.VinculoSolicitacaoBolsa.length > 0
                  ? rowData.VinculoSolicitacaoBolsa[
                      rowData.VinculoSolicitacaoBolsa.length - 1
                    ]?.solicitacaoBolsa?.bolsa?.cota?.instituicaoPagadora
                  : "Voluntária"
              }
              style={{ width: "12rem" }}
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
          </DataTable>
        )}
      </Card>
      <Dialog
        header="Justificativas"
        visible={showJustificativas}
        style={{ width: "50vw" }}
        onHide={() => setShowJustificativas(false)}
      >
        <div style={{ whiteSpace: "pre-line", marginBottom: "12px" }}>
          {justificativasAtuais}
        </div>
      </Dialog>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          getParticipacoes();
        }}
        itemName="Detalhes"
      >
        {selectedRowData && (
          <ParticipacaoGestorController
            tenant={params.tenant}
            participacaoId={selectedRowData?.id}
            onClose={() => setIsModalOpen(false)}
            onSuccess={
              () => {}
              //getParticipacoes
            }
          />
        )}
      </Modal>
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
    </div>
  );
};

export default Resultado;

"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  getParticipacoesByTenant,
  aprovarParticipacoes,
  reprovarParticipacoes,
} from "@/app/api/client/participacao";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { FilterService } from "primereact/api";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";
import {
  formatStatusText,
  getSeverityByStatus,
  renderStatusTagWithJustificativa,
} from "@/lib/tagUtils";
import {
  notaRowFilterTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import { statusOptions } from "@/lib/statusOptions";

// Filtro customizado para intervalo de IRA
FilterService.register("ira_intervalo", (value, filters) => {
  const [min, max] = filters || [null, null];
  if (min === null && max === null) return true;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
});
const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itens, setItens] = useState([]);
  const [filteredItens, setFilteredItens] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [motivoReprova, setMotivoReprova] = useState("");
  const [displayReprovarDialog, setDisplayReprovarDialog] = useState(false);
  const dataTableRef = useRef(null);
  const [loadingAprovar, setLoadingAprovar] = useState(false);
  const [loadingReprovar, setLoadingReprovar] = useState(false);
  const [progress, setProgress] = useState(0);
  const [justificativasAtuais, setJustificativasAtuais] = useState("");
  const [showJustificativas, setShowJustificativas] = useState(false);

  // Opções para os filtros
  const [cursosOptions, setCursosOptions] = useState([]);
  const [formasIngressoOptions, setFormasIngressoOptions] = useState([]);
  const [editaisOptions, setEditaisOptions] = useState([]);

  const toast = useRef(null);

  // Funções para acessar propriedades aninhadas de forma segura
  const getCurso = (item) => item.user?.UserTenant?.[0]?.curso?.curso || "N/A";
  const getFormaIngresso = (item) =>
    item.user?.UserTenant?.[0]?.formaIngresso?.formaIngresso || "N/A";
  const getMatricula = (item) => item.user?.UserTenant?.[0]?.matricula || "N/A";
  const getParticipacaoExterna = (item) =>
    item.user?.UserTenant?.[0]?.participacaoExterna ? "Sim" : "Não";
  const getEditalTitulo = (item) => item.inscricao?.edital?.titulo || "N/A";
  const getIra = (item) => (item.ira !== null ? item.ira.toFixed(4) : "N/A");

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "inscricao.edital.titulo": {
      value: null,
      matchMode: FilterMatchMode.IN,
    },

    statusParticipacao: {
      value: null,
      matchMode: FilterMatchMode.IN,
    },
    "planoDeTrabalho.statusClassificacao": {
      value: null,
      matchMode: FilterMatchMode.IN,
    },
    "user.UserTenant.0.curso.curso": {
      value: null,
      matchMode: FilterMatchMode.IN,
    },
    "user.UserTenant.0.formaIngresso.formaIngresso": {
      value: null,
      matchMode: FilterMatchMode.IN,
    },
    "user.nome": {
      value: null,
      matchMode: FilterMatchMode.CONTAINS,
    },
    "user.cpf": {
      value: null,
      matchMode: FilterMatchMode.CONTAINS,
    },
    ira: {
      value: [null, null],
      matchMode: "ira_intervalo",
    },
    "user.UserTenant.0.matricula": {
      value: null,
      matchMode: FilterMatchMode.CONTAINS,
    },
    participacaoExterna: {
      operator: FilterOperator.OR,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
  });
  const JustificativaModal = ({ visible, onHide, justificativa }) => {
    return (
      <Dialog
        header="Justificativa"
        visible={visible}
        style={{ width: "50vw" }}
        onHide={onHide}
        footer={<Button label="Fechar" icon="pi pi-times" onClick={onHide} />}
      >
        <div className="p-fluid">
          <div className="p-field">
            <p>{justificativa}</p>
          </div>
        </div>
      </Dialog>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const participacoes = await getParticipacoesByTenant(
          params.tenant,
          "aluno",
          params.ano
        );
        console.log(participacoes);
        // Processar opções para filtros
        const statusUnicos = [
          ...new Set(participacoes.map((item) => item.statusParticipacao)),
        ]
          .filter(Boolean)
          .map((status) => ({ label: status, value: status }));

        const cursosUnicos = [
          ...new Set(participacoes.map((item) => getCurso(item))),
        ]
          .filter(Boolean)
          .map((curso) => ({ label: curso, value: curso }));

        const formasIngressoUnicas = [
          ...new Set(participacoes.map((item) => getFormaIngresso(item))),
        ]
          .filter(Boolean)
          .map((formaIngresso) => ({
            label: formaIngresso,
            value: formaIngresso,
          }));

        const editaisUnicos = [
          ...new Set(participacoes.map((item) => getEditalTitulo(item))),
        ]
          .filter(Boolean)
          .map((edital) => ({ label: edital, value: edital }));

        setCursosOptions(cursosUnicos);
        setFormasIngressoOptions(formasIngressoUnicas);
        setEditaisOptions(editaisUnicos);

        const normalizado = participacoes.map((item) => ({
          ...item,
          ira: item.user?.UserTenant?.[0]?.rendimentoAcademico ?? null,
          curso: getCurso(item),
          formaIngresso: getFormaIngresso(item),
          matricula: getMatricula(item),
          participacaoExterna: getParticipacaoExterna(item),
          editalTitulo: getEditalTitulo(item),
        }));

        setItens(normalizado);
        setFilteredItens(normalizado);
      } catch (error) {
        console.error("Erro ao buscar participações:", error);
        setError("Erro ao buscar participações.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  // Função para o filtro global
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Template genérico para filtros MultiSelect

  const BATCH_SIZE = 20;

  const processarEmLotes = async (ids, callback) => {
    const total = ids.length;
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const lote = ids.slice(i, i + BATCH_SIZE);
      await callback(lote);
      setProgress(Math.round(((i + BATCH_SIZE) / total) * 100));
    }
  };
  const handleAprovar = async () => {
    if (selectedItems.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Selecione pelo menos um item para aprovar",
        life: 3000,
      });
      return;
    }

    setLoadingAprovar(true);
    setProgress(0);

    const ids = selectedItems.map((item) => item.id);
    let aprovados = [];

    try {
      await processarEmLotes(ids, async (lote) => {
        const resultado = await aprovarParticipacoes(params.tenant, lote);

        const ignoradas = resultado.participacoesIgnoradas || [];
        const aprovadasDoLote = lote.filter((id) => !ignoradas.includes(id));
        aprovados.push(...aprovadasDoLote);

        if (ignoradas.length > 0) {
          toast.current.show({
            severity: "warn",
            summary: "Atenção",
            detail: `${ignoradas.length} participação(ões) ignoradas`,
            life: 4000,
          });
        }
      });

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: `${aprovados.length} participação(ões) aprovadas com sucesso!`,
        life: 5000,
      });

      const novosItens = itens.map((item) =>
        aprovados.includes(item.id)
          ? { ...item, statusParticipacao: "APROVADA", justificativa: null }
          : item
      );

      setItens(novosItens);
      setFilteredItens(novosItens);
      setSelectedItems([]);
    } catch (error) {
      console.error("Erro ao aprovar em lotes:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message || "Erro ao aprovar participações",
        life: 5000,
      });
    } finally {
      setLoadingAprovar(false);
    }
  };

  const handleReprovar = () => {
    if (selectedItems.length === 0) {
      toast.current.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Selecione pelo menos um item para reprovar",
        life: 3000,
      });
      return;
    }
    setDisplayReprovarDialog(true);
  };

  const confirmarReprova = async () => {
    if (!motivoReprova.trim()) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Digite o motivo da reprovação",
        life: 3000,
      });
      return;
    }

    setLoadingReprovar(true);
    setProgress(0);

    const ids = selectedItems.map((item) => item.id);
    let reprovados = [];

    try {
      await processarEmLotes(ids, async (lote) => {
        const resultado = await reprovarParticipacoes(
          params.tenant,
          lote,
          motivoReprova
        );

        const ignoradas = resultado.participacoesIgnoradas || [];

        // Calcula as reprovadas por exclusão: tudo que foi enviado menos as ignoradas
        const reprovadasDoLote = lote.filter((id) => !ignoradas.includes(id));
        reprovados.push(...reprovadasDoLote);

        if (ignoradas.length > 0) {
          toast.current.show({
            severity: "warn",
            summary: "Atenção",
            detail: `${ignoradas.length} participação(ões) ignoradas`,
            life: 4000,
          });
        }
      });

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: `${reprovados.length} participação(ões) reprovadas com sucesso!`,
        life: 5000,
      });

      // Atualiza apenas os itens reprovados no frontend
      const novosItens = itens.map((item) =>
        reprovados.includes(item.id)
          ? {
              ...item,
              statusParticipacao: "RECUSADA",
              justificativa: motivoReprova,
            }
          : item
      );

      setItens(novosItens);
      setFilteredItens(novosItens);
      setSelectedItems([]);
      setMotivoReprova("");
      setDisplayReprovarDialog(false);
    } catch (error) {
      console.error("Erro ao reprovar participações:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message || "Erro ao reprovar participações",
        life: 5000,
      });
    } finally {
      setLoadingReprovar(false);
    }
  };

  const renderHeader = () => {
    return (
      <div className="">
        <div>
          <label htmlFor="filtroStatus" className="block">
            <p>Busque por palavra-chave:</p>
          </label>
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Pesquisar..."
            style={{ width: "100%" }}
          />
          {selectedItems.length > 0 && (
            <>
              {" "}
              <div className="flex justify-start gap-2 mt-2 ">
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
              </div>
              {loadingAprovar && (
                <div className="mt-2">
                  <ProgressBar
                    value={progress}
                    style={{ height: "6px" }}
                    showValue={false}
                  />
                  <small className="block text-center mt-1">
                    {progress}% completo (
                    {Math.round((selectedItems.length * progress) / 100)} de{" "}
                    {selectedItems.length} itens)
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };
  useEffect(() => {
    setSelectedItems([]);
  }, [filters]);

  return (
    <main>
      <Toast ref={toast} />
      <Card className="custom-card ">
        <h5 className="pt-2 pr-2 pl-2">Seleção de Alunos</h5>
        {loading ? (
          <div className="pr-2 pl-2 pb-2 pt-2">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          </div>
        ) : error ? (
          <Message severity="error" text={error} />
        ) : (
          <DataTable
            ref={dataTableRef}
            value={filteredItens}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            scrollable
            selectionMode={"checkbox"}
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            dataKey="id"
            sortMode="multiple"
            header={renderHeader()}
            filters={filters}
            onFilter={(e) => {
              setFilters(e.filters);
              setFilteredItens(e.filteredValue || itens); // atualiza os itens filtrados
              setSelectedItems([]); // limpa seleção quando filtros mudam (opcional)
            }}
            filterDisplay="row"
            globalFilterFields={[
              "inscricao.edital.titulo",
              "user.nome",
              "user.cpf",
              "status",
              "user.UserTenant.0.curso.curso",
              "user.UserTenant.0.formaIngresso.formaIngresso",
              "user.UserTenant.0.matricula",
            ]}
            emptyMessage="Nenhuma participação encontrada."
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
          >
            <Column
              selectionMode="multiple"
              frozen
              headerStyle={{ width: "3rem" }}
            />
            <Column field="id" header="ID" />

            {/* Coluna Edital com MultiSelect */}
            <Column
              field="editalTitulo"
              header="Edital"
              sortable
              filter
              filterField="inscricao.edital.titulo"
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, editaisOptions)
              }
              body={(rowData) => rowData.inscricao.edital.titulo}
              showFilterMenu={false}
            />
            <Column
              field="planoDeTrabalho.statusClassificacao"
              header="Status Plano de Trabalho"
              sortable
              filter
              showFilterMenu={false}
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  statusOptions.classificacao
                )
              }
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.planoDeTrabalho.statusClassificacao,
                  rowData.planoDeTrabalho.justificativa,
                  {
                    onShowJustificativa: (justificativa) => {
                      setJustificativasAtuais(justificativa);
                      setShowJustificativas(true);
                    },
                  }
                )
              }
            />
            {/* Coluna Status com MultiSelect */}
            <Column
              field="statusParticipacao"
              header="Status"
              sortable
              filter
              showFilterMenu={false}
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  statusOptions.participacao
                )
              }
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.statusParticipacao,
                  rowData.justificativa,
                  {
                    onShowJustificativa: (justificativa) => {
                      setJustificativasAtuais(justificativa);
                      setShowJustificativas(true);
                    },
                  }
                )
              }
            />

            <Column
              field="user.nome"
              header="Usuário"
              sortable
              filter
              filterPlaceholder="Buscar por nome"
              filterField="user.nome"
              showFilterMenu={false}
            />

            <Column
              field="user.cpf"
              header="CPF"
              sortable
              filter
              filterPlaceholder="Buscar por CPF"
              filterField="user.cpf"
              showFilterMenu={false}
              style={{ minWidth: "230px" }}
            />

            {/* Coluna Curso com MultiSelect */}
            <Column
              field="curso"
              header="Curso"
              sortable
              filter
              filterField="user.UserTenant.0.curso.curso"
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, cursosOptions)
              }
              showFilterMenu={false}
            />

            {/* Coluna Forma de Ingresso com MultiSelect */}
            <Column
              field="formaIngresso"
              header="Forma de Ingresso"
              sortable
              filter
              filterField="user.UserTenant.0.formaIngresso.formaIngresso"
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  formasIngressoOptions
                )
              }
              showFilterMenu={false}
            />
            <Column
              field="ira"
              header="Rendimento Acadêmico"
              sortable
              filter
              filterField="ira"
              filterElement={notaRowFilterTemplate}
              filterMatchMode="ira_intervalo"
              dataType="numeric"
              body={(rowData) => rowData.ira}
              style={{ textAlign: "left", width: "8rem" }}
            />

            <Column
              field="matricula"
              header="Matrícula"
              sortable
              filterPlaceholder="Filtrar matrícula"
            />
          </DataTable>
        )}
      </Card>
      <Dialog
        header="Confirmar Reprovação"
        onHide={() => {
          setDisplayReprovarDialog(false);
          setMotivoReprova("");
          setProgress(0); // 👈 zera barra ao cancelar
        }}
        visible={displayReprovarDialog}
        style={{ width: "450px" }}
        footer={
          <div>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => {
                setDisplayReprovarDialog(false);
                setMotivoReprova("");
              }}
            />
            <Button
              label="Confirmar"
              icon="pi pi-check"
              className="p-button-danger"
              onClick={confirmarReprova}
              loading={loadingReprovar}
              autoFocus
            />
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
              placeholder="Digite o motivo da reprovação..."
            />
          </div>
        </div>
        {loadingReprovar && (
          <div className="mt-3">
            <ProgressBar
              value={progress}
              style={{ height: "6px" }}
              showValue={false}
            />
            <small className="block text-center mt-1">
              {progress}% completo (
              {Math.round((selectedItems.length * progress) / 100)} de{" "}
              {selectedItems.length} itens)
            </small>
          </div>
        )}
      </Dialog>
      {/* Modal de Justificativas */}
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
    </main>
  );
};

export default Page;

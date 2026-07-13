"use client";
// HOOKS
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ESTILO
import styles from "./TabelaPlanoDeTrabalhoAcompanhamento.module.scss";

// PRIMEREACT
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { FilterService } from "primereact/api";
import { Dialog } from "primereact/dialog";

// SERVIÇOS
import {
  aplicarNotaCorte,
  getAllPlanoDeTrabalhosByTenant,
} from "@/app/api/client/planoDeTrabalho";
import { handleDefinirNotaCorte } from "@/lib/notaCorteUtils";
import {
  editalRowFilterTemplate,
  notaRowFilterTemplate,
  statusClassificacaoBodyTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import Modal from "../Modal";
import ProjetoAvaliacaoResumo from "../ProjetoAvaliacaoResumo";

// Registra filtro personalizado para intervalo de notas
FilterService.register("nota_intervalo", (value, filters) => {
  const [min, max] = filters ?? [undefined, undefined];

  if (min === undefined && max === undefined) return true;
  if (typeof min === "number" && value < min) return false;
  if (typeof max === "number" && value > max) return false;

  return true;
});

const TabelaPlanoDeTrabalhoAcompanhamento = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [notaCorte, setNotaCorte] = useState(0);
  const [isLoadingNotaCorte, setIsLoadingNotaCorte] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editaisDisponiveis, setEditaisDisponiveis] = useState([]);
  const [statusClassificacaoDisponiveis, setStatusClassificacaoDisponiveis] =
    useState([]);
  const [showJustificativaModal, setShowJustificativaModal] = useState(false);
  const [justificativaAtual, setJustificativaAtual] = useState("");

  // REFS
  const toast = useRef(null);
  const dataTableRef = useRef(null);

  // FILTROS
  const [filters, setFilters] = useState({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    id: { value: "", matchMode: FilterMatchMode.CONTAINS },
    "inscricao.status": {
      value: [],
      matchMode: FilterMatchMode.IN,
    },
    statusClassificacao: {
      value: [],
      matchMode: FilterMatchMode.IN,
    },
    "inscricao.edital.titulo": {
      value: [],
      matchMode: FilterMatchMode.IN,
    },
    titulo: { value: "", matchMode: FilterMatchMode.CONTAINS },
    "inscricaoProjeto.projeto.area.area": {
      value: "",
      matchMode: FilterMatchMode.CONTAINS,
    },
    "area.area": { value: "", matchMode: FilterMatchMode.CONTAINS },
    orientadoresString: {
      value: "", // Adicione value padrão
      matchMode: FilterMatchMode.CONTAINS,
    },
    alunosString: {
      value: "", // Adicione value padrão
      matchMode: FilterMatchMode.CONTAINS,
    },
    notaTotal: {
      value: [undefined, undefined],
      matchMode: "nota_intervalo",
    },
    notaProjeto: {
      value: [undefined, undefined],
      matchMode: "nota_intervalo",
    },
    notaPlano: {
      value: [undefined, undefined],
      matchMode: "nota_intervalo",
    },
    notaOrientador: {
      value: [undefined, undefined],
      matchMode: "nota_intervalo",
    },
    notaAluno: {
      value: [undefined, undefined],
      matchMode: "nota_intervalo",
    },
  });
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const itensBrutos = await getAllPlanoDeTrabalhosByTenant(
        params.tenant,
        params.ano || null
      );
      // Só planos de inscrições efetivamente enviadas (exclui rascunhos) —
      // mesmo filtro usado em app/[tenant]/gestor/[ano]/inscricoes/page.jsx.
      const itens = (itensBrutos || []).filter(
        (item) => item.inscricao?.status === "enviada"
      );
      // Processa os itens para adicionar campos virtuais
      const itensProcessados =
        itens?.map((item) => {
          // Extrai nomes dos alunos (participacoes diretas do item)
          const alunos = item.participacoes?.map((p) => p.user.nome) || [];

          // Extrai nomes dos orientadores (participacoes da inscricao)
          const orientadores =
            item.inscricao?.participacoes?.map((p) => p.user.nome) || [];

          // Campos herdados do projeto (mesmos que existiam na tabela
          // "Avaliações de Projetos", agora trazidos pra cá).
          const fichasProjeto = item.inscricaoProjeto?.FichaAvaliacao || [];
          const avaliadoresProjeto =
            item.inscricaoProjeto?.InscricaoProjetoAvaliador || [];
          const notasProjeto = fichasProjeto.map((f) => f.notaTotal || 0);

          return {
            ...item,
            // Campos virtuais
            notaTotal: parseFloat(
              (
                item.notaAluno +
                item.notaOrientador +
                item.notaPlano +
                item.notaProjeto
              ).toFixed(4)
            ),
            alunosString: alunos.join(", "),
            orientadoresString: orientadores.join(", "),
            quantidadeFichas: fichasProjeto.length,
            quantidadeAvaliadores: avaliadoresProjeto.length,
            avaliadoresString:
              avaliadoresProjeto
                .map((a) => a.avaliador?.nome)
                .filter(Boolean)
                .join(", ") || "Nenhum avaliador",
            diferencaNotas:
              notasProjeto.length > 0
                ? Math.max(...notasProjeto) - Math.min(...notasProjeto)
                : "N/A",
          };
        }) || [];
      setItens(itensProcessados);

      setStatusClassificacaoDisponiveis([
        { label: "Em análise", value: "EM_ANALISE" },
        { label: "Classificado", value: "CLASSIFICADO" },
        { label: "Desclassificado", value: "DESCLASSIFICADO" },
      ]);

      const editaisUnicos = [
        ...new Set(itens.map((item) => item.inscricao?.edital?.titulo)),
      ].filter(Boolean);

      setEditaisDisponiveis(
        editaisUnicos.map((edital) => ({ label: edital, value: edital }))
      );
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar dados",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  // BUSCA DE DADOS INICIAIS
  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, params.ano]);

  // FUNÇÕES DE MANIPULAÇÃO
  const handleDefinirNotaCorteWrapper = async () => {
    await handleDefinirNotaCorte({
      notaCorte,
      selectedItems,
      params,
      aplicarNotaCorteApi: aplicarNotaCorte,
      fetchInitialData,
      setIsLoadingNotaCorte,
      setProgress,
      setNotaCorte,
      setSelectedItems,
      toast, // Passando a referência diretamente, sem o .current
    });
  };

  // TEMPLATES DE COLUNAS

  const openJustificativaModal = (rowData) => {
    if (rowData.justificativa) {
      setJustificativaAtual(rowData.justificativa);
      setShowJustificativaModal(true);
    }
  };

  // HANDLERS
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap justify-content-between align-items-center">
        <InputText
          className="w-100"
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Pesquisar..."
        />
      </div>
    );
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState(null);
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setSelectedPlano(null);
  };
  // Resumo do projeto (título, área, status, avaliadores, fichas) — sem
  // abas e sem ações de edição/desvinculação, feito sob medida pra tela
  // de Acompanhamento.
  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      {selectedPlano && (
        <ProjetoAvaliacaoResumo
          tenantSlug={params.tenant}
          ano={params.ano}
          projetoId={selectedPlano.inscricaoProjeto?.projeto?.id}
          idInscricao={selectedPlano.inscricao?.id}
          planoFichas={selectedPlano.FichaAvaliacao}
          onSuccess={fetchInitialData}
        />
      )}
    </Modal>
  );
  // RENDERIZAÇÃO
  return (
    <>
      {renderModalContent()}
      <main className={styles.main}>
        <Card className="custom-card mb-2 mt-2 pt-1">
          {loading ? (
            <div className="pr-2 pl-2 pb-2 pt-2">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
            </div>
          ) : (
            <>
              {selectedItems.length > 0 && (
                <div
                  className={`flex flex-column gap-3 mt-1 ${styles.notaCorte}`}
                >
                  <div className="flex align-items-center gap-2">
                    <span>Definir nota de corte de</span>
                    <InputNumber
                      value={notaCorte ?? 0}
                      onValueChange={(e) => setNotaCorte(e.value ?? 0)}
                      mode="decimal"
                      min={0}
                      max={100}
                      placeholder="Nota"
                      className="w-8rem mt-1"
                    />
                    <span>
                      para os {selectedItems.length} itens selecionados
                    </span>
                    <Button
                      label={
                        isLoadingNotaCorte ? (
                          <>
                            <i className="pi pi-spinner pi-spin mr-2"></i>
                            Processando...
                          </>
                        ) : (
                          "Confirmar"
                        )
                      }
                      icon={!isLoadingNotaCorte && "pi pi-check"}
                      className="p-button-success mt-1"
                      onClick={handleDefinirNotaCorteWrapper}
                      disabled={isLoadingNotaCorte}
                    />
                    {isLoadingNotaCorte && (
                      <div className="mt-2">
                        <ProgressBar
                          value={progress}
                          style={{ height: "6px" }}
                          showValue={false}
                        />
                        <small className="block text-center mt-1">
                          {progress}% completo (
                          {Math.round((selectedItems.length * progress) / 100)}{" "}
                          de {selectedItems.length} itens)
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DataTable
                ref={dataTableRef}
                value={itens}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 20, 50]}
                scrollable
                selectionMode="checkbox"
                selection={selectedItems}
                onSelectionChange={(e) => setSelectedItems(e.value)}
                dataKey="id"
                onRowClick={(e) => {
                  setSelectedPlano(e.data);
                  setIsModalOpen(true);
                }}
                header={renderHeader()}
                rowClassName={() => "cursor-pointer"}
                filters={filters}
                onFilter={(e) => {
                  setFilters(e.filters);
                  setSelectedItems([]); // limpa a seleção com os novos filtros aplicados
                }}
                filterDisplay="row"
                globalFilterFields={["inscricao.edital.titulo"]}
                emptyMessage="Nenhum item encontrado."
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
              >
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: "3rem" }}
                  frozen
                />
                <Column
                  field="id"
                  header="ID_Plano"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por id"
                  filterField="id"
                />
                <Column
                  field="inscricao.status"
                  header="Status Inscrição"
                  sortable
                  filter
                  filterElement={(options) =>
                    statusClassificacaoFilterTemplate(options, [
                      { label: "Pendente", value: "pendente" },
                      { label: "Enviada", value: "enviada" },
                      { label: "Aprovada", value: "aprovada" },
                    ])
                  }
                  showFilterMenu={false}
                  filterField="inscricao.status"
                  body={(rowData) => rowData.inscricao.status}
                  style={{ width: "12rem" }}
                />
                <Column
                  field="statusClassificacao"
                  header="Status Classificação do Plano"
                  sortable
                  filter
                  filterElement={(options) =>
                    statusClassificacaoFilterTemplate(
                      options,
                      statusClassificacaoDisponiveis
                    )
                  }
                  showFilterMenu={false}
                  filterField="statusClassificacao"
                  body={(rowData) =>
                    statusClassificacaoBodyTemplate(
                      rowData,
                      styles,
                      openJustificativaModal
                    )
                  }
                  style={{ width: "12rem" }}
                />
                <Column
                  field="inscricao.edital.titulo"
                  header="Edital"
                  sortable
                  filter
                  filterElement={(options) =>
                    editalRowFilterTemplate(options, editaisDisponiveis)
                  }
                  showFilterMenu={false}
                  filterField="inscricao.edital.titulo"
                />

                <Column
                  field="titulo"
                  header="Título do Plano de Trabalho"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por nome"
                  filterField="titulo"
                  style={{ maxWidth: "20rem" }}
                />
                <Column
                  field="inscricaoProjeto.projeto.area.area"
                  header="Área do Projeto"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por área"
                  filterField="inscricaoProjeto.projeto.area.area"
                  body={(rowData) =>
                    rowData.inscricaoProjeto?.projeto?.area?.area || "-"
                  }
                  style={{ width: "12rem" }}
                />
                <Column
                  field="area.area"
                  header="Área do Plano"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por área"
                  filterField="area.area"
                  body={(rowData) => rowData.area?.area || "-"}
                  style={{ width: "12rem" }}
                />
                <Column
                  field="orientadoresString"
                  header="Orientador"
                  sortable
                  filter
                  showFilterMenu={true}
                  filterField="orientadoresString"
                  filterPlaceholder="Filtrar por nome"
                />
                <Column
                  field="alunosString"
                  header="Aluno"
                  sortable
                  filter
                  showFilterMenu={true}
                  filterField="alunosString"
                  filterPlaceholder="Filtrar por nome"
                />

                <Column
                  field="notaTotal"
                  header="Nota Total Plano de Trabalho"
                  sortable
                  filter
                  filterField="notaTotal"
                  filterElement={notaRowFilterTemplate}
                  filterMatchMode="nota_intervalo"
                  dataType="numeric"
                  body={(rowData) => rowData.notaTotal}
                  style={{ textAlign: "center", width: "8rem" }}
                />
                <Column
                  field="notaProjeto"
                  header="Nota Projeto"
                  sortable
                  filter
                  filterField="notaProjeto"
                  filterElement={notaRowFilterTemplate}
                  filterMatchMode="nota_intervalo"
                  dataType="numeric"
                  body={(rowData) => rowData.notaProjeto}
                  style={{ textAlign: "center", width: "8rem" }}
                />

                <Column
                  field="notaPlano"
                  header="Nota Plano"
                  sortable
                  filter
                  filterField="notaPlano"
                  filterElement={notaRowFilterTemplate}
                  filterMatchMode="nota_intervalo"
                  dataType="numeric"
                  body={(rowData) => rowData.notaPlano}
                  style={{ textAlign: "center", width: "8rem" }}
                />
                <Column
                  field="notaOrientador"
                  header="Nota Orientador"
                  sortable
                  filter
                  filterField="notaOrientador"
                  filterElement={notaRowFilterTemplate}
                  filterMatchMode="nota_intervalo"
                  dataType="numeric"
                  body={(rowData) => rowData.notaOrientador}
                  style={{ textAlign: "center", width: "8rem" }}
                />
                <Column
                  field="notaAluno"
                  header="Nota Aluno"
                  sortable
                  filter
                  filterField="notaAluno"
                  filterElement={notaRowFilterTemplate}
                  filterMatchMode="nota_intervalo"
                  dataType="numeric"
                  body={(rowData) => rowData.notaAluno}
                  style={{ textAlign: "center", width: "8rem" }}
                />

                {/* Colunas herdadas da antiga tabela "Avaliações de Projetos" */}
                <Column
                  field="quantidadeFichas"
                  header="Qtd. Fichas"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por quantidade"
                  filterField="quantidadeFichas"
                />
                <Column
                  field="quantidadeAvaliadores"
                  header="Qtd. Avaliadores"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por quantidade"
                  filterField="quantidadeAvaliadores"
                />
                <Column
                  field="diferencaNotas"
                  header="Diferença de Notas"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por diferença"
                  filterField="diferencaNotas"
                  body={(rowData) =>
                    typeof rowData.diferencaNotas === "number"
                      ? rowData.diferencaNotas.toFixed(2)
                      : rowData.diferencaNotas
                  }
                />
                <Column
                  field="avaliadoresString"
                  header="Avaliadores"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por avaliadores"
                  filterField="avaliadoresString"
                  body={(rowData) => (
                    <div
                      style={{
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={rowData.avaliadoresString}
                    >
                      {rowData.avaliadoresString}
                    </div>
                  )}
                />
              </DataTable>
            </>
          )}
        </Card>
      </main>
      <Dialog
        header="Justificativa de Desclassificação"
        visible={showJustificativaModal}
        style={{ width: "50vw" }}
        onHide={() => setShowJustificativaModal(false)}
      >
        <div style={{ whiteSpace: "pre-line", paddingBottom: "20px" }}>
          {justificativaAtual}
        </div>
      </Dialog>
      <Toast ref={toast} />
    </>
  );
};

export default TabelaPlanoDeTrabalhoAcompanhamento;

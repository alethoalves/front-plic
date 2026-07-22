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
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { FilterService } from "primereact/api";
import { Button as PrimeButton } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";

// COMPONENTES
import Button from "@/components/Button";

// SERVIÇOS
import {
  getAllPlanoDeTrabalhosByTenant,
  aplicarNotaCorte,
} from "@/app/api/client/planoDeTrabalho";
import { alterarStatusAvaliacao } from "@/app/api/client/projeto";
import { handleDefinirNotaCorte } from "@/lib/notaCorteUtils";
import { formatStatusText } from "@/lib/tagUtils";
import {
  editalRowFilterTemplate,
  notaRowFilterTemplate,
  statusClassificacaoBodyTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import Modal from "../Modal";
import ProjetoAvaliacaoResumo from "../ProjetoAvaliacaoResumo";

// Mesmo conjunto de status de avaliação usado em "Alterar status" na tela de
// Seleção de Projetos (TabelaProjetos.jsx) — é o mesmo campo, propagado da
// mesma forma (InscricaoProjeto -> todos os PlanoDeTrabalho do projeto).
const STATUS_AVALIACAO_OPCOES = [
  "AGUARDANDO_AVALIACAO",
  "EM_AVALIACAO",
  "AVALIADA",
].map((status) => ({ label: formatStatusText(status), value: status }));

// Mesma lista estática usada em TabelaPlanoDeTrabalho.jsx — não depende dos
// dados carregados, por isso é constante de módulo, não state.
const STATUS_CLASSIFICACAO_DISPONIVEIS = [
  { label: "Em análise", value: "EM_ANALISE" },
  { label: "Classificado", value: "CLASSIFICADO" },
  { label: "Desclassificado", value: "DESCLASSIFICADO" },
];

const BLOQUEIO_OPCOES = [
  { label: "Bloqueado", value: true },
  { label: "Não bloqueado", value: false },
];

// Registra filtro personalizado para intervalo de notas
FilterService.register("nota_intervalo", (value, filters) => {
  const [min, max] = filters ?? [undefined, undefined];

  if (min === undefined && max === undefined) return true;
  if (typeof min === "number" && value < min) return false;
  if (typeof max === "number" && value > max) return false;

  return true;
});

// Fábrica dos filtros iniciais — usada tanto no useState quanto no reset
// do botão "Limpar Filtros", pra não duplicar o objeto em dois lugares.
const getInitialFilters = () => ({
  global: { value: "", matchMode: FilterMatchMode.CONTAINS },
  id: { value: "", matchMode: FilterMatchMode.CONTAINS },
  "inscricaoProjeto.statusAvaliacao": {
    value: [],
    matchMode: FilterMatchMode.IN,
  },
  statusClassificacao: { value: [], matchMode: FilterMatchMode.IN },
  "inscricaoProjeto.bloqueadoAvaliacao": {
    value: [],
    matchMode: FilterMatchMode.IN,
  },
  "inscricao.edital.titulo": {
    value: [],
    matchMode: FilterMatchMode.IN,
  },
  titulo: { value: "", matchMode: FilterMatchMode.CONTAINS },
  "inscricaoProjeto.projeto.titulo": {
    value: "",
    matchMode: FilterMatchMode.CONTAINS,
  },
  "inscricaoProjeto.projeto.area.area": {
    value: [],
    matchMode: FilterMatchMode.IN,
  },
  "area.area": { value: [], matchMode: FilterMatchMode.IN },
  orientadoresString: {
    value: "",
    matchMode: FilterMatchMode.CONTAINS,
  },
  alunosString: {
    value: "",
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
  quantidadeFichas: { value: "", matchMode: FilterMatchMode.CONTAINS },
  quantidadeAvaliadores: {
    value: "",
    matchMode: FilterMatchMode.CONTAINS,
  },
  diferencaNotas: { value: "", matchMode: FilterMatchMode.CONTAINS },
  avaliadoresString: { value: "", matchMode: FilterMatchMode.CONTAINS },
});

const TabelaPlanoDeTrabalhoAcompanhamento = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [editaisDisponiveis, setEditaisDisponiveis] = useState([]);
  const [areasProjetoDisponiveis, setAreasProjetoDisponiveis] = useState([]);
  const [areasPlanoDisponiveis, setAreasPlanoDisponiveis] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [novoStatus, setNovoStatus] = useState(null);
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [notaCorte, setNotaCorte] = useState(0);
  const [isLoadingNotaCorte, setIsLoadingNotaCorte] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showJustificativaModal, setShowJustificativaModal] = useState(false);
  const [justificativaAtual, setJustificativaAtual] = useState("");
  const [showJustificativaBloqueioModal, setShowJustificativaBloqueioModal] =
    useState(false);
  const [justificativaBloqueioAtual, setJustificativaBloqueioAtual] =
    useState("");

  // REFS
  const toast = useRef(null);
  const dataTableRef = useRef(null);

  // FILTROS
  const [filters, setFilters] = useState(getInitialFilters());
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

          // Diferença de notas: mesma régua usada no modal de detalhe (soma
          // projeto + plano por avaliador, já que o mesmo avaliador envia os
          // dois juntos na mesma submissão) — ignora fichas arquivadas e
          // fichas "sem nota" (período bloqueado), senão o max/min fica
          // distorcido por valores que não deveriam contar.
          const notaCombinadaPorAvaliador = new Map();
          fichasProjeto
            .filter((f) => !f.arquivada && f.notaTotal !== null)
            .forEach((f) => {
              notaCombinadaPorAvaliador.set(
                f.avaliadorId,
                (notaCombinadaPorAvaliador.get(f.avaliadorId) || 0) + f.notaTotal
              );
            });
          (item.FichaAvaliacao || [])
            .filter((f) => !f.arquivada && f.notaTotal !== null)
            .forEach((f) => {
              notaCombinadaPorAvaliador.set(
                f.avaliadorId,
                (notaCombinadaPorAvaliador.get(f.avaliadorId) || 0) + f.notaTotal
              );
            });
          const notasCombinadas = Array.from(notaCombinadaPorAvaliador.values());

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
              notasCombinadas.length > 0
                ? Math.max(...notasCombinadas) - Math.min(...notasCombinadas)
                : "N/A",
          };
        }) || [];
      setItens(itensProcessados);
      // Mantém o plano aberto no modal em sincronia após qualquer refresh
      // (ex.: arquivar/desarquivar uma ficha) — sem isso, planoFichas
      // continuaria mostrando os dados antigos até o modal ser reaberto.
      setSelectedPlano((prevSelected) =>
        prevSelected
          ? itensProcessados.find((item) => item.id === prevSelected.id) ??
            prevSelected
          : prevSelected
      );

      const editaisUnicos = [
        ...new Set(itens.map((item) => item.inscricao?.edital?.titulo)),
      ].filter(Boolean);

      setEditaisDisponiveis(
        editaisUnicos.map((edital) => ({ label: edital, value: edital }))
      );

      const areasProjetoUnicas = [
        ...new Set(
          itens.map((item) => item.inscricaoProjeto?.projeto?.area?.area)
        ),
      ].filter(Boolean);

      setAreasProjetoDisponiveis(
        areasProjetoUnicas.map((area) => ({ label: area, value: area }))
      );

      const areasPlanoUnicas = [
        ...new Set(itens.map((item) => item.area?.area)),
      ].filter(Boolean);

      setAreasPlanoDisponiveis(
        areasPlanoUnicas.map((area) => ({ label: area, value: area }))
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
  const abrirMenuAcoes = () => setActiveModal("menuAcoes");

  const fecharModalAcao = () => {
    setActiveModal(null);
    setNovoStatus(null);
    setNotaCorte(0);
  };

  const openJustificativaModal = (rowData) => {
    if (rowData.justificativa) {
      setJustificativaAtual(rowData.justificativa);
      setShowJustificativaModal(true);
    }
  };

  const abrirJustificativaBloqueio = (rowData) => {
    setJustificativaBloqueioAtual(
      rowData.inscricaoProjeto?.justificativaBloqueio || ""
    );
    setShowJustificativaBloqueioModal(true);
  };

  // Ids únicos de InscricaoProjeto (projeto pai) por trás dos planos
  // selecionados. Um mesmo projeto pode ter vários planos de trabalho
  // (irmãos) selecionados ao mesmo tempo — o status é alterado por
  // projeto, não por plano.
  const inscricaoProjetoIdsSelecionados = [
    ...new Set(
      selectedItems.map((item) => item.inscricaoProjeto?.id).filter(Boolean)
    ),
  ];

  const confirmarAlterarStatus = async () => {
    setSalvandoStatus(true);
    try {
      await alterarStatusAvaliacao(
        params.tenant,
        inscricaoProjetoIdsSelecionados,
        novoStatus
      );
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Status atualizado com sucesso.",
        life: 3000,
      });
      await fetchInitialData();
      setSelectedItems([]);
      fecharModalAcao();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao alterar o status.",
        life: 3000,
      });
    } finally {
      setSalvandoStatus(false);
    }
  };

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
      toast,
    });
    fecharModalAcao();
  };

  // HANDLERS
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
    setSelectedItems([]); // consistente com onFilter, que já limpa a seleção a cada mudança de filtro
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap justify-content-between align-items-center gap-2">
        <PrimeButton
          icon="pi pi-filter-slash"
          label="Limpar Filtros"
          onClick={clearFilters}
          className="p-button-outlined p-button-secondary"
        />
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
          {selectedItems.length > 0 && (
            <div
              className={`flex align-items-center gap-2 mb-2 ${styles.acaoLote}`}
            >
              <span>
                {selectedItems.length} plano(s) de trabalho
                selecionado(s)
              </span>
              <Button className="button btn-primary" onClick={abrirMenuAcoes}>
                Executar Ação
              </Button>
            </div>
          )}

          <DataTable
            ref={dataTableRef}
            value={itens}
            loading={loading}
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
              field="inscricaoProjeto.statusAvaliacao"
              header="Status Avaliação"
              sortable
              filter
              filterElement={(options) =>
                editalRowFilterTemplate(options, STATUS_AVALIACAO_OPCOES)
              }
              showFilterMenu={false}
              filterField="inscricaoProjeto.statusAvaliacao"
              body={(rowData) =>
                rowData.inscricaoProjeto?.statusAvaliacao || "-"
              }
              style={{ width: "14rem" }}
            />
            <Column
              field="inscricaoProjeto.bloqueadoAvaliacao"
              header="Bloqueio"
              sortable
              filter
              filterElement={(options) =>
                editalRowFilterTemplate(options, BLOQUEIO_OPCOES)
              }
              showFilterMenu={false}
              filterField="inscricaoProjeto.bloqueadoAvaliacao"
              body={(rowData) =>
                rowData.inscricaoProjeto?.bloqueadoAvaliacao ? (
                  <Tag
                    severity="warning"
                    className={styles.tagClicavel}
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirJustificativaBloqueio(rowData);
                    }}
                  >
                    Bloqueado
                  </Tag>
                ) : (
                  "-"
                )
              }
              style={{ width: "10rem" }}
            />
            <Column
              field="statusClassificacao"
              header="Status Classificação do Plano"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  STATUS_CLASSIFICACAO_DISPONIVEIS
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
              field="inscricaoProjeto.projeto.titulo"
              header="Nome do Projeto"
              sortable
              filter
              filterPlaceholder="Filtrar por nome"
              filterField="inscricaoProjeto.projeto.titulo"
              body={(rowData) =>
                rowData.inscricaoProjeto?.projeto?.titulo || "-"
              }
              style={{ maxWidth: "20rem" }}
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
              filterElement={(options) =>
                editalRowFilterTemplate(options, areasProjetoDisponiveis)
              }
              showFilterMenu={false}
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
              filterElement={(options) =>
                editalRowFilterTemplate(options, areasPlanoDisponiveis)
              }
              showFilterMenu={false}
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
        </Card>
      </main>
      <Modal isOpen={activeModal !== null} onClose={fecharModalAcao} size="small">
        {(() => {
          switch (activeModal) {
            case "menuAcoes":
              return (
                <div className={styles.menuAcoes}>
                  <h5 className="mb-2">Executar ação</h5>
                  <ul>
                    <li onClick={() => setActiveModal("alterarStatus")}>
                      <p>Alterar status</p>
                    </li>
                    <li onClick={() => setActiveModal("aplicarNotaCorte")}>
                      <p>Aplicar nota de corte</p>
                    </li>
                  </ul>
                </div>
              );
            case "alterarStatus":
              return (
                <div className={styles.formNotaManual}>
                  <h5 className="mb-2">Alterar status</h5>
                  <p className="mb-2">
                    O novo status substituirá o status atual d
                    {inscricaoProjetoIdsSelecionados.length > 1 ? "os" : "o"}{" "}
                    {inscricaoProjetoIdsSelecionados.length} projeto(s)
                    vinculado(s) aos planos de trabalho selecionados — e será
                    propagado para TODOS os planos de trabalho desses
                    projetos, não apenas para os que estão selecionados
                    agora.
                  </p>
                  <label htmlFor="novoStatus">Status</label>
                  <Dropdown
                    inputId="novoStatus"
                    value={novoStatus}
                    options={STATUS_AVALIACAO_OPCOES}
                    onChange={(e) => setNovoStatus(e.value)}
                    placeholder="Selecione o status"
                    className="w-100 mt-1"
                  />
                  <div className="flex justify-content-end gap-2 mt-3">
                    <Button className="button btn-secondary" onClick={fecharModalAcao}>
                      Cancelar
                    </Button>
                    <Button
                      className="button btn-primary"
                      onClick={confirmarAlterarStatus}
                      loading={salvandoStatus}
                      disabled={!novoStatus}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              );
            case "aplicarNotaCorte":
              return (
                <div className={styles.formNotaManual}>
                  <h5 className="mb-2">Aplicar nota de corte</h5>
                  <p className="mb-2">
                    Planos com nota total maior ou igual à nota de corte
                    serão classificados; os demais, desclassificados. Isso
                    será aplicado aos {selectedItems.length} plano(s) de
                    trabalho selecionado(s).
                  </p>
                  <label htmlFor="notaCorte">Nota de corte</label>
                  <InputNumber
                    inputId="notaCorte"
                    value={notaCorte}
                    onValueChange={(e) => setNotaCorte(e.value ?? 0)}
                    mode="decimal"
                    min={0}
                    max={100}
                    placeholder="Nota"
                    className="w-100 mt-1"
                  />
                  {isLoadingNotaCorte && (
                    <div className="mt-3">
                      <ProgressBar
                        value={progress}
                        style={{ height: "6px" }}
                        showValue={false}
                      />
                      <small className="block text-center mt-1">
                        {progress}% completo (
                        {Math.round(
                          (selectedItems.length * progress) / 100
                        )}{" "}
                        de {selectedItems.length} itens)
                      </small>
                    </div>
                  )}
                  <div className="flex justify-content-end gap-2 mt-3">
                    <Button
                      className="button btn-secondary"
                      onClick={fecharModalAcao}
                      disabled={isLoadingNotaCorte}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="button btn-primary"
                      onClick={handleDefinirNotaCorteWrapper}
                      loading={isLoadingNotaCorte}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              );
            default:
              return null;
          }
        })()}
      </Modal>
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
      <Dialog
        header="Justificativa do Bloqueio"
        visible={showJustificativaBloqueioModal}
        style={{ width: "50vw" }}
        onHide={() => setShowJustificativaBloqueioModal(false)}
      >
        <div style={{ whiteSpace: "pre-line", paddingBottom: "20px" }}>
          {justificativaBloqueioAtual}
        </div>
      </Dialog>
      <Toast ref={toast} />
    </>
  );
};

export default TabelaPlanoDeTrabalhoAcompanhamento;

"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { MultiSelect } from "primereact/multiselect";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Tooltip } from "primereact/tooltip";
import { getInscricaoProjetoByTenant } from "@/app/api/client/projeto";
import Modal from "@/components/Modal"; // Importe o componente Modal personalizado
import ModalInscricao from "@/components/ModalInscricao"; // Importe o componente ModalInscricao
import FormGestorProjetoCreateOrEdit from "@/components/Formularios/FormGestorProjetoCreateOrEdit";

const AvaliacoesProjetos = ({
  params,
  setProjetosSelecionados,
  processarInscricoes,
  inscricoesProjetos,
  setInscricoesProjetos,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filtroStatus, setFiltroStatus] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar a abertura do modal
  const [selectedInscricao, setSelectedInscricao] = useState(null); // Estado para armazenar a inscrição selecionada
  const [selectedProjetos, setSelectedProjetos] = useState([]);

  const dataTableRef = useRef(null);

  // Filtros
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "inscricao.id": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "inscricao.edital.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.edital.ano": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "projeto.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "projeto.area.area": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.proponente.nome": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    avaliadores: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
    },
    quantidadeFichas: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    quantidadeAvaliadores: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    notaMedia: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    diferencaNotas: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
  });

  // Buscar inscrições de projetos e criar colunas virtuais
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await processarInscricoes(params.tenant, setInscricoesProjetos);
      } catch (error) {
        console.error("Erro ao buscar inscrições de projetos:", error);
        setError("Erro ao buscar inscrições de projetos.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  // Filtro global
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Filtro de status
  const statusOptions = [
    { label: "AGUARDANDO_AVALIACAO", value: "AGUARDANDO_AVALIACAO" },
    { label: "EM_AVALIACAO", value: "EM_AVALIACAO" },
    { label: "AVALIADA", value: "AVALIADA" },
  ];

  // Aplicar filtro de status
  const inscricoesFiltradas =
    filtroStatus.length > 0
      ? inscricoesProjetos.filter((inscricao) =>
          filtroStatus.includes(inscricao.statusAvaliacao)
        )
      : inscricoesProjetos;

  // Exportar para Excel
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Avaliações de Projetos");

    // Cabeçalhos
    worksheet.columns = [
      { header: "ID Inscrição", key: "id", width: 15 },
      { header: "Título do Edital", key: "editalTitulo", width: 30 },
      { header: "Ano do Edital", key: "editalAno", width: 15 },
      { header: "ID Projeto", key: "projetoId", width: 15 },
      { header: "Título do Projeto", key: "projetoTitulo", width: 30 },
      { header: "Área do Projeto", key: "projetoArea", width: 25 },
      { header: "Qtd. Fichas", key: "quantidadeFichas", width: 15 },
      { header: "Nota Média", key: "notaMedia", width: 15 },
      { header: "Avaliadores", key: "avaliadores", width: 40 },
      { header: "Proponente", key: "proponente", width: 40 },
      { header: "Status Avaliação", key: "statusAvaliacao", width: 20 }, // Nova coluna
      { header: "Qtd. Avaliadores", key: "quantidadeAvaliadores", width: 20 }, // Nova coluna
      { header: "Diferença de Notas", key: "diferencaNotas", width: 20 }, // Nova coluna
    ];

    // Adicionar dados
    inscricoesFiltradas.forEach((inscricao) => {
      worksheet.addRow({
        id: inscricao.id,
        editalTitulo: inscricao.inscricao.edital.titulo,
        editalAno: inscricao.inscricao.edital.ano,
        projetoId: inscricao.projeto.id,
        projetoTitulo: inscricao.projeto.titulo,
        projetoArea: inscricao.projeto.area?.area || "N/A",
        quantidadeFichas: inscricao.quantidadeFichas,
        notaMedia: inscricao.notaMedia,
        avaliadores: inscricao.avaliadores,
        proponente: inscricao.inscricao.proponente.nome,
        statusAvaliacao: inscricao.statusAvaliacao, // Nova coluna
        quantidadeAvaliadores: inscricao.quantidadeAvaliadores, // Nova coluna
        diferencaNotas: inscricao.diferencaNotas, // Nova coluna
      });
    });

    // Salvar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "InscricoesProjetos.xlsx");
  };

  // Cabeçalho da tabela
  const renderHeader = () => {
    return (
      <div className="">
        <h4 className="m-0 mr-2">Projetos</h4>
        <div className="m-2">
          <label htmlFor="filtroStatus" className="block ">
            <p>Busque por palavra-chave:</p>
          </label>
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Pesquisar..."
            style={{ width: "100%" }}
          />
          <label htmlFor="filtroStatus" className="block mt-2">
            <p>Filtre por status:</p>
          </label>
          <MultiSelect
            id="filtroStatus"
            value={filtroStatus}
            options={statusOptions}
            onChange={(e) => setFiltroStatus(e.value)}
            placeholder="Selecione os status"
            display="chip"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  };

  // Função para abrir o modal com os dados da linha selecionada
  const handleRowClick = (event) => {
    setSelectedInscricao({
      tenant: params.tenant,
      idInscricao: event.data.inscricao.id,
      idProjeto: event.data.projetoId,
    });
    setIsModalOpen(true);
  };
  const paginatorRight = (
    <Button
      type="button"
      icon="pi pi-download"
      text
      onClick={exportExcel}
      tooltip="Exportar para Excel"
      tooltipOptions={{ position: "top" }}
    />
  );
  // Função para fechar o modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInscricao(null);
  };

  return (
    <>
      <main>
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <ProgressSpinner />
          </div>
        ) : error ? (
          <Message severity="error" text={error} />
        ) : (
          <Card className="custom-card">
            {/* Filtro de status */}

            <DataTable
              ref={dataTableRef}
              value={inscricoesFiltradas}
              paginator
              rows={10}
              rowsPerPageOptions={[10, 20, 50]}
              scrollable
              dataKey="id"
              header={renderHeader()}
              filters={filters}
              filterDisplay="menu"
              globalFilterFields={[
                "inscricao.edital.titulo",
                "inscricao.edital.ano",
                "projeto.titulo",
                "projeto.area.area",
                "inscricao.proponente.nome",
                "statusAvaliacao",
                "quantidadeFichas", // Adicionar o campo de filtro global
                "quantidadeAvaliadores", // Adicionar o campo de filtro global
                "notaMedia", // Adicionar o campo de filtro global
                "diferencaNotas", // Adicionar o campo de filtro global
              ]}
              emptyMessage="Nenhuma inscrição de projeto encontrada."
              rowClassName="clickable-row"
              onRowClick={(e) => {
                handleRowClick(e);
              }}
              selection={selectedProjetos}
              onSelectionChange={(e) => {
                setSelectedProjetos(e.value);
                setProjetosSelecionados(e.value);
              }}
              paginatorRight={paginatorRight} // Adicione o botão de download aquiç
            >
              {/* Colunas existentes */}
              <Column
                selectionMode="multiple"
                headerStyle={{ width: "3em" }}
                onClick={(e) => {
                  // Impede a propagação do evento para evitar a seleção da linha
                  e.originalEvent.stopPropagation();
                }}
                frozen
              />
              <Column
                field="inscricao.edital.titulo"
                header="Edital"
                sortable
                filter
                filterPlaceholder="Filtrar por título"
              />
              <Column
                field="inscricao.edital.ano"
                header="Ano"
                sortable
                filter
                filterPlaceholder="Filtrar por ano"
              />
              <Column
                field="projeto.id"
                header="ID Projeto"
                sortable
                filter
                filterPlaceholder="Filtrar por ID"
              />
              {/* Nova coluna: statusAvaliacao */}
              <Column
                field="statusAvaliacao"
                header="Status Avaliação"
                sortable
                filter
                filterPlaceholder="Filtrar por status"
              />
              <Column
                field="projeto.titulo"
                header="Título do Projeto"
                sortable
                filter
                filterPlaceholder="Filtrar por título"
                style={{ maxWidth: "300px" }}
                body={(rowData) => (
                  <div
                    className="custom-tooltip"
                    style={{
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    data-pr-tooltip={rowData.projeto.titulo}
                    data-pr-position="top"
                  >
                    {rowData.projeto.titulo}
                  </div>
                )}
              />
              <Column
                field="projeto.area.area"
                header="Área do Projeto"
                sortable
                filter
                filterPlaceholder="Filtrar por área"
                body={(rowData) => rowData.projeto.area?.area || "N/A"}
              />
              <Column
                field="quantidadeFichas"
                header="Qtd. Fichas"
                sortable
                filter
                filterPlaceholder="Filtrar por quantidade"
                filterField="quantidadeFichas" // Adicionar o campo de filtro
              />
              <Column
                field="quantidadeAvaliadores"
                header="Qtd. Avaliadores"
                sortable
                filter
                filterPlaceholder="Filtrar por quantidade"
                filterField="quantidadeAvaliadores" // Adicionar o campo de filtro
              />
              <Column
                field="notaMedia"
                header="Nota Média"
                sortable
                filter
                filterPlaceholder="Filtrar por nota média"
                filterField="notaMedia" // Adicionar o campo de filtro
              />
              <Column
                field="diferencaNotas"
                header="Diferença de Notas"
                sortable
                filter
                filterPlaceholder="Filtrar por diferença"
                filterField="diferencaNotas" // Adicionar o campo de filtro
                body={(rowData) =>
                  typeof rowData.diferencaNotas === "number"
                    ? rowData.diferencaNotas.toFixed(2)
                    : rowData.diferencaNotas
                }
              />

              <Column
                field="avaliadores"
                header="Avaliadores"
                sortable
                filter
                filterPlaceholder="Filtrar por avaliadores"
                body={(rowData) => (
                  <div
                    className="custom-tooltip"
                    style={{
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    data-pr-tooltip={rowData.avaliadores}
                    data-pr-position="top"
                  >
                    {rowData.avaliadores}
                  </div>
                )}
              />
              <Column
                field="inscricao.proponente.nome"
                header="Proponente"
                sortable
                filter
                filterPlaceholder="Filtrar por proponente"
                body={(rowData) => (
                  <div
                    className="custom-tooltip"
                    style={{
                      maxWidth: "300px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    data-pr-tooltip={rowData.inscricao.proponente.nome}
                    data-pr-position="top"
                  >
                    {rowData.inscricao.proponente.nome}
                  </div>
                )}
              />
            </DataTable>

            <Tooltip target=".custom-tooltip" />
          </Card>
        )}

        {/* Modal personalizado para exibir detalhes da inscrição */}
        <Modal isOpen={isModalOpen} onClose={closeModal}>
          {selectedInscricao && (
            <div className="mt-3">
              <FormGestorProjetoCreateOrEdit
                projetoId={selectedInscricao.idProjeto}
                tenantSlug={params.tenant}
                idInscricao={selectedInscricao.idInscricao}
                onSuccess={() =>
                  processarInscricoes(params.tenant, setInscricoesProjetos)
                }
                onClose={closeModal}
              />
            </div>
          )}
        </Modal>
      </main>
    </>
  );
};

export default AvaliacoesProjetos;

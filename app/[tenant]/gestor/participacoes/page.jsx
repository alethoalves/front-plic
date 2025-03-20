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
import { MultiSelect } from "primereact/multiselect"; // Substituir Dropdown por MultiSelect
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getParticipacoesByTenant } from "@/app/api/client/participacao";
import { Toast } from "primereact/toast";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itens, setItens] = useState([]); // Dados completos
  const [filteredItens, setFilteredItens] = useState([]); // Dados filtrados
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [statusFiltro, setStatusFiltro] = useState([]); // Agora é um array
  const [tipoFiltro, setTipoFiltro] = useState([]); // Agora é um array
  const dataTableRef = useRef(null);
  const toast = useRef(null);

  // Filtros do DataTable
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "inscricao.edital.ano": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "inscricao.edital.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "user.nome": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    status: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    tipo: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
  });

  // Opções para os filtros de seleção
  const statusOptions = [
    { label: "Ativo", value: "ativo" },
    { label: "Inativo", value: "inativo" },
    { label: "Completo", value: "completo" },
    { label: "Incompleto", value: "incompleto" },
  ];

  const tipoOptions = [
    { label: "Orientador", value: "orientador" },
    { label: "Coorientador", value: "coorientador" },
    { label: "Aluno", value: "aluno" },
  ];

  // Buscar dados das participações
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const participacoes = await getParticipacoesByTenant(params.tenant);
        setItens(participacoes || []);
        setFilteredItens(participacoes || []); // Inicializa os itens filtrados
      } catch (error) {
        console.error("Erro ao buscar participações:", error);
        setError("Erro ao buscar participações.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  // Aplicar filtros externos (status e tipo) sempre que mudarem
  useEffect(() => {
    let filteredData = itens;

    // Filtro por status (ignora se statusFiltro estiver vazio)
    if (statusFiltro.length > 0) {
      filteredData = filteredData.filter((item) =>
        statusFiltro.includes(item.status)
      );
    }

    // Filtro por tipo (ignora se tipoFiltro estiver vazio)
    if (tipoFiltro.length > 0) {
      filteredData = filteredData.filter((item) =>
        tipoFiltro.includes(item.tipo)
      );
    }

    setFilteredItens(filteredData); // Atualiza os itens filtrados
  }, [statusFiltro, tipoFiltro, itens]);

  // Função para exportar para Excel
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Participações");

    // Cabeçalhos
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Tipo", key: "tipo", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Início", key: "inicio", width: 15 },
      { header: "Fim", key: "fim", width: 15 },
      { header: "Edital", key: "edital", width: 20 },
      { header: "Ano", key: "ano", width: 10 },
      { header: "Usuário", key: "usuario", width: 25 },
      { header: "CPF", key: "cpf", width: 15 },
    ];

    // Adicionar dados
    filteredItens.forEach((item) => {
      worksheet.addRow({
        id: item.id,
        tipo: item.tipo,
        status: item.status,
        inicio: item.inicio || "N/A",
        fim: item.fim || "N/A",
        edital: item.inscricao?.edital?.titulo || "N/A",
        ano: item.inscricao?.edital?.ano || "N/A",
        usuario: item.user?.nome || "N/A",
        cpf: item.user?.cpf || "N/A",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Participacoes.xlsx");
  };

  // Filtro global
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Cabeçalho da tabela
  const renderHeader = () => {
    return (
      <div className="">
        <h4 className="m-0 mr-2">Participações</h4>
        <div className="m-2">
          <label htmlFor="filtroStatus" className="block">
            <p>Busque por palavra-chave:</p>
          </label>
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Pesquisar..."
            style={{ width: "100%" }}
          />
          <label htmlFor="filtroTipo" className="block mt-2">
            <p>Filtre por tipo:</p>
          </label>
          <MultiSelect
            id="tipoFiltro"
            value={tipoFiltro}
            options={tipoOptions}
            onChange={(e) => setTipoFiltro(e.value)}
            placeholder="Selecione o tipo"
            display="chip"
            style={{ width: "100%" }}
          />
          <label htmlFor="filtroStatus" className="block mt-2">
            <p>Filtre por status:</p>
          </label>
          <MultiSelect
            id="statusFiltro"
            value={statusFiltro}
            options={statusOptions}
            onChange={(e) => setStatusFiltro(e.value)}
            placeholder="Selecione o status"
            display="chip"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  };

  return (
    <main>
      <Toast ref={toast} />
      {loading ? (
        <div className="flex justify-center items-center h-20">
          <ProgressSpinner />
        </div>
      ) : error ? (
        <Message severity="error" text={error} />
      ) : (
        <Card className="custom-card">
          <DataTable
            ref={dataTableRef}
            value={filteredItens} // Usa os itens filtrados
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            scrollable
            selectionMode={"checkbox"}
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            dataKey="id"
            header={renderHeader()}
            filters={filters} // Filtros das colunas
            filterDisplay="menu"
            globalFilterFields={[
              "inscricao.edital.ano",
              "inscricao.edital.titulo",
              "user.nome",
              "status",
              "tipo",
            ]}
            emptyMessage="Nenhuma participação encontrada."
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column field="id" header="ID" sortable filter />
            <Column field="tipo" header="Tipo" sortable filter />
            <Column field="status" header="Status" sortable filter />
            <Column field="inicio" header="Início" sortable />
            <Column field="fim" header="Fim" sortable />
            <Column
              field="inscricao.edital.titulo"
              header="Edital"
              sortable
              filter
            />
            <Column field="inscricao.edital.ano" header="Ano" sortable filter />
            <Column field="user.nome" header="Usuário" sortable filter />
            <Column field="user.cpf" header="CPF" sortable filter />
          </DataTable>
        </Card>
      )}
    </main>
  );
};

export default Page;

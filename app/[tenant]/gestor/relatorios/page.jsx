"use client";
import { getInscricaoProjetoByTenant } from "@/app/api/client/projeto";
import Header from "@/components/Header";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import ExcelJS from "exceljs"; // Importando exceljs
import { saveAs } from "file-saver"; // Para salvar o arquivo
import { Dialog } from "primereact/dialog";
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  const visualizarProjeto = (projeto) => {
    setProjetoSelecionado(projeto);
    setModalVisible(true);
  };
  <Dialog
    header="Detalhes do Projeto"
    visible={modalVisible}
    style={{ width: "50vw" }}
    onHide={() => setModalVisible(false)}
  >
    {projetoSelecionado && (
      <div>
        <p>
          <strong>ID:</strong> {projetoSelecionado.inscricao.id}
        </p>
        <p>
          <strong>Título:</strong> {projetoSelecionado.projeto.titulo}
        </p>
        <p>
          <strong>Proponente:</strong>{" "}
          {projetoSelecionado.inscricao.proponente?.nome}
        </p>
        <p>
          <strong>Edital:</strong> {projetoSelecionado.inscricao.edital?.titulo}{" "}
          ({projetoSelecionado.inscricao.edital?.ano})
        </p>
      </div>
    )}
  </Dialog>;
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "inscricao.id": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }], // Teste "EQUALS" ou outro modo compatível
    },
    "inscricao.status": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.edital.ano": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "inscricao.edital.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },

    "projeto.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "projeto.InscricaoProjeto.notaFinal": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    titulo: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.alunoParticipacoes": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.orientadorParticipacoes": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "projeto.InscricaoProjeto.statusAvaliacao": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const dataTableRef = useRef(null);
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Projetos");

    // Definir cabeçalhos
    worksheet.columns = [
      { header: "ID da Inscrição", key: "inscricaoId", width: 15 },
      { header: "Título", key: "titulo", width: 30 },
      { header: "Proponente", key: "proponente", width: 25 },
      { header: "Nome do Edital", key: "edital", width: 20 },
      { header: "Ano do Edital", key: "ano", width: 10 },
    ];

    // Adicionar os dados na planilha
    projetos.forEach((projeto) => {
      worksheet.addRow({
        inscricaoId: projeto.inscricao.id,
        titulo: projeto.projeto.titulo,
        proponente: projeto.inscricao.proponente?.nome || "Não informado",
        edital: projeto.inscricao.edital?.titulo || "Não informado",
        ano: projeto.inscricao.edital?.ano || "Não informado",
      });
    });

    // Criar o buffer e baixar o arquivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Projetos.xlsx");
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const projetos = await getAllPlanoDeTrabalhosByTenant(params.tenant);
        setProjetos(projetos || []);
      } catch (error) {
        console.error("Erro ao buscar projetos:", error);
        setError("Erro ao buscar projetos.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap gap-2 justify-content-between align-items-center">
        <h4 className="m-0 mr-2">Planos de Trabalho</h4>
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Pesquisar..."
        />
      </div>
    );
  };

  return (
    <main>
      {loading ? (
        <div className="flex justify-center items-center h-20">
          <ProgressSpinner />
        </div>
      ) : error ? (
        <Message severity="error" text={error} />
      ) : (
        <Card className="custom-card">
          <div className="flex gap-2 header-table">
            <Button
              type="button"
              icon="pi pi-file-excel"
              label="Exportar Excel"
              className="p-button-success mr-1"
              onClick={exportExcel}
            />
            <Button
              type="button"
              icon="pi pi-check"
              label="Exibir Selecionados"
              className="p-button-info"
              onClick={() =>
                console.log("Itens selecionados:", selectedProjects)
              }
            />
          </div>

          <DataTable
            ref={dataTableRef}
            value={projetos}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            scrollable
            selection={selectedProjects}
            onSelectionChange={(e) => setSelectedProjects(e.value)}
            dataKey="id"
            header={renderHeader()}
            filters={filters}
            filterDisplay="menu"
            globalFilterFields={[
              "inscricao.id",
              "inscricao.status",
              "inscricao.edital.ano",
              "inscricao.edital.titulo",
              "projeto.titulo",
              "projeto.InscricaoProjeto.notaFinal",
              "titulo",
              "orientadorParticipacoes",
              "inscricao.alunoParticipacoes",
              "projeto.InscricaoProjeto.statusAvaliacao",
            ]}
            emptyMessage="Nenhum plano de trabalho encontrado."
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column
              header="Ações"
              body={(rowData) => <div className="flex gap-2"></div>}
              style={{ minWidth: "8rem" }}
            />
            <Column
              field="inscricao.id"
              header="ID Inscrição"
              sortable
              filter
              filterPlaceholder="Filtrar por Ano"
              filterField="inscricao.id"
              style={{ minWidth: "8rem", maxWidth: "10rem" }}
            />
            <Column
              field="inscricao.status"
              header="Staus Inscrição"
              sortable
              filter
              filterPlaceholder="Filtrar por Ano"
              filterField="inscricao.status"
              style={{ minWidth: "10rem", maxWidth: "20rem" }}
            />
            <Column
              field="inscricao.edital.ano"
              header="Ano"
              sortable
              filter
              filterPlaceholder="Filtrar por Ano"
              filterField="inscricao.edital.ano"
              style={{ minWidth: "8rem", maxWidth: "10rem" }}
            />
            <Column
              field="inscricao.edital.titulo"
              header="Edital"
              sortable
              filter
              filterPlaceholder="Filtrar por Edital"
              filterField="inscricao.edital.titulo"
              style={{ minWidth: "8rem", maxWidth: "10rem" }}
            />
            <Column
              field="projeto.titulo"
              header="Projeto"
              sortable
              filter
              filterPlaceholder="Filtrar por Projeto"
              filterField="projeto.titulo"
              style={{ minWidth: "20rem", maxWidth: "30rem" }}
            />
            <Column
              field="projeto.InscricaoProjeto.statusAvaliacao"
              header="Status projeto"
              sortable
              filter
              filterPlaceholder="Filtrar por status"
              filterField="projeto.InscricaoProjeto.statusAvaliacao"
              style={{ minWidth: "10rem", maxWidth: "20rem" }}
            />
            <Column
              field="projeto.InscricaoProjeto.notaFinal"
              header="Nota Projeto"
              sortable
              filter
              filterPlaceholder="Filtrar por Nota"
              filterField="projeto.InscricaoProjeto.notaFinal"
              style={{ minWidth: "10rem", maxWidth: "20rem" }}
            />
            <Column
              field="titulo"
              header="Plano de Trabalho"
              sortable
              filter
              filterPlaceholder="Filtrar por Plano"
              filterField="titulo"
              style={{ minWidth: "30rem", maxWidth: "40rem" }}
            />
            <Column
              field="inscricao.orientadorParticipacoes"
              header="Orientadores"
              sortable
              filter
              filterPlaceholder="Filtrar por Orientador"
              filterField="orientadorParticipacoes"
              style={{ minWidth: "30rem", maxWidth: "40rem" }}
            />
            <Column
              field="inscricao.alunoParticipacoes"
              header="Alunos"
              sortable
              filter
              filterPlaceholder="Filtrar por Aluno"
              filterField="inscricao.alunoParticipacoes"
              style={{ minWidth: "30rem", maxWidth: "40rem" }}
            />
          </DataTable>
        </Card>
      )}
    </main>
  );
};

export default Page;

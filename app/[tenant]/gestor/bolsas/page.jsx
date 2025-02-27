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
  // Função para calcular a média
  const calcularMedia = (fichas) => {
    const notas = fichas
      .map((f) => f.notaTotal)
      .filter((n) => n !== null && !isNaN(n));

    return notas.length > 0
      ? Number((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2))
      : null;
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
    projetoId: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }], // Teste "EQUALS" ou outro modo compatível
    },
    "projeto.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.proponente.nome": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.edital.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.edital.ano": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    qtdFichas: {
      operator: FilterOperator.AND,
      constraints: [
        { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL },
      ],
    },
    mediaNotas: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.BETWEEN }],
    },
    avaliadores: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const dataTableRef = useRef(null);
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Projetos");

    // Definir cabeçalhos
    worksheet.columns = [
      { header: "ID_Inscrição", key: "inscricaoId", width: 15 },
      { header: "ID_Projeto", key: "projetoId", width: 15 },
      { header: "Título", key: "titulo", width: 30 },
      { header: "Proponente", key: "proponente", width: 25 },
      { header: "Nome do Edital", key: "edital", width: 20 },
      { header: "Ano do Edital", key: "ano", width: 10 },
      { header: "Qtd. Fichas", key: "qtdFichas", width: 15 },
      { header: "Média Notas", key: "mediaNotas", width: 15 },
      { header: "Avaliadores", key: "avaliadores", width: 40 },
    ];

    // Adicionar os dados na planilha
    projetos.forEach((projeto) => {
      worksheet.addRow({
        inscricaoId: projeto.inscricao.id,
        projetoId: projeto.projetoId,
        titulo: projeto.projeto.titulo,
        proponente: projeto.inscricao.proponente?.nome || "Não informado",
        edital: projeto.inscricao.edital?.titulo || "Não informado",
        ano: projeto.inscricao.edital?.ano || "Não informado",
        qtdFichas: projeto.qtdFichas,
        mediaNotas: projeto.mediaNotas || "N/A",
        avaliadores: projeto.avaliadores,
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
        const projetos = await getInscricaoProjetoByTenant(params.tenant);
        // Adicionar campos virtuais
        const projetosFormatados = projetos.map((projeto) => ({
          ...projeto,
          qtdFichas: projeto.FichaAvaliacao.length,
          mediaNotas: calcularMedia(projeto.FichaAvaliacao),
          // Novo campo virtual para avaliadores
          avaliadores:
            projeto.InscricaoProjetoAvaliador?.map((a) => a.avaliador?.nome)
              .filter((nome) => nome) // Remove valores nulos/undefined
              .join("; ") || "Nenhum avaliador", // Valor padrão
        }));

        setProjetos(projetosFormatados || []);
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
        <h4 className="m-0 mr-2">Projetos</h4>
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
          <div className="flex gap-2">
            <Button
              type="button"
              icon="pi pi-file-excel"
              label="Exportar Excel"
              className="p-button-success mr-1 ml-2"
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
              "projeto.titulo",
              "projetoId",
              "inscricao.proponente.nome",
              "inscricao.edital.titulo",
              "inscricao.edital.ano",
              "qtdFichas",
              "mediaNotas",
              "avaliadores",
            ]}
            emptyMessage="Nenhum projeto encontrado."
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column
              header="Ações"
              body={(rowData) => <div className="flex gap-2"></div>}
              style={{ minWidth: "8rem" }}
            />

            <Column
              field="inscricao.id"
              header="Inscrição"
              sortable
              filter
              filterPlaceholder="Filtrar por ID"
              filterField="inscricao.id"
              style={{ minWidth: "8rem", maxWidth: "10rem" }}
            />
            <Column
              field="projetoId"
              header="ID_Projeto"
              sortable
              filter
              filterPlaceholder="Filtrar por id"
              filterField="projetoId"
            />
            <Column
              field="inscricao.edital.titulo"
              header="Edital"
              sortable
              filter
              filterPlaceholder="Filtrar por edital"
              filterField="inscricao.edital.titulo"
            />
            <Column
              field="inscricao.edital.ano"
              header="Ano"
              sortable
              filter
              filterPlaceholder="Filtrar por ano"
              filterField="inscricao.edital.ano"
            />
            <Column
              field="projeto.titulo"
              header="Título"
              sortable
              filter
              filterPlaceholder="Filtrar por título"
              filterField="projeto.titulo"
              style={{
                minWidth: "10rem",
                maxWidth: "20rem",
              }}
            />
            <Column
              field="inscricao.proponente.nome"
              header="Proponente"
              sortable
              filter
              filterPlaceholder="Filtrar por proponente"
              filterField="inscricao.proponente.nome"
              style={{ minWidth: "20rem" }}
            />
            {/* Coluna Qtd. Fichas */}
            <Column
              field="qtdFichas"
              header="Qtd. Fichas"
              sortable
              filter
              dataType="numeric"
              filterPlaceholder="Filtrar por quantidade"
              style={{ width: "120px", textAlign: "center" }}
              body={(rowData) => rowData.qtdFichas}
            />

            {/* Coluna Média */}
            <Column
              field="mediaNotas"
              header="Média das Notas"
              sortable
              filter
              dataType="numeric"
              filterPlaceholder="Filtrar por média"
              style={{ width: "150px", textAlign: "center" }}
              body={(rowData) => rowData.mediaNotas?.toFixed(2) || "N/A"}
            />
            <Column
              field="avaliadores"
              header="Avaliadores"
              sortable
              filter
              filterPlaceholder="Filtrar por avaliador"
              style={{ minWidth: "25rem" }}
              body={(rowData) => rowData.avaliadores}
            />
          </DataTable>
        </Card>
      )}
    </main>
  );
};

export default Page;

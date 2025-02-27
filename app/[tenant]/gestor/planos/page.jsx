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
import calcularMedia from "@/lib/calcularMedia";
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";
import { Dropdown } from "primereact/dropdown";
import { RiEditLine, RiEyeLine } from "@remixicon/react";
import Modal from "@/components/Modal";
import ModalInscricao from "@/components/ModalInscricao";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itens, setItens] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    inscricaoId: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }], // Teste "EQUALS" ou outro modo compatível
    },
    "inscricao.status": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.orientadorParticipacoes": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    projetoId: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }], // Teste "EQUALS" ou outro modo compatível
    },
    "projeto.InscricaoProjeto.projeto.area.area": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "projeto.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "projeto.envolveAnimais": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }], // Use EQUALS para booleanos
    },
    "projeto.envolveHumanos": {
      // Corrigi o typo "envoleHumanos" para "envolveHumanos"
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
    id: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }], // Teste "EQUALS" ou outro modo compatível
    },
    "area.area": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    titulo: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    alunoParticipacoes: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
    },
  });
  const [selected, setSelected] = useState({});
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const dataTableRef = useRef(null);
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Planos de Trabalho");

    // Cabeçalhos alinhados com a DataTable
    worksheet.columns = [
      { header: "Ano", key: "ano", width: 10 },
      { header: "Edital", key: "edital", width: 20 },
      { header: "Inscrição", key: "inscricaoId", width: 15 },
      { header: "Status Inscrição", key: "status", width: 20 },
      { header: "Orientador", key: "orientador", width: 25 },
      { header: "ID_Projeto", key: "projetoId", width: 15 },
      { header: "Área Projeto", key: "areaProjeto", width: 20 },
      { header: "Título Projeto", key: "tituloProjeto", width: 30 },
      { header: "Envolve Humanos", key: "envolveHumanos", width: 20 },
      { header: "Envolve Animais", key: "envolveAnimais", width: 20 },
      { header: "Qtd. Fichas", key: "qtdFichas", width: 15 },
      { header: "Média Notas", key: "mediaNotas", width: 15 },
      { header: "Avaliadores", key: "avaliadores", width: 40 },
      { header: "ID_Plano", key: "idPlano", width: 15 },
      { header: "Área do Plano", key: "areaPlano", width: 20 },
      { header: "Título Plano", key: "tituloPlano", width: 30 },
      { header: "Aluno(s)", key: "alunoParticipacoes", width: 30 },
    ];

    // Adicionando dados
    itens.forEach((item) => {
      worksheet.addRow({
        ano: item.inscricao?.edital?.ano || "Não informado",
        edital: item.inscricao?.edital?.titulo || "Não informado",
        inscricaoId: item.inscricaoId,
        status: item.inscricao?.status || "Não informado",
        orientador: item.inscricao?.orientadorParticipacoes || "Não informado",
        projetoId: item.projetoId,
        areaProjeto:
          item.projeto?.InscricaoProjeto?.projeto?.area?.area ||
          "Não informado",
        tituloProjeto: item.projeto?.titulo || "Não informado",
        envolveHumanos: item.projeto?.envolveHumanos ? "Sim" : "Não", // Verifica se existe o projeto
        envolveAnimais: item.projeto?.envolveAnimais ? "Sim" : "Não",
        qtdFichas: item.qtdFichas,
        mediaNotas: item.mediaNotas?.toFixed(2) || "N/A",
        avaliadores: item.avaliadores,

        idPlano: item.id,
        areaPlano: item.area?.area || "Não informado",
        tituloPlano: item.titulo || "Não informado",
        alunoParticipacoes: item.alunoParticipacoes,
      });
    });

    // Formatação numérica para média
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // Pular cabeçalho
        const mediaCell = row.getCell("mediaNotas");
        if (typeof mediaCell.value === "number") {
          mediaCell.numFmt = "0.00";
        }
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Projetos.xlsx");
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const itens = await getAllPlanoDeTrabalhosByTenant(params.tenant);
        // Adicionar campos virtuais
        const itensComCamposVirtuais = itens.map((item) => ({
          ...item,
          qtdFichas:
            item.projeto?.InscricaoProjeto?.FichaAvaliacao?.length || 0, // Corrigido com optional chaining
          mediaNotas: calcularMedia(
            item.projeto?.InscricaoProjeto?.FichaAvaliacao || []
          ), // Garante array vazio como fallback
          avaliadores:
            item.projeto?.InscricaoProjeto?.InscricaoProjetoAvaliador?.map(
              // Adicionado optional chaining
              (a) => a.avaliador?.nome
            )
              .filter(Boolean) // Filtra nomes nulos/vazios
              .join("; ") || "Nenhum avaliador",
          // Novo campo virtual para alunos
          alunoParticipacoes:
            item.participacoes
              ?.map((p) => `${p.user?.nome} (${p.status})`)
              ?.join("; ") || "Nenhum aluno vinculado",
        }));

        setItens(itensComCamposVirtuais || []);
        console.log(itensComCamposVirtuais);
      } catch (error) {
        console.error("Erro ao buscar itens:", error);
        setError("Erro ao buscar itens.");
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
  const openModalAndSetData = () => {};
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setSelected({});
  };

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <ModalInscricao
        selected={selected}
        atualizarItens={setItens} // Passa a função setItens para atualização
      />
    </Modal>
  );
  return (
    <main>
      {renderModalContent()}
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
              onClick={() => console.log("Itens selecionados:", selectedItems)}
            />
          </div>

          <DataTable
            ref={dataTableRef}
            value={itens}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            scrollable
            selectionMode={"checkbox"}
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            dataKey="id"
            header={renderHeader()}
            filters={filters}
            filterDisplay="menu"
            globalFilterFields={[
              "inscricao.edital.ano",
              "inscricao.edital.titulo",
              "inscricaoId",
              "inscricao.status",
              "inscricao.orientadorParticipacoes",
              "projetoId",
              "projeto.InscricaoProjeto.projeto.area.area",
              "projeto.titulo",
              "projeto.envolveHumanos",
              "projeto.envolveAnimais",
              "qtdFichas",
              "mediaNotas",
              "avaliadores",
              "id",
              "area.area",
              "titulo",
              "alunoParticipacoes",
            ]}
            emptyMessage="Nenhum item encontrado."
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            {false && (
              <Column
                header="Ações"
                body={(rowData) => <div className="flex gap-2"></div>}
                style={{ minWidth: "8rem" }}
              />
            )}
            <Column
              field="inscricao.edital.ano"
              header="Ano"
              sortable
              filter
              filterPlaceholder="Filtrar por ano"
              filterField="inscricao.edital.ano"
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
              field="inscricaoId"
              header="Inscrição"
              sortable
              filter
              filterPlaceholder="Filtrar por ID"
              filterField="inscricaoId"
              style={{ minWidth: "8rem", maxWidth: "10rem" }}
              body={(rowData) => (
                <div
                  onClick={() => {
                    setIsModalOpen(true);
                    setSelected({
                      tenant: params.tenant,
                      item: "inscricao",
                      idInscricao: rowData.inscricaoId,
                    });
                  }}
                  className="flex gap-2 link"
                >
                  <div className="icon">
                    <RiEyeLine />
                  </div>
                  <span>{rowData.inscricaoId}</span>
                </div>
              )}
            />
            <Column
              field="inscricao.status"
              header="Status Inscrição"
              sortable
              filter
              filterPlaceholder="Filtrar por status"
              filterField="inscricao.status"
            />
            <Column
              field="inscricao.orientadorParticipacoes"
              header="Orientador"
              sortable
              filter
              filterPlaceholder="Filtrar por edital"
              filterField="inscricao.orientadorParticipacoes"
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
              field="projeto.InscricaoProjeto.projeto.area.area"
              header="Área Projeto"
              sortable
              filter
              filterPlaceholder="Filtrar por área"
              filterField="projeto.InscricaoProjeto.projeto.area.area"
              style={{
                minWidth: "10rem",
                maxWidth: "20rem",
              }}
            />
            <Column
              field="projeto.titulo"
              header="Título Projeto"
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
              field="projeto.envolveHumanos"
              header="Envolve Humanos"
              sortable
              filter
              filterField="projeto.envolveHumanos"
              body={(rowData) =>
                rowData.projeto?.envolveHumanos ? "Sim" : "Não"
              } // Exibe Sim/Não
              filterElement={(options) => (
                <Dropdown
                  value={options.value}
                  options={[
                    { label: "Todos", value: null },
                    { label: "Sim", value: true },
                    { label: "Não", value: false },
                  ]}
                  onChange={(e) => options.filterCallback(e.value)}
                  placeholder="Filtrar"
                />
              )}
            />
            <Column
              field="projeto.envolveAnimais"
              header="Envolve Animais"
              sortable
              filter
              filterField="projeto.envolveAnimais"
              body={(rowData) =>
                rowData.projeto?.envolveAnimais ? "Sim" : "Não"
              } // Exibe Sim/Não
              filterElement={(options) => (
                <Dropdown
                  value={options.value}
                  options={[
                    { label: "Todos", value: null },
                    { label: "Sim", value: true },
                    { label: "Não", value: false },
                  ]}
                  onChange={(e) => options.filterCallback(e.value)}
                  placeholder="Filtrar"
                />
              )}
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
              style={{ minWidth: "13rem" }}
              body={(rowData) => rowData.avaliadores}
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
              field="area.area"
              header="Área do Plano"
              sortable
              filter
              filterPlaceholder="Filtrar por área"
              filterField="area.area"
              style={{
                minWidth: "10rem",
                maxWidth: "20rem",
              }}
            />
            <Column
              field="titulo"
              header="Título Plano"
              sortable
              filter
              filterPlaceholder="Filtrar por título"
              filterField="titulo"
              style={{
                minWidth: "10rem",
                maxWidth: "20rem",
              }}
            />
            <Column
              field="alunoParticipacoes"
              header="Aluno(s)"
              sortable
              filter
              filterPlaceholder="Filtrar por aluno"
              filterField="alunoParticipacoes"
              style={{ minWidth: "20rem" }}
            />
          </DataTable>
        </Card>
      )}
    </main>
  );
};

export default Page;

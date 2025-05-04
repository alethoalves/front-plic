"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { getCargos, deleteCargo } from "@/app/api/client/cargo";
import Modal from "@/components/Modal";
import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import NewCargo from "@/components/Formularios/NewCargo";
import { RiDeleteBinLine } from "@remixicon/react";
import { GestorDesassociarAvaliadorInscricaoProjeto } from "@/app/api/client/avaliador";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";

const AvaliadoresProjetos = ({
  params,
  setAvaliadoresSelecionados,
  calcularProjetosAvaliados,
  atualizarAvaliadores,
  setAvaliadores,
  avaliadores,
  setTodasAreas,
  todasAreas,
  processarInscricoes,
  setInscricoesProjetos,
  inscricoesProjetos,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [areasFiltro, setAreasFiltro] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avaliadorToEdit, setAvaliadorToEdit] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const [selectedAvaliadores, setSelectedAvaliadores] = useState([]);
  const dataTableRef = useRef(null);
  const toast = useRef(null); // Referência para o Toast

  // Filtros
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "user.nome": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "user.email": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "user.celular": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    nivel: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    projetosAtribuidos: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    projetosAvaliados: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
  });

  // Buscar avaliadores e áreas
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await atualizarAvaliadores(
          params.tenant,
          setAvaliadores,
          setTodasAreas
        );
      } catch (error) {
        console.error("Erro ao buscar avaliadores:", error);
        setError("Erro ao buscar avaliadores.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  // Filtrar avaliadores por áreas de atuação
  const avaliadoresFiltrados =
    areasFiltro.length > 0
      ? avaliadores.filter((avaliador) =>
          avaliador.user.userArea.some((ua) =>
            areasFiltro.includes(ua.area.area)
          )
        )
      : avaliadores;

  // Exportar para Excel
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Avaliadores");

    // Cabeçalhos
    worksheet.columns = [
      { header: "Nome", key: "nome", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Celular", key: "celular", width: 15 },
      { header: "Nível", key: "nivel", width: 20 },
      { header: "Áreas de Atuação", key: "areas", width: 50 },
      { header: "Projetos atribuídos", key: "projetosAtribuidos", width: 20 },
      { header: "Projetos avaliados", key: "projetosAvaliados", width: 20 }, // Nova coluna
    ];

    // Adicionar dados
    avaliadoresFiltrados.forEach((avaliador) => {
      worksheet.addRow({
        nome: avaliador.user.nome,
        email: avaliador.user.email,
        celular: avaliador.user.celular,
        nivel:
          avaliador.nivel === 1 ? "Comitê Institucional" : "Comitê Externo",
        areas: avaliador.user.userArea.map((ua) => ua.area.area).join(", "),
        projetosAtribuidos: avaliador.user.InscricaoProjetoAvaliador.length,
        projetosAvaliados: calcularProjetosAvaliados(avaliador), // Nova coluna
      });
    });

    // Salvar arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Avaliadores.xlsx");
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
        <h4 className="m-0 mr-2">Avaliadores</h4>
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
            <p>Filtre por área de atuação:</p>
          </label>
          <MultiSelect
            id="areasFiltro"
            value={areasFiltro}
            options={todasAreas}
            onChange={(e) => setAreasFiltro(e.value)}
            placeholder="Selecione as áreas"
            display="chip"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    );
  };

  const paginatorRight = (
    <Button type="button" icon="pi pi-download" text onClick={exportExcel} />
  );

  const paginatorLeft = (
    <Button
      type="button"
      icon="pi pi-plus"
      text
      onClick={() => openModalAndSetData()}
    />
  );

  // Funções para manipulação de ações
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getCargos(params.tenant, { cargo: "avaliador" });
      setAvaliadores(data);
    } catch (error) {
      console.error("Erro ao buscar avaliadores:", error);
    }
  }, [params.tenant]);

  const handleDelete = useCallback(
    async (avaliador) => {
      const confirmed = window.confirm(
        "Tem certeza que deseja excluir este avaliador?"
      );
      if (!confirmed) return;

      setErrorDelete("");
      try {
        await deleteCargo(params.tenant, avaliador.id);
        setAvaliadores((prevAvaliadores) =>
          prevAvaliadores.filter((a) => a.id !== avaliador.id)
        );
      } catch (error) {
        setErrorDelete(
          error.response?.data?.message ?? "Erro na conexão com o servidor."
        );
      }
    },
    [params.tenant]
  );

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setAvaliadorToEdit(data);
    setVerifiedData(null);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setAvaliadorToEdit(null);
    setErrorDelete(null);
    setVerifiedData(null);
  };

  // Renderização do modal
  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className="mb-2">
        <h4>Editar Avaliador</h4>
        <p>Preencha os dados abaixo para editar o avaliador.</p>
        {!avaliadorToEdit && (
          <CPFVerificationForm
            tenantSlug={params.tenant}
            onCpfVerified={setVerifiedData}
          />
        )}
        {(verifiedData || avaliadorToEdit) && (
          <NewCargo
            tenantSlug={params.tenant}
            initialData={{ ...verifiedData, ...avaliadorToEdit }}
            onClose={closeModalAndResetData}
            onSuccess={handleCreateOrEditSuccess}
            avaliador={true}
          />
        )}
      </div>
    </Modal>
  );
  // Função para desassociar um avaliador de um projeto
  const handleDesassociarAvaliador = async (
    inscricaoProjetoId,
    avaliadorId
  ) => {
    try {
      await GestorDesassociarAvaliadorInscricaoProjeto(
        params.tenant,
        inscricaoProjetoId,
        avaliadorId
      );
      processarInscricoes(params.tenant, setInscricoesProjetos);
      // Atualiza a lista de avaliadores após a desassociação
      await atualizarAvaliadores(params.tenant, setAvaliadores, setTodasAreas);
      // Exibe mensagem de sucesso
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Avaliador desassociado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      // Exibe mensagem de erro
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          error.response?.data?.message || "Erro ao desassociar avaliador.",
        life: 3000,
      });
    }
  };

  // Renderiza o botão de lixeira na coluna "Projetos atribuídos"
  const projetosAtribuidosBodyTemplate = (rowData) => {
    return (
      <div>
        {rowData.user.InscricaoProjetoAvaliador.length}
        {rowData.user.InscricaoProjetoAvaliador.map((associacao) => (
          <Button
            key={associacao.id}
            icon={<RiDeleteBinLine />}
            className="p-button-danger p-button-rounded p-button-text"
            onClick={(e) => {
              e.stopPropagation();
              handleDesassociarAvaliador(
                associacao.inscricaoProjetoId,
                rowData.user.id
              );
            }}
            tooltip={`${associacao.inscricaoProjeto?.projeto?.titulo} - `}
            tooltipOptions={{ position: "top" }}
          />
        ))}
      </div>
    );
  };
  return (
    <>
      {renderModalContent()}
      <Toast ref={toast} /> {/* Componente Toast */}
      {renderModalContent()}
      <main>
        <Card className="custom-card">
          {loading ? (
            <div className="pr-2 pl-2">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
            </div>
          ) : (
            <>
              <DataTable
                ref={dataTableRef}
                value={avaliadoresFiltrados}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 20, 50]}
                scrollable
                dataKey="id"
                header={renderHeader()}
                filters={filters}
                filterDisplay="menu"
                globalFilterFields={[
                  "user.nome",
                  "user.email",
                  "user.celular",
                  "nivel",
                  "projetosAtribuidos",
                  "projetosAvaliados",
                ]}
                emptyMessage="Nenhum avaliador encontrado."
                onRowClick={(e) => openModalAndSetData(e.data)}
                rowClassName="clickable-row" // Adiciona cursor pointer e hover effect
                paginatorRight={paginatorRight}
                paginatorLeft={paginatorLeft}
                selection={selectedAvaliadores}
                onSelectionChange={(e) => {
                  setSelectedAvaliadores(e.value);
                  setAvaliadoresSelecionados(e.value);
                }}
              >
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: "3rem" }}
                />
                <Column
                  field="user.nome"
                  header="Nome"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por nome"
                />
                <Column
                  field="projetosAvaliados" // Usar a coluna virtual
                  header="Projetos avaliados"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por projetos avaliados"
                />
                <Column
                  field="projetosAtribuidos"
                  header="Projetos atribuídos"
                  body={projetosAtribuidosBodyTemplate} // Usa o template personalizado
                  sortable
                  filter
                  filterPlaceholder="Filtrar por projetos atribuídos"
                />
                <Column
                  header="Nível"
                  body={(rowData) =>
                    rowData.nivel === 1
                      ? "Comitê Institucional"
                      : "Comitê Externo"
                  }
                  sortable
                  filter
                  filterPlaceholder="Filtrar por nível"
                />
                <Column
                  header="Áreas de Atuação"
                  body={(rowData) =>
                    rowData.user.userArea.map((ua) => ua.area.area).join(", ")
                  }
                />
                <Column
                  field="user.email"
                  header="Email"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por email"
                />
                <Column
                  field="user.celular"
                  header="Celular"
                  sortable
                  filter
                  filterPlaceholder="Filtrar por celular"
                />
                <Column
                  header="Ações"
                  body={(rowData) => (
                    <Button
                      icon={<RiDeleteBinLine />}
                      className="p-button-danger p-button-rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(rowData);
                      }}
                    />
                  )}
                />
              </DataTable>
            </>
          )}
        </Card>
      </main>
    </>
  );
};

export default AvaliadoresProjetos;

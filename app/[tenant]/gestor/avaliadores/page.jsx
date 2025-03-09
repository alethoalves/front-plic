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

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [avaliadores, setAvaliadores] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [areasFiltro, setAreasFiltro] = useState([]);
  const [todasAreas, setTodasAreas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avaliadorToEdit, setAvaliadorToEdit] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const dataTableRef = useRef(null);

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
    nivel: {
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
        const avaliadores = await getCargos(params.tenant, {
          cargo: "avaliador",
        });
        setAvaliadores(avaliadores || []);

        // Extrair todas as áreas de atuação únicas
        const areasUnicas = [
          ...new Set(
            avaliadores.flatMap((avaliador) =>
              avaliador.user.userArea.map((ua) => ua.area.area)
            )
          ),
        ];
        setTodasAreas(
          areasUnicas.map((area) => ({ label: area, value: area }))
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
      <div className="flex flex-wrap gap-2 justify-content-between align-items-center">
        <h4 className="m-0 mr-2">Avaliadores</h4>
        <div className="flex gap-2">
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Pesquisar..."
          />
          <Button
            icon="pi pi-plus"
            label="Adicionar Avaliador"
            className="p-button-success ml-1"
            onClick={() => openModalAndSetData()}
          />
        </div>
      </div>
    );
  };

  // Funções para manipulação de ações
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getCargos(params.tenant, { cargo: "avaliador" });
      setAvaliadores(data);
    } catch (error) {
      console.error("Erro ao buscar avaliadores:", error);
    }
  }, [params.tenant]);

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este avaliador?"
    );
    if (!confirmed) return;

    setErrorDelete("");
    try {
      await deleteCargo(params.tenant, avaliadorToEdit.id);
      setAvaliadores(avaliadores.filter((a) => a.id !== avaliadorToEdit.id));
      setIsModalOpen(false);
      setAvaliadorToEdit(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    }
  }, [params.tenant, avaliadorToEdit, avaliadores]);

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
        <CPFVerificationForm
          tenantSlug={params.tenant}
          onCpfVerified={setVerifiedData}
        />
        {verifiedData && (
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

  return (
    <>
      {renderModalContent()}

      <main>
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <ProgressSpinner />
          </div>
        ) : error ? (
          <Message severity="error" text={error} />
        ) : (
          <Card className="custom-card">
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                icon="pi pi-file-excel"
                label="Exportar Excel"
                className="p-button-success mr-1 ml-2"
                onClick={exportExcel}
              />
            </div>

            {/* Filtro de áreas de atuação */}
            <div className="m-2">
              <label htmlFor="areasFiltro" className="block mb-2">
                Filtrar por áreas de atuação:
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
              globalFilterFields={["user.nome", "user.email", "nivel"]}
              emptyMessage="Nenhum avaliador encontrado."
              onRowClick={(e) => openModalAndSetData(e.data)}
              rowClassName="clickable-row" // Adiciona cursor pointer e hover effect
            >
              <Column
                field="user.nome"
                header="Nome"
                sortable
                filter
                filterPlaceholder="Filtrar por nome"
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
            </DataTable>
          </Card>
        )}
      </main>
    </>
  );
};

export default Page;

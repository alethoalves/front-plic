"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import style from "./page.module.scss";
import { Toast } from "primereact/toast";
import { getCargos, deleteCargo } from "@/app/api/client/cargo";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Modal from "@/components/Modal";
import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import NewCargo from "@/components/Formularios/NewCargo";
import { RiDeleteBinLine } from "@remixicon/react";
import { ProgressBar } from "primereact/progressbar";
import Header from "@/components/Header";
import { classNames } from "primereact/utils";

const Page = ({ params }) => {
  const [todasAreas, setTodasAreas] = useState([]);
  const [avaliadores, setAvaliadores] = useState([]);
  const toast = useRef(null); // Referência para o Toast

  // Função para exibir mensagens de sucesso ou erro no Toast
  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);

  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [areasFiltro, setAreasFiltro] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avaliadorToEdit, setAvaliadorToEdit] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const [verifiedRows, setVerifiedRows] = useState({});

  const [checkedRows, setCheckedRows] = useState({});
  const dataTableRef = useRef(null);
  const handleVerificationClick = (rowData) => {
    const rowId = rowData.id;
    setVerifiedRows((prev) => {
      const newState = { ...prev };
      if (newState[rowId]) {
        delete newState[rowId]; // Remove verificação se já estiver verificada
      } else {
        newState[rowId] = true; // Marca como verificada se não estiver
      }
      return newState;
    });

    // Dispara o console.log com as informações da linha
    console.log("Dados da linha:", rowData);
  };
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
  const handleCreateOrEditSuccess =
    (async () => {
      try {
        const data = await getCargos(params.tenant, { cargo: "avaliador" });
        setAvaliadores(data);
      } catch (error) {
        console.error("Erro ao buscar avaliadores:", error);
      }
    },
    [params.tenant]);

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

  const atualizarAvaliadores = async (
    tenant,
    setAvaliadores,
    setTodasAreas
  ) => {
    try {
      const data = await getCargos(tenant, { cargo: "avaliador" });
      setAvaliadores(data);

      // Extrair todas as áreas únicas dos avaliadores
      const areas = [];
      data.forEach((avaliador) => {
        avaliador.user.userArea.forEach((ua) => {
          if (!areas.includes(ua.area.area)) {
            areas.push(ua.area.area);
          }
        });
      });
      setTodasAreas(areas);
    } catch (error) {
      console.error("Erro ao atualizar avaliadores:", error);
      throw error;
    }
  };
  const handleCheckClick = (rowData) => {
    const rowId = rowData.id;
    setCheckedRows((prev) => {
      const newState = { ...prev };
      if (newState[rowId]) {
        delete newState[rowId]; // Remove se já estiver marcado
      } else {
        newState[rowId] = true; // Marca se não estiver
      }
      return newState;
    });

    console.log("Linha selecionada:", rowData); // Log dos dados da linha
  };
  return (
    <>
      {renderModalContent()}
      <Toast ref={toast} /> {/* Componente Toast */}
      {renderModalContent()}
      <main>
        <Header className="mb-3" titulo="Avaliadores" />
        <Card className="custom-card">
          {loading ? (
            <div className="pr-2 pl-2 pb-2 pt-2">
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
                ]}
                emptyMessage="Nenhum avaliador encontrado."
                onRowClick={(e) => openModalAndSetData(e.data)}
                rowClassName="clickable-row" // Adiciona cursor pointer e hover effect
                paginatorRight={paginatorRight}
                paginatorLeft={paginatorLeft}
              >
                <Column
                  header="Nome"
                  body={(rowData) => (
                    <div>
                      <h6 className="m-0">{rowData.user.nome}</h6>
                      <p className="m-0 text-sm text-color-secondary">
                        {rowData.user.email}
                      </p>
                      <p className="m-0 mt-1 text-sm text-color-secondary">
                        {rowData.user.celular}
                      </p>
                    </div>
                  )}
                  sortable
                  sortField="user.nome"
                  filter
                  filterField="user.nome"
                  filterPlaceholder="Filtrar por nome"
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
                  header="Disponível pra avaliar"
                  headerClassName="text-center"
                  body={(rowData) => (
                    <div
                      className="flex align-items-center justify-content-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que o clique na linha seja disparado
                        handleCheckClick(rowData);
                      }}
                    >
                      <i
                        className={classNames("pi", {
                          "text-green-500 pi-check-circle":
                            checkedRows[rowData.id], // Verde quando marcado
                          "text-red-400 pi-times-circle":
                            !checkedRows[rowData.id], // Cinza quando não marcado
                        })}
                        style={{ fontSize: "1.25rem" }}
                      />
                    </div>
                  )}
                  style={{ width: "100px", textAlign: "center" }}
                />
                <Column
                  body={(rowData) => (
                    <div
                      className="flex
                      align-items-center
                      justify-content-center
                      cursor-pointer"
                    >
                      <Button
                        icon={<RiDeleteBinLine />}
                        className="p-button-danger p-button-rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(rowData);
                        }}
                      />
                    </div>
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

export default Page;

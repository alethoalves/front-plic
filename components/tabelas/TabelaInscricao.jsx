"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { getCookie } from "cookies-next";

import styles from "./TabelaInscricao.module.scss";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { FilterService } from "primereact/api";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { ContextMenu } from "primereact/contextmenu";

import { getInscricoesByTenantAndYear } from "@/app/api/client/inscricao";

const getCurrentUserId = () => {
  try {
    const token = getCookie("authToken");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id ?? null;
  } catch {
    return null;
  }
};

import { statusClassificacaoFilterTemplate } from "@/lib/tableTemplates";
import { getSeverityByStatus, formatStatusText } from "@/lib/tagUtils";
import Modal from "../Modal";
import Inscricao from "../Inscricao";
import NovaInscricao from "../NovaInscricao";
import { deleteInscricao as deleteInscricaoApi } from "@/app/api/client/inscricao";

FilterService.register("nota_intervalo", (value, filters) => {
  const [min, max] = filters ?? [undefined, undefined];
  if (min === undefined && max === undefined) return true;
  if (typeof min === "number" && value < min) return false;
  if (typeof max === "number" && value > max) return false;
  return true;
});

const NAME_PARTICLES = new Set([
  "de",
  "da",
  "do",
  "dos",
  "das",
  "e",
  "em",
  "na",
  "no",
  "nos",
  "nas",
]);

const normalizeName = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (i > 0 && NAME_PARTICLES.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

// Situação da participação (definida pela gestão do programa)
const getStatusParticipacaoInfo = (status) => {
  switch (status) {
    case "APROVADA":
      return { label: "Aprovada", severity: "success" };
    case "ATIVA":
    case "ativo":
      return { label: "Ativa", severity: "success" };
    case "EM_ANALISE":
      return { label: "Em análise", severity: "warning" };
    case "PENDENTE":
      return { label: "Pendente", severity: "warning" };
    case "RECUSADA":
      return { label: "Recusada", severity: "danger" };
    case "CANCELADA":
      return { label: "Cancelada", severity: "danger" };
    case "SUBSTITUIDA":
      return { label: "Substituída", severity: "danger" };
    case "INATIVA":
    case "inativo":
      return { label: "Inativa", severity: "danger" };
    default:
      return { label: status || "Em análise", severity: "info" };
  }
};

// Situação da documentação (CV Lattes, formulários, etc.)
const getStatusDocumentacaoInfo = (status) => {
  if (status === "incompleto") {
    return { label: "Documentação pendente", severity: "warning" };
  }
  return { label: "Documentação completa", severity: "success" };
};

const TabelaInscricao = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [editaisDisponiveis, setEditaisDisponiveis] = useState([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState([]);
  const [filteredItens, setFilteredItens] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInscricao, setSelectedInscricao] = useState(null);
  const [deleteInscricaoDialog, setDeleteInscricaoDialog] = useState(false);
  const [editais, setEditais] = useState([]);
  const currentUserId = getCurrentUserId();
  const isAdmin = currentUserId === 1;

  const toast = useRef(null);
  const dataTableRef = useRef(null);
  const cm = useRef(null);

  const menuModel = [
    {
      label: "Editar",
      icon: "pi pi-pencil",
      command: () => setIsModalOpen(true),
    },
    ...(isAdmin
      ? [
          { separator: true },
          {
            label: "Excluir",
            icon: "pi pi-trash",
            command: () => setDeleteInscricaoDialog(true),
          },
        ]
      : []),
  ];

  const [filters, setFilters] = useState({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    "edital.titulo": { value: [], matchMode: FilterMatchMode.IN },
    status: { value: [], matchMode: FilterMatchMode.IN },
    proponente: { value: "", matchMode: FilterMatchMode.CONTAINS },
    alunosString: { value: "", matchMode: FilterMatchMode.CONTAINS },
    orientadoresString: { value: "", matchMode: FilterMatchMode.CONTAINS },
    participantesString: { value: "", matchMode: FilterMatchMode.CONTAINS },
    id: {
      operator: FilterOperator.AND,
      constraints: [{ value: undefined, matchMode: FilterMatchMode.EQUALS }],
    },
  });

  const getEditaisUnicos = useCallback((inscricoes) => {
    const editaisSet = new Set();
    inscricoes.forEach((item) => {
      if (item.edital?.titulo) editaisSet.add(item.edital.titulo);
    });
    return Array.from(editaisSet).map((edital) => ({
      label: edital,
      value: edital,
    }));
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const inscricoes = await getInscricoesByTenantAndYear(
        params.tenant,
        params.ano || null,
      );

      const itensProcessados =
        inscricoes?.map((inscricao) => {
          const proponenteStr = `${inscricao.proponente?.nome || ""} ${
            inscricao.proponente?.cpf || ""
          }`.trim();

          const participantesStr = inscricao.participacoes
            ?.map((p) => `${p.user.nome} ${p.user.cpf}`)
            .join(" ")
            .trim();

          const buscaGlobalStr = `${proponenteStr} ${participantesStr}`.trim();

          return {
            ...inscricao,
            buscaGlobal: buscaGlobalStr,
            proponenteString: proponenteStr,
            alunosString:
              inscricao.participacoes
                ?.filter((p) => p.tipo === "aluno")
                ?.map((p) => `${p.user.nome} ${p.user.cpf}`)
                .join(" ") || "",
            orientadoresString:
              inscricao.participacoes
                ?.filter((p) => p.tipo === "orientador")
                ?.map((p) => `${p.user.nome} ${p.user.cpf}`)
                .join(" ") || "",
            proponente: inscricao.proponente?.nome || "",
          };
        }) || [];

      setItens(itensProcessados);
      setStatusDisponiveis([
        { label: "Pendente", value: "pendente" },
        { label: "Enviada", value: "enviada" },
        { label: "Aprovada", value: "aprovada" },
        { label: "Reprovada", value: "reprovada" },
      ]);

      const editaisUnicos = [
        ...new Set(itensProcessados.map((item) => item.edital?.titulo)),
      ].filter(Boolean);

      setEditaisDisponiveis(
        editaisUnicos.map((edital) => ({ label: edital, value: edital })),
      );
      setEditais(getEditaisUnicos(itensProcessados));
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar inscrições",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, params.ano]);

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setSelectedInscricao(null);
  };

  const openNew = () => {
    setSelectedInscricao(null);
    setIsModalOpen(true);
  };

  const deleteInscricao = async () => {
    try {
      await deleteInscricaoApi(params.tenant, selectedInscricao.id);

      setItens((prev) => prev.filter((val) => val.id !== selectedInscricao.id));
      setDeleteInscricaoDialog(false);
      setSelectedInscricao(null);

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Inscrição deletada",
        life: 3000,
      });
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail:
          "Falha ao deletar inscrição. Verifique se há projetos e planos de trabalho associados à inscrição.",
        life: 3000,
      });
    }
  };

  const exportCSV = () => {
    dataTableRef.current.exportCSV();
  };

  const leftToolbarTemplate = () => (
    <Button
      label="Nova Inscrição"
      icon="pi pi-plus"
      severity="success"
      onClick={openNew}
    />
  );

  const rightToolbarTemplate = () => (
    <Button
      label="Exportar"
      icon="pi pi-download"
      className="p-button-help"
      onClick={exportCSV}
    />
  );

  const totalRecords = (filteredItens ?? itens).length;

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <span className="text-color-secondary">
        {totalRecords}{" "}
        {totalRecords === 1 ? "inscrição encontrada" : "inscrições encontradas"}
      </span>
      <IconField iconPosition="left">
        <InputText
          type="search"
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Pesquisar..."
        />
      </IconField>
    </div>
  );

  const deleteInscricaoDialogFooter = (
    <React.Fragment>
      <Button
        label="Não"
        icon="pi pi-times"
        outlined
        onClick={() => setDeleteInscricaoDialog(false)}
      />
      <Button
        label="Sim"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteInscricao}
      />
    </React.Fragment>
  );

  const renderModalContent = () => {
    if (!isModalOpen) return null;

    if (selectedInscricao) {
      return (
        <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
          <Inscricao
            params={params}
            inscricaoId={selectedInscricao?.id}
            onSuccess={() => {
              fetchInitialData();
              closeModalAndResetData();
            }}
          />
        </Modal>
      );
    }

    return (
      <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
        <NovaInscricao params={params} />
      </Modal>
    );
  };

  return (
    <>
      {renderModalContent()}
      <ContextMenu model={menuModel} ref={cm} />
      <main className={styles.main}>
        <Card className="pt-2">
          <Toast ref={toast} />
          <Toolbar
            className="mr-2 ml-2 p-2"
            start={leftToolbarTemplate}
            end={rightToolbarTemplate}
          />

          {loading ? (
            <div className="pr-2 pl-2 pb-2 pt-2">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
            </div>
          ) : (
            <DataTable
              ref={dataTableRef}
              value={filteredItens ?? itens}
              paginator
              rows={10}
              rowsPerPageOptions={[10, 20, 50]}
              scrollable
              dataKey="id"
              header={header}
              filters={filters}
              onFilter={(e) => {
                setFilters(e.filters);
                setFilteredItens(e.filteredValue || itens);
              }}
              filterDisplay="row"
              globalFilterFields={["buscaGlobal"]}
              emptyMessage="Nenhuma inscrição encontrada."
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
              onRowClick={(e) => {
                setSelectedInscricao(e.data);
                setIsModalOpen(true);
              }}
              contextMenuSelection={selectedInscricao}
              onContextMenuSelectionChange={(e) =>
                setSelectedInscricao(e.value)
              }
              onContextMenu={(e) => cm.current.show(e.originalEvent)}
              rowClassName={() => "cursor-pointer"}
            >
              <Column
                field="id"
                header="ID Inscrição"
                sortable
                filterPlaceholder="Filtrar por id"
                filterField="id"
              />
              <Column
                field="edital.titulo"
                header="Edital"
                sortable
                filter
                filterElement={(options) =>
                  statusClassificacaoFilterTemplate(options, editaisDisponiveis)
                }
                showFilterMenu={false}
                filterField="edital.titulo"
              />
              <Column
                field="status"
                header="Status"
                sortable
                filter
                filterElement={(options) =>
                  statusClassificacaoFilterTemplate(options, statusDisponiveis)
                }
                showFilterMenu={false}
                filterField="status"
                body={(rowData) => (
                  <Tag rounded severity={getSeverityByStatus(rowData.status)}>
                    {formatStatusText(rowData.status)}
                  </Tag>
                )}
                style={{ width: "12rem" }}
              />
              <Column
                field="proponente"
                header="Proponente"
                sortable
                filter
                filterPlaceholder="Filtrar por nome"
                filterField="proponente"
                body={(rowData) => normalizeName(rowData.proponente)}
              />
              <Column
                field="orientadoresString"
                header="Orientadores"
                sortable
                filter
                filterPlaceholder="Filtrar orientadores"
                filterField="orientadoresString"
                body={(rowData) => {
                  const orientadores =
                    rowData.participacoes
                      ?.filter((p) => p.tipo === "orientador")
                      ?.map((p) => ({
                        nome: p.user.nome,
                        status: p.status,
                        statusParticipacao: p.statusParticipacao,
                      })) || [];

                  if (orientadores.length === 0) {
                    return (
                      <span
                        style={{
                          color: "var(--text-color-secondary)",
                          fontStyle: "italic",
                        }}
                      >
                        Nenhum orientador
                      </span>
                    );
                  }

                  return (
                    <div className={styles["alunos-orientadores-cell"]}>
                      {orientadores.map((orientador, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{normalizeName(orientador.nome)}</span>
                          <Tag
                            rounded
                            severity={
                              getStatusParticipacaoInfo(
                                orientador.statusParticipacao,
                              ).severity
                            }
                            title="Situação da participação"
                          >
                            {
                              getStatusParticipacaoInfo(
                                orientador.statusParticipacao,
                              ).label
                            }
                          </Tag>
                          <Tag
                            rounded
                            severity={
                              getStatusDocumentacaoInfo(orientador.status)
                                .severity
                            }
                            title="Situação da documentação"
                          >
                            {
                              getStatusDocumentacaoInfo(orientador.status)
                                .label
                            }
                          </Tag>
                        </div>
                      ))}
                    </div>
                  );
                }}
                style={{ width: "16rem" }}
              />
              <Column
                field="alunosString"
                header="Alunos"
                sortable
                filter
                filterPlaceholder="Filtrar alunos"
                filterField="alunosString"
                body={(rowData) => {
                  const alunos =
                    rowData.participacoes
                      ?.filter((p) => p.tipo === "aluno")
                      ?.map((p) => ({
                        nome: p.user.nome,
                        status: p.status,
                        statusParticipacao: p.statusParticipacao,
                      })) || [];

                  if (alunos.length === 0) {
                    return (
                      <span
                        style={{
                          color: "var(--text-color-secondary)",
                          fontStyle: "italic",
                        }}
                      >
                        Nenhum aluno
                      </span>
                    );
                  }

                  return (
                    <div className={styles["alunos-orientadores-cell"]}>
                      {alunos.map((aluno, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{normalizeName(aluno.nome)}</span>
                          <Tag
                            rounded
                            severity={
                              getStatusParticipacaoInfo(
                                aluno.statusParticipacao,
                              ).severity
                            }
                            title="Situação da participação"
                          >
                            {
                              getStatusParticipacaoInfo(
                                aluno.statusParticipacao,
                              ).label
                            }
                          </Tag>
                          <Tag
                            rounded
                            severity={
                              getStatusDocumentacaoInfo(aluno.status).severity
                            }
                            title="Situação da documentação"
                          >
                            {getStatusDocumentacaoInfo(aluno.status).label}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  );
                }}
                style={{ width: "16rem" }}
              />
            </DataTable>
          )}
        </Card>
      </main>

      <Dialog
        visible={deleteInscricaoDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="Confirmar"
        modal
        footer={deleteInscricaoDialogFooter}
        onHide={() => setDeleteInscricaoDialog(false)}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedInscricao && (
            <span>
              Tem certeza que deseja deletar a inscrição{" "}
              <b>{selectedInscricao.id}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default TabelaInscricao;

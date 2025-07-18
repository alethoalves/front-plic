"use client";
// HOOKS
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ESTILO
import styles from "./TabelaInscricao.module.scss";

// PRIMEREACT
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { FilterService } from "primereact/api";
import { Dialog } from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import { Tag } from "primereact/tag";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import FormNewInscricao from "@/components/Formularios/FormNewInscricao";
import { RiEditLine } from "@remixicon/react";
// SERVIÇOS
import { getInscricoesByTenantAndYear } from "@/app/api/client/inscricao";
import {
  statusClassificacaoBodyTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import Modal from "../Modal";
import Inscricao from "../Inscricao";
import NovaInscricao from "../NovaInscricao";
import { deleteInscricao as deleteInscricaoApi } from "@/app/api/client/inscricao";
// Registra filtro personalizado para intervalo de notas
FilterService.register("nota_intervalo", (value, filters) => {
  const [min, max] = filters ?? [undefined, undefined];

  if (min === undefined && max === undefined) return true;
  if (typeof min === "number" && value < min) return false;
  if (typeof max === "number" && value > max) return false;

  return true;
});

const TabelaInscricao = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [editaisDisponiveis, setEditaisDisponiveis] = useState([]);
  const [statusDisponiveis, setStatusDisponiveis] = useState([]);
  const [filteredItens, setFilteredItens] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInscricao, setSelectedInscricao] = useState(null);
  const [selectedInscricoes, setSelectedInscricoes] = useState(null);
  const [deleteInscricaoDialog, setDeleteInscricaoDialog] = useState(false);
  const [deleteInscricoesDialog, setDeleteInscricoesDialog] = useState(false);
  const [editais, setEditais] = useState([]);

  // REFS
  const toast = useRef(null);
  const dataTableRef = useRef(null);

  // FILTROS
  const [filters, setFilters] = useState({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    "edital.titulo": {
      value: [],
      matchMode: FilterMatchMode.IN,
    },
    status: {
      value: [],
      matchMode: FilterMatchMode.IN,
    },
    proponente: {
      value: "",
      matchMode: FilterMatchMode.CONTAINS,
    },
    alunosString: {
      value: "",
      matchMode: FilterMatchMode.CONTAINS,
    },
    orientadoresString: {
      value: "",
      matchMode: FilterMatchMode.CONTAINS,
    },
    participantesString: {
      value: "",
      matchMode: FilterMatchMode.CONTAINS,
    },
    id: {
      operator: FilterOperator.AND,
      constraints: [{ value: undefined, matchMode: FilterMatchMode.EQUALS }],
    },
  });
  const getEditaisUnicos = useCallback((inscricoes) => {
    const editaisSet = new Set();

    inscricoes.forEach((item) => {
      if (item.edital?.titulo) {
        editaisSet.add(item.edital.titulo);
      }
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
        params.ano || null
      );

      // Processa os itens para adicionar campos virtuais
      const itensProcessados =
        inscricoes?.map((inscricao) => {
          // Proponente (nome + CPF)
          const proponenteStr = `${inscricao.proponente?.nome || ""} ${
            inscricao.proponente?.cpf || ""
          }`.trim();

          // Participantes (todos - alunos e orientadores)
          const participantesStr = inscricao.participacoes
            ?.map((p) => `${p.user.nome} ${p.user.cpf}`)
            .join(" ")
            .trim();

          // Campo virtual para busca global (combina tudo)
          const buscaGlobalStr = `${proponenteStr} ${participantesStr}`.trim();

          return {
            ...inscricao,
            // Campo para busca global
            buscaGlobal: buscaGlobalStr,
            // Campos específicos para filtros individuais
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
      console.log(itensProcessados);
      // Configura status disponíveis
      setStatusDisponiveis([
        { label: "Pendente", value: "pendente" },
        { label: "Enviada", value: "enviada" },
        { label: "Aprovada", value: "aprovada" },
        { label: "Reprovada", value: "reprovada" },
      ]);

      // Configura editais disponíveis
      const editaisUnicos = [
        ...new Set(itensProcessados.map((item) => item.edital?.titulo)),
      ].filter(Boolean);

      setEditaisDisponiveis(
        editaisUnicos.map((edital) => ({ label: edital, value: edital }))
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

  // BUSCA DE DADOS INICIAIS
  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, params.ano]);

  // HANDLERS
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

  const confirmDeleteInscricao = (inscricao) => {
    setSelectedInscricao(inscricao);
    setDeleteInscricaoDialog(true);
  };

  const deleteInscricao = async () => {
    try {
      await deleteInscricaoApi(params.tenant, selectedInscricao.id);

      let _inscricoes = itens.filter((val) => val.id !== selectedInscricao.id);
      setItens(_inscricoes);
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
          "Falha ao deletar inscrição. Verifique se há projetos e planos de trabalho associadosà inscrição.",
        life: 3000,
      });
    }
  };

  const confirmDeleteSelected = () => {
    setDeleteInscricoesDialog(true);
  };

  const deleteSelectedInscricoes = async () => {
    setDeleteInscricoesDialog(false);

    // Criamos uma cópia mutável do array de itens
    let currentItens = [...itens];

    for (const inscricao of selectedInscricoes) {
      try {
        await deleteInscricaoApi(params.tenant, inscricao.id);

        // Atualiza a lista após cada deleção bem-sucedida
        currentItens = currentItens.filter((val) => val.id !== inscricao.id);
        setItens(currentItens);

        toast.current.show({
          severity: "success",
          summary: "Sucesso",
          detail: `Inscrição ${inscricao.id} deletada`,
          life: 2000,
        });
      } catch (error) {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: `Falha ao deletar inscrição ${inscricao.id}`,
          life: 2000,
        });
      }
    }

    setSelectedInscricoes(null);
  };

  const exportCSV = () => {
    dataTableRef.current.exportCSV();
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-1">
        <Button
          label="Nova Inscrição"
          icon="pi pi-plus"
          severity="success"
          onClick={openNew}
        />
        <Button
          label="Deletar"
          icon="pi pi-trash"
          severity="danger"
          onClick={confirmDeleteSelected}
          disabled={!selectedInscricoes || !selectedInscricoes.length}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <Button
        label="Exportar"
        icon="pi pi-upload"
        className="p-button-help"
        onClick={exportCSV}
      />
    );
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="mr-2"
          onClick={() => {
            setSelectedInscricao(rowData);
            setIsModalOpen(true);
          }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDeleteInscricao(rowData)}
        />
      </React.Fragment>
    );
  };

  const header = (
    <div>
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

  const deleteInscricoesDialogFooter = (
    <React.Fragment>
      <Button
        label="Não"
        icon="pi pi-times"
        outlined
        onClick={() => setDeleteInscricoesDialog(false)}
      />
      <Button
        label="Sim"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteSelectedInscricoes}
      />
    </React.Fragment>
  );

  const renderModalContent = () => {
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
    } else {
      return (
        <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
          <NovaInscricao params={params} />
        </Modal>
      );
    }
  };

  // RENDERIZAÇÃO
  return (
    <>
      {renderModalContent()}
      <main className={styles.main}>
        <Card className="pt-2 ">
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
              selection={selectedInscricoes}
              onSelectionChange={(e) => setSelectedInscricoes(e.value)}
              selectionMode="multiple"
            >
              <Column selectionMode="multiple" exportable={false}></Column>

              <Column
                body={actionBodyTemplate}
                exportable={false}
                style={{ minWidth: "12rem" }}
              ></Column>
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
                body={(rowData) => rowData.status}
                style={{ width: "12rem" }}
              />

              <Column
                field="proponente"
                header="Proponente"
                sortable
                filter
                filterPlaceholder="Filtrar por nome"
                filterField="proponente"
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
                      ?.map((participacao) => ({
                        nome: participacao.user.nome,
                        status: participacao.statusParticipacao,
                      })) || [];

                  return (
                    <div className={styles["alunos-orientadores-cell"]}>
                      {orientadores.map((orientador, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span>{orientador.nome}</span>
                          {statusClassificacaoBodyTemplate(
                            orientador.status,
                            styles
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }}
                style={{ width: "13rem" }}
              />
              <Column
                field="alunosString"
                header="Alunos"
                sortable
                body={(rowData) => {
                  const alunos =
                    rowData.participacoes
                      ?.filter((p) => p.tipo === "aluno")
                      ?.map((participacao) => ({
                        nome: participacao.user.nome,
                        status: participacao.statusParticipacao,
                      })) || [];

                  return (
                    <div className={styles["alunos-orientadores-cell"]}>
                      {alunos.map((aluno, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span>{aluno.nome}</span>
                          {statusClassificacaoBodyTemplate(
                            aluno.status,
                            styles
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }}
                style={{ width: "13rem" }}
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

      <Dialog
        visible={deleteInscricoesDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="Confirmar"
        modal
        footer={deleteInscricoesDialogFooter}
        onHide={() => setDeleteInscricoesDialog(false)}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          {selectedInscricoes && (
            <span>
              Tem certeza que deseja deletar as inscrições selecionadas?
            </span>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default TabelaInscricao;

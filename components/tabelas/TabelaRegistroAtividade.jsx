// components/TabelaRegistroAtividade.jsx

"use client";
import { useEffect, useState, useRef } from "react";

// ESTILO
import styles from "./TabelaRegistroAtividade.module.scss";

// PRIMEREACT
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressBar } from "primereact/progressbar";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";

// SERVIÇOS
import { getRegistrosAtividadesByAno } from "@/app/api/client/atividade";
import {
  RiCheckLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiForbid2Line,
  RiTeamLine,
  RiUser2Line,
  RiSearchLine,
  RiGraduationCapLine,
} from "@remixicon/react";
import NoData from "../NoData";
import { updateRegistroAtividade } from "@/app/api/client/registroAtividade";

const TabelaRegistroAtividade = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [atividades, setAtividades] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [filteredPlanos, setFilteredPlanos] = useState([]);
  const toast = useRef(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [statusFilters, setStatusFilters] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [progress, setProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const statusOptions = [
    { label: "Pendente", value: "naoEntregue" },
    { label: "Concluída", value: "concluido" },
    { label: "Dispensada", value: "dispensada" },
  ];
  const updateStatusSingle = async (registroId, newStatus) => {
    setIsUpdating(true);

    try {
      const response = await updateRegistroAtividade(
        params.tenant,
        null,
        registroId,
        { status: newStatus }
      );

      // Atualiza o estado local sem recarregar tudo
      setPlanos((prevPlanos) =>
        prevPlanos.map((plano) => ({
          ...plano,
          atividades: plano.atividades.map((atividade) => {
            if (atividade.registro?.id === registroId) {
              return {
                ...atividade,
                registro: {
                  ...atividade.registro,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                },
              };
            }
            return atividade;
          }),
        }))
      );

      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Status atualizado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao atualizar o status",
        life: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateStatusBulk = async (newStatus) => {
    if (selectedItems.length === 0) return;

    setIsUpdating(true);
    setProgress(0);

    try {
      let totalUpdates = 0;
      let completedUpdates = 0;

      // Contar registros que serão atualizados
      selectedItems.forEach((plano) => {
        plano.atividades.forEach((atividade) => {
          if (atividade.temRegistro) totalUpdates++;
        });
      });

      const updates = [];

      // Preparar todas as atualizações
      selectedItems.forEach((plano) => {
        plano.atividades.forEach((atividade) => {
          if (atividade.temRegistro && atividade.registro?.id) {
            updates.push(
              updateRegistroAtividade(
                params.tenant,
                null,
                atividade.registro.id,
                { status: newStatus }
              ).then(() => {
                completedUpdates++;
                setProgress((completedUpdates / totalUpdates) * 100);
              })
            );
          }
        });
      });

      // Executar todas as atualizações em paralelo
      await Promise.all(updates);

      // Atualizar estado local
      setPlanos((prevPlanos) =>
        prevPlanos.map((plano) => {
          if (!selectedItems.some((item) => item.id === plano.id)) return plano;

          return {
            ...plano,
            atividades: plano.atividades.map((atividade) => {
              if (atividade.temRegistro) {
                return {
                  ...atividade,
                  registro: {
                    ...atividade.registro,
                    status: newStatus,
                    updatedAt: new Date().toISOString(),
                  },
                };
              }
              return atividade;
            }),
          };
        })
      );

      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Status atualizados com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao atualizar alguns status",
        life: 3000,
      });
    } finally {
      setIsUpdating(false);
      setProgress(0);
    }
  };
  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const data = await getRegistrosAtividadesByAno(params.tenant, params.ano);

      const arrAtividades = Array.isArray(data.atividades)
        ? data.atividades
        : [];
      const arrPlanos = Array.isArray(data.planos) ? data.planos : [];

      // Agrupar atividades por formularioId
      const atividadesAgrupadas = arrAtividades.reduce((acc, atividade) => {
        const grupoExistente = acc.find(
          (item) => item.formularioId === atividade.formularioId
        );

        if (grupoExistente) {
          // Adiciona o ID da atividade ao grupo existente
          grupoExistente.idsAtividades.push(atividade.id);
        } else {
          // Cria um novo grupo
          acc.push({
            ...atividade,
            idsAtividades: [atividade.id],
          });
        }
        return acc;
      }, []);

      setAtividades(atividadesAgrupadas);

      // Processar cada plano para incluir o array completo de atividades
      const planosProcessados = arrPlanos.map((plano) => {
        // Criar array de atividades com registro específico
        const atividadesComRegistro = atividadesAgrupadas.map(
          (grupoAtividade) => {
            // Verifica se há registro para qualquer uma das atividades do grupo
            const temRegistro = grupoAtividade.idsAtividades.some(
              (id) =>
                plano.registros?.[id] !== null &&
                plano.registros?.[id] !== undefined
            );

            // Pega o primeiro registro encontrado (já que são do mesmo formulário)
            let registro = null;
            for (const id of grupoAtividade.idsAtividades) {
              if (plano.registros?.[id]) {
                registro = plano.registros[id];
                break;
              }
            }

            return {
              ...grupoAtividade,
              registro,
              temRegistro,
            };
          }
        );

        return {
          ...plano,
          atividades: atividadesComRegistro,
          searchText: `${plano.titulo} ${plano.orientadores} ${
            plano.alunos
          } ${plano.inscricao?.participacoes
            ?.map((p) => p.user.nome + p.user.cpf)
            .join(" ")} ${plano.participacoes
            ?.map((p) => p.user.nome + p.user.cpf)
            .join(" ")}`.toLowerCase(),
        };
      });

      setPlanos(planosProcessados);
      setFilteredPlanos(planosProcessados);

      // Inicializa os filtros de status para cada grupo de atividade
      const initialFilters = {};
      atividadesAgrupadas.forEach((grupo) => {
        initialFilters[grupo.formularioId] = [];
      });
      setStatusFilters(initialFilters);
    } catch (error) {
      console.error("Erro ao obter registros de atividades:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar registros de atividades",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.tenant && params.ano) {
      fetchRegistros();
    }
  }, [params.tenant, params.ano]);

  // Efeito para aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [statusFilters, globalFilter, planos]);

  const applyFilters = () => {
    let result = [...planos];

    // Aplica filtro global
    if (globalFilter) {
      const searchText = globalFilter.toLowerCase();
      result = result.filter((plano) => plano.searchText.includes(searchText));
    }

    // Aplica filtros de status
    const activeActivityFilters = Object.entries(statusFilters).filter(
      ([_, values]) => values.length > 0
    );

    if (activeActivityFilters.length > 0) {
      result = result.filter((plano) => {
        return activeActivityFilters.every(([formularioId, statusValues]) => {
          const atividade = plano.atividades.find(
            (a) => a.formularioId === parseInt(formularioId)
          );

          if (!atividade || !atividade.temRegistro) {
            return statusValues.includes(null);
          }
          return statusValues.includes(atividade.registro.status);
        });
      });
    }

    setFilteredPlanos(result);
  };

  const handleStatusFilterChange = (formularioId, values) => {
    setStatusFilters((prev) => ({
      ...prev,
      [formularioId]: values,
    }));
  };

  // Corpo da célula para atividades
  const atividadeBody = (rowData, atividade) => {
    const atividadePlano = rowData.atividades.find(
      (a) => a.formularioId === atividade.formularioId
    );

    if (!atividadePlano || !atividadePlano.temRegistro) {
      return <span style={{ color: "#999" }}>–</span>;
    }

    // Encontra o registro específico para esta atividade
    const registro = atividadePlano.registro;
    if (!registro || !registro.id) {
      return <span style={{ color: "#999" }}>–</span>;
    }

    return (
      <div className={styles.actions}>
        <div
          className={`${styles.action} ${styles.pendente} ${
            registro.status === "naoEntregue" ? styles.pendenteSelected : ""
          }`}
          onClick={() => updateStatusSingle(registro.id, "naoEntregue")}
        >
          <RiErrorWarningLine />
          <p>Pendente</p>
        </div>
        <div
          className={`${styles.action} ${styles.concluida} ${
            registro.status === "concluido" ? styles.concluidaSelected : ""
          }`}
          onClick={() => updateStatusSingle(registro.id, "concluido")}
        >
          <RiCheckboxCircleLine />
          <p>Concluída</p>
        </div>
        <div
          className={`${styles.action} ${styles.dispensada} ${
            registro.status === "dispensada" ? styles.dispensadaSelected : ""
          }`}
          onClick={() => updateStatusSingle(registro.id, "dispensada")}
        >
          <RiForbid2Line />
          <p>Dispensada</p>
        </div>
      </div>
    );
  };

  // Cabeçalho da coluna com filtro
  const atividadeHeader = (atividade) => {
    return (
      <div className={styles.columnHeader}>
        <div>{atividade.titulo}</div>
        <MultiSelect
          value={statusFilters[atividade.formularioId] || []}
          options={statusOptions}
          onChange={(e) =>
            handleStatusFilterChange(atividade.formularioId, e.value)
          }
          placeholder="Filtrar"
          className={styles.statusFilter}
        />
      </div>
    );
  };

  return (
    <>
      <Toast ref={toast} />

      <main className={styles.main}>
        {atividades.length > 0 ? (
          <Card className="custom-card  mb-2 mt-2 ">
            <h5 className="pl-2 pr-2 pt-2">
              Atividades dos Planos de Trabalho
            </h5>
            <div className={styles.tableHeader}>
              <div className={styles.searchContainer}>
                <InputText
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Buscar por nome, CPF..."
                  className={styles.searchInput}
                />
              </div>
            </div>

            {loading ? (
              <div className="pr-2 pl-2 pb-2 pt-2">
                <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                {selectedItems.length > 1 && (
                  <div className={styles.actions}>
                    <div
                      className={`${styles.action} ${styles.pendente}`}
                      onClick={() => updateStatusBulk("naoEntregue")}
                    >
                      <RiErrorWarningLine />
                      <p>Pendente</p>
                    </div>
                    <div
                      className={`${styles.action} ${styles.concluida}`}
                      onClick={() => updateStatusBulk("concluido")}
                    >
                      <RiCheckboxCircleLine />
                      <p>Concluída</p>
                    </div>
                    <div
                      className={`${styles.action} ${styles.dispensada}`}
                      onClick={() => updateStatusBulk("dispensada")}
                    >
                      <RiForbid2Line />
                      <p>Dispensada</p>
                    </div>
                  </div>
                )}
                {isUpdating && (
                  <div className="pr-2 pl-2 pb-2 pt-2">
                    <ProgressBar
                      value={progress}
                      style={{ height: "6px" }}
                      showValue={false}
                    />
                    <div className={styles.progressText}>
                      Atualizando {Math.round(progress)}%...
                    </div>
                  </div>
                )}
                <DataTable
                  className={styles.table}
                  value={filteredPlanos}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[10, 20, 50]}
                  selectionMode="checkbox"
                  selection={selectedItems}
                  onSelectionChange={(e) => setSelectedItems(e.value)}
                  scrollable
                  dataKey="id"
                  emptyMessage="Nenhum registro encontrado."
                  paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                  currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                >
                  <Column
                    selectionMode="multiple"
                    headerStyle={{ width: "3rem" }}
                    frozen
                    className={styles.checkBoxColumn}
                  />
                  {/* Coluna fixa para o plano */}
                  <Column
                    field="titulo"
                    header="Plano de Trabalho"
                    style={{
                      width: "350px",
                      fontWeight: "bold",
                    }}
                    body={(rowData) => (
                      <div className={styles.rowCel}>
                        <h6>{rowData.titulo || `Plano #${rowData.id}`}</h6>
                        <div className={styles.participacoes}>
                          <div className={styles.icon}>
                            <RiUser2Line />
                          </div>
                          <div className={styles.contentParticipacoes}>
                            <p>{rowData.orientadores}</p>
                          </div>
                        </div>
                        <div className={styles.participacoes}>
                          <div className={styles.icon}>
                            <RiGraduationCapLine />
                          </div>
                          <div className={styles.contentParticipacoes}>
                            <p>{rowData.alunos}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  />

                  {/* Colunas dinâmicas para grupos de atividades */}
                  {atividades.map((atividade) => (
                    <Column
                      key={`col-ativ-${atividade.formularioId}`}
                      header={() => atividadeHeader(atividade)}
                      headerStyle={{}}
                      body={(rowData) => atividadeBody(rowData, atividade)}
                    />
                  ))}
                </DataTable>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-3">
            <NoData description="Crie atividades" />
          </Card>
        )}
      </main>
    </>
  );
};

export default TabelaRegistroAtividade;

"use client";
import { useEffect, useState, useRef } from "react";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { FilterService } from "primereact/api";
import styles from "./page.module.scss";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import {
  RiAddCircleLine,
  RiPencilLine,
  RiDeleteBinLine,
} from "@remixicon/react";
import {
  createCota,
  deleteCota,
  getCotas,
  alocarBolsa,
  updateCota,
  desalocarBolsa,
  getSolicitacoesBolsa,
} from "@/app/api/client/bolsa";
import {
  notaRowFilterTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import { renderStatusTagWithJustificativa } from "@/lib/tagUtils";
import { statusOptions } from "@/lib/statusOptions";

// Registro de filtros personalizados
FilterService.register("intervalo", (value, filters) => {
  const [min, max] = filters || [null, null];
  if (min === null && max === null) return true;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
});

const getInitialFilters = () => ({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  "inscricao.edital.titulo": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  status: {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  instituicaoPagadora: {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  ordemRecebimentoBolsa: {
    value: [null, null],
    matchMode: "intervalo",
  },
});

const Page = ({ params }) => {
  const { tenant, ano } = params;
  const toast = useRef(null);

  // Estados para dados
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [cotas, setCotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [distribuindo, setDistribuindo] = useState(false);
  const [desalocando, setDesalocando] = useState(false);
  const [progressoDistribuicao, setProgressoDistribuicao] = useState({
    atual: 0,
    total: 0,
  });

  // Estados para modais
  const [showCotaModal, setShowCotaModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentCota, setCurrentCota] = useState(null);
  const [cotaForm, setCotaForm] = useState({
    ano: parseInt(ano),
    quantidadeBolsas: 0,
  });

  // Filtros e opções
  const [editaisDisponiveis, setEditaisDisponiveis] = useState([]);
  const [filters, setFilters] = useState(getInitialFilters());
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [showJustificativas, setShowJustificativas] = useState(false);
  const [justificativasAtuais, setJustificativasAtuais] = useState("");
  const [
    instituicoesPagadorasDisponiveis,
    setInstituicoesPagadorasDisponiveis,
  ] = useState([]);

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const solicitacoes = await getSolicitacoesBolsa(
          params.tenant,
          params.ano
        );
        const solicitacoesComInstituicao = solicitacoes.map((s) => ({
          ...s,
          instituicaoPagadora:
            s.bolsa?.cota?.instituicaoPagadora ?? "Não alocado",
        }));

        setSolicitacoes(solicitacoesComInstituicao);
        console.log(solicitacoes);
        // Prepara filtros
        const editaisUnicos = [
          ...new Set(solicitacoes.map((s) => s.inscricao?.edital?.titulo)),
        ].filter(Boolean);
        setEditaisDisponiveis(
          editaisUnicos.map((edital) => ({ label: edital, value: edital }))
        );

        // Carrega cotas
        const cotasResponse = await getCotas(tenant, ano);
        const instituicoesPagadorasUnicas = [
          ...new Set(
            cotasResponse.cotas?.map((c) => c.instituicaoPagadora) || []
          ),
        ].filter(Boolean);
        setInstituicoesPagadorasDisponiveis([
          { label: "Não alocado", value: "Não alocado" },
          ...instituicoesPagadorasUnicas.map((instituicao) => ({
            label: instituicao,
            value: instituicao,
          })),
        ]);

        setCotas(cotasResponse.cotas || []);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        showToast("error", "Erro", "Falha ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant, ano]);

  // Manipulação de cotas
  const handleCreateCota = async () => {
    try {
      const response = await createCota(tenant, {
        ...cotaForm,
        tenantId: tenant,
      });
      setCotas([...cotas, response.quota]);
      setShowCotaModal(false);
      resetCotaForm();
      showToast("success", "Sucesso", "Cota criada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar cota:", error);
      showToast("error", "Erro", "Falha ao criar cota");
    }
  };

  const handleUpdateCota = async () => {
    try {
      const response = await updateCota(tenant, currentCota.id, cotaForm);
      setCotas(
        cotas.map((c) => (c.id === currentCota.id ? response.quota : c))
      );
      setShowCotaModal(false);
      resetCotaForm();
      showToast("success", "Sucesso", "Cota atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar cota:", error);
      showToast("error", "Erro", "Falha ao atualizar cota");
    }
  };

  const handleDeleteCota = async () => {
    try {
      await deleteCota(tenant, currentCota.id);
      setCotas(cotas.filter((c) => c.id !== currentCota.id));
      setShowDeleteDialog(false);
      showToast("success", "Sucesso", "Cota excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir cota:", error);
      showToast("error", "Erro", "Falha ao excluir cota");
    }
  };

  const openEditModal = (cota) => {
    setCurrentCota(cota);
    setCotaForm({
      ano: cota.ano,
      quantidadeBolsas: cota.quantidadeBolsas,
      instituicaoPagadora: cota.instituicaoPagadora,
    });
    setShowCotaModal(true);
  };

  const openCreateModal = () => {
    setCurrentCota(null);
    setCotaForm({
      ano: parseInt(ano),
      quantidadeBolsas: 0,
      instituicaoPagadora: "",
    });
    setShowCotaModal(true);
  };

  const resetCotaForm = () => {
    setCotaForm({
      ano: parseInt(ano),
      quantidadeBolsas: 0,
      instituicaoPagadora: "",
    });
  };

  // Filtros
  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const clearFilters = () => {
    setFilters(getInitialFilters());
    setGlobalFilterValue("");
  };

  // Renderização do cabeçalho da tabela
  const renderHeader = () => {
    return (
      <div className="justify-content-between align-items-center">
        <span className="p-input-icon-left flex flex-wrap gap-1 mb-2">
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
          <Button
            icon="pi pi-filter-slash"
            label="Limpar Filtros"
            onClick={clearFilters}
            className="p-button-outlined p-button-secondary"
          />
          {selectedItems.length > 0 && (
            <Button
              label={`Desalocar Bolsas (${selectedItems.length})`}
              icon="pi pi-ban"
              className="p-button-danger"
              onClick={desalocarBolsasSelecionadas}
              loading={desalocando}
            />
          )}
        </span>
      </div>
    );
  };

  // Distribuição de bolsas
  const distribuirBolsasParaSelecionados = async (cotaId) => {
    if (!selectedItems.length) {
      showToast("warn", "Aviso", "Nenhuma solicitação selecionada.");
      return;
    }

    setDistribuindo(true);
    setProgressoDistribuicao({ atual: 0, total: selectedItems.length });

    for (let i = 0; i < selectedItems.length; i++) {
      const solicitacao = selectedItems[i];

      try {
        const { solicitacaoBolsa, bolsa, cotas } = await alocarBolsa(tenant, {
          solicitacaoBolsaId: solicitacao.id,
          cotaId,
        }).then((r) => r.data); // <- já devolve o payload
        console.log(bolsa);
        /* 1. Atualiza a linha */
        setSolicitacoes((prev) =>
          prev.map((s) =>
            s.id === solicitacao.id
              ? {
                  ...solicitacao, // usa a versão do servidor
                  bolsa, // mantém o objeto da bolsa
                  instituicaoPagadora: bolsa?.cota?.instituicaoPagadora,
                }
              : s
          )
        );

        /* 2. Atualiza a cota */
        setCotas(cotas);

        /* 3. Garante que o filtro tenha a nova instituição */
        setInstituicoesPagadorasDisponiveis((prev) => {
          const nome = bolsa.cota?.instituicaoPagadora;
          return prev.some((opt) => opt.value === nome)
            ? prev
            : [...prev, { label: nome, value: nome }];
        });

        showToast("success", "Bolsa alocada");
      } catch (err) {
        const msg =
          err?.response?.data?.message || "Erro ao alocar bolsa no servidor";
        showToast("error", "Erro ao alocar", msg);
        if (msg === "Não há bolsas disponíveis nesta cota") break;
      }

      setProgressoDistribuicao((p) => ({ ...p, atual: p.atual + 1 }));
    }

    setDistribuindo(false);
    setProgressoDistribuicao({ atual: 0, total: 0 });
    setSelectedItems([]);
  };

  const desalocarBolsasSelecionadas = async () => {
    if (!selectedItems.length) {
      showToast("warn", "Aviso", "Nenhuma solicitação selecionada.");
      return;
    }

    setDesalocando(true);

    for (const solicitacao of selectedItems.filter((item) => item.bolsaId)) {
      try {
        const response = await desalocarBolsa(tenant, {
          solicitacaoBolsaId: solicitacao.id,
        });

        const bolsaDesalocada = solicitacao.bolsa;
        const cotaId = bolsaDesalocada?.cota?.id;

        // Atualizar solicitações
        setSolicitacoes((prev) =>
          prev.map((s) =>
            s.id === solicitacao.id
              ? {
                  ...s,
                  bolsaId: null,
                  bolsa: null,
                  instituicaoPagadora: "Não alocado",
                }
              : s
          )
        );

        // Atualizar cotas
        if (cotaId) {
          setCotas((prev) =>
            prev.map((c) =>
              c.id === cotaId
                ? {
                    ...c,
                    Bolsa: (c.Bolsa || []).filter(
                      (b) => b?.id !== solicitacao.bolsaId
                    ),
                  }
                : c
            )
          );
        }

        showToast("info", "Bolsa removida");
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          "Erro ao desalocar bolsa no servidor";

        showToast("error", "Erro ao desalocar", `${msg}`);
      }
    }

    setSelectedItems([]);
    setDesalocando(false);
  };

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  return (
    <div className={styles.resultado}>
      <Toast ref={toast} />

      {/* Card de Cotas */}
      <Card className="mb-2">
        <div className={styles.title}>
          <h5>Cotas de Bolsas</h5>
          <RiAddCircleLine
            size={24}
            className="cursor-pointer"
            onClick={openCreateModal}
          />
        </div>

        <div className={styles.cotas}>
          {cotas.map((cota) => {
            // Calcula as métricas de forma mais robusta
            const bolsasDisponibilizadas = cota.quantidadeBolsas || 0;
            const bolsasCriadas = cota.Bolsa?.length || 0;
            const bolsasNaoUtilizadas = Math.max(
              0,
              bolsasDisponibilizadas - bolsasCriadas
            );

            // Filtra bolsas alocadas (com solicitação associada)
            const bolsasAlocadas =
              cota.Bolsa?.filter((b) => b?.SolicitacaoBolsa !== null).length ||
              0;
            const bolsasNaoAlocadas = Math.max(
              0,
              bolsasCriadas - bolsasAlocadas
            );

            return (
              <div key={cota.id} className={styles.cotaEbtn}>
                <div className={styles.cota}>
                  <h6>{cota.instituicaoPagadora}</h6>
                  <div className={styles.cotaInfo}>
                    <p>
                      <strong>Disponibilizadas:</strong>{" "}
                      {bolsasDisponibilizadas}
                    </p>
                    <p>
                      <strong>Criadas:</strong> {bolsasCriadas}
                    </p>
                    <p>
                      <strong>Não criadas:</strong> {bolsasNaoUtilizadas}
                    </p>
                    <p>
                      <strong>Alocadas:</strong> {bolsasAlocadas}
                    </p>
                    <p>
                      <strong>Não alocadas:</strong> {bolsasNaoAlocadas}
                    </p>
                  </div>

                  <div className={styles.cotaActions}>
                    <RiPencilLine
                      size={18}
                      className="cursor-pointer"
                      onClick={() => openEditModal(cota)}
                    />
                    <RiDeleteBinLine
                      size={18}
                      className="cursor-pointer text-red-500"
                      onClick={() => {
                        setCurrentCota(cota);
                        setShowDeleteDialog(true);
                      }}
                    />
                  </div>
                </div>
                {selectedItems.length > 0 && (
                  <Button
                    label={
                      distribuindo
                        ? `Distribuindo... ${progressoDistribuicao.atual} de ${progressoDistribuicao.total}`
                        : `Distribuir essa cota para ${
                            selectedItems.length
                          } aluno${selectedItems.length > 1 ? "s" : ""}`
                    }
                    className="p-button-success p-2 w-100"
                    icon="pi pi-send"
                    onClick={() => distribuirBolsasParaSelecionados(cota.id)}
                    disabled={distribuindo || desalocando}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal de Cota */}
      <Dialog
        header={currentCota ? "Editar Cota" : "Criar Nova Cota"}
        visible={showCotaModal}
        style={{ width: "50vw" }}
        onHide={() => setShowCotaModal(false)}
        footer={
          <div>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowCotaModal(false)}
              className="p-button-text"
            />
            <Button
              label={currentCota ? "Atualizar" : "Criar"}
              icon="pi pi-check"
              onClick={currentCota ? handleUpdateCota : handleCreateCota}
              autoFocus
            />
          </div>
        }
      >
        <div className="p-fluid p-1">
          <div className="p-field mb-2">
            <label htmlFor="instituicaoPagadora">Instituição Pagadora</label>
            <InputText
              id="instituicaoPagadora"
              value={cotaForm.instituicaoPagadora}
              onChange={(e) =>
                setCotaForm({
                  ...cotaForm,
                  instituicaoPagadora: e.target.value,
                })
              }
              placeholder="Ex: FAP-DF, CNPq, CAPES"
              className="w-full p-1"
            />
          </div>

          <div className="p-field">
            <label htmlFor="quantidade">Quantidade</label>
            <InputNumber
              id="quantidadeBolsas"
              value={cotaForm.quantidadeBolsas}
              onValueChange={(e) =>
                setCotaForm({ ...cotaForm, quantidadeBolsas: e.value })
              }
              useGrouping={false}
              mode="decimal"
              min={0}
              className="w-full "
            />
          </div>
        </div>
      </Dialog>

      {/* Card de Alocação de Bolsas */}
      <Card>
        <h5 className="pl-2 pr-2 pt-2">Alocação de Bolsas</h5>

        {loading ? (
          <div className="p-2">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          </div>
        ) : (
          <DataTable
            value={solicitacoes}
            stripedRows
            scrollable
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="Nenhuma solicitação encontrada"
            resizableColumns
            columnResizeMode="expand"
            sortMode="multiple"
            selectionMode="checkbox"
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            dataKey="id"
            header={renderHeader}
            filters={filters}
            globalFilterFields={[
              "inscricao.proponente.nome",
              "inscricao.edital.titulo",
            ]}
            onFilter={(e) => {
              setFilters(e.filters);
              setSelectedItems([]);
            }}
            filterDisplay="row"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
          >
            <Column
              selectionMode="multiple"
              headerStyle={{ width: "3rem" }}
              frozen
            />

            <Column
              field="inscricao.edital.titulo"
              header="Edital"
              sortable
              filter
              filterField="inscricao.edital.titulo"
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, editaisDisponiveis)
              }
              showFilterMenu={false}
            />

            <Column
              field="status"
              header="Status da solicitação"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  statusOptions.solicitacao
                )
              }
              showFilterMenu={false}
              filterField="status"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.status,
                  rowData.justificativa,
                  {
                    onShowJustificativa: (justificativa) => {
                      setJustificativasAtuais(justificativa);
                      setShowJustificativas(true);
                    },
                  }
                )
              }
              style={{ width: "12rem" }}
            />

            <Column
              field="ordemRecebimentoBolsa"
              header="Ordem para receber bolsa"
              body={(rowData) => rowData.ordemRecebimentoBolsa}
              sortable
              filter
              filterField="ordemRecebimentoBolsa"
              filterMatchMode="intervalo"
              filterElement={notaRowFilterTemplate}
              dataType="numeric"
              style={{ textAlign: "left" }}
              showFilterMenu={false}
            />

            <Column
              field="instituicaoPagadora"
              filter
              sortable
              header="Bolsa"
              filterField="instituicaoPagadora"
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  instituicoesPagadorasDisponiveis
                )
              }
              body={(rowData) => (
                <Tag
                  value={rowData.instituicaoPagadora}
                  severity={
                    rowData.instituicaoPagadora === "Não alocado"
                      ? "info"
                      : "success"
                  }
                />
              )}
              style={{ textAlign: "left", width: "12rem" }}
            />
          </DataTable>
        )}
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        header="Confirmar Exclusão"
        visible={showDeleteDialog}
        style={{ width: "30vw" }}
        onHide={() => setShowDeleteDialog(false)}
        footer={
          <div>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowDeleteDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Excluir"
              icon="pi pi-trash"
              onClick={handleDeleteCota}
              className="p-button-danger"
              autoFocus
            />
          </div>
        }
      >
        <p>
          Tem certeza que deseja excluir a cota{" "}
          {currentCota?.instituicaoPagadora}?
        </p>
        <p>Esta ação não pode ser desfeita.</p>
      </Dialog>

      {/* Modal de Justificativas */}
      <Dialog
        header="Justificativas"
        visible={showJustificativas}
        style={{ width: "50vw" }}
        onHide={() => setShowJustificativas(false)}
      >
        <div style={{ whiteSpace: "pre-line", marginBottom: "12px" }}>
          {justificativasAtuais}
        </div>
      </Dialog>
    </div>
  );
};

export default Page;

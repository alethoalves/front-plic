"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  // ===== ENDPOINTS JÁ EXISTENTES =====
  getVinculosByTenant,
  processarSolicitacoesBolsa,
  aprovarVinculo,
  recusarVinculo,
  // ===== ENDPOINTS DE COTAS/BOLSAS =====
  createCota,
  deleteCota,
  getCotas,
  alocarBolsa,
  desalocarBolsa,
  updateCota,
} from "@/app/api/client/bolsa";

import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressBar } from "primereact/progressbar";
import { FilterMatchMode } from "primereact/api";
import { InputText } from "primereact/inputtext";
import { FilterService } from "primereact/api";

import {
  notaRowFilterTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import {
  renderStatusTagWithJustificativa,
  getSeverityByStatus,
} from "@/lib/tagUtils";
import { statusOptions } from "@/lib/statusOptions";

import {
  RiAddCircleLine,
  RiPencilLine,
  RiDeleteBinLine,
} from "@remixicon/react";

import styles from "./SolicitacoesBolsa.module.scss";

/* ----------------------------- filtros custom ---------------------------- */
FilterService.register("intervalo", (value, filters) => {
  const [min, max] = filters || [null, null];
  if (min === null && max === null) return true;
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
});

const getInitialFilters = () => ({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  /* ---------- filtros já existentes ---------- */
  "participacao.inscricao.edital.titulo": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  "participacao.planoDeTrabalho.statusClassificacao": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  "participacao.statusParticipacao": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  "solicitacaoBolsa.status": { value: null, matchMode: FilterMatchMode.IN },
  orientadores: { value: null, matchMode: FilterMatchMode.CONTAINS },
  status: { value: null, matchMode: FilterMatchMode.IN },
  "participacao.user.nome": {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  vinculosAprovados: { value: [null, null], matchMode: "intervalo" },
  notaTotal: { value: [null, null], matchMode: "intervalo" },
  rendimentoAcademico: { value: [null, null], matchMode: "intervalo" },
  "solicitacaoBolsa.ordemRecebimentoBolsa": {
    value: [null, null],
    matchMode: "intervalo",
  },
  /* ---------- novo filtro de Bolsa (cota) ---------- */
  instituicaoPagadora: { value: null, matchMode: FilterMatchMode.IN },
  formaIngresso: { value: null, matchMode: FilterMatchMode.IN },
});

/* ======================================================================= */
/*                               COMPONENTE                                */
/* ======================================================================= */
export default function SolicitacoesBolsa() {
  const { tenant, ano } = useParams();
  const toast = useRef(null);

  /* ------------------------- estados principais ------------------------- */
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---- seleção, processamento em lote, aprovação/recusa de vínculo ---- */
  const [selectedItems, setSelectedItems] = useState([]);
  const [loadingProcessar, setLoadingProcessar] = useState(false);
  const [progressProcessar, setProgressProcessar] = useState(0);
  const [loadingAprovarVinculo, setLoadingAprovarVinculo] = useState(false);
  const [loadingRecusarVinculo, setLoadingRecusarVinculo] = useState(false);
  const [displayNegarDialog, setDisplayNegarDialog] = useState(false);
  const [justificativa, setJustificativa] = useState("");

  /* ----------------------- estados de filtros UI ----------------------- */
  const [filters, setFilters] = useState(getInitialFilters());
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [editaisOptions, setEditaisOptions] = useState([]);
  const [classificacaoStatusOptions, setClassificacaoStatusOptions] = useState(
    []
  );
  const [participacaoStatusOptions, setParticipacaoStatusOptions] = useState(
    []
  );
  const [solicitacaoStatusOptions, setSolicitacaoStatusOptions] = useState([]);
  const [vinculoStatusOptions, setVinculoStatusOptions] = useState([]);
  const [
    instituicoesPagadorasDisponiveis,
    setInstituicoesPagadorasDisponiveis,
  ] = useState([]);
  const [formaIngressoOptions, setFormaIngressoOptions] = useState([]);

  /* --------------------------- Cotas & bolsas --------------------------- */
  const [cotas, setCotas] = useState([]);
  const [distribuindo, setDistribuindo] = useState(false);
  const [desalocando, setDesalocando] = useState(false);
  const [progressoDistribuicao, setProgressoDistribuicao] = useState({
    atual: 0,
    total: 0,
  });
  const [showCotaModal, setShowCotaModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentCota, setCurrentCota] = useState(null);
  const [cotaForm, setCotaForm] = useState({
    ano: parseInt(ano),
    quantidadeBolsas: 0,
    instituicaoPagadora: "",
  });

  /* ==================================================================== */
  /*                  FUNÇÃO DE PRÉ‑PROCESSAMENTO DOS DADOS               */
  /* ==================================================================== */
  const processarDados = async (rawData) => {
    /* opções de filtros globais */
    setEditaisOptions(
      [
        ...new Set(
          rawData.map((i) => i.participacao?.inscricao?.edital?.titulo || "N/A")
        ),
      ]
        .filter(Boolean)
        .map((edital) => ({ label: edital, value: edital }))
    );
    setFormaIngressoOptions(
      [
        ...new Set(
          rawData.map(
            (i) =>
              i.participacao?.userTenant?.formaIngresso?.formaIngresso || "N/A"
          )
        ),
      ]
        .filter(Boolean)
        .map((forma) => ({ label: forma, value: forma }))
    );
    setClassificacaoStatusOptions(statusOptions.classificacao);
    setParticipacaoStatusOptions(statusOptions.participacao);
    setSolicitacaoStatusOptions(statusOptions.solicitacao);
    setVinculoStatusOptions(statusOptions.vinculo);

    /* contagem de vínculos aprovados por aluno */
    const countAprovados = {};
    rawData.forEach((item) => {
      const alunoId = item.participacao?.user?.id;
      if (!alunoId) return;
      if (!countAprovados[alunoId]) countAprovados[alunoId] = 0;
      if (item.status === "APROVADO") countAprovados[alunoId]++;
    });

    return rawData.map((item) => {
      const plano = item.participacao?.planoDeTrabalho;
      const notaTotal = plano
        ? (
            plano.notaAluno +
            plano.notaOrientador +
            plano.notaPlano +
            plano.notaProjeto
          ).toFixed(4)
        : null;
      const orientadores =
        item.participacao?.inscricao?.participacoes
          ?.map((p) => p.user?.nome)
          .filter(Boolean)
          .join(", ") || "N/A";

      // Extrair forma de ingresso
      const formaIngresso =
        item.participacao?.userTenant?.formaIngresso?.formaIngresso || "N/A";

      return {
        ...item,
        notaTotal: notaTotal ? parseFloat(notaTotal) : null,
        rendimentoAcademico:
          item.participacao?.user?.UserTenant[0]?.rendimentoAcademico,
        vinculosAprovados: countAprovados[item.participacao.user.id] || 0,
        orientadores,
        formaIngresso, // Nova propriedade adicionada
        /* --------- campo usado para coluna/filtragem de bolsa ---------- */
        instituicaoPagadora:
          item.solicitacaoBolsa?.bolsa?.cota?.instituicaoPagadora ??
          "Não alocado",
      };
    });
  };
  /* ------ Justificativa: estado + função para abrir dialog ------ */
  const [displayJustificativaDialog, setDisplayJustificativaDialog] =
    useState(false);
  const [justificativaAtual, setJustificativaAtual] = useState("");

  const showJustificativaDialog = (texto) => {
    setJustificativaAtual(texto);
    setDisplayJustificativaDialog(true);
  };
  /* ==================================================================== */
  /*                              LOAD DATA                               */
  /* ==================================================================== */
  useEffect(() => {
    const fetchEverything = async () => {
      try {
        setLoading(true);
        /* -- vínculos -- */
        const rawVinculos = await getVinculosByTenant(tenant, ano);
        console.log(rawVinculos);
        const processed = await processarDados(rawVinculos);
        setProcessedData(processed);

        /* -- cotas -- */
        const cotasResp = await getCotas(tenant, ano);
        setCotas(cotasResp.cotas || []);

        /* opções de instituições */
        const insts = [
          ...new Set((cotasResp.cotas || []).map((c) => c.instituicaoPagadora)),
        ].filter(Boolean);
        setInstituicoesPagadorasDisponiveis([
          { label: "Não alocado", value: "Não alocado" },
          ...insts.map((i) => ({ label: i, value: i })),
        ]);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEverything();
  }, [tenant, ano]);

  /* ==================================================================== */
  /*                            CRUD DE COTAS                             */
  /* ==================================================================== */
  const resetCotaForm = () =>
    setCotaForm({
      ano: parseInt(ano),
      quantidadeBolsas: 0,
      instituicaoPagadora: "",
    });

  const handleCreateCota = async () => {
    try {
      const { quota } = await createCota(tenant, {
        ...cotaForm,
        tenantId: tenant,
      });
      setCotas((prev) => [...prev, quota]);
      showToast("success", "Sucesso", "Cota criada!");
    } catch (e) {
      showToast("error", "Erro", "Falha ao criar cota");
    } finally {
      setShowCotaModal(false);
      resetCotaForm();
    }
  };

  const handleUpdateCota = async () => {
    try {
      const { quota } = await updateCota(tenant, currentCota.id, cotaForm);
      setCotas((prev) => prev.map((c) => (c.id === quota.id ? quota : c)));
      showToast("success", "Sucesso", "Cota atualizada!");
    } catch (e) {
      showToast("error", "Erro", "Falha ao atualizar cota");
    } finally {
      setShowCotaModal(false);
      resetCotaForm();
    }
  };

  const handleDeleteCota = async () => {
    try {
      await deleteCota(tenant, currentCota.id);
      setCotas((prev) => prev.filter((c) => c.id !== currentCota.id));
      showToast("success", "Sucesso", "Cota excluída!");
    } catch (e) {
      showToast("error", "Erro", "Falha ao excluir cota");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  /* ==================================================================== */
  /*                    DISTRIBUIÇÃO / DESALOC. DE BOLSAS                 */
  /* ==================================================================== */
  const distribuirBolsasParaSelecionados = async (cotaId) => {
    if (!selectedItems.length)
      return showToast("warn", "Aviso", "Nenhuma solicitação selecionada.");

    setDistribuindo(true);
    setProgressoDistribuicao({ atual: 0, total: selectedItems.length });

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      try {
        const {
          solicitacaoBolsa,
          bolsa,
          cotas: updatedCotas,
        } = await alocarBolsa(tenant, {
          solicitacaoBolsaId: item.solicitacaoBolsa.id,
          cotaId,
        }).then((r) => r.data);

        /* ---- atualiza linha ---- */
        setProcessedData((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  solicitacaoBolsa: { ...solicitacaoBolsa, bolsaId: bolsa.id },
                  instituicaoPagadora: bolsa?.cota?.instituicaoPagadora,
                }
              : p
          )
        );

        /* ---- atualiza cotas ---- */
        setCotas(updatedCotas);

        /* ---- garante filtro ---- */
        setInstituicoesPagadorasDisponiveis((prev) => {
          const nome = bolsa.cota?.instituicaoPagadora;
          return prev.some((opt) => opt.value === nome)
            ? prev
            : [...prev, { label: nome, value: nome }];
        });

        showToast("success", "Bolsa alocada");
      } catch (err) {
        const msg = err?.response?.data?.message || "Erro ao alocar bolsa";
        showToast("error", "Erro", msg);
        if (msg.includes("Não há bolsas disponíveis")) break;
      }

      setProgressoDistribuicao((p) => ({ ...p, atual: p.atual + 1 }));
    }

    setDistribuindo(false);
    setSelectedItems([]);
  };

  const desalocarBolsasSelecionadas = async () => {
    if (!selectedItems.length)
      return showToast("warn", "Aviso", "Nenhuma solicitação selecionada.");

    setDesalocando(true);

    for (const item of selectedItems.filter(
      (i) => i.solicitacaoBolsa?.bolsaId
    )) {
      try {
        await desalocarBolsa(tenant, {
          solicitacaoBolsaId: item.solicitacaoBolsa.id,
        });

        const cotaId = item.solicitacaoBolsa?.bolsa?.cota?.id;
        /* ---- linha ---- */
        setProcessedData((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                  ...p,
                  solicitacaoBolsa: { ...p.solicitacaoBolsa, bolsaId: null },
                  instituicaoPagadora: "Não alocado",
                }
              : p
          )
        );
        /* ---- cota ---- */
        if (cotaId) {
          setCotas((prev) =>
            prev.map((c) =>
              c.id === cotaId
                ? {
                    ...c,
                    Bolsa: (c.Bolsa || []).filter(
                      (b) => b.id !== item.solicitacaoBolsa.bolsaId
                    ),
                  }
                : c
            )
          );
        }
        showToast("info", "Bolsa removida");
      } catch {
        showToast("error", "Erro", "Falha ao desalocar bolsa");
      }
    }

    setDesalocando(false);
    setSelectedItems([]);
  };
  /* ==================================================================== */
  /*                APROVAR / RECUSAR VÍNCULOS INDIVIDUAIS                */
  /* ==================================================================== */
  const handleRecusarVinculo = () => {
    if (!selectedItems.length) {
      showToast(
        "warn",
        "Aviso",
        "Selecione pelo menos um vínculo para recusar."
      );
      return;
    }
    setDisplayNegarDialog(true); // abre o modal de justificativa
  };

  const confirmarRecusaVinculo = async () => {
    if (!justificativa.trim()) {
      showToast("error", "Erro", "Digite o motivo da recusa.");
      return;
    }

    setLoadingRecusarVinculo(true);
    let sucesso = 0;

    for (const item of selectedItems) {
      try {
        await recusarVinculo(tenant, item.id, justificativa);
        sucesso++;

        /* marca a linha como recusada e armazena a justificativa */
        setProcessedData((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "RECUSADO", motivoRecusa: justificativa }
              : p
          )
        );
      } catch (err) {
        const msg = err?.response?.data?.message || "Erro ao recusar vínculo";
        showToast("error", "Erro", msg);
      }
    }

    showToast(
      sucesso === selectedItems.length ? "success" : "warn",
      "Concluído",
      `${sucesso} de ${selectedItems.length} vínculo(s) recusado(s).`
    );

    setLoadingRecusarVinculo(false);
    setDisplayNegarDialog(false);
    setJustificativa("");
    setSelectedItems([]);
  };
  // Atualizar handleProcessarSolicitacoes para processar os dados após a atualização
  /* ==================================================================== */
  /*                    PROCESSAR SOLICITAÇÕES DE BOLSA                   */
  /*  (passa todas que estão EM_ANALISE pelo endpoint processarSolicitacoesBolsa) */
  /* ==================================================================== */
  const handleProcessarSolicitacoes = async () => {
    setLoadingProcessar(true);
    setProgressProcessar(0);

    try {
      /* 1. pega IDs de todas as solicitações ligadas aos itens da tabela */
      const ids = processedData
        .map((it) => it.solicitacaoBolsa?.id)
        .filter(Boolean);

      if (ids.length === 0) {
        showToast(
          "info",
          "Nada a processar",
          "Não há solicitações nesta lista."
        );
        setLoadingProcessar(false);
        return;
      }

      /* 2. divide em lotes de 10 para não sobrecarregar o servidor */
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize));
      }

      let totalProcessed = 0;

      for (const batch of batches) {
        try {
          /* chama a API */
          await processarSolicitacoesBolsa(tenant, batch);

          totalProcessed += batch.length;
          setProgressProcessar(Math.round((totalProcessed / ids.length) * 100));

          showToast(
            "success",
            "Processado",
            `Lote com ${batch.length} solicitações processado`
          );

          /* 3. recarrega dados após cada lote para refletir novos status */
          const raw = await getVinculosByTenant(tenant, ano);
          setProcessedData(await processarDados(raw));
        } catch (err) {
          const msg =
            err?.response?.data?.message ||
            "Erro ao processar lote de solicitações";
          console.error(msg);
          showToast("error", "Erro no lote", msg);
        }
      }

      showToast(
        "success",
        "Concluído",
        `${totalProcessed} de ${ids.length} solicitações processadas`
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Erro ao processar solicitações";
      console.error(msg);
      showToast("error", "Erro", msg);
    } finally {
      setLoadingProcessar(false);
      setProgressProcessar(0);
    }
  };

  /* ==================================================================== */
  /*                         APROVAR VÍNCULOS                             */
  /* ==================================================================== */
  const handleAprovarVinculo = async () => {
    if (!selectedItems.length) {
      showToast(
        "warn",
        "Aviso",
        "Selecione pelo menos um vínculo para aprovar."
      );
      return;
    }

    setLoadingAprovarVinculo(true);
    let sucesso = 0;

    for (const item of selectedItems) {
      try {
        await aprovarVinculo(tenant, item.id); // chamada à API
        sucesso++;

        /* atualiza a linha aprovada */
        setProcessedData((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "APROVADO" } : p))
        );
      } catch (err) {
        const msg = err?.response?.data?.message || "Erro ao aprovar vínculo";
        showToast("error", "Erro", msg);
      }
    }

    showToast(
      sucesso === selectedItems.length ? "success" : "warn",
      "Concluído",
      `${sucesso} de ${selectedItems.length} vínculo(s) aprovado(s).`
    );

    setLoadingAprovarVinculo(false);
    setSelectedItems([]);
  };

  /* ==================================================================== */
  /*                              UTILITIES                               */
  /* ==================================================================== */
  const showToast = (severity, summary, detail) =>
    toast.current?.show({ severity, summary, detail, life: 3000 });

  const onGlobalFilterChange = (e) => {
    const val = e.target.value;
    setGlobalFilterValue(val);
    setFilters((f) => ({
      ...f,
      global: { value: val, matchMode: FilterMatchMode.CONTAINS },
    }));
  };

  const clearFilters = () => {
    setFilters(getInitialFilters());
    setGlobalFilterValue("");
  };

  /* ==================================================================== */
  /*                               HEADER                                 */
  /* ==================================================================== */
  const renderHeader = () => (
    <div className="justify-content-between align-items-center">
      <span className="p-input-icon-left flex flex-wrap gap-1 mb-2">
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Buscar..."
        />
        <Button
          icon="pi pi-filter-slash"
          label="Limpar"
          onClick={clearFilters}
          className="p-button-outlined p-button-secondary"
        />

        {processedData.some(
          (i) => i.solicitacaoBolsa?.status === "EM_ANALISE"
        ) && (
          <Button
            label="Processar Solicitações"
            icon="pi pi-cog"
            className="p-button-info"
            onClick={handleProcessarSolicitacoes}
            loading={loadingProcessar}
          />
        )}

        {selectedItems.length > 0 && (
          <>
            <Button
              label={`Aprovar Vínculo (${selectedItems.length})`}
              icon="pi pi-check-circle"
              className="p-button-success"
              onClick={handleAprovarVinculo}
              loading={loadingAprovarVinculo}
            />
            <Button
              label={`Recusar Vínculo (${selectedItems.length})`}
              icon="pi pi-ban"
              className="p-button-danger"
              onClick={handleRecusarVinculo}
              loading={loadingRecusarVinculo}
            />
            <Button
              label={`Desalocar Bolsa (${selectedItems.length})`}
              icon="pi pi-times"
              className="p-button-warning"
              onClick={desalocarBolsasSelecionadas}
              loading={desalocando}
            />
          </>
        )}
      </span>
    </div>
  );

  /* ==================================================================== */
  /*                               RENDER                                 */
  /* ==================================================================== */
  if (loading)
    return <ProgressBar mode="indeterminate" style={{ height: "6px" }} />;

  if (error)
    return (
      <div className={styles.SolicitacoesBolsa}>Erro ao carregar dados</div>
    );

  return (
    <div className={styles.SolicitacoesBolsa}>
      <Toast ref={toast} />

      {/* ======================= CARD DE COTAS ======================= */}
      <Card className="mb-2">
        <div className={styles.title}>
          <h5>Cotas de Bolsas</h5>
          <RiAddCircleLine
            size={22}
            className="cursor-pointer"
            onClick={() => {
              setCurrentCota(null);
              resetCotaForm();
              setShowCotaModal(true);
            }}
          />
        </div>

        <div className={styles.cotas}>
          {cotas.map((cota) => {
            const disponibilizadas = cota.quantidadeBolsas || 0;
            const criadas = cota.Bolsa?.length || 0;
            const naoCriadas = Math.max(0, disponibilizadas - criadas);
            const alocadas =
              cota.Bolsa?.filter((b) => b?.SolicitacaoBolsa).length || 0;
            const naoAlocadas = Math.max(0, criadas - alocadas);

            return (
              <div key={cota.id} className={styles.cotaEbtn}>
                <div className={styles.cota}>
                  <h6>{cota.instituicaoPagadora}</h6>
                  <div className={styles.cotaInfo}>
                    <p>
                      <strong>Disponibilizadas:</strong> {disponibilizadas}
                    </p>
                    <p>
                      <strong>Criadas:</strong> {criadas}
                    </p>
                    <p>
                      <strong>Não criadas:</strong> {naoCriadas}
                    </p>
                    <p>
                      <strong>Alocadas:</strong> {alocadas}
                    </p>
                    <p>
                      <strong>Não alocadas:</strong> {naoAlocadas}
                    </p>
                  </div>
                  <div className={styles.cotaActions}>
                    <RiPencilLine
                      size={18}
                      className="cursor-pointer"
                      onClick={() => {
                        setCurrentCota(cota);
                        setCotaForm({ ...cota });
                        setShowCotaModal(true);
                      }}
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

                {selectedItems.length > 0 &&
                  (naoAlocadas > 0 || naoCriadas > 0) && (
                    <Button
                      label={
                        distribuindo
                          ? `Distribuindo... ${progressoDistribuicao.atual}/${progressoDistribuicao.total}`
                          : `Distribuir esta cota para ${
                              selectedItems.length
                            } aluno${selectedItems.length > 1 ? "s" : ""}`
                      }
                      className="p-button-success w-100"
                      icon="pi pi-send"
                      disabled={distribuindo || desalocando}
                      onClick={() => distribuirBolsasParaSelecionados(cota.id)}
                    />
                  )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ================= TABELA PRINCIPAL ================= */}
      <Card>
        <h5 className="pt-2 pl-2 pr-2">Solicitações de Bolsas</h5>
        <DataTable
          value={processedData}
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
          globalFilterFields={["participacao.user.nome", "orientadores"]}
          onFilter={(e) => {
            setFilters(e.filters);
            setSelectedItems([]);
          }}
          filterDisplay="row"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
        >
          {/* seleção */}
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            frozen
          />

          {/* EDITAL */}
          <Column
            field="participacao.inscricao.edital.titulo"
            header="Edital"
            sortable
            filter
            filterField="participacao.inscricao.edital.titulo"
            filterElement={(opts) =>
              statusClassificacaoFilterTemplate(opts, editaisOptions)
            }
            showFilterMenu={false}
          />

          {/* STATUS PLANO */}
          <Column
            field="participacao.planoDeTrabalho.statusClassificacao"
            header="Status Plano"
            sortable
            filter
            filterField="participacao.planoDeTrabalho.statusClassificacao"
            filterElement={(opts) =>
              statusClassificacaoFilterTemplate(
                opts,
                classificacaoStatusOptions
              )
            }
            showFilterMenu={false}
            body={(row) =>
              renderStatusTagWithJustificativa(
                row.participacao.planoDeTrabalho.statusClassificacao,
                row.participacao.planoDeTrabalho.justificativa,
                { onShowJustificativa: showJustificativaDialog }
              )
            }
            style={{ width: "12rem" }}
          />

          {/* STATUS ALUNO */}
          <Column
            field="participacao.statusParticipacao"
            header="Status Aluno"
            sortable
            filter
            filterField="participacao.statusParticipacao"
            filterElement={(opts) =>
              statusClassificacaoFilterTemplate(opts, participacaoStatusOptions)
            }
            showFilterMenu={false}
            body={(row) =>
              renderStatusTagWithJustificativa(
                row.participacao.statusParticipacao,
                row.participacao.justificativa,
                { onShowJustificativa: showJustificativaDialog }
              )
            }
            style={{ width: "12rem" }}
          />

          {/* STATUS SOLICITAÇÃO */}
          <Column
            field="solicitacaoBolsa.status"
            header="Status Solicitação"
            sortable
            filter
            filterField="solicitacaoBolsa.status"
            filterElement={(opts) =>
              statusClassificacaoFilterTemplate(opts, solicitacaoStatusOptions)
            }
            showFilterMenu={false}
            body={(row) =>
              renderStatusTagWithJustificativa(
                row.solicitacaoBolsa.status,
                row.solicitacaoBolsa.justificativa,
                { onShowJustificativa: showJustificativaDialog }
              )
            }
            style={{ width: "12rem" }}
          />

          {/* STATUS VÍNCULO */}
          <Column
            field="status"
            header="Status Vínculo"
            sortable
            filter
            filterField="status"
            filterElement={(opts) =>
              statusClassificacaoFilterTemplate(opts, vinculoStatusOptions)
            }
            showFilterMenu={false}
            body={(row) =>
              renderStatusTagWithJustificativa(row.status, row.motivoRecusa, {
                onShowJustificativa: showJustificativaDialog,
              })
            }
            style={{ width: "12rem" }}
          />

          {/* ALUNO */}
          <Column
            field="participacao.user.nome"
            header="Aluno"
            sortable
            filter
            showFilterMenu
            filterField="participacao.user.nome"
            filterPlaceholder="Filtrar por nome"
          />
          <Column
            field="formaIngresso"
            header="Forma de Ingresso"
            sortable
            filter
            filterField="formaIngresso"
            filterElement={(opts) =>
              statusClassificacaoFilterTemplate(opts, formaIngressoOptions)
            }
            showFilterMenu={false}
          />

          {/* ORIENTADOR(ES) */}
          <Column
            field="orientadores"
            header="Orientador"
            sortable
            filter
            showFilterMenu
            filterField="orientadores"
            filterPlaceholder="Filtrar por nome"
          />

          {/* VÍNCULOS APROVADOS */}
          <Column
            field="vinculosAprovados"
            header="Bolsas Aprovadas"
            body={(row) => (
              <Tag
                value={row.vinculosAprovados}
                severity={row.vinculosAprovados > 0 ? "success" : "info"}
              />
            )}
            sortable
            style={{ textAlign: "center", width: "8rem" }}
          />

          {/* NOTA TOTAL */}
          <Column
            field="notaTotal"
            header="Nota Total"
            sortable
            filter
            filterField="notaTotal"
            filterMatchMode="intervalo"
            filterElement={notaRowFilterTemplate}
            dataType="numeric"
            body={(row) =>
              row.notaTotal !== null ? row.notaTotal.toFixed(4) : "N/A"
            }
            style={{ textAlign: "center", width: "8rem" }}
          />

          {/* RENDIMENTO ACADÊMICO */}
          <Column
            field="rendimentoAcademico"
            header="Rend. Acadêmico"
            sortable
            filter
            filterField="rendimentoAcademico"
            filterMatchMode="intervalo"
            filterElement={notaRowFilterTemplate}
            dataType="numeric"
            body={(row) => row.rendimentoAcademico}
            style={{ textAlign: "center", width: "8rem" }}
          />

          {/* ORDEM DA BOLSA */}
          <Column
            field="solicitacaoBolsa.ordemRecebimentoBolsa"
            header="Ordem Bolsa"
            sortable
            filter
            filterField="solicitacaoBolsa.ordemRecebimentoBolsa"
            filterMatchMode="intervalo"
            filterElement={notaRowFilterTemplate}
            dataType="numeric"
            body={(row) => row.solicitacaoBolsa.ordemRecebimentoBolsa}
            style={{ textAlign: "center" }}
          />

          {/* NOVA COLUNA ‑ INSTITUIÇÃO (COTA) */}
          <Column
            field="solicitacaoBolsa.bolsa.cota.instituicaoPagadora"
            header="Bolsa"
            sortable
            filter
            filterField="instituicaoPagadora"
            filterElement={(opts) =>
              statusClassificacaoFilterTemplate(
                opts,
                instituicoesPagadorasDisponiveis
              )
            }
            body={(row) => (
              <Tag
                value={row.instituicaoPagadora}
                severity={
                  row.solicitacaoBolsa.bolsa?.cota.instituicaoPagadora
                    ? "success"
                    : "warning"
                }
              />
            )}
            style={{ textAlign: "center", width: "12rem" }}
          />
        </DataTable>
      </Card>

      {/* =================== MODAIS (cota, delete, justificativa…) =================== */}
      {/* -- modal de criar/editar cota -- */}
      <Dialog
        header={currentCota ? "Editar Cota" : "Criar Cota"}
        visible={showCotaModal}
        style={{ width: "50vw" }}
        onHide={() => setShowCotaModal(false)}
        footer={
          <div>
            <Button
              label="Cancelar"
              className="p-button-text"
              onClick={() => setShowCotaModal(false)}
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
        <div className="p-fluid">
          <div className="p-field mb-2">
            <label>Instituição Pagadora</label>
            <InputText
              value={cotaForm.instituicaoPagadora}
              onChange={(e) =>
                setCotaForm({
                  ...cotaForm,
                  instituicaoPagadora: e.target.value,
                })
              }
              placeholder="Ex: FAP‑DF, CNPq"
            />
          </div>
          <div className="p-field">
            <label>Quantidade de Bolsas</label>
            <InputText
              keyfilter="pint"
              value={cotaForm.quantidadeBolsas}
              onChange={(e) =>
                setCotaForm({
                  ...cotaForm,
                  quantidadeBolsas: parseInt(e.target.value || "0", 10),
                })
              }
            />
          </div>
        </div>
      </Dialog>

      {/* -- dialog confirmar delete -- */}
      <Dialog
        header="Confirmar Exclusão"
        visible={showDeleteDialog}
        style={{ width: "30vw" }}
        onHide={() => setShowDeleteDialog(false)}
        footer={
          <div>
            <Button
              label="Cancelar"
              className="p-button-text"
              onClick={() => setShowDeleteDialog(false)}
            />
            <Button
              label="Excluir"
              className="p-button-danger"
              icon="pi pi-trash"
              onClick={handleDeleteCota}
              autoFocus
            />
          </div>
        }
      >
        Tem certeza que deseja excluir a cota{" "}
        <strong>{currentCota?.instituicaoPagadora}</strong>?
      </Dialog>
      {/* ------------ Dialog de Justificativa (somente leitura) ------------ */}
      <Dialog
        header="Justificativa"
        visible={displayJustificativaDialog}
        style={{ width: "50vw" }}
        onHide={() => setDisplayJustificativaDialog(false)}
        footer={
          <Button
            label="Fechar"
            icon="pi pi-times"
            className="p-button-text"
            onClick={() => setDisplayJustificativaDialog(false)}
          />
        }
      >
        <div style={{ whiteSpace: "pre-line" }}>{justificativaAtual}</div>
      </Dialog>

      {/* -- dialog recusar vínculo -- */}
      <Dialog
        header="Confirmar Recusa"
        visible={displayNegarDialog}
        style={{ width: "450px" }}
        onHide={() => {
          setDisplayNegarDialog(false);
          setJustificativa("");
        }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              className="p-button-text"
              onClick={() => {
                setDisplayNegarDialog(false);
                setJustificativa("");
              }}
            />
            <Button
              label="Confirmar"
              className="p-button-danger"
              onClick={confirmarRecusaVinculo}
              loading={loadingRecusarVinculo}
            />
          </div>
        }
      >
        <InputTextarea
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          rows={3}
          autoResize
          placeholder="Digite o motivo da recusa..."
        />
      </Dialog>
    </div>
  );
}

"use client";
// HOOKS
import { useEffect, useState, useRef, useMemo } from "react";

// ESTILO E ÍCONES
import styles from "./TabelaProjetos.module.scss";
import { RiSettings5Line } from "@remixicon/react";

// PRIMEREACT
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Toast } from "primereact/toast";
import { Checkbox } from "primereact/checkbox";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";

// COMPONENTES
import Modal from "@/components/Modal";
import Button from "@/components/Button";

// SERVIÇOS
import {
  getInscricaoProjetoByTenant,
  atribuirNotaManual,
  alterarStatusAvaliacao,
  bloquearAvaliacaoProjeto,
  desbloquearAvaliacaoProjeto,
} from "@/app/api/client/projeto";
import { formatStatusText } from "@/lib/tagUtils";
import { getFormularioProjeto } from "@/app/api/client/formulario";
import {
  getConfiguracaoTabela,
  upsertConfiguracaoTabela,
} from "@/app/api/client/configuracaoTabela";
import {
  editalRowFilterTemplate,
  notaRowFilterTemplate,
} from "@/lib/tableTemplates";
import {
  formatarValorCampoDinamico,
  TIPOS_NAO_SELECIONAVEIS,
} from "@/lib/formularioDinamico";

const CHAVE_CONFIG_COLUNAS = "colunasExtraProjetoSelecao";
const STATUS_AVALIACAO_OPCOES = [
  "AGUARDANDO_AVALIACAO",
  "EM_AVALIACAO",
  "AVALIADA",
].map((status) => ({ label: formatStatusText(status), value: status }));
const BLOQUEIO_OPCOES = [
  { label: "Bloqueado", value: true },
  { label: "Não bloqueado", value: false },
];

const TabelaProjetos = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [editaisDisponiveis, setEditaisDisponiveis] = useState([]);
  const [formularioCampos, setFormularioCampos] = useState([]);
  const [colunasSelecionadas, setColunasSelecionadas] = useState([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [draftColunas, setDraftColunas] = useState([]);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [notaManual, setNotaManual] = useState(null);
  const [justificativaNotaManual, setJustificativaNotaManual] = useState("");
  const [salvandoNotaManual, setSalvandoNotaManual] = useState(false);
  const [novoStatus, setNovoStatus] = useState(null);
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [justificativaBloqueio, setJustificativaBloqueio] = useState("");
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false);
  const [showJustificativaBloqueioModal, setShowJustificativaBloqueioModal] = useState(false);
  const [justificativaBloqueioAtual, setJustificativaBloqueioAtual] = useState("");

  // REFS
  const toast = useRef(null);

  // FILTROS
  const [filters, setFilters] = useState({
    global: { value: "", matchMode: FilterMatchMode.CONTAINS },
    id: { value: "", matchMode: FilterMatchMode.CONTAINS },
    "projeto.titulo": { value: "", matchMode: FilterMatchMode.CONTAINS },
    "projeto.area.area": { value: "", matchMode: FilterMatchMode.CONTAINS },
    "inscricao.proponente.nome": {
      value: "",
      matchMode: FilterMatchMode.CONTAINS,
    },
    "inscricao.edital.titulo": { value: [], matchMode: FilterMatchMode.IN },
    statusAvaliacao: { value: "", matchMode: FilterMatchMode.CONTAINS },
    bloqueadoAvaliacao: { value: [], matchMode: FilterMatchMode.IN },
    notaMedia: {
      value: [undefined, undefined],
      matchMode: "intervalo_numerico",
    },
    notaFinal: {
      value: [undefined, undefined],
      matchMode: "intervalo_numerico",
    },
  });

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const inscricoesProjetos = await getInscricaoProjetoByTenant(
        params.tenant,
        null,
        params.ano || null
      );

      const itensProcessados =
        inscricoesProjetos?.map((inscricao) => {
          const quantidadeFichas = inscricao.FichaAvaliacao?.length || 0;
          const notaMedia =
            quantidadeFichas > 0
              ? parseFloat(
                  (
                    inscricao.FichaAvaliacao.reduce(
                      (sum, ficha) => sum + (ficha.notaTotal || 0),
                      0
                    ) / quantidadeFichas
                  ).toFixed(2)
                )
              : null;

          const avaliadores =
            inscricao.InscricaoProjetoAvaliador?.map(
              (avaliador) => avaliador.avaliador.nome
            ).join(", ") || "";

          return {
            ...inscricao,
            quantidadeFichas,
            notaMedia,
            avaliadores,
            quantidadeAvaliadores: inscricao.InscricaoProjetoAvaliador?.length || 0,
          };
        }) || [];

      setItens(itensProcessados);

      const editaisUnicos = [
        ...new Set(
          itensProcessados.map((item) => item.inscricao?.edital?.titulo)
        ),
      ].filter(Boolean);

      setEditaisDisponiveis(
        editaisUnicos.map((edital) => ({ label: edital, value: edital }))
      );
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar dados",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, params.ano]);

  useEffect(() => {
    const fetchConfigColunas = async () => {
      try {
        const [formulario, configuracao] = await Promise.all([
          getFormularioProjeto(params.tenant),
          getConfiguracaoTabela(params.tenant, CHAVE_CONFIG_COLUNAS),
        ]);
        setFormularioCampos(
          (formulario?.campos || []).filter(
            (campo) => !TIPOS_NAO_SELECIONAVEIS.includes(campo.tipo)
          )
        );
        setColunasSelecionadas(configuracao?.campoIds || []);
      } catch (error) {
        console.error("Erro ao carregar configuração de colunas:", error);
      }
    };

    fetchConfigColunas();
  }, [params.tenant]);

  const abrirConfigModal = () => {
    setDraftColunas(colunasSelecionadas);
    setShowConfigModal(true);
  };

  const toggleCampoDraft = (campoId, checked) => {
    setDraftColunas((prev) =>
      checked ? [...prev, campoId] : prev.filter((id) => id !== campoId)
    );
  };

  const salvarConfigColunas = async () => {
    setSalvandoConfig(true);
    try {
      await upsertConfiguracaoTabela(params.tenant, CHAVE_CONFIG_COLUNAS, {
        campoIds: draftColunas,
      });
      setColunasSelecionadas(draftColunas);
      setShowConfigModal(false);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao salvar a configuração de colunas",
        life: 3000,
      });
    } finally {
      setSalvandoConfig(false);
    }
  };

  const abrirMenuAcoes = () => setActiveModal("menuAcoes");

  const fecharModalAcao = () => {
    setActiveModal(null);
    setNotaManual(null);
    setJustificativaNotaManual("");
    setNovoStatus(null);
    setJustificativaBloqueio("");
  };

  const abrirJustificativaBloqueio = (rowData) => {
    setJustificativaBloqueioAtual(rowData.justificativaBloqueio || "");
    setShowJustificativaBloqueioModal(true);
  };

  const confirmarNotaManual = async () => {
    setSalvandoNotaManual(true);
    try {
      await atribuirNotaManual(
        params.tenant,
        selectedItems.map((item) => item.id),
        notaManual,
        justificativaNotaManual
      );
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Nota manual atribuída com sucesso.",
        life: 3000,
      });
      await fetchInitialData();
      setSelectedItems([]);
      fecharModalAcao();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao atribuir a nota manual.",
        life: 3000,
      });
    } finally {
      setSalvandoNotaManual(false);
    }
  };

  const confirmarAlterarStatus = async () => {
    setSalvandoStatus(true);
    try {
      await alterarStatusAvaliacao(
        params.tenant,
        selectedItems.map((item) => item.id),
        novoStatus
      );
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Status atualizado com sucesso.",
        life: 3000,
      });
      await fetchInitialData();
      setSelectedItems([]);
      fecharModalAcao();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao alterar o status.",
        life: 3000,
      });
    } finally {
      setSalvandoStatus(false);
    }
  };

  const confirmarBloquear = async () => {
    setSalvandoBloqueio(true);
    try {
      await bloquearAvaliacaoProjeto(
        params.tenant,
        selectedItems.map((item) => item.id),
        justificativaBloqueio
      );
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Avaliação do projeto bloqueada com sucesso.",
        life: 3000,
      });
      await fetchInitialData();
      setSelectedItems([]);
      fecharModalAcao();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao bloquear a avaliação do projeto.",
        life: 3000,
      });
    } finally {
      setSalvandoBloqueio(false);
    }
  };

  const confirmarDesbloquear = async () => {
    setSalvandoBloqueio(true);
    try {
      await desbloquearAvaliacaoProjeto(
        params.tenant,
        selectedItems.map((item) => item.id)
      );
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Avaliação do projeto desbloqueada com sucesso.",
        life: 3000,
      });
      await fetchInitialData();
      setSelectedItems([]);
      fecharModalAcao();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao desbloquear a avaliação do projeto.",
        life: 3000,
      });
    } finally {
      setSalvandoBloqueio(false);
    }
  };

  // Achata o valor de cada campo dinâmico selecionado num campo raso (`campo_<id>`)
  // em cada linha, pra poder usar sort/filter nativos do PrimeReact (que operam
  // sobre um `field` simples, não sobre uma busca em rowData.projeto.Resposta).
  const itensComCamposDinamicos = useMemo(() => {
    if (colunasSelecionadas.length === 0) return itens;
    return itens.map((item) => {
      const extras = {};
      colunasSelecionadas.forEach((campoId) => {
        const campo = formularioCampos.find((c) => c.id === campoId);
        if (!campo) return;
        const resposta = item.projeto?.Resposta?.find(
          (r) => r.campoId === campoId
        );
        extras[`campo_${campoId}`] = formatarValorCampoDinamico(
          resposta,
          campo.tipo
        );
      });
      return { ...item, ...extras };
    });
  }, [itens, colunasSelecionadas, formularioCampos]);

  // Garante que sempre exista uma entrada de filtro pras colunas dinâmicas
  // atualmente selecionadas, mesmo antes do primeiro onFilter disparar.
  const filtersEfetivos = useMemo(() => {
    const merged = { ...filters };
    colunasSelecionadas.forEach((campoId) => {
      const field = `campo_${campoId}`;
      if (!merged[field]) {
        merged[field] = { value: "", matchMode: FilterMatchMode.CONTAINS };
      }
    });
    return merged;
  }, [filters, colunasSelecionadas]);

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => (
    <div className="flex flex-wrap justify-content-between align-items-center gap-2">
      <InputText
        className="w-100"
        value={globalFilterValue}
        onChange={onGlobalFilterChange}
        placeholder="Pesquisar..."
      />
      <RiSettings5Line
        className={styles.configIcon}
        onClick={abrirConfigModal}
        title="Configurar colunas extras"
      />
    </div>
  );

  return (
    <>
      <main className={styles.main}>
        <Card className="custom-card mb-2 mt-2 pt-1">
          {loading ? (
            <div className="pr-2 pl-2 pb-2 pt-2">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
            </div>
          ) : (
            <>
              {selectedItems.length > 0 && (
                <div className={`flex align-items-center gap-2 mb-2 ${styles.acaoLote}`}>
                  <span>{selectedItems.length} projeto(s) selecionado(s)</span>
                  <Button className="button btn-primary" onClick={abrirMenuAcoes}>
                    Executar Ação
                  </Button>
                </div>
              )}
              <DataTable
              value={itensComCamposDinamicos}
              paginator
              rows={10}
              rowsPerPageOptions={[10, 20, 50]}
              scrollable
              selectionMode="checkbox"
              selection={selectedItems}
              onSelectionChange={(e) => setSelectedItems(e.value)}
              dataKey="id"
              header={renderHeader()}
              filters={filtersEfetivos}
              onFilter={(e) => {
                setFilters(e.filters);
                setSelectedItems([]);
              }}
              filterDisplay="row"
              globalFilterFields={[
                "projeto.titulo",
                "inscricao.proponente.nome",
                ...colunasSelecionadas.map((campoId) => `campo_${campoId}`),
              ]}
              emptyMessage="Nenhum projeto encontrado."
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
            >
              <Column
                selectionMode="multiple"
                headerStyle={{ width: "3rem" }}
                frozen
              />
              <Column
                field="id"
                header="ID"
                sortable
                filter
                filterPlaceholder="Filtrar por id"
                filterField="id"
                style={{ width: "6rem" }}
              />
              <Column
                field="projeto.titulo"
                header="Título do Projeto"
                sortable
                filter
                filterPlaceholder="Filtrar por título"
                filterField="projeto.titulo"
                body={(rowData) => rowData.projeto?.titulo || "-"}
                style={{ maxWidth: "20rem" }}
              />
              <Column
                field="projeto.area.area"
                header="Área"
                sortable
                filter
                filterPlaceholder="Filtrar por área"
                filterField="projeto.area.area"
                body={(rowData) => rowData.projeto?.area?.area || "-"}
                style={{ width: "12rem" }}
              />
              <Column
                field="inscricao.proponente.nome"
                header="Orientador"
                sortable
                filter
                filterPlaceholder="Filtrar por nome"
                filterField="inscricao.proponente.nome"
                body={(rowData) => rowData.inscricao?.proponente?.nome || "-"}
              />
              <Column
                field="inscricao.edital.titulo"
                header="Edital"
                sortable
                filter
                filterElement={(options) =>
                  editalRowFilterTemplate(options, editaisDisponiveis)
                }
                showFilterMenu={false}
                filterField="inscricao.edital.titulo"
                body={(rowData) => rowData.inscricao?.edital?.titulo || "-"}
              />
              <Column
                field="statusAvaliacao"
                header="Status Avaliação"
                sortable
                filter
                filterPlaceholder="Filtrar por status"
                filterField="statusAvaliacao"
                style={{ width: "14rem" }}
              />
              <Column
                field="quantidadeFichas"
                header="Qtd. Fichas"
                sortable
                style={{ textAlign: "center", width: "8rem" }}
              />
              <Column
                field="notaMedia"
                header="Nota Média"
                sortable
                filter
                filterField="notaMedia"
                filterElement={notaRowFilterTemplate}
                filterMatchMode="intervalo_numerico"
                dataType="numeric"
                body={(rowData) => rowData.notaMedia ?? "-"}
                style={{ textAlign: "center", width: "8rem" }}
              />
              <Column
                field="bloqueadoAvaliacao"
                header="Bloqueio"
                filter
                filterElement={(options) =>
                  editalRowFilterTemplate(options, BLOQUEIO_OPCOES)
                }
                showFilterMenu={false}
                filterField="bloqueadoAvaliacao"
                body={(rowData) =>
                  rowData.bloqueadoAvaliacao ? (
                    <Tag
                      severity="warning"
                      className={styles.tagClicavel}
                      onClick={() => abrirJustificativaBloqueio(rowData)}
                    >
                      Bloqueado
                    </Tag>
                  ) : (
                    "-"
                  )
                }
                style={{ width: "10rem" }}
              />
              <Column
                field="notaFinal"
                header="Nota Final"
                sortable
                filter
                filterField="notaFinal"
                filterElement={notaRowFilterTemplate}
                filterMatchMode="intervalo_numerico"
                dataType="numeric"
                body={(rowData) => rowData.notaFinal ?? "-"}
                style={{ textAlign: "center", width: "8rem" }}
              />
              {colunasSelecionadas.map((campoId) => {
                const campo = formularioCampos.find((c) => c.id === campoId);
                if (!campo) return null;
                const field = `campo_${campoId}`;
                return (
                  <Column
                    key={campoId}
                    field={field}
                    header={campo.label}
                    sortable
                    filter
                    filterPlaceholder={`Filtrar por ${campo.label.toLowerCase()}`}
                    filterField={field}
                    style={{ minWidth: "10rem" }}
                  />
                );
              })}
              </DataTable>
            </>
          )}
        </Card>
      </main>
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        size="small"
      >
        <div className={styles.configModal}>
          <h5 className="mb-2">Colunas extras (campos do formulário)</h5>
          <ul className={styles.camposList}>
            {formularioCampos.length === 0 ? (
              <li>Nenhum campo dinâmico configurado.</li>
            ) : (
              formularioCampos.map((campo) => (
                <li key={campo.id} className="flex align-items-center gap-2 mb-2">
                  <Checkbox
                    inputId={`campo-${campo.id}`}
                    checked={draftColunas.includes(campo.id)}
                    onChange={(e) => toggleCampoDraft(campo.id, e.checked)}
                  />
                  <label htmlFor={`campo-${campo.id}`}>{campo.label}</label>
                </li>
              ))
            )}
          </ul>
          <div className={`${styles.modalActions} flex justify-content-end gap-2 mt-3`}>
            <Button
              className="button btn-secondary"
              onClick={() => setShowConfigModal(false)}
            >
              Cancelar
            </Button>
            <Button
              className="button btn-primary"
              onClick={salvarConfigColunas}
              loading={salvandoConfig}
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={activeModal !== null} onClose={fecharModalAcao} size="small">
        {(() => {
          switch (activeModal) {
            case "menuAcoes":
              return (
                <div className={styles.menuAcoes}>
                  <h5 className="mb-2">Executar ação</h5>
                  <ul>
                    <li onClick={() => setActiveModal("atribuirNotaManual")}>
                      <p>Atribuir nota manualmente</p>
                    </li>
                    <li onClick={() => setActiveModal("alterarStatus")}>
                      <p>Alterar status</p>
                    </li>
                    <li onClick={() => setActiveModal("bloquearAvaliacao")}>
                      <p>Bloquear avaliação do projeto</p>
                    </li>
                    <li onClick={() => setActiveModal("desbloquearAvaliacao")}>
                      <p>Desbloquear avaliação do projeto</p>
                    </li>
                  </ul>
                </div>
              );
            case "atribuirNotaManual":
              return (
                <div className={styles.formNotaManual}>
                  <h5 className="mb-2">Atribuir nota manualmente</h5>
                  <p className="mb-2">
                    Essa nota substituirá a nota atual de{" "}
                    {selectedItems.length} projeto(s) selecionado(s) e será
                    propagada para os planos de trabalho vinculados.
                  </p>
                  <label htmlFor="notaManual">Nota</label>
                  <InputNumber
                    inputId="notaManual"
                    value={notaManual}
                    onValueChange={(e) => setNotaManual(e.value)}
                    mode="decimal"
                    min={0}
                    max={100}
                    placeholder="Nota"
                    className="w-100 mt-1 mb-2"
                  />
                  <label htmlFor="justificativaNotaManual">Justificativa</label>
                  <InputTextarea
                    inputId="justificativaNotaManual"
                    value={justificativaNotaManual}
                    onChange={(e) => setJustificativaNotaManual(e.target.value)}
                    rows={4}
                    className="w-100 mt-1"
                    placeholder="Explique o motivo da atribuição manual"
                  />
                  <div className={`${styles.modalActions} flex justify-content-end gap-2 mt-3`}>
                    <Button className="button btn-secondary" onClick={fecharModalAcao}>
                      Cancelar
                    </Button>
                    <Button
                      className="button btn-primary"
                      onClick={confirmarNotaManual}
                      loading={salvandoNotaManual}
                      disabled={
                        notaManual === null ||
                        notaManual === undefined ||
                        !justificativaNotaManual.trim()
                      }
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              );
            case "alterarStatus":
              return (
                <div className={styles.formNotaManual}>
                  <h5 className="mb-2">Alterar status</h5>
                  <p className="mb-2">
                    O novo status substituirá o status atual de{" "}
                    {selectedItems.length} projeto(s) selecionado(s) e será
                    propagado para os planos de trabalho vinculados.
                  </p>
                  <label htmlFor="novoStatus">Status</label>
                  <Dropdown
                    inputId="novoStatus"
                    value={novoStatus}
                    options={STATUS_AVALIACAO_OPCOES}
                    onChange={(e) => setNovoStatus(e.value)}
                    placeholder="Selecione o status"
                    className="w-100 mt-1"
                  />
                  <div className={`${styles.modalActions} flex justify-content-end gap-2 mt-3`}>
                    <Button className="button btn-secondary" onClick={fecharModalAcao}>
                      Cancelar
                    </Button>
                    <Button
                      className="button btn-primary"
                      onClick={confirmarAlterarStatus}
                      loading={salvandoStatus}
                      disabled={!novoStatus}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              );
            case "bloquearAvaliacao":
              return (
                <div className={styles.formNotaManual}>
                  <h5 className="mb-2">Bloquear avaliação do projeto</h5>
                  <p className="mb-2">
                    O avaliador de {selectedItems.length} projeto(s)
                    selecionado(s) vai ver a ficha de avaliação do projeto
                    desabilitada, com a justificativa abaixo, mas continua
                    avaliando os planos de trabalho normalmente. A nota do
                    projeto não será calculada automaticamente — você
                    atribuirá manualmente depois.
                  </p>
                  <label htmlFor="justificativaBloqueio">Justificativa</label>
                  <InputTextarea
                    inputId="justificativaBloqueio"
                    value={justificativaBloqueio}
                    onChange={(e) => setJustificativaBloqueio(e.target.value)}
                    rows={4}
                    className="w-100 mt-1"
                    placeholder="Explique o motivo do bloqueio (o avaliador vai ver esse texto)"
                  />
                  <div className={`${styles.modalActions} flex justify-content-end gap-2 mt-3`}>
                    <Button className="button btn-secondary" onClick={fecharModalAcao}>
                      Cancelar
                    </Button>
                    <Button
                      className="button btn-primary"
                      onClick={confirmarBloquear}
                      loading={salvandoBloqueio}
                      disabled={!justificativaBloqueio.trim()}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              );
            case "desbloquearAvaliacao":
              return (
                <div className={styles.formNotaManual}>
                  <h5 className="mb-2">Desbloquear avaliação do projeto</h5>
                  <p className="mb-2">
                    O avaliador volta a ver a ficha de avaliação do projeto
                    normalmente, pra {selectedItems.length} projeto(s)
                    selecionado(s).
                  </p>
                  <div className={`${styles.modalActions} flex justify-content-end gap-2 mt-3`}>
                    <Button className="button btn-secondary" onClick={fecharModalAcao}>
                      Cancelar
                    </Button>
                    <Button
                      className="button btn-primary"
                      onClick={confirmarDesbloquear}
                      loading={salvandoBloqueio}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              );
            default:
              return null;
          }
        })()}
      </Modal>
      <Dialog
        header="Justificativa do Bloqueio"
        visible={showJustificativaBloqueioModal}
        style={{ width: "50vw" }}
        onHide={() => setShowJustificativaBloqueioModal(false)}
      >
        <div style={{ whiteSpace: "pre-line", paddingBottom: "20px" }}>
          {justificativaBloqueioAtual}
        </div>
      </Dialog>
      <Toast ref={toast} />
    </>
  );
};

export default TabelaProjetos;

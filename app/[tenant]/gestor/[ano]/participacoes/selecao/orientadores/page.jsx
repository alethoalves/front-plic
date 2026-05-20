"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode } from "primereact/api";
import { Card } from "primereact/card";
import { Message } from "primereact/message";
import {
  getParticipacoesByTenant,
  getParticipacao,
  aprovarParticipacoes,
  reprovarParticipacoes,
} from "@/app/api/client/participacao";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import { getFormulario } from "@/app/api/client/formulario";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { ProgressBar } from "primereact/progressbar";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  formatStatusText,
  renderStatusTagWithJustificativa,
} from "@/lib/tagUtils";
import { statusClassificacaoFilterTemplate } from "@/lib/tableTemplates";
import { statusOptions } from "@/lib/statusOptions";
import generateLattesText from "@/lib/generateLattesText";
import Modal from "@/components/Modal";
import {
  RiUser2Line,
  RiFileTextLine,
  RiStarLine,
  RiListCheck2,
  RiExternalLinkLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiCloseLargeLine,
} from "@remixicon/react";
import styles from "./page.module.scss";

const BATCH_SIZE = 20;

// -------- GrupoAvaliacao (read-only) --------
const GrupoAvaliacao = ({ grupo, nivel = 0 }) => {
  const [expanded, setExpanded] = useState(nivel === 0);
  const temItens =
    grupo.respostaCampos?.length > 0 ||
    grupo.grupos?.some(
      (g) => g.respostaCampos?.length > 0 || g.grupos?.length > 0
    );
  const nivelClass = nivel === 1 ? styles.nivel1 : nivel >= 2 ? styles.nivel2 : "";

  return (
    <div className={`${styles.grupoBox} ${nivelClass}`}>
      <div
        className={styles.grupoHeader}
        onClick={() => temItens && setExpanded(!expanded)}
        style={{ cursor: temItens ? "pointer" : "default" }}
      >
        <div className={styles.grupoLabel}>
          {temItens && (
            <i
              className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"}`}
              style={{ fontSize: "0.72rem" }}
            />
          )}
          {grupo.label}
        </div>
        <span className={styles.notaBadge}>
          {grupo.nota ?? 0} / {grupo.notaMax ?? 0}
        </span>
      </div>

      {expanded && (
        <div className={styles.grupoContent}>
          {grupo.respostaCampos?.map((item, idx) => (
            <div key={idx} className={styles.itemBox}>
              <div className={styles.itemNumber}>
                Item {idx + 1}
                {grupo.notaPorItem != null && (
                  <span style={{ marginLeft: 8, color: "var(--primary-dark)", fontWeight: 700 }}>
                    +{grupo.notaPorItem}
                  </span>
                )}
              </div>
              {item
                .filter((c) => c.value !== undefined && c.value !== null && c.value !== "")
                .map((c, ci) => (
                  <div key={ci} className={styles.itemRow}>
                    <span className={styles.itemKey}>{c.label}:</span>
                    <span className={styles.itemValue}>
                      {typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value)}
                    </span>
                  </div>
                ))}
            </div>
          ))}
          {grupo.grupos?.map((sub, i) => (
            <GrupoAvaliacao key={i} grupo={sub} nivel={nivel + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// -------- Página principal --------
const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itens, setItens] = useState([]);
  const [filteredItens, setFilteredItens] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [motivoReprova, setMotivoReprova] = useState("");
  const [displayReprovarDialog, setDisplayReprovarDialog] = useState(false);
  const [loadingAprovar, setLoadingAprovar] = useState(false);
  const [loadingReprovar, setLoadingReprovar] = useState(false);
  const [progress, setProgress] = useState(0);
  const [justificativasAtuais, setJustificativasAtuais] = useState("");
  const [showJustificativas, setShowJustificativas] = useState(false);
  const [editaisOptions, setEditaisOptions] = useState([]);

  // Modal de detalhes
  const [modalVisible, setModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const dataTableRef = useRef(null);
  const toast = useRef(null);

  const getEditalTitulo = (item) => item.inscricao?.edital?.titulo || "N/A";

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "inscricao.edital.titulo": { value: null, matchMode: FilterMatchMode.IN },
    statusParticipacao: { value: null, matchMode: FilterMatchMode.IN },
    "user.nome": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "user.cpf": { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const participacoes = await getParticipacoesByTenant(
          params.tenant,
          "orientador",
          params.ano
        );
        const editaisUnicos = [
          ...new Set(participacoes.map((item) => getEditalTitulo(item))),
        ]
          .filter(Boolean)
          .map((e) => ({ label: e, value: e }));
        setEditaisOptions(editaisUnicos);
        const normalizado = participacoes.map((item) => ({
          ...item,
          editalTitulo: getEditalTitulo(item),
        }));
        setItens(normalizado);
        setFilteredItens(normalizado);
      } catch (err) {
        setError("Erro ao buscar participações de orientadores.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.ano]);

  const handleRowClick = async (event) => {
    const row = event.data;
    setModalVisible(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const [fullParticipacao, inscricao] = await Promise.all([
        getParticipacao(params.tenant, row.id, params.ano),
        getInscricaoUserById(params.tenant, row.inscricao?.id),
      ]);
      let formularioCampos = [];
      if (inscricao?.edital?.formOrientadorId) {
        const form = await getFormulario(params.tenant, inscricao.edital.formOrientadorId);
        formularioCampos = (form?.campos || []).sort(
          (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
        );
      }
      setDetailData({ participacao: fullParticipacao, formularioCampos });
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível carregar os detalhes do orientador.",
        life: 4000,
      });
      setModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    const _f = { ...filters };
    _f["global"].value = value;
    setFilters(_f);
    setGlobalFilterValue(value);
  };

  const processarEmLotes = async (ids, callback) => {
    const total = ids.length;
    for (let i = 0; i < total; i += BATCH_SIZE) {
      await callback(ids.slice(i, i + BATCH_SIZE));
      setProgress(Math.round(((i + BATCH_SIZE) / total) * 100));
    }
  };

  const handleAprovar = async () => {
    if (!selectedItems.length) {
      toast.current.show({ severity: "warn", summary: "Aviso", detail: "Selecione pelo menos um item para aprovar", life: 3000 });
      return;
    }
    setLoadingAprovar(true);
    setProgress(0);
    let aprovados = [];
    try {
      await processarEmLotes(selectedItems.map((i) => i.id), async (lote) => {
        const r = await aprovarParticipacoes(params.tenant, lote);
        const ignoradas = r.participacoesIgnoradas || [];
        aprovados.push(...lote.filter((id) => !ignoradas.includes(id)));
        if (ignoradas.length)
          toast.current.show({ severity: "warn", summary: "Atenção", detail: `${ignoradas.length} ignoradas`, life: 4000 });
      });
      toast.current.show({ severity: "success", summary: "Sucesso", detail: `${aprovados.length} aprovadas!`, life: 5000 });
      const updated = itens.map((i) =>
        aprovados.includes(i.id) ? { ...i, statusParticipacao: "APROVADA", justificativa: null } : i
      );
      setItens(updated);
      setFilteredItens(updated);
      setSelectedItems([]);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: err.response?.data?.message || "Erro ao aprovar", life: 5000 });
    } finally {
      setLoadingAprovar(false);
    }
  };

  const handleReprovar = () => {
    if (!selectedItems.length) {
      toast.current.show({ severity: "warn", summary: "Aviso", detail: "Selecione pelo menos um item para reprovar", life: 3000 });
      return;
    }
    setDisplayReprovarDialog(true);
  };

  const confirmarReprova = async () => {
    if (!motivoReprova.trim()) {
      toast.current.show({ severity: "error", summary: "Erro", detail: "Digite o motivo", life: 3000 });
      return;
    }
    setLoadingReprovar(true);
    setProgress(0);
    let reprovados = [];
    try {
      await processarEmLotes(selectedItems.map((i) => i.id), async (lote) => {
        const r = await reprovarParticipacoes(params.tenant, lote, motivoReprova);
        const ignoradas = r.participacoesIgnoradas || [];
        reprovados.push(...lote.filter((id) => !ignoradas.includes(id)));
        if (ignoradas.length)
          toast.current.show({ severity: "warn", summary: "Atenção", detail: `${ignoradas.length} ignoradas`, life: 4000 });
      });
      toast.current.show({ severity: "success", summary: "Sucesso", detail: `${reprovados.length} reprovadas!`, life: 5000 });
      const updated = itens.map((i) =>
        reprovados.includes(i.id) ? { ...i, statusParticipacao: "RECUSADA", justificativa: motivoReprova } : i
      );
      setItens(updated);
      setFilteredItens(updated);
      setSelectedItems([]);
      setMotivoReprova("");
      setDisplayReprovarDialog(false);
    } catch (err) {
      toast.current.show({ severity: "error", summary: "Erro", detail: err.response?.data?.message || "Erro ao reprovar", life: 5000 });
    } finally {
      setLoadingReprovar(false);
    }
  };

  useEffect(() => { setSelectedItems([]); }, [filters]);

  const renderHeader = () => (
    <div>
      <label className="block"><p>Busque por palavra-chave:</p></label>
      <InputText
        value={globalFilterValue}
        onChange={onGlobalFilterChange}
        placeholder="Pesquisar..."
        style={{ width: "100%" }}
      />
      {selectedItems.length > 0 && (
        <div className="flex justify-start gap-2 mt-2">
          <Button
            label={`Aprovar (${selectedItems.length})`}
            icon="pi pi-check"
            className="p-button-success mr-2"
            onClick={handleAprovar}
            loading={loadingAprovar}
          />
          <Button
            label={`Reprovar (${selectedItems.length})`}
            icon="pi pi-times"
            className="p-button-danger"
            onClick={handleReprovar}
          />
          {loadingAprovar && (
            <div className="mt-2">
              <ProgressBar value={progress} style={{ height: "6px" }} showValue={false} />
              <small className="block text-center mt-1">{progress}% completo</small>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ---- Conteúdo do Modal ----
  const renderModalContent = () => {
    if (detailLoading) {
      return (
        <div className={styles.loadingCenter}>
          <ProgressSpinner style={{ width: 48, height: 48 }} />
        </div>
      );
    }

    if (!detailData) return null;

    const { participacao, formularioCampos } = detailData;
    const { user, fichaAvaliacao, respostas, statusParticipacao, justificativa, inscricao } = participacao;
    const lattesMaisRecente = user?.cvLattes?.length
      ? user.cvLattes[user.cvLattes.length - 1]
      : null;
    const lattesInfo = lattesMaisRecente ? generateLattesText(lattesMaisRecente.url) : null;

    return (
      <>
        {/* Header com gradiente */}
        <div className={styles.orientadorHeader}>
          <div className={styles.closeBtn} onClick={() => setModalVisible(false)}>
            <RiCloseLargeLine />
          </div>
          <div className={styles.headerTop}>
            <div className={styles.avatar}>
              {user?.nome?.charAt(0)?.toUpperCase() || "O"}
            </div>
            <div className={styles.headerInfo}>
              <h4>{user?.nome || "—"}</h4>
              <p>Orientador · {inscricao?.edital?.titulo || ""}</p>
            </div>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusBadge}>{formatStatusText(statusParticipacao)}</span>
          </div>
          {justificativa && (
            <p className={styles.justificativa}>Justificativa: {justificativa}</p>
          )}
        </div>

        {/* Corpo */}
        <div className={styles.modalBody}>

          {/* Dados Pessoais */}
          <div className={styles.box}>
            <div className={styles.header}>
              <div className={styles.icon}><RiUser2Line size={18} /></div>
              <h6>Dados Pessoais</h6>
            </div>
            <div className={styles.boxContent}>
              <div className={styles.fieldGrid}>
                {[
                  { label: "CPF", value: user?.cpf },
                  { label: "E-mail", value: user?.email },
                  { label: "Telefone", value: user?.telefone },
                  { label: "Edital", value: inscricao?.edital?.titulo },
                ]
                  .filter((f) => f.value)
                  .map((field, i) => (
                    <div key={i} className={styles.field}>
                      <p className={styles.fieldLabel}>{field.label}</p>
                      <p className={styles.fieldValue}>{field.value}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Currículo Lattes */}
          <div className={styles.box}>
            <div className={styles.header}>
              <div className={styles.icon}><RiFileTextLine size={18} /></div>
              <h6>Currículo Lattes</h6>
            </div>
            <div className={styles.boxContent}>
              {lattesMaisRecente ? (
                <>
                  <div className={styles.lattesItem}>
                    <RiCheckboxCircleLine size={18} className={styles.lattesOk} />
                    <span>Currículo enviado</span>
                  </div>
                  {lattesInfo?.formattedDate && (
                    <p className={styles.lattesDate}>
                      Enviado em {lattesInfo.formattedDate} às {lattesInfo.formattedTime}
                    </p>
                  )}
                  <a
                    href={lattesMaisRecente.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.externalLink}
                  >
                    <RiExternalLinkLine size={15} />
                    Visualizar CV Lattes
                  </a>
                </>
              ) : (
                <div className={styles.lattesItem}>
                  <RiCloseCircleLine size={18} className={styles.lattesMissing} />
                  <span>Nenhum currículo enviado</span>
                </div>
              )}
            </div>
          </div>

          {/* Ficha de Avaliação Lattes */}
          {fichaAvaliacao && (
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}><RiStarLine size={18} /></div>
                <h6>Ficha de Avaliação Lattes</h6>
                <span className={styles.totalBadge}>
                  {fichaAvaliacao.nota ?? 0} / {fichaAvaliacao.notaMax ?? 0}
                </span>
              </div>
              <div className={styles.boxContent}>
                {fichaAvaliacao.grupos?.length > 0 ? (
                  fichaAvaliacao.grupos.map((grupo, i) => (
                    <GrupoAvaliacao key={i} grupo={grupo} nivel={0} />
                  ))
                ) : (
                  <p className={styles.emptyState}>Nenhum item de avaliação.</p>
                )}
              </div>
            </div>
          )}

          {/* Respostas ao Formulário */}
          {formularioCampos.length > 0 && (
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}><RiListCheck2 size={18} /></div>
                <h6>Respostas ao Formulário</h6>
              </div>
              <div className={styles.boxContent}>
                {(respostas?.length ?? 0) === 0 ? (
                  <p className={styles.emptyState}>Nenhuma resposta enviada.</p>
                ) : (
                  formularioCampos.map((campo) => {
                    const resposta = respostas?.find((r) => r.campoId === campo.id);
                    if (!resposta) return null;
                    const valor = resposta.value;
                    const valorExibido = (() => {
                      if (typeof valor === "boolean") return valor ? "Sim" : "Não";
                      if (!valor) return "—";
                      if (typeof valor === "string" && valor.startsWith("http")) {
                        return (
                          <a
                            href={valor}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.externalLink}
                          >
                            <RiExternalLinkLine size={14} />
                            Ver arquivo
                          </a>
                        );
                      }
                      try {
                        const parsed = JSON.parse(valor);
                        if (Array.isArray(parsed)) return parsed.join(", ");
                      } catch {}
                      return String(valor);
                    })();
                    return (
                      <div key={campo.id} className={styles.respostaItem}>
                        <p className={styles.respostaLabel}>{campo.label}</p>
                        <div className={styles.respostaValue}>{valorExibido}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <main>
      <Toast ref={toast} />

      {/* Modal de detalhes do orientador */}
      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        size="large"
        noPadding={true}
        showIconClose={false}
      >
        {renderModalContent()}
      </Modal>

      <Card className="custom-card">
        <h5 className="pt-2 pr-2 pl-2">Seleção de Orientadores</h5>
        {loading ? (
          <div className="pr-2 pl-2 pb-2 pt-2">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          </div>
        ) : error ? (
          <Message severity="error" text={error} />
        ) : (
          <DataTable
            ref={dataTableRef}
            value={filteredItens}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            scrollable
            selectionMode="checkbox"
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            onRowClick={handleRowClick}
            dataKey="id"
            sortMode="multiple"
            header={renderHeader()}
            filters={filters}
            onFilter={(e) => {
              setFilters(e.filters);
              setFilteredItens(e.filteredValue || itens);
              setSelectedItems([]);
            }}
            filterDisplay="row"
            globalFilterFields={["inscricao.edital.titulo", "user.nome", "user.cpf", "statusParticipacao"]}
            emptyMessage="Nenhuma participação encontrada."
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
            rowClassName={() => "cursor-pointer"}
          >
            <Column selectionMode="multiple" frozen headerStyle={{ width: "3rem" }} />
            <Column field="id" header="ID" sortable style={{ width: "5rem" }} />
            <Column
              field="editalTitulo"
              header="Edital"
              sortable
              filter
              filterField="inscricao.edital.titulo"
              filterElement={(options) => statusClassificacaoFilterTemplate(options, editaisOptions)}
              body={(rowData) => rowData.inscricao?.edital?.titulo || "N/A"}
              showFilterMenu={false}
            />
            <Column
              field="statusParticipacao"
              header="Status"
              sortable
              filter
              showFilterMenu={false}
              filterElement={(options) => statusClassificacaoFilterTemplate(options, statusOptions.participacao)}
              body={(rowData) => (
                <div onClick={(e) => e.stopPropagation()}>
                  {renderStatusTagWithJustificativa(rowData.statusParticipacao, rowData.justificativa, {
                    onShowJustificativa: (j) => { setJustificativasAtuais(j); setShowJustificativas(true); },
                  })}
                </div>
              )}
            />
            <Column
              field="user.nome"
              header="Nome"
              sortable
              filter
              filterPlaceholder="Buscar por nome"
              filterField="user.nome"
              showFilterMenu={false}
            />
            <Column
              field="user.cpf"
              header="CPF"
              sortable
              filter
              filterPlaceholder="Buscar por CPF"
              filterField="user.cpf"
              showFilterMenu={false}
              style={{ minWidth: "180px" }}
            />
            <Column
              header=""
              body={() => (
                <Button
                  icon="pi pi-chevron-right"
                  className="p-button-text p-button-plain p-button-sm"
                  style={{ color: "#94a3b8" }}
                />
              )}
              style={{ width: "3rem" }}
            />
          </DataTable>
        )}
      </Card>

      {/* Dialog Reprovar */}
      <Dialog
        header="Confirmar Reprovação"
        visible={displayReprovarDialog}
        onHide={() => { setDisplayReprovarDialog(false); setMotivoReprova(""); setProgress(0); }}
        style={{ width: "450px" }}
        footer={
          <div>
            <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={() => { setDisplayReprovarDialog(false); setMotivoReprova(""); }} />
            <Button label="Confirmar" icon="pi pi-check" className="p-button-danger" onClick={confirmarReprova} loading={loadingReprovar} autoFocus />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="motivo">Motivo da reprovação</label>
            <InputTextarea
              id="motivo"
              value={motivoReprova}
              onChange={(e) => setMotivoReprova(e.target.value)}
              rows={3}
              autoResize
              placeholder="Digite o motivo..."
            />
          </div>
        </div>
        {loadingReprovar && (
          <div className="mt-3">
            <ProgressBar value={progress} style={{ height: "6px" }} showValue={false} />
            <small className="block text-center mt-1">{progress}% completo</small>
          </div>
        )}
      </Dialog>

      {/* Dialog Justificativa */}
      <Dialog
        header="Justificativa"
        visible={showJustificativas}
        style={{ width: "50vw" }}
        onHide={() => setShowJustificativas(false)}
      >
        <div style={{ whiteSpace: "pre-line", marginBottom: 12 }}>{justificativasAtuais}</div>
      </Dialog>
    </main>
  );
};

export default Page;

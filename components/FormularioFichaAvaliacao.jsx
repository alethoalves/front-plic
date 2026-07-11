/*
  Componente: FormularioFichaAvaliacao.jsx
  CRUD de Fichas de Avaliação (rubrica em árvore: grupos/subgrupos/critérios,
  cada critério com sua própria escala — binária, likert, numérica, slider ou manual).
*/
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Skeleton as PmSkeleton } from "primereact/skeleton";
import {
  RiAddCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from "@remixicon/react";
import Header from "@/components/Header";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import styles from "./FormularioFichaAvaliacao.module.scss";
import {
  getFormulariosAvaliacao,
  createFormularioAvaliacao,
  updateFormularioAvaliacao,
  deleteFormularioAvaliacao,
  getFormularioAvaliacao,
} from "@/app/api/client/formularioAvaliacao";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import NoData from "@/components/NoData";
import { getEditais, updateEdital } from "@/app/api/client/edital";
import {
  TIPOS_ESCALA,
  novoCriterio,
  novoGrupo,
  pontuacaoMaximaSchema,
  listarCriterios,
} from "@/lib/fichaAvaliacaoScoring";

const OBJETOS = [
  { label: "Projeto", value: "PROJETO" },
  { label: "Plano de Trabalho", value: "PLANO_DE_TRABALHO" },
  { label: "Atividade", value: "ATIVIDADE" },
];
/* Mapeia o tipo de avaliação → campo no Edital */
const fieldMap = {
  PROJETO: "formAvaliacaoProjetoId",
  PLANO_DE_TRABALHO: "formAvaliacaoPlanoDeTrabalhoId",
  // ATIVIDADE não tem campo específico no edital (por enquanto)
};

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const escalaPadrao = (tipo) => {
  if (tipo === "binaria") {
    return { tipo, opcoes: [{ valor: 0, label: "Não" }, { valor: 1, label: "Sim" }] };
  }
  if (tipo === "likert") {
    return {
      tipo,
      opcoes: [
        { valor: 0, label: "Não atende" },
        { valor: 0.5, label: "Atende parcialmente" },
        { valor: 1, label: "Atende" },
      ],
    };
  }
  return { tipo, min: 0, max: 10, step: 1 };
};

/** Valida a árvore inteira antes de enviar; retorna a 1ª mensagem de erro ou null. */
const validarArvore = (nos, caminho = "raiz") => {
  if (!Array.isArray(nos) || nos.length === 0) {
    return `Adicione ao menos um grupo ou critério em "${caminho}".`;
  }
  for (const no of nos) {
    if (!no.label?.trim()) return `Todo grupo/critério precisa de um título.`;
    if (no.tipo === "grupo") {
      const erro = validarArvore(no.itens, no.label);
      if (erro) return erro;
    } else if (!no.peso || no.peso <= 0) {
      return `O critério "${no.label}" precisa de um peso maior que zero.`;
    }
  }
  return null;
};

/* ─── EscalaEditor ────────────────────────────────────────────────────────── */
const EscalaEditor = ({ escala, onChange }) => {
  const isOpcoes = escala.tipo === "binaria" || escala.tipo === "likert";

  const updateOpcao = (i, campo, valor) => {
    const opcoes = clone(escala.opcoes);
    opcoes[i] = { ...opcoes[i], [campo]: campo === "valor" ? Number(valor) : valor };
    onChange({ ...escala, opcoes });
  };
  const addOpcao = () =>
    onChange({ ...escala, opcoes: [...escala.opcoes, { valor: 0, label: "" }] });
  const removeOpcao = (i) =>
    onChange({ ...escala, opcoes: escala.opcoes.filter((_, idx) => idx !== i) });

  return (
    <div className={styles.escalaBox}>
      <div className={styles.formGroup}>
        <label className={styles.inputLabel}>Como o avaliador vê a nota</label>
        <select
          className={styles.selectField}
          value={escala.tipo}
          onChange={(e) => onChange(escalaPadrao(e.target.value))}
        >
          {TIPOS_ESCALA.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {isOpcoes ? (
        <>
          {escala.opcoes.map((op, i) => (
            <div key={i} className={styles.opcaoRow}>
              <input
                type="number"
                step="any"
                value={op.valor}
                onChange={(e) => updateOpcao(i, "valor", e.target.value)}
                title="Valor numérico"
              />
              <input
                type="text"
                placeholder="Rótulo (ex: Sim, Atende parcialmente...)"
                value={op.label}
                onChange={(e) => updateOpcao(i, "label", e.target.value)}
              />
              <div className={styles.deleteSmall} onClick={() => removeOpcao(i)}>
                <RiDeleteBinLine />
              </div>
            </div>
          ))}
          <div className={styles.addSmall} onClick={addOpcao}>
            <RiAddCircleLine />
            <span>Adicionar opção</span>
          </div>
        </>
      ) : (
        <div className={styles.notasGroup}>
          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Mínimo</label>
            <input
              type="number"
              step="any"
              className={styles.inputField}
              value={escala.min}
              onChange={(e) => onChange({ ...escala, min: Number(e.target.value) })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Máximo</label>
            <input
              type="number"
              step="any"
              className={styles.inputField}
              value={escala.max}
              onChange={(e) => onChange({ ...escala, max: Number(e.target.value) })}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.inputLabel}>Incremento</label>
            <input
              type="number"
              step="any"
              min="0"
              className={styles.inputField}
              value={escala.step ?? 1}
              onChange={(e) => onChange({ ...escala, step: Number(e.target.value) })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── NoEditor (grupo ou critério, recursivo) ───────────────────────────── */
const NoEditor = ({ no, onChange, onDelete, nivel }) => {
  const [expandido, setExpandido] = useState(true);
  const set = (campo, valor) => onChange({ ...no, [campo]: valor });

  if (no.tipo === "criterio") {
    return (
      <div className={styles.criterioItem} style={{ marginLeft: nivel > 0 ? 0 : undefined }}>
        <div className={styles.criterioHeader}>
          <input
            type="text"
            className={styles.inputField}
            placeholder="Título do critério"
            value={no.label}
            onChange={(e) => set("label", e.target.value)}
          />
          <input
            type="number"
            step="any"
            min="0.01"
            className={`${styles.inputField} ${styles.pesoInput}`}
            title="Peso (pontos quando totalmente atendido)"
            value={no.peso}
            onChange={(e) => set("peso", Number(e.target.value))}
          />
          <div className={styles.deleteSmall} onClick={onDelete}>
            <RiDeleteBinLine />
          </div>
        </div>
        <textarea
          placeholder="Descrição / instrução ao avaliador (opcional)"
          value={no.descricao || ""}
          onChange={(e) => set("descricao", e.target.value)}
          rows={2}
        />
        <EscalaEditor escala={no.escala} onChange={(escala) => set("escala", escala)} />
      </div>
    );
  }

  // grupo
  const itens = no.itens || [];
  const pontuacaoMaxima = pontuacaoMaximaSchema(itens);

  const addFilho = (tipo) => {
    const novo = tipo === "grupo" ? novoGrupo() : novoCriterio();
    set("itens", [...itens, novo]);
  };
  const updateFilho = (i, filho) => {
    const next = clone(itens);
    next[i] = filho;
    set("itens", next);
  };
  const removeFilho = (i) => set("itens", itens.filter((_, idx) => idx !== i));

  return (
    <div className={styles.grupoItem}>
      <div className={styles.grupoHeader}>
        <div className={styles.expandBtn} onClick={() => setExpandido((v) => !v)}>
          {expandido ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
        </div>
        <input
          type="text"
          className={`${styles.inputField} ${styles.grupoLabelInput}`}
          placeholder="Título do grupo"
          value={no.label}
          onChange={(e) => set("label", e.target.value)}
        />
        <span className={styles.badgePoints}>{pontuacaoMaxima} pts (máx.)</span>
        <div className={styles.deleteSmall} onClick={onDelete}>
          <RiDeleteBinLine />
        </div>
      </div>

      {expandido && (
        <div className={styles.grupoBody}>
          {itens.map((filho, i) => (
            <NoEditor
              key={filho.id}
              no={filho}
              nivel={nivel + 1}
              onChange={(v) => updateFilho(i, v)}
              onDelete={() => removeFilho(i)}
            />
          ))}
          <div className={styles.addRow}>
            <div className={styles.addSmall} onClick={() => addFilho("grupo")}>
              <RiAddCircleLine />
              <span>Adicionar subgrupo</span>
            </div>
            <div className={styles.addSmall} onClick={() => addFilho("criterio")}>
              <RiAddCircleLine />
              <span>Adicionar critério</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── SchemaCriteriosEditor ──────────────────────────────────────────────── */
const SchemaCriteriosEditor = ({ value, onChange }) => {
  const addRaiz = (tipo) => {
    const novo = tipo === "grupo" ? novoGrupo() : novoCriterio();
    onChange([...value, novo]);
  };
  const updateRaiz = (i, no) => {
    const next = clone(value);
    next[i] = no;
    onChange(next);
  };
  const removeRaiz = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className={styles.arvore}>
      {value.map((no, i) => (
        <NoEditor
          key={no.id}
          no={no}
          nivel={0}
          onChange={(v) => updateRaiz(i, v)}
          onDelete={() => removeRaiz(i)}
        />
      ))}
      <div className={styles.addRow}>
        <div className={styles.addSmall} onClick={() => addRaiz("grupo")}>
          <RiAddCircleLine />
          <span>Adicionar grupo</span>
        </div>
        <div className={styles.addSmall} onClick={() => addRaiz("criterio")}>
          <RiAddCircleLine />
          <span>Adicionar critério (sem grupo)</span>
        </div>
      </div>
    </div>
  );
};

/* ─── FormularioFichaAvaliacao ───────────────────────────────────────────── */
export default function FormularioFichaAvaliacao({ params }) {
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [formularios, setFormularios] = useState([]);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formulario, setFormulario] = useState({
    titulo: "",
    objeto: "PROJETO",
    schemaCriterios: [],
  });
  const [saving, setSaving] = useState(false);
  const [editais, setEditais] = useState([]);
  const [anoAtual] = useState(params.ano);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [listaFormularios, listaEditais] = await Promise.all([
        getFormulariosAvaliacao(params.tenant),
        getEditais(params.tenant, anoAtual),
      ]);
      setFormularios(listaFormularios);
      setEditais(listaEditais || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar dados.");
    } finally {
      setLoading(false);
    }
  }, [params.tenant, anoAtual]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLinkChange = async (tenantSlug, editalId, body) => {
    try {
      await updateEdital(tenantSlug, editalId, body);
      const freshEditais = await getEditais(tenantSlug, anoAtual);
      setEditais(freshEditais || []);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao atualizar vínculos",
      });
      console.error(err);
    }
  };

  const openNew = () => {
    setFormulario({ titulo: "", objeto: "PROJETO", schemaCriterios: [] });
    setEditMode(false);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = async (rowData) => {
    try {
      setSaving(true);
      let ficha = rowData;
      if (!rowData.schemaCriterios) {
        ficha = await getFormularioAvaliacao(params.tenant, rowData.id);
      }
      setEditMode(true);
      setEditingId(ficha.id);
      setFormulario({
        titulo: ficha.titulo,
        objeto: ficha.objeto,
        schemaCriterios: ficha.schemaCriterios || [],
      });
      setModalOpen(true);
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao carregar critérios",
      });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id) => {
    confirmDialog({
      message: "Deseja realmente excluir esta ficha?",
      header: "Confirmação de Exclusão",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim, excluir",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      rejectClassName: "p-button-secondary",
      acceptIcon: "pi pi-check",
      rejectIcon: "pi pi-times",
      accept: () => handleDelete(id),
    });
  };

  const handleDelete = async (id) => {
    try {
      setSaving(true);
      setEditingId(id);
      await deleteFormularioAvaliacao(params.tenant, id);
      toast.current?.show({ severity: "success", summary: "Excluído", detail: "Ficha removida" });
      await loadData();
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "Erro", detail: "Não foi possível excluir" });
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!formulario.titulo.trim()) {
        toast.current?.show({ severity: "error", summary: "Erro", detail: "O título é obrigatório" });
        setSaving(false);
        return;
      }

      const erroArvore = validarArvore(formulario.schemaCriterios);
      if (erroArvore) {
        toast.current?.show({ severity: "error", summary: "Erro", detail: erroArvore });
        setSaving(false);
        return;
      }

      if (editMode) {
        await updateFormularioAvaliacao(params.tenant, editingId, formulario);
        toast.current?.show({ severity: "success", summary: "Salvo", detail: "Ficha atualizada" });
      } else {
        await createFormularioAvaliacao(params.tenant, formulario);
        toast.current?.show({ severity: "success", summary: "Criado", detail: "Ficha criada" });
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: err.response?.data?.message || "Falha ao salvar",
      });
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const renderModalContent = () => (
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="large">
      <div className={`${styles.icon} mb-2`}>
        {editMode ? <RiEditLine /> : <RiAddCircleLine />}
      </div>
      <h4>{editMode ? "Editar Ficha" : "Nova Ficha"}</h4>
      <p>
        {editMode
          ? "Edite os grupos e critérios da ficha de avaliação."
          : "Monte a rubrica: agrupe critérios em grupos/subgrupos e defina como o avaliador vai dar a nota em cada um."}
      </p>

      <div className={styles.formContainer}>
        <div className={styles.formGroup}>
          <label className={styles.inputLabel}>Título</label>
          <input
            type="text"
            className={styles.inputField}
            value={formulario.titulo}
            onChange={(e) => setFormulario({ ...formulario, titulo: e.target.value })}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.inputLabel}>Objeto Avaliado</label>
          <select
            className={styles.selectField}
            value={formulario.objeto}
            onChange={(e) => setFormulario({ ...formulario, objeto: e.target.value })}
          >
            {OBJETOS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <h5 className={styles.sectionTitle}>
          Grupos e critérios
          <span className={styles.badgePoints} style={{ marginLeft: 8 }}>
            {pontuacaoMaximaSchema(formulario.schemaCriterios)} pts no total
          </span>
        </h5>

        <SchemaCriteriosEditor
          value={formulario.schemaCriterios}
          onChange={(schemaCriterios) => setFormulario({ ...formulario, schemaCriterios })}
        />

        <div className={styles.modalFooter}>
          <Button className="btn-secondary" onClick={() => setModalOpen(false)} type="button" disabled={saving}>
            Cancelar
          </Button>
          <Button className="btn-primary" onClick={handleSave} type="button" loading={saving}>
            <p>Salvar</p>
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

      <Header
        subtitulo="Formulário de Avaliação"
        descricao="Crie, edite e vincule formulário de avaliação aos seus editais."
        className="mb-3"
      />

      <div className={styles.content}>
        <div className={styles.btnNewItem} onClick={openNew}>
          <div className={styles.icon}>
            <RiAddCircleLine />
          </div>
          <p>Novo</p>
        </div>

        {loading ? (
          <div className="mt-2">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            {formularios.map((form) => {
              const campo = fieldMap[form.objeto];
              const isGlobal = !campo;
              const totalCriterios = listarCriterios(form.schemaCriterios || []).length;
              const pontuacaoMaxima = pontuacaoMaximaSchema(form.schemaCriterios || []);

              return (
                <div className={`${styles.card} mt-2`} key={form.id}>
                  <Card
                    title={form.titulo}
                    subtitle={OBJETOS.find((o) => o.value === form.objeto)?.label || form.objeto}
                    onEdit={() => openEdit(form)}
                    onDelete={() => confirmDelete(form.id)}
                    additionalInfo={`${totalCriterios} critérios · ${pontuacaoMaxima} pts`}
                    editais={editais}
                    tenantSlug={params.tenant}
                    onLinkChange={handleLinkChange}
                    formulario={form}
                    campoEdital={campo}
                    isGlobal={isGlobal}
                    onView={() => openEdit(form)}
                  />
                </div>
              );
            })}
            {formularios.length === 0 && (
              <div className={styles.card}>
                <NoData />
              </div>
            )}
          </>
        )}
      </div>

      {renderModalContent()}
    </>
  );
}

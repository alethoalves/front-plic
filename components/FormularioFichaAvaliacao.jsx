/*
  Componente: FormularioFichaAvaliacao.jsx
  CRUD de Fichas de Avaliação
*/
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Skeleton as PmSkeleton } from "primereact/skeleton";
import { RiAddCircleLine, RiDeleteBinLine, RiEditLine } from "@remixicon/react";
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
import { MultiSelect } from "primereact/multiselect";
import { getEditais, updateEdital } from "@/app/api/client/edital";

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
const vazioCriterio = () => ({
  ordem: 1,
  label: "",
  descricao: "",
  notaMinima: 0,
  notaMaxima: 10,
  peso: 1,
});

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
    criterios: [vazioCriterio()],
  });
  const [saving, setSaving] = useState(false); // Adicione isso com os outros estados
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
  // Função para lidar com a vinculação de editais
  // Função para lidar com a vinculação de editais (será passada para o Card)
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
    setFormulario({
      titulo: "",
      objeto: "PROJETO",
      criterios: [vazioCriterio()],
    });
    setEditMode(false);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = async (rowData) => {
    try {
      setSaving(true); // Ativa o loading
      let ficha = rowData;
      if (!rowData.CriterioFormularioAvaliacao) {
        ficha = await getFormularioAvaliacao(params.tenant, rowData.id);
      }
      setEditMode(true);
      setEditingId(ficha.id);
      setFormulario({
        titulo: ficha.titulo,
        objeto: ficha.objeto,
        criterios: ficha.CriterioFormularioAvaliacao.map((c) => ({
          ordem: c.ordem,
          label: c.label,
          descricao: c.descricao || "",
          notaMinima: c.notaMinima,
          notaMaxima: c.notaMaxima,
          peso: c.peso,
        })),
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
      setSaving(false); // Desativa o loading
    }
  };

  const confirmDelete = (id) => {
    confirmDialog({
      message: "Deseja realmente excluir esta ficha?",
      header: "Confirmação de Exclusão",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Sim, excluir",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger", // Estilo vermelho para o botão de aceitar
      rejectClassName: "p-button-secondary", // Estilo secundário para o botão de rejeitar
      acceptIcon: "pi pi-check",
      rejectIcon: "pi pi-times",
      accept: () => handleDelete(id),
    });
  };

  const handleDelete = async (id) => {
    try {
      setSaving(true);
      setEditingId(id); // Marca qual item está sendo deletado
      await deleteFormularioAvaliacao(params.tenant, id);
      toast.current?.show({
        severity: "success",
        summary: "Excluído",
        detail: "Ficha removida",
      });
      await loadData();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível excluir",
      });
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true); // Ativa o estado de loading

      // Validação básica
      if (!formulario.titulo.trim()) {
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: "O título é obrigatório",
        });
        setSaving(false);
        return;
      }

      if (formulario.criterios.some((c) => !c.label.trim())) {
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: "Todos os critérios devem ter um label",
        });
        setSaving(false);
        return;
      }

      if (editMode) {
        await updateFormularioAvaliacao(params.tenant, editingId, formulario);
        toast.current?.show({
          severity: "success",
          summary: "Salvo",
          detail: "Ficha atualizada",
        });
      } else {
        await createFormularioAvaliacao(params.tenant, formulario);
        toast.current?.show({
          severity: "success",
          summary: "Criado",
          detail: "Ficha criada",
        });
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Falha ao salvar",
      });
      console.error(err);
    } finally {
      setSaving(false); // Desativa o loading independente do resultado
    }
  };

  const addCriterio = () => {
    setFormulario((prev) => ({
      ...prev,
      criterios: [
        ...prev.criterios,
        { ...vazioCriterio(), ordem: prev.criterios.length + 1 },
      ],
    }));
  };

  const removeCriterio = (index) => {
    setFormulario((prev) => ({
      ...prev,
      criterios: prev.criterios.filter((_, i) => i !== index),
    }));
  };

  const updateCriterio = (index, field, value) => {
    setFormulario((prev) => ({
      ...prev,
      criterios: prev.criterios.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const actionBodyTemplate = (row) => (
    <div className={styles.actions}>
      <Button
        onClick={() => openEdit(row)}
        icon={RiEditLine}
        className="btn-secondary"
        type="button"
        //loading={saving && editingId === row.id} // Adiciona loading quando estiver salvando esta linha
      />
      <Button
        onClick={() => confirmDelete(row.id)}
        icon={RiDeleteBinLine}
        className="btn-error"
        type="button"
        //loading={saving && editingId === row.id} // Adiciona loading quando estiver deletando esta linha
      />
    </div>
  );

  const renderModalContent = () => (
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
      <div className={`${styles.icon} mb-2`}>
        {editMode ? <RiEditLine /> : <RiAddCircleLine />}
      </div>
      <h4>{editMode ? "Editar Ficha" : "Nova Ficha"}</h4>
      <p>
        {editMode
          ? "Edite os dados da ficha de avaliação."
          : "Preencha os dados abaixo para criar uma nova ficha de avaliação."}
      </p>

      <div className={styles.formContainer}>
        <div className={styles.formGroup}>
          <label className={styles.inputLabel}>Título</label>
          <input
            type="text"
            className={styles.inputField}
            value={formulario.titulo}
            onChange={(e) =>
              setFormulario({ ...formulario, titulo: e.target.value })
            }
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.inputLabel}>Objeto Avaliado</label>
          <select
            className={styles.selectField}
            value={formulario.objeto}
            onChange={(e) =>
              setFormulario({ ...formulario, objeto: e.target.value })
            }
          >
            {OBJETOS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <h5 className={styles.sectionTitle}>Critérios</h5>
        {formulario.criterios.map((crit, idx) => (
          <div key={idx} className={styles.criterioItem}>
            <div className={styles.criterioHeader}>
              <div className={styles.ordemBadge}>
                <p>{idx + 1}</p>
              </div>
              <button
                className={styles.removeButton}
                onClick={() => removeCriterio(idx)}
                type="button"
              >
                <RiDeleteBinLine />
              </button>
            </div>

            <div className={styles.criterioBody}>
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>Label</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={crit.label}
                  onChange={(e) => updateCriterio(idx, "label", e.target.value)}
                  required
                />
              </div>

              <div className={styles.notasGroup}>
                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Nota Mínima</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={crit.notaMinima}
                    min="0"
                    onChange={(e) =>
                      updateCriterio(
                        idx,
                        "notaMinima",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Nota Máxima</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={crit.notaMaxima}
                    min="1"
                    onChange={(e) =>
                      updateCriterio(
                        idx,
                        "notaMaxima",
                        parseFloat(e.target.value) || 10
                      )
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Peso</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={crit.peso}
                    min="0.1"
                    step="0.1"
                    onChange={(e) =>
                      updateCriterio(
                        idx,
                        "peso",
                        parseFloat(e.target.value) || 1
                      )
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          className={styles.addButton}
          onClick={addCriterio}
          type="button"
        >
          <RiAddCircleLine className={styles.addIcon} />
          Adicionar critério
        </button>

        <div className={styles.modalFooter}>
          <Button
            className="btn-secondary"
            onClick={() => setModalOpen(false)}
            type="button"
            disabled={saving} // Desabilita o botão durante o salvamento
          >
            Cancelar
          </Button>
          <Button
            className="btn-primary"
            onClick={handleSave}
            type="button"
            loading={saving} // Adiciona o estado de loading
          >
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
              const isGlobal = !campo; // Se não tiver campo mapeado, é global

              return (
                <div className={`${styles.card} mt-2`} key={form.id}>
                  <Card
                    title={form.titulo}
                    subtitle={
                      OBJETOS.find((o) => o.value === form.objeto)?.label ||
                      form.objeto
                    }
                    onEdit={() => openEdit(form)}
                    onDelete={() => confirmDelete(form.id)}
                    additionalInfo={`${
                      form._count?.CriterioFormularioAvaliacao ?? 0
                    } critérios`}
                    editais={editais}
                    tenantSlug={params.tenant}
                    onLinkChange={handleLinkChange}
                    formulario={form}
                    campoEdital={campo} // Passa o campo específico para o Card
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

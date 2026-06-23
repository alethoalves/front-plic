"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./EditalDocumentos.module.scss";
import {
  RiUploadCloud2Line,
  RiDeleteBinLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiSaveLine,
} from "@remixicon/react";
import Button from "@/components/Button";
import {
  createEditalDocumento,
  getEditalDocumentos,
  deleteEditalDocumento,
  updateEditalDocumento,
} from "@/app/api/client/editalDocumentos";

const TIPOS = [{ value: "INSCRICAO", label: "Inscrição" }];

const EditalDocumentos = ({ params }) => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingId, setSavingId] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo: "INSCRICAO",
    file: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  const fetchDocumentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEditalDocumentos(params.tenant, params.idEdital);
      setDocumentos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.tenant, params.idEdital]);

  useEffect(() => {
    fetchDocumentos();
  }, [fetchDocumentos]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const validate = () => {
    const errors = {};
    if (!form.titulo.trim()) errors.titulo = "Título é obrigatório";
    if (!form.file) errors.file = "Selecione um arquivo";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", form.file);
      fd.append("titulo", form.titulo.trim());
      fd.append("descricao", form.descricao.trim());
      fd.append("tipo", form.tipo);
      await createEditalDocumento(params.tenant, params.idEdital, fd);
      setForm({ titulo: "", descricao: "", tipo: "INSCRICAO", file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      showFeedback("success", "Documento enviado com sucesso!");
      await fetchDocumentos();
    } catch (err) {
      console.error(err);
      showFeedback("error", "Erro ao enviar o documento. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja excluir este documento?")) return;
    setDeletingId(id);
    try {
      await deleteEditalDocumento(params.tenant, params.idEdital, id);
      showFeedback("success", "Documento excluído.");
      await fetchDocumentos();
    } catch (err) {
      console.error(err);
      showFeedback("error", "Erro ao excluir o documento.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartEdit = (doc) => {
    setEditingId(doc.id);
    setEditForm({ titulo: doc.titulo, descricao: doc.descricao || "", tipo: doc.tipo });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (id) => {
    if (!editForm.titulo?.trim()) {
      showFeedback("error", "Título é obrigatório.");
      return;
    }
    setSavingId(id);
    try {
      await updateEditalDocumento(params.tenant, params.idEdital, id, {
        titulo: editForm.titulo.trim(),
        descricao: editForm.descricao.trim(),
        tipo: editForm.tipo,
      });
      showFeedback("success", "Documento atualizado!");
      setEditingId(null);
      setEditForm({});
      await fetchDocumentos();
    } catch (err) {
      console.error(err);
      showFeedback("error", "Erro ao salvar alterações.");
    } finally {
      setSavingId(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setForm((prev) => ({ ...prev, file }));
    if (file) setFormErrors((prev) => ({ ...prev, file: undefined }));
  };

  return (
    <div className={styles.container}>
      {feedback && (
        <div className={`${styles.feedback} ${styles[feedback.type]}`}>
          {feedback.type === "success" ? <RiCheckLine /> : <RiCloseLine />}
          <p>{feedback.message}</p>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label>Título do documento *</label>
            <input
              type="text"
              placeholder="Ex: Edital de Seleção 2025"
              value={form.titulo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, titulo: e.target.value }))
              }
            />
            {formErrors.titulo && (
              <span className={styles.error}>{formErrors.titulo}</span>
            )}
          </div>
          <div className={styles.field}>
            <label>Classificação</label>
            <select
              value={form.tipo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tipo: e.target.value }))
              }
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label>Descrição (opcional)</label>
          <input
            type="text"
            placeholder="Ex: Leia antes de se inscrever"
            value={form.descricao}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, descricao: e.target.value }))
            }
          />
        </div>

        <div className={styles.uploadArea}>
          <div
            className={`${styles.dropzone} ${form.file ? styles.hasFile : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <RiUploadCloud2Line />
            <p>
              {form.file
                ? form.file.name
                : "Clique para selecionar um arquivo PDF"}
            </p>
            <span>Tamanho máximo: 15 MB</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className={styles.hiddenInput}
          />
          {formErrors.file && (
            <span className={styles.error}>{formErrors.file}</span>
          )}
        </div>

        <Button type="submit" className="btn-primary" disabled={uploading}>
          {uploading ? "Enviando..." : "Adicionar documento"}
        </Button>
      </form>

      <div className={styles.listSection}>
        <h6>Documentos cadastrados</h6>
        {loading ? (
          <p className={styles.loadingText}>Carregando...</p>
        ) : documentos.length === 0 ? (
          <p className={styles.emptyText}>Nenhum documento cadastrado ainda.</p>
        ) : (
          <ul className={styles.list}>
            {documentos.map((doc) =>
              editingId === doc.id ? (
                <li key={doc.id} className={`${styles.listItem} ${styles.editingItem}`}>
                  <div className={styles.docIcon}>
                    {doc.nomeArquivo.endsWith(".pdf") ? (
                      <RiFilePdf2Line />
                    ) : (
                      <RiFileTextLine />
                    )}
                  </div>
                  <div className={styles.editFields}>
                    <input
                      className={styles.editInput}
                      placeholder="Título *"
                      value={editForm.titulo}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, titulo: e.target.value }))
                      }
                    />
                    <input
                      className={styles.editInput}
                      placeholder="Descrição (opcional)"
                      value={editForm.descricao}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, descricao: e.target.value }))
                      }
                    />
                    <select
                      className={styles.editSelect}
                      value={editForm.tipo}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, tipo: e.target.value }))
                      }
                    >
                      {TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.docActions}>
                    <button
                      onClick={() => handleSaveEdit(doc.id)}
                      disabled={savingId === doc.id}
                      className={styles.saveBtn}
                      title="Salvar"
                    >
                      <RiSaveLine />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className={styles.cancelBtn}
                      title="Cancelar"
                    >
                      <RiCloseLine />
                    </button>
                  </div>
                </li>
              ) : (
                <li key={doc.id} className={styles.listItem}>
                  <div className={styles.docIcon}>
                    {doc.nomeArquivo.endsWith(".pdf") ? (
                      <RiFilePdf2Line />
                    ) : (
                      <RiFileTextLine />
                    )}
                  </div>
                  <div className={styles.docInfo}>
                    <p className={styles.docTitulo}>{doc.titulo}</p>
                    {doc.descricao && (
                      <p className={styles.docDescricao}>{doc.descricao}</p>
                    )}
                    <span className={styles.docTipo}>
                      {TIPOS.find((t) => t.value === doc.tipo)?.label || doc.tipo}
                    </span>
                  </div>
                  <div className={styles.docActions}>
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      Ver
                    </a>
                    <button
                      onClick={() => handleStartEdit(doc)}
                      className={styles.editBtn}
                      title="Editar"
                    >
                      <RiEditLine />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className={styles.deleteBtn}
                      title="Excluir"
                    >
                      <RiDeleteBinLine />
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EditalDocumentos;

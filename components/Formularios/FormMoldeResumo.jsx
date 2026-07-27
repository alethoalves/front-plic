"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import styles from "@/components/Formularios/Form.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  RiFileTextLine,
  RiAddCircleLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiCloseLine,
  RiSave2Line,
  RiDownload2Line,
} from "@remixicon/react";
import {
  updateEventoConfiguracoes,
  getConfiguracoesEdicaoAnterior,
} from "@/app/api/client/eventos";

// moldeResumo é um JSON solto na tabela Evento (não uma tabela própria), então
// a lista de partes vive só em estado local e só vai pro backend quando o
// admin aperta "Salvar" desta seção — igual ao restante de FormConfiguracoesEvento,
// diferente de FormInstituicoesParceiras (que tem CRUD próprio por ser tabela real).
const FormMoldeResumo = ({ eventoSlug, initialPartes }) => {
  const [partes, setPartes] = useState(initialPartes || []);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [erroAdd, setErroAdd] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({ label: "", max: "", required: false });
  const [erroEdit, setErroEdit] = useState("");
  const [edicaoAnterior, setEdicaoAnterior] = useState(null);

  const { control, resetField, getValues } = useForm({
    defaultValues: { label: "", max: "", required: "false" },
  });

  // Só sugere importar quando esta edição ainda não tem nenhuma parte definida.
  useEffect(() => {
    if (partes.length > 0) {
      setEdicaoAnterior(null);
      return;
    }
    let ativo = true;
    getConfiguracoesEdicaoAnterior(eventoSlug)
      .then((resultado) => {
        if (ativo && resultado?.moldeResumo?.partes?.length > 0) {
          setEdicaoAnterior(resultado);
        }
      })
      .catch(() => {
        // Falha silenciosa — é só a sugestão de import, não impede o resto da tela
      });
    return () => {
      ativo = false;
    };
  }, [eventoSlug, partes.length]);

  const onImportar = () => {
    setPartes(edicaoAnterior.moldeResumo.partes);
    setEdicaoAnterior(null);
  };

  const handleAdd = () => {
    const { label, max, required } = getValues();
    if (!label?.trim() || !max) {
      setErroAdd("Preencha o nome da seção e o limite de caracteres.");
      return;
    }
    setPartes((prev) => [
      ...prev,
      { label: label.trim(), max: Number(max), required: required === "true" },
    ]);
    setErroAdd("");
    resetField("label");
    resetField("max");
    resetField("required");
  };

  const handleRemove = (index) => {
    setPartes((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleStartEdit = (index) => {
    const parte = partes[index];
    setEditingIndex(index);
    setEditValues({ label: parte.label, max: String(parte.max), required: !!parte.required });
    setErroEdit("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setErroEdit("");
  };

  const handleSaveEdit = () => {
    const { label, max, required } = editValues;
    if (!label.trim() || !max) {
      setErroEdit("Preencha o nome da seção e o limite de caracteres.");
      return;
    }
    setPartes((prev) =>
      prev.map((p, i) =>
        i === editingIndex ? { label: label.trim(), max: Number(max), required } : p
      )
    );
    setEditingIndex(null);
    setErroEdit("");
  };

  const onSalvar = async () => {
    setSalvando(true);
    setErro("");
    setSucesso(false);
    try {
      await updateEventoConfiguracoes(eventoSlug, { moldeResumo: { partes } });
      setSucesso(true);
    } catch (error) {
      setErro(error.response?.data?.message ?? "Erro na conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={styles.secao}>
      <div className={styles.secaoHead}>
        <div className={styles.secaoIcon}>
          <RiFileTextLine />
        </div>
        <h6>Molde do resumo</h6>
      </div>
      <div className={styles.secaoContent}>
        <p className={styles.dica}>
          Seções que o autor preenche ao submeter um resumo (ex.: Introdução,
          Metodologia, Resultados), cada uma com limite de caracteres e se é
          obrigatória.
        </p>

        {partes.length === 0 && edicaoAnterior && (
          <div className="mb-2">
            <p className={styles.dica}>
              A edição anterior ({edicaoAnterior.nomeEvento} —{" "}
              {edicaoAnterior.edicaoEvento}) tem um molde de resumo com{" "}
              {edicaoAnterior.moldeResumo.partes.length} seção(ões) cadastrada(s).
              Importar em vez de criar do zero?
            </p>
            <Button
              icon={RiDownload2Line}
              className="btn-secondary mt-1"
              type="button"
              onClick={onImportar}
            >
              Importar da edição anterior
            </Button>
          </div>
        )}

        {partes.length > 0 && (
          <div className={styles.lista}>
            {partes.map((parte, index) => {
              if (editingIndex === index) {
                return (
                  <div key={`edit-${index}`} className={styles.listaItem}>
                    <div className={styles.listaItemEditForm}>
                      <input
                        className={styles.editInput}
                        value={editValues.label}
                        onChange={(e) =>
                          setEditValues((p) => ({ ...p, label: e.target.value }))
                        }
                        placeholder="Nome da seção"
                      />
                      <input
                        className={`${styles.editInput} ${styles.editInputSmall}`}
                        value={editValues.max}
                        onChange={(e) =>
                          setEditValues((p) => ({
                            ...p,
                            max: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder="Limite de caracteres"
                        inputMode="numeric"
                      />
                      <label className="flex gap-1 mt-1">
                        <input
                          type="checkbox"
                          checked={editValues.required}
                          onChange={(e) =>
                            setEditValues((p) => ({ ...p, required: e.target.checked }))
                          }
                        />
                        <p className="p5">Obrigatório</p>
                      </label>
                      {erroEdit && <p className={styles.editError}>{erroEdit}</p>}
                      <div className={styles.editActions}>
                        <button type="button" className={styles.editSave} onClick={handleSaveEdit}>
                          <RiCheckLine size={14} /> Salvar
                        </button>
                        <button type="button" className={styles.editCancel} onClick={handleCancelEdit}>
                          <RiCloseLine size={14} /> Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={index} className={styles.listaItem}>
                  <div className={styles.listaItemContent}>
                    <p className={styles.itemName}>{parte.label}</p>
                    <p className={`p5 ${styles.itemDates}`}>
                      {parte.max} caracteres{parte.required ? " · obrigatório" : ""}
                    </p>
                  </div>
                  <div className={styles.listaItemActions}>
                    <div
                      className={`${styles.actionIcon} ${styles.actionIconEdit}`}
                      onClick={() => handleStartEdit(index)}
                      title="Editar"
                    >
                      <RiPencilLine />
                    </div>
                    <div
                      className={`${styles.actionIcon} ${styles.actionIconDelete}`}
                      onClick={() => handleRemove(index)}
                      title="Excluir"
                    >
                      <RiDeleteBinLine />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={`${styles.secaoGrid} mt-2`}>
          <Input control={control} name="label" label="Nome da seção" inputType="text" />
          <Input control={control} name="max" label="Limite de caracteres" inputType="number" />
        </div>
        <div className={`${styles.checkboxGrid} mt-1`}>
          <Input control={control} name="required" label="Obrigatório" inputType="checkbox" />
        </div>
        <div className="mt-2">
          <Button icon={RiAddCircleLine} className="btn-secondary" type="button" onClick={handleAdd}>
            Adicionar seção
          </Button>
        </div>
        {erroAdd && <p className={styles.statusErro}>{erroAdd}</p>}
      </div>
      <div className={styles.secaoFooter}>
        {sucesso && <p className={styles.statusSucesso}>Salvo!</p>}
        {erro && <p className={styles.statusErro}>{erro}</p>}
        <div className={styles.secaoBotao}>
          <Button
            icon={RiSave2Line}
            className="btn-secondary"
            type="button"
            onClick={onSalvar}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormMoldeResumo;

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import styles from "@/components/Formularios/Form.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  RiPriceTag3Line,
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

// categorias é um JSON solto na tabela Evento (não uma tabela própria), então
// a lista de opções vive só em estado local e só vai pro backend quando o
// admin aperta "Salvar" desta seção — mesmo raciocínio de FormMoldeResumo.
const FormCategorias = ({ eventoSlug, initialOptions }) => {
  const [options, setOptions] = useState(initialOptions || []);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [erroAdd, setErroAdd] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [erroEdit, setErroEdit] = useState("");
  const [edicaoAnterior, setEdicaoAnterior] = useState(null);

  const { control, resetField, getValues } = useForm({
    defaultValues: { categoria: "" },
  });

  // Só sugere importar quando esta edição ainda não tem nenhuma categoria definida.
  useEffect(() => {
    if (options.length > 0) {
      setEdicaoAnterior(null);
      return;
    }
    let ativo = true;
    getConfiguracoesEdicaoAnterior(eventoSlug)
      .then((resultado) => {
        if (ativo && resultado?.categorias?.options?.length > 0) {
          setEdicaoAnterior(resultado);
        }
      })
      .catch(() => {
        // Falha silenciosa — é só a sugestão de import, não impede o resto da tela
      });
    return () => {
      ativo = false;
    };
  }, [eventoSlug, options.length]);

  const onImportar = () => {
    setOptions(edicaoAnterior.categorias.options);
    setEdicaoAnterior(null);
  };

  const handleAdd = () => {
    const { categoria } = getValues();
    const valor = categoria?.trim();
    if (!valor) {
      setErroAdd("Informe o nome da categoria.");
      return;
    }
    if (options.includes(valor)) {
      setErroAdd("Essa categoria já existe.");
      return;
    }
    setOptions((prev) => [...prev, valor]);
    setErroAdd("");
    resetField("categoria");
  };

  const handleRemove = (index) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditValue(options[index]);
    setErroEdit("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setErroEdit("");
  };

  const handleSaveEdit = () => {
    const valor = editValue.trim();
    if (!valor) {
      setErroEdit("Informe o nome da categoria.");
      return;
    }
    setOptions((prev) => prev.map((o, i) => (i === editingIndex ? valor : o)));
    setEditingIndex(null);
    setErroEdit("");
  };

  const onSalvar = async () => {
    setSalvando(true);
    setErro("");
    setSucesso(false);
    try {
      await updateEventoConfiguracoes(eventoSlug, { categorias: { options } });
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
          <RiPriceTag3Line />
        </div>
        <h6>Categorias de submissão</h6>
      </div>
      <div className={styles.secaoContent}>
        <p className={styles.dica}>
          Categorias usadas para classificar os resumos/apresentações
          submetidos neste evento.
        </p>

        {options.length === 0 && edicaoAnterior && (
          <div className="mb-2">
            <p className={styles.dica}>
              A edição anterior ({edicaoAnterior.nomeEvento} —{" "}
              {edicaoAnterior.edicaoEvento}) tem{" "}
              {edicaoAnterior.categorias.options.length} categoria(s) cadastrada(s).
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

        {options.length > 0 && (
          <div className={styles.lista}>
            {options.map((categoria, index) => {
              if (editingIndex === index) {
                return (
                  <div key={`edit-${index}`} className={styles.listaItem}>
                    <div className={styles.listaItemEditForm}>
                      <input
                        className={styles.editInput}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Nome da categoria"
                      />
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
                    <p className={styles.itemName}>{categoria}</p>
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className={`${styles.secaoGrid} mt-2`}
        >
          <Input control={control} name="categoria" label="Nome da categoria" inputType="text" />
          <Button icon={RiAddCircleLine} className="btn-secondary" type="submit">
            Adicionar
          </Button>
        </form>
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

export default FormCategorias;

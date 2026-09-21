"use client";

import { useEffect, useState } from "react";
import styles from "@/components/Formularios/Form.module.scss";
import styleSecao from "@/components/Formularios/FormConfiguracoesEvento.module.scss";
import Button from "@/components/Button";
import ModalDelete from "@/components/ModalDelete";
import {
  RiAwardLine,
  RiAddCircleLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiCloseLine,
} from "@remixicon/react";
import {
  getCriteriosAvaliacao,
  criarCriterioAvaliacao,
  atualizarCriterioAvaliacao,
  excluirCriterioAvaliacao,
} from "@/app/api/client/criterioAvaliacao";
import { escalaPadraoQualitativa } from "@/lib/criterioAvaliacaoScoring";

const CAMPOS_VAZIOS = {
  titulo: "",
  descricao: "",
  peso: "1",
  tipoEntrada: "NUMERICA",
  notaMinima: "0",
  notaMaxima: "10",
  escala: escalaPadraoQualitativa(),
};

// Editor inline das opções da escala qualitativa (rótulo + valor, ex.: "Não
// atende" = 0). Mesmo padrão visual de linha/inputs já usado neste arquivo,
// em vez de importar o EscalaEditor da árvore de Projeto/Plano (acoplado a
// outro formato de nó).
const EscalaQualitativaEditor = ({ escala, onChange }) => {
  const atualizarOpcao = (index, campo, valor) => {
    onChange(escala.map((o, i) => (i === index ? { ...o, [campo]: valor } : o)));
  };
  const adicionarOpcao = () => onChange([...escala, { valor: "", label: "" }]);
  const removerOpcao = (index) => onChange(escala.filter((_, i) => i !== index));

  return (
    <div className="mb-1">
      {escala.map((opcao, index) => (
        <div key={index} className={styles.opcaoEscala}>
          <div className="flex gap-1 mb-1">
            <input
              className={styles.editInput}
              value={opcao.label}
              onChange={(e) => atualizarOpcao(index, "label", e.target.value)}
              placeholder="Rótulo curto (ex: Atende parcialmente)"
            />
            <input
              type="number"
              step="any"
              className={`${styles.editInput} ${styles.editInputSmall}`}
              value={opcao.valor}
              onChange={(e) => atualizarOpcao(index, "valor", e.target.value)}
              placeholder="Valor"
            />
            {escala.length > 2 && (
              <div
                className={`${styles.actionIcon} ${styles.actionIconDelete}`}
                onClick={() => removerOpcao(index)}
                title="Remover opção"
              >
                <RiDeleteBinLine />
              </div>
            )}
          </div>
          <input
            className={styles.editInput}
            value={opcao.descricao || ""}
            onChange={(e) => atualizarOpcao(index, "descricao", e.target.value)}
            placeholder="Descrição exibida ao avaliador (opcional)"
          />
        </div>
      ))}
      <div
        className={`${styles.actionIcon} ${styles.actionIconEdit}`}
        onClick={adicionarOpcao}
        title="Adicionar opção"
      >
        <RiAddCircleLine />
      </div>
    </div>
  );
};

// CriterioAvaliacao é uma tabela própria (não um JSON solto como
// categorias/moldeResumo), então cada ação de fato persiste na hora — não
// existe um botão "Salvar" único no fim, ao contrário de FormCategorias.
const FormCriteriosAvaliacao = ({ eventoSlug }) => {
  const [criterios, setCriterios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [novo, setNovo] = useState(CAMPOS_VAZIOS);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [erroNovo, setErroNovo] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState(CAMPOS_VAZIOS);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  const [criterioParaExcluir, setCriterioParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState("");

  useEffect(() => {
    let ativo = true;
    getCriteriosAvaliacao(eventoSlug)
      .then((resultado) => {
        if (ativo) setCriterios(resultado || []);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [eventoSlug]);

  const validar = ({ titulo, tipoEntrada, notaMinima, notaMaxima, escala, peso }) => {
    if (!titulo?.trim()) return "Informe o título do critério.";
    if (Number(peso) <= 0 || Number.isNaN(Number(peso))) {
      return "O peso deve ser maior que zero.";
    }
    if (tipoEntrada === "QUALITATIVA") {
      if (!escala || escala.length < 2) return "Adicione ao menos 2 opções na escala.";
      const opcaoInvalida = escala.some(
        (o) => !o.label?.trim() || o.valor === "" || o.valor === undefined || Number.isNaN(Number(o.valor))
      );
      if (opcaoInvalida) return "Cada opção da escala precisa de um rótulo e um valor numérico.";
      return "";
    }
    if (Number(notaMaxima) <= Number(notaMinima)) {
      return "A nota máxima deve ser maior que a nota mínima.";
    }
    return "";
  };

  const montarPayload = (campos) => {
    const payload = {
      titulo: campos.titulo.trim(),
      descricao: campos.descricao.trim() || undefined,
      peso: Number(campos.peso) || 1,
      tipoEntrada: campos.tipoEntrada,
    };
    if (campos.tipoEntrada === "QUALITATIVA") {
      payload.escala = campos.escala.map((o) => ({
        valor: Number(o.valor),
        label: o.label.trim(),
        descricao: o.descricao?.trim() || undefined,
      }));
    } else {
      payload.notaMinima = Number(campos.notaMinima);
      payload.notaMaxima = Number(campos.notaMaxima);
    }
    return payload;
  };

  const handleAdd = async () => {
    const erro = validar(novo);
    if (erro) {
      setErroNovo(erro);
      return;
    }
    setSalvandoNovo(true);
    setErroNovo("");
    try {
      const criterio = await criarCriterioAvaliacao(eventoSlug, montarPayload(novo));
      setCriterios((prev) => [...prev, criterio]);
      setNovo(CAMPOS_VAZIOS);
    } catch (error) {
      setErroNovo(error.response?.data?.message ?? "Erro na conexão com o servidor.");
    } finally {
      setSalvandoNovo(false);
    }
  };

  const handleStartEdit = (criterio) => {
    setEditingId(criterio.id);
    setEditFields({
      titulo: criterio.titulo,
      descricao: criterio.descricao || "",
      peso: String(criterio.peso ?? 1),
      tipoEntrada: criterio.tipoEntrada || "NUMERICA",
      notaMinima: String(criterio.notaMinima),
      notaMaxima: String(criterio.notaMaxima),
      escala:
        criterio.tipoEntrada === "QUALITATIVA" && criterio.escala?.length
          ? criterio.escala.map((o) => ({ valor: String(o.valor), label: o.label, descricao: o.descricao || "" }))
          : escalaPadraoQualitativa(),
    });
    setErroEdicao("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setErroEdicao("");
  };

  const handleSaveEdit = async () => {
    const erro = validar(editFields);
    if (erro) {
      setErroEdicao(erro);
      return;
    }
    setSalvandoEdicao(true);
    setErroEdicao("");
    try {
      const criterioAtualizado = await atualizarCriterioAvaliacao(
        eventoSlug,
        editingId,
        montarPayload(editFields)
      );
      setCriterios((prev) =>
        prev.map((c) => (c.id === editingId ? criterioAtualizado : c))
      );
      setEditingId(null);
    } catch (error) {
      setErroEdicao(error.response?.data?.message ?? "Erro na conexão com o servidor.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleConfirmarExcluir = async () => {
    setExcluindo(true);
    setErroExcluir("");
    try {
      await excluirCriterioAvaliacao(eventoSlug, criterioParaExcluir.id);
      setCriterios((prev) => prev.filter((c) => c.id !== criterioParaExcluir.id));
      setCriterioParaExcluir(null);
    } catch (error) {
      setErroExcluir(error.response?.data?.message ?? "Erro na conexão com o servidor.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <section className={styleSecao.section}>
      <div className={styleSecao.sectionHead}>
        <div className={styleSecao.sectionIcon}>
          <RiAwardLine />
        </div>
        <div>
          <h6>Ficha de avaliação</h6>
          <p>Critérios que o avaliador pontua ao avaliar uma submissão.</p>
        </div>
      </div>
      <div className={styleSecao.sectionGrid}>
        {carregando ? (
          <p className={styleSecao.dica}>Carregando critérios...</p>
        ) : (
          <>
            {criterios.length > 0 && (
              <div className={styles.lista}>
                {criterios.map((criterio) => {
                  if (editingId === criterio.id) {
                    return (
                      <div key={`edit-${criterio.id}`} className={styles.listaItem}>
                        <div className={styles.listaItemEditForm}>
                          <input
                            className={styles.editInput}
                            value={editFields.titulo}
                            onChange={(e) =>
                              setEditFields((prev) => ({ ...prev, titulo: e.target.value }))
                            }
                            placeholder="Título do critério"
                          />
                          <input
                            className={styles.editInput}
                            value={editFields.descricao}
                            onChange={(e) =>
                              setEditFields((prev) => ({ ...prev, descricao: e.target.value }))
                            }
                            placeholder="Descrição (opcional)"
                          />
                          <div className="flex gap-1 mb-1">
                            <select
                              className={styles.editInput}
                              value={editFields.tipoEntrada}
                              onChange={(e) =>
                                setEditFields((prev) => ({ ...prev, tipoEntrada: e.target.value }))
                              }
                            >
                              <option value="NUMERICA">Nota numérica</option>
                              <option value="QUALITATIVA">Escala qualitativa</option>
                            </select>
                            <input
                              type="number"
                              step="any"
                              className={`${styles.editInput} ${styles.editInputSmall}`}
                              value={editFields.peso}
                              onChange={(e) =>
                                setEditFields((prev) => ({ ...prev, peso: e.target.value }))
                              }
                              placeholder="Peso"
                              title="Peso do critério na nota final"
                            />
                          </div>
                          {editFields.tipoEntrada === "QUALITATIVA" ? (
                            <EscalaQualitativaEditor
                              escala={editFields.escala}
                              onChange={(escala) =>
                                setEditFields((prev) => ({ ...prev, escala }))
                              }
                            />
                          ) : (
                            <div className="flex gap-1">
                              <input
                                type="number"
                                className={`${styles.editInput} ${styles.editInputSmall}`}
                                value={editFields.notaMinima}
                                onChange={(e) =>
                                  setEditFields((prev) => ({ ...prev, notaMinima: e.target.value }))
                                }
                                placeholder="Mín."
                              />
                              <input
                                type="number"
                                className={`${styles.editInput} ${styles.editInputSmall}`}
                                value={editFields.notaMaxima}
                                onChange={(e) =>
                                  setEditFields((prev) => ({ ...prev, notaMaxima: e.target.value }))
                                }
                                placeholder="Máx."
                              />
                            </div>
                          )}
                          {erroEdicao && <p className={styles.editError}>{erroEdicao}</p>}
                          <div className={styles.editActions}>
                            <button
                              type="button"
                              className={styles.editSave}
                              onClick={handleSaveEdit}
                              disabled={salvandoEdicao}
                            >
                              <RiCheckLine size={14} />{" "}
                              {salvandoEdicao ? "Salvando..." : "Salvar"}
                            </button>
                            <button
                              type="button"
                              className={styles.editCancel}
                              onClick={handleCancelEdit}
                              disabled={salvandoEdicao}
                            >
                              <RiCloseLine size={14} /> Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={criterio.id} className={styles.listaItem}>
                      <div className={styles.listaItemContent}>
                        <p className={styles.itemName}>{criterio.titulo}</p>
                        {criterio.descricao && (
                          <p className={styles.itemDates}>{criterio.descricao}</p>
                        )}
                        <p className={styles.itemDates}>
                          {criterio.tipoEntrada === "QUALITATIVA"
                            ? (criterio.escala || []).map((o) => o.label).join(" / ")
                            : `Nota de ${criterio.notaMinima} a ${criterio.notaMaxima}`}
                          {" · "}Peso {criterio.peso ?? 1}
                        </p>
                      </div>
                      <div className={styles.listaItemActions}>
                        <div
                          className={`${styles.actionIcon} ${styles.actionIconEdit}`}
                          onClick={() => handleStartEdit(criterio)}
                          title="Editar"
                        >
                          <RiPencilLine />
                        </div>
                        <div
                          className={`${styles.actionIcon} ${styles.actionIconDelete}`}
                          onClick={() => setCriterioParaExcluir(criterio)}
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
              className="mt-2"
            >
              <input
                className={styles.editInput}
                value={novo.titulo}
                onChange={(e) => setNovo((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Título do critério"
              />
              <input
                className={styles.editInput}
                value={novo.descricao}
                onChange={(e) => setNovo((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição (opcional)"
              />
              <div className="flex gap-1 mb-1">
                <select
                  className={styles.editInput}
                  value={novo.tipoEntrada}
                  onChange={(e) => setNovo((prev) => ({ ...prev, tipoEntrada: e.target.value }))}
                >
                  <option value="NUMERICA">Nota numérica</option>
                  <option value="QUALITATIVA">Escala qualitativa</option>
                </select>
                <input
                  type="number"
                  step="any"
                  className={`${styles.editInput} ${styles.editInputSmall}`}
                  value={novo.peso}
                  onChange={(e) => setNovo((prev) => ({ ...prev, peso: e.target.value }))}
                  placeholder="Peso"
                  title="Peso do critério na nota final"
                />
              </div>
              {novo.tipoEntrada === "QUALITATIVA" ? (
                <EscalaQualitativaEditor
                  escala={novo.escala}
                  onChange={(escala) => setNovo((prev) => ({ ...prev, escala }))}
                />
              ) : (
                <div className="flex gap-1 mb-1">
                  <input
                    type="number"
                    className={`${styles.editInput} ${styles.editInputSmall}`}
                    value={novo.notaMinima}
                    onChange={(e) => setNovo((prev) => ({ ...prev, notaMinima: e.target.value }))}
                    placeholder="Mín."
                  />
                  <input
                    type="number"
                    className={`${styles.editInput} ${styles.editInputSmall}`}
                    value={novo.notaMaxima}
                    onChange={(e) => setNovo((prev) => ({ ...prev, notaMaxima: e.target.value }))}
                    placeholder="Máx."
                  />
                </div>
              )}
              <Button
                icon={RiAddCircleLine}
                className="btn-secondary"
                type="submit"
                disabled={salvandoNovo}
              >
                {salvandoNovo ? "Adicionando..." : "Adicionar critério"}
              </Button>
            </form>
            {erroNovo && <p className={styleSecao.statusErro}>{erroNovo}</p>}
          </>
        )}
      </div>

      <ModalDelete
        isOpen={!!criterioParaExcluir}
        onClose={() => {
          setCriterioParaExcluir(null);
          setErroExcluir("");
        }}
        title="Excluir critério de avaliação"
        confirmationText={`Tem certeza que deseja excluir o critério "${criterioParaExcluir?.titulo}"? Avaliações já registradas não são afetadas.`}
        errorDelete={erroExcluir}
        handleDelete={handleConfirmarExcluir}
        txtBtn={excluindo ? "Excluindo..." : "Excluir"}
      />
    </section>
  );
};

export default FormCriteriosAvaliacao;

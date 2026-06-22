"use client";
import { useState, useEffect } from "react";
import styles from "./EditalFichaAvaliacao.module.scss";
import {
  RiAddCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from "@remixicon/react";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { getEdital, updateEdital } from "@/app/api/client/edital";
import { LATTES_ELEMENTS } from "@/lib/lattesElements";

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const emptyPerfil = () => ({
  label: "",
  tipoParticipacao: "orientador",
  aplicabilidade: "geral",
  notaMax: 0,
  grupos: [],
});

const emptyGrupo = () => ({ label: "", notaMax: 0, grupos: [] });

const emptyItem = () => ({
  label: "",
  path: "",
  tagLattes: "",
  notaMax: 0,
  notaPorItem: 0,
  campos: [],
  filterLattes: { operador: "AND", condicoes: [] },
});

const emptyCampo = () => ({ type: "text", label: "", tagLattes: "", qualis: false });
const emptyCondicao = () => ({ campo: "", operador: "EQUAL", valor: "" });
const emptySubgrupo = () => ({ operador: "OR", condicoes: [emptyCondicao(), emptyCondicao()] });
const isSubgrupo = (c) => Boolean(c?.condicoes && Array.isArray(c.condicoes));

const isLeafItem = (obj) => Boolean(obj?.tagLattes);

// ─── CondicaoRow ─────────────────────────────────────────────────────────────
const CondicaoRow = ({ cond, onChange, onDelete, availableAttrs, enumValues }) => {
  const serializeValor = (v) => {
    if (Array.isArray(v)) return v.join(", ");
    return String(v ?? "");
  };

  const parseValor = (operador, raw) => {
    if (operador === "BETWEEN") {
      const parts = raw.split(",").map((s) => Number(s.trim()));
      return parts.length === 2 && parts.every((n) => !isNaN(n)) ? parts : [0, 0];
    }
    if (operador === "OR") {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return raw;
  };

  const handleOperadorChange = (newOp) => {
    const defaultValor = newOp === "BETWEEN" ? [0, 0] : newOp === "OR" ? [] : "";
    onChange({ ...cond, operador: newOp, valor: defaultValor });
  };

  return (
    <div className={styles.condicaoRow}>
      {availableAttrs.length > 0 ? (
        <select
          value={cond.campo}
          onChange={(e) => onChange({ ...cond, campo: e.target.value })}
        >
          <option value="">-- campo --</option>
          {availableAttrs.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      ) : (
        <input
          placeholder="Campo (ex: ANO-DO-ARTIGO)"
          value={cond.campo}
          onChange={(e) => onChange({ ...cond, campo: e.target.value })}
        />
      )}
      <select value={cond.operador} onChange={(e) => handleOperadorChange(e.target.value)}>
        <option value="EQUAL">EQUAL</option>
        <option value="BETWEEN">BETWEEN</option>
        <option value="OR">OR</option>
        <option value="CONTAINS">CONTAINS</option>
      </select>
      {cond.operador === "EQUAL" && enumValues?.[cond.campo]?.length > 0 ? (
        <select
          value={String(cond.valor ?? "")}
          onChange={(e) => onChange({ ...cond, valor: e.target.value })}
        >
          <option value="">-- valor --</option>
          {enumValues[cond.campo].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      ) : (
        <input
          placeholder={
            cond.operador === "BETWEEN"
              ? "Ex: 2022, 2026"
              : cond.operador === "OR"
              ? "Ex: B3, B4"
              : "Ex: A1"
          }
          value={serializeValor(cond.valor)}
          onChange={(e) =>
            onChange({ ...cond, valor: parseValor(cond.operador, e.target.value) })
          }
        />
      )}
      <div className={styles.deleteSmall} onClick={onDelete}>
        <RiDeleteBinLine />
      </div>
    </div>
  );
};

// ─── SubgrupoCondicao ─────────────────────────────────────────────────────────
const SubgrupoCondicao = ({ subgrupo, onChange, onDelete, availableAttrs, enumValues }) => {
  const updateInner = (i, cond) => {
    const condicoes = clone(subgrupo.condicoes);
    condicoes[i] = cond;
    onChange({ ...subgrupo, condicoes });
  };
  const deleteInner = (i) =>
    onChange({ ...subgrupo, condicoes: subgrupo.condicoes.filter((_, idx) => idx !== i) });
  const addInner = () =>
    onChange({ ...subgrupo, condicoes: [...subgrupo.condicoes, emptyCondicao()] });

  return (
    <div className={styles.subgrupoCondicao}>
      <div className={styles.subgrupoHeader}>
        <span className={styles.subgrupoLabel}>Sub-grupo</span>
        <select
          value={subgrupo.operador}
          onChange={(e) => onChange({ ...subgrupo, operador: e.target.value })}
        >
          <option value="OR">OR</option>
          <option value="AND">AND</option>
        </select>
        <div className={styles.deleteSmall} onClick={onDelete}>
          <RiDeleteBinLine />
        </div>
      </div>
      {subgrupo.condicoes.map((cond, i) => (
        <CondicaoRow
          key={i}
          cond={cond}
          availableAttrs={availableAttrs}
          enumValues={enumValues}
          onChange={(c) => updateInner(i, c)}
          onDelete={() => deleteInner(i)}
        />
      ))}
      <div className={styles.addSmall} onClick={addInner}>
        <RiAddCircleLine />
        <span>Adicionar condição ao sub-grupo</span>
      </div>
    </div>
  );
};

// ─── PerfilForm ───────────────────────────────────────────────────────────────
const PerfilForm = ({ initialData, mode, onSave, onClose }) => {
  const [data, setData] = useState(clone(initialData));
  const set = (k, v) => setData((prev) => ({ ...prev, [k]: v }));

  return (
    <div className={styles.form}>
      <h4>{mode === "create" ? "Novo Perfil de Participação" : "Editar Perfil"}</h4>
      <p>Define um perfil por tipo de participante (ex: orientador, aluno).</p>

      <label className={styles.field}>
        <span>Título do perfil</span>
        <input
          value={data.label}
          onChange={(e) => set("label", e.target.value)}
          placeholder="Ex: Perfil do Orientador"
        />
      </label>

      <label className={styles.field}>
        <span>Tipo de participação</span>
        <select
          value={data.tipoParticipacao}
          onChange={(e) => set("tipoParticipacao", e.target.value)}
        >
          <option value="orientador">orientador</option>
          <option value="coorientador">coorientador</option>
          <option value="aluno">aluno</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Aplicabilidade</span>
        <input
          value={data.aplicabilidade}
          onChange={(e) => set("aplicabilidade", e.target.value)}
          placeholder="geral"
        />
      </label>

      <label className={styles.field}>
        <span>Nota máxima do perfil</span>
        <input
          type="number"
          value={data.notaMax}
          onChange={(e) => set("notaMax", Number(e.target.value))}
        />
      </label>

      <div className={styles.formActions}>
        <Button className="btn-secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="btn-primary" onClick={() => onSave(data)}>
          Salvar
        </Button>
      </div>
    </div>
  );
};

// ─── GrupoForm ────────────────────────────────────────────────────────────────
const GrupoForm = ({ initialData, mode, onSave, onClose }) => {
  const [data, setData] = useState(clone(initialData));
  const set = (k, v) => setData((prev) => ({ ...prev, [k]: v }));

  return (
    <div className={styles.form}>
      <h4>{mode === "create" ? "Novo Grupo" : "Editar Grupo"}</h4>

      <label className={styles.field}>
        <span>Título do grupo</span>
        <input
          value={data.label}
          onChange={(e) => set("label", e.target.value)}
          placeholder="Ex: Produção científica"
        />
      </label>

      <label className={styles.field}>
        <span>Nota máxima do grupo</span>
        <input
          type="number"
          value={data.notaMax}
          onChange={(e) => set("notaMax", Number(e.target.value))}
        />
      </label>

      <div className={styles.formActions}>
        <Button className="btn-secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="btn-primary" onClick={() => onSave(data)}>
          Salvar
        </Button>
      </div>
    </div>
  );
};

// ─── ItemForm ─────────────────────────────────────────────────────────────────
const ItemForm = ({ initialData, mode, onSave, onClose }) => {
  const [data, setData] = useState(clone(initialData));
  const set = (k, v) => setData((prev) => ({ ...prev, [k]: v }));

  // Elemento Lattes selecionado (para filtrar attrs disponíveis)
  const selectedElement = LATTES_ELEMENTS.find(
    (e) => e.tagLattes === data.tagLattes
  ) || null;
  const availableAttrs = selectedElement?.attrs || [];

  const handleElementSelect = (tagLattes) => {
    const el = LATTES_ELEMENTS.find((e) => e.tagLattes === tagLattes);
    if (el) {
      setData((prev) => ({
        ...prev,
        path: el.path,
        tagLattes: el.tagLattes,
      }));
    } else {
      setData((prev) => ({ ...prev, path: "", tagLattes: "" }));
    }
  };

  // campos ops
  const addCampo = () => set("campos", [...(data.campos || []), emptyCampo()]);
  const updateCampo = (i, campo) => {
    const arr = clone(data.campos);
    arr[i] = campo;
    set("campos", arr);
  };
  const deleteCampo = (i) =>
    set("campos", data.campos.filter((_, idx) => idx !== i));

  // filterLattes ops
  const setFilterOp = (v) =>
    set("filterLattes", { ...data.filterLattes, operador: v });
  const addCondicao = () =>
    set("filterLattes", {
      ...data.filterLattes,
      condicoes: [...(data.filterLattes?.condicoes || []), emptyCondicao()],
    });
  const addSubgrupo = () =>
    set("filterLattes", {
      ...data.filterLattes,
      condicoes: [...(data.filterLattes?.condicoes || []), emptySubgrupo()],
    });
  const updateCondicao = (i, cond) => {
    const condicoes = clone(data.filterLattes.condicoes);
    condicoes[i] = cond;
    set("filterLattes", { ...data.filterLattes, condicoes });
  };
  const deleteCondicao = (i) =>
    set("filterLattes", {
      ...data.filterLattes,
      condicoes: data.filterLattes.condicoes.filter((_, idx) => idx !== i),
    });

  return (
    <div className={styles.form}>
      <h4>{mode === "create" ? "Novo Item" : "Editar Item"}</h4>

      <label className={styles.field}>
        <span>Título do item</span>
        <input
          value={data.label}
          onChange={(e) => set("label", e.target.value)}
          placeholder="Ex: Artigo em periódico Qualis A1"
        />
      </label>

      {/* Seletor de elemento Lattes — preenche path e tagLattes automaticamente */}
      <label className={styles.field}>
        <span>Elemento Lattes</span>
        <select
          value={data.tagLattes || ""}
          onChange={(e) => handleElementSelect(e.target.value)}
        >
          <option value="">-- selecione o elemento --</option>
          {LATTES_ELEMENTS.map((el) => (
            <option key={el.tagLattes} value={el.tagLattes}>
              {el.label}
            </option>
          ))}
        </select>
      </label>

      {/* Mostra o path preenchido (somente leitura) */}
      {data.path && (
        <div className={styles.pathDisplay}>
          <span>Path:</span> {data.path}
        </div>
      )}

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Nota máxima</span>
          <input
            type="number"
            value={data.notaMax}
            onChange={(e) => set("notaMax", Number(e.target.value))}
          />
        </label>
        <label className={styles.field}>
          <span>Nota por item</span>
          <input
            type="number"
            value={data.notaPorItem}
            onChange={(e) => set("notaPorItem", Number(e.target.value))}
          />
        </label>
      </div>

      {/* Campos */}
      <div className={styles.subSection}>
        <h6>Campos do Lattes a exibir</h6>
        {(data.campos || []).map((campo, i) => (
          <div key={i} className={styles.campoRow}>
            <select
              value={campo.type || ""}
              onChange={(e) =>
                updateCampo(i, { ...campo, type: e.target.value || undefined })
              }
            >
              <option value="">sem tipo</option>
              <option value="text">text</option>
              <option value="number">number</option>
            </select>
            <input
              placeholder="Label"
              value={campo.label}
              onChange={(e) => updateCampo(i, { ...campo, label: e.target.value })}
            />
            {availableAttrs.length > 0 ? (
              <select
                value={campo.tagLattes || ""}
                onChange={(e) =>
                  updateCampo(i, { ...campo, tagLattes: e.target.value })
                }
              >
                <option value="">-- atributo --</option>
                {availableAttrs.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            ) : (
              <input
                placeholder="tagLattes"
                value={campo.tagLattes}
                onChange={(e) =>
                  updateCampo(i, { ...campo, tagLattes: e.target.value })
                }
              />
            )}
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={!!campo.qualis}
                onChange={(e) =>
                  updateCampo(i, { ...campo, qualis: e.target.checked })
                }
              />
              Qualis
            </label>
            <div className={styles.deleteSmall} onClick={() => deleteCampo(i)}>
              <RiDeleteBinLine />
            </div>
          </div>
        ))}
        <div className={styles.addSmall} onClick={addCampo}>
          <RiAddCircleLine />
          <span>Adicionar campo</span>
        </div>
      </div>

      {/* FilterLattes */}
      <div className={styles.subSection}>
        <h6>Filtro Lattes</h6>
        <label className={styles.field}>
          <span>Operador entre condições</span>
          <select
            value={data.filterLattes?.operador || "AND"}
            onChange={(e) => setFilterOp(e.target.value)}
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </label>
        {(data.filterLattes?.condicoes || []).map((cond, i) =>
          isSubgrupo(cond) ? (
            <SubgrupoCondicao
              key={i}
              subgrupo={cond}
              availableAttrs={availableAttrs}
              enumValues={selectedElement?.enumValues || {}}
              onChange={(c) => updateCondicao(i, c)}
              onDelete={() => deleteCondicao(i)}
            />
          ) : (
            <CondicaoRow
              key={i}
              cond={cond}
              availableAttrs={availableAttrs}
              enumValues={selectedElement?.enumValues || {}}
              onChange={(c) => updateCondicao(i, c)}
              onDelete={() => deleteCondicao(i)}
            />
          )
        )}
        <div className={styles.addSmall} onClick={addCondicao}>
          <RiAddCircleLine />
          <span>Adicionar condição</span>
        </div>
        <div className={styles.addSmall} onClick={addSubgrupo}>
          <RiAddCircleLine />
          <span>Adicionar sub-grupo (OR/AND aninhado)</span>
        </div>
      </div>

      <div className={styles.formActions}>
        <Button className="btn-secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button className="btn-primary" onClick={() => onSave(data)}>
          Salvar
        </Button>
      </div>
    </div>
  );
};

// ─── EditalFichaAvaliacao ─────────────────────────────────────────────────────
const EditalFichaAvaliacao = ({ params }) => {
  const [schema, setSchema] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedPerfis, setExpandedPerfis] = useState({});
  const [expandedGrupos, setExpandedGrupos] = useState({});
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const edital = await getEdital(params.tenant, params.idEdital);
        if (edital?.schemaFichaAvaliacaoParticipacao) {
          const s =
            typeof edital.schemaFichaAvaliacaoParticipacao === "string"
              ? JSON.parse(edital.schemaFichaAvaliacaoParticipacao)
              : edital.schemaFichaAvaliacaoParticipacao;
          setSchema(Array.isArray(s) ? s : []);
        }
      } catch (e) {
        console.error("Erro ao carregar schema:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.tenant, params.idEdital]);

  const markChanged = (newSchema) => {
    setSchema(newSchema);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEdital(params.tenant, params.idEdital, {
        schemaFichaAvaliacaoParticipacao: schema,
      });
      setHasChanges(false);
    } catch (e) {
      console.error("Erro ao salvar schema:", e);
    } finally {
      setSaving(false);
    }
  };

  // ─── Perfil ops ──────────────────────────────────────────────────────────────
  const addPerfil = (data) => markChanged([...schema, data]);

  const updatePerfil = (idx, data) => {
    const next = clone(schema);
    next[idx] = { ...data, grupos: next[idx].grupos };
    markChanged(next);
  };

  const deletePerfil = (idx) => markChanged(schema.filter((_, i) => i !== idx));

  // ─── Grupo ops ───────────────────────────────────────────────────────────────
  const addGrupo = (pi, data) => {
    const next = clone(schema);
    next[pi].grupos = [...(next[pi].grupos || []), data];
    markChanged(next);
  };

  const updateGrupo = (pi, gi, data) => {
    const next = clone(schema);
    const grupos = next[pi].grupos;
    grupos[gi] = { ...data, grupos: grupos[gi].grupos };
    markChanged(next);
  };

  const deleteGrupo = (pi, gi) => {
    const next = clone(schema);
    next[pi].grupos = next[pi].grupos.filter((_, i) => i !== gi);
    markChanged(next);
  };

  // ─── Item ops (dentro de um grupo) ──────────────────────────────────────────
  const addItem = (pi, gi, data) => {
    const next = clone(schema);
    next[pi].grupos[gi].grupos = [...(next[pi].grupos[gi].grupos || []), data];
    markChanged(next);
  };

  const updateItem = (pi, gi, ii, data) => {
    const next = clone(schema);
    next[pi].grupos[gi].grupos[ii] = data;
    markChanged(next);
  };

  const deleteItem = (pi, gi, ii) => {
    const next = clone(schema);
    next[pi].grupos[gi].grupos = next[pi].grupos[gi].grupos.filter((_, i) => i !== ii);
    markChanged(next);
  };

  // ─── Item ops (direto no perfil — estrutura flat como no aluno) ───────────
  const addFlatItem = (pi, data) => {
    const next = clone(schema);
    next[pi].grupos = [...(next[pi].grupos || []), data];
    markChanged(next);
  };

  const updateFlatItem = (pi, ii, data) => {
    const next = clone(schema);
    next[pi].grupos[ii] = data;
    markChanged(next);
  };

  const deleteFlatItem = (pi, ii) => {
    const next = clone(schema);
    next[pi].grupos = next[pi].grupos.filter((_, i) => i !== ii);
    markChanged(next);
  };

  // ─── Modal ───────────────────────────────────────────────────────────────────
  const openModal = (config) => setModal(config);
  const closeModal = () => setModal(null);

  const handleModalSave = (data) => {
    const { type, mode, pi, gi, ii } = modal;
    if (type === "perfil") mode === "create" ? addPerfil(data) : updatePerfil(pi, data);
    if (type === "grupo") mode === "create" ? addGrupo(pi, data) : updateGrupo(pi, gi, data);
    if (type === "item") mode === "create" ? addItem(pi, gi, data) : updateItem(pi, gi, ii, data);
    if (type === "flatItem") mode === "create" ? addFlatItem(pi, data) : updateFlatItem(pi, ii, data);
    closeModal();
  };

  const togglePerfil = (idx) =>
    setExpandedPerfis((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const toggleGrupo = (key) =>
    setExpandedGrupos((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) return <p>Carregando...</p>;

  const modalSize = modal?.type === "item" ? "large" : "small";

  return (
    <div className={styles.container}>
      {/* Barra de salvar */}
      <div className={styles.saveBar}>
        <Button
          className="btn-primary"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          loading={saving}
        >
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
        {hasChanges && !saving && (
          <span className={styles.unsaved}>Há alterações não salvas</span>
        )}
      </div>

      {/* Lista de perfis */}
      {schema.map((perfil, pi) => (
        <div key={pi} className={styles.perfil}>
          <div className={styles.perfilHeader}>
            <div className={styles.perfilInfo}>
              <div className={styles.expandBtn} onClick={() => togglePerfil(pi)}>
                {expandedPerfis[pi] ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
              </div>
              <div>
                <strong>{perfil.label || "Sem título"}</strong>
                <div className={styles.badges}>
                  <span className={styles.badge}>{perfil.tipoParticipacao}</span>
                  <span className={styles.badge}>{perfil.aplicabilidade}</span>
                  <span className={styles.badgePoints}>{perfil.notaMax} pts máx.</span>
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              <div
                className={styles.edit}
                onClick={() =>
                  openModal({ type: "perfil", mode: "edit", pi, data: perfil })
                }
              >
                <RiEditLine />
              </div>
              <div className={styles.delete} onClick={() => deletePerfil(pi)}>
                <RiDeleteBinLine />
              </div>
            </div>
          </div>

          {expandedPerfis[pi] && (
            <div className={styles.perfilBody}>
              {(() => {
                const isFlatPerfil = (perfil.grupos || []).some(isLeafItem);

                if (isFlatPerfil) {
                  return (
                    <>
                      {(perfil.grupos || []).map((item, ii) => (
                        <div key={ii} className={styles.item}>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemLabel}>
                              {item.label || "Sem título"}
                            </span>
                            <div className={styles.itemMeta}>
                              {item.tagLattes && (
                                <span className={styles.badge}>{item.tagLattes}</span>
                              )}
                              <span className={styles.badgePoints}>
                                máx {item.notaMax} pts · {item.notaPorItem} pts/item
                              </span>
                            </div>
                          </div>
                          <div className={styles.actions}>
                            <div
                              className={styles.edit}
                              onClick={() =>
                                openModal({
                                  type: "flatItem",
                                  mode: "edit",
                                  pi,
                                  ii,
                                  data: item,
                                })
                              }
                            >
                              <RiEditLine />
                            </div>
                            <div
                              className={styles.delete}
                              onClick={() => deleteFlatItem(pi, ii)}
                            >
                              <RiDeleteBinLine />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div
                        className={styles.addItem}
                        onClick={() =>
                          openModal({
                            type: "flatItem",
                            mode: "create",
                            pi,
                            data: emptyItem(),
                          })
                        }
                      >
                        <RiAddCircleLine />
                        <p>Adicionar item</p>
                      </div>
                    </>
                  );
                }

                return (
                  <>
                    {(perfil.grupos || []).map((grupo, gi) => {
                      const gKey = `${pi}-${gi}`;
                      return (
                        <div key={gi} className={styles.grupo}>
                          <div className={styles.grupoHeader}>
                            <div className={styles.grupoInfo}>
                              <div
                                className={styles.expandBtn}
                                onClick={() => toggleGrupo(gKey)}
                              >
                                {expandedGrupos[gKey] ? (
                                  <RiArrowUpSLine />
                                ) : (
                                  <RiArrowDownSLine />
                                )}
                              </div>
                              <span>{grupo.label || "Sem título"}</span>
                              <span className={styles.badgePoints}>{grupo.notaMax} pts</span>
                            </div>
                            <div className={styles.actions}>
                              <div
                                className={styles.edit}
                                onClick={() =>
                                  openModal({
                                    type: "grupo",
                                    mode: "edit",
                                    pi,
                                    gi,
                                    data: grupo,
                                  })
                                }
                              >
                                <RiEditLine />
                              </div>
                              <div
                                className={styles.delete}
                                onClick={() => deleteGrupo(pi, gi)}
                              >
                                <RiDeleteBinLine />
                              </div>
                            </div>
                          </div>

                          {expandedGrupos[gKey] && (
                            <div className={styles.grupoBody}>
                              {(grupo.grupos || []).map((item, ii) => (
                                <div key={ii} className={styles.item}>
                                  <div className={styles.itemInfo}>
                                    <span className={styles.itemLabel}>
                                      {item.label || "Sem título"}
                                    </span>
                                    <div className={styles.itemMeta}>
                                      {item.tagLattes && (
                                        <span className={styles.badge}>{item.tagLattes}</span>
                                      )}
                                      <span className={styles.badgePoints}>
                                        máx {item.notaMax} pts · {item.notaPorItem} pts/item
                                      </span>
                                    </div>
                                  </div>
                                  <div className={styles.actions}>
                                    <div
                                      className={styles.edit}
                                      onClick={() =>
                                        openModal({
                                          type: "item",
                                          mode: "edit",
                                          pi,
                                          gi,
                                          ii,
                                          data: item,
                                        })
                                      }
                                    >
                                      <RiEditLine />
                                    </div>
                                    <div
                                      className={styles.delete}
                                      onClick={() => deleteItem(pi, gi, ii)}
                                    >
                                      <RiDeleteBinLine />
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <div
                                className={styles.addItem}
                                onClick={() =>
                                  openModal({
                                    type: "item",
                                    mode: "create",
                                    pi,
                                    gi,
                                    data: emptyItem(),
                                  })
                                }
                              >
                                <RiAddCircleLine />
                                <p>Adicionar item</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div
                      className={styles.addItem}
                      onClick={() =>
                        openModal({
                          type: "grupo",
                          mode: "create",
                          pi,
                          data: emptyGrupo(),
                        })
                      }
                    >
                      <RiAddCircleLine />
                      <p>Adicionar grupo</p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      ))}

      {/* Adicionar perfil */}
      <div
        className={styles.addPerfil}
        onClick={() =>
          openModal({ type: "perfil", mode: "create", data: emptyPerfil() })
        }
      >
        <div className={styles.addIcon}>
          <RiAddCircleLine />
        </div>
        <p>Adicionar perfil de participação</p>
      </div>

      {/* Modal */}
      {modal && (
        <Modal isOpen={true} onClose={closeModal} size={modalSize}>
          {modal.type === "perfil" && (
            <PerfilForm
              initialData={modal.data}
              mode={modal.mode}
              onSave={handleModalSave}
              onClose={closeModal}
            />
          )}
          {modal.type === "grupo" && (
            <GrupoForm
              initialData={modal.data}
              mode={modal.mode}
              onSave={handleModalSave}
              onClose={closeModal}
            />
          )}
          {(modal.type === "item" || modal.type === "flatItem") && (
            <ItemForm
              initialData={modal.data}
              mode={modal.mode}
              onSave={handleModalSave}
              onClose={closeModal}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default EditalFichaAvaliacao;

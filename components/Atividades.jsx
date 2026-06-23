"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import GanttChart from "./GanttChart";
import Modal from "@/components/Modal";
import {
  RiDeleteBinLine,
  RiDownloadLine,
  RiCalendarLine,
  RiPencilLine,
  RiCheckLine,
  RiCloseLine,
  RiSparklingLine,
  RiAlertLine,
  RiArrowLeftLine,
} from "@remixicon/react";
import styles from "@/components/Formularios/Form.module.scss";
import { formatDateToISO, formatarData } from "@/lib/formatarDatas";
import { useForm } from "react-hook-form";
import {
  getPlanosDeTrabalhoByUser,
  parseCronogramaComIA,
} from "@/app/api/client/planoDeTrabalho";

const parseLocalDate = (str) => {
  if (!str) return new Date(0);
  if (str.includes("/")) {
    const [d, m, y] = str.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(str);
};

const applyDateMask = (raw) => {
  let v = raw.replace(/\D/g, "").slice(0, 8);
  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
  if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5);
  return v;
};

const calcFim = (inicio, duracao) => {
  if (!inicio || !duracao || !/^\d{2}\/\d{2}\/\d{4}$/.test(inicio)) return "";
  const [d, m, y] = inicio.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + parseInt(duracao, 10) - 1);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const normalizeDate = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) return dateStr;
  return formatarData(dateStr);
};

const Atividades = ({
  cronograma,
  setCronograma,
  tenantSlug,
  currentPlanoId,
  minAtividadesPorPlano,
  anoBase,
}) => {
  const [errorAdd, setErrorAdd] = useState("");
  const [loading, setLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [errorImport, setErrorImport] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({
    nome: "",
    inicio: "",
    fim: "",
    duracao: "",
  });
  const [editError, setEditError] = useState("");

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTexto, setAiTexto] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiError, setAiError] = useState("");

  const { control, resetField, setValue, watch, getValues } = useForm({});

  const duracaoWatch = watch("duracao");
  const inicioWatch = watch("inicio");

  useEffect(() => {
    if (!duracaoWatch || !inicioWatch) return;
    const fim = calcFim(inicioWatch, duracaoWatch);
    if (fim) setValue("fim", fim);
  }, [duracaoWatch, inicioWatch, setValue]);

  const handleAddAtividade = () => {
    const nomeAtividade = getValues("nomeAtividade");
    const inicio = getValues("inicio");
    const fim = getValues("fim");

    if (!nomeAtividade || !inicio || !fim) {
      setErrorAdd("Preencha todos os campos obrigatórios da atividade!");
      return;
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(inicio) || !dateRegex.test(fim)) {
      setErrorAdd("Informe as datas no formato DD/MM/AAAA.");
      return;
    }

    const dataInicio = new Date(formatDateToISO(inicio));
    const dataFim = new Date(formatDateToISO(fim));

    if (dataFim < dataInicio) {
      setErrorAdd("A data de fim não pode ser anterior à data de início.");
      return;
    }

    setCronograma((prev) => [...prev, { nome: nomeAtividade, inicio, fim }]);
    setErrorAdd("");
    resetField("nomeAtividade");
    resetField("inicio");
    resetField("fim");
    resetField("duracao");
  };

  const handleRemoveAtividade = (index) => {
    setCronograma((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleStartEdit = (index) => {
    const item = cronograma[index];
    setEditingIndex(index);
    setEditValues({
      nome: item.nome,
      inicio: item.inicio,
      fim: item.fim,
      duracao: "",
    });
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditError("");
  };

  const handleSaveEdit = () => {
    const { nome, inicio, fim } = editValues;
    if (!nome || !inicio || !fim) {
      setEditError("Preencha todos os campos.");
      return;
    }
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(inicio) || !dateRegex.test(fim)) {
      setEditError("Informe as datas no formato DD/MM/AAAA.");
      return;
    }
    if (parseLocalDate(fim) < parseLocalDate(inicio)) {
      setEditError("A data de fim não pode ser anterior à data de início.");
      return;
    }
    setCronograma((prev) =>
      prev.map((item, i) =>
        i === editingIndex ? { nome, inicio, fim } : item,
      ),
    );
    setEditingIndex(null);
    setEditError("");
  };

  const handleAnalisarComIA = async (e) => {
    e.preventDefault();
    if (!aiTexto.trim()) {
      setAiError("Cole um texto para analisar.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const atividades = await parseCronogramaComIA(
        tenantSlug,
        aiTexto,
        anoBase,
      );
      setAiPreview(atividades.map((a) => ({ ...a })));
    } catch {
      setAiError("Não foi possível processar o texto. Tente novamente.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAdicionarDoAI = (e) => {
    e.preventDefault();
    const validas = aiPreview.filter((a) => a.nome && a.inicio && a.fim);
    setCronograma((prev) => [...prev, ...validas]);
    setAiModalOpen(false);
    setAiTexto("");
    setAiPreview(null);
    setAiError("");
  };

  const handleOpenImportModal = async (e) => {
    e.preventDefault();
    if (!tenantSlug) return;
    setImportModalOpen(true);
    setLoadingPlanos(true);
    setErrorImport("");
    try {
      const planos = await getPlanosDeTrabalhoByUser(tenantSlug);
      const planosComCronograma = (planos || []).filter(
        (p) =>
          p.id !== currentPlanoId && p.CronogramaPlanoDeTrabalho?.length > 0,
      );
      setPlanosDisponiveis(planosComCronograma);
    } catch {
      setErrorImport("Erro ao carregar planos de trabalho.");
    } finally {
      setLoadingPlanos(false);
    }
  };

  const handleImportFromPlano = (plano) => {
    const atividadesImportadas = plano.CronogramaPlanoDeTrabalho.map(
      (item) => ({
        nome: item.atividade,
        inicio: normalizeDate(item.inicio),
        fim: normalizeDate(item.fim),
      }),
    );
    setCronograma((prev) => [...prev, ...atividadesImportadas]);
    setImportModalOpen(false);
  };

  const sortedItems = [...cronograma]
    .map((item, originalIndex) => ({ ...item, _idx: originalIndex }))
    .sort((a, b) => parseLocalDate(a.inicio) - parseLocalDate(b.inicio));

  const isBelow =
    minAtividadesPorPlano && cronograma.length < minAtividadesPorPlano;

  return (
    <div className={styles.cronograma}>
      {tenantSlug && (
        <div className={styles.importBanner}>
          <div className={styles.importBannerText}>
            <RiDownloadLine size={16} />
            <p className="p5">
              Agilize o preenchimento importando de outro plano ou usando a IA
            </p>
          </div>
          <div className={styles.importBannerActions}>
            {anoBase && (
              <Button
                icon={RiSparklingLine}
                onClick={(e) => {
                  e.preventDefault();
                  setAiModalOpen(true);
                }}
                className="btn-secondary"
                disabled={loading}
              >
                Colar Atividades
              </Button>
            )}
            <Button
              icon={RiDownloadLine}
              onClick={handleOpenImportModal}
              className="btn-primary"
              disabled={loading}
            >
              Importar Cronograma de outro Plano
            </Button>
          </div>
        </div>
      )}

      {minAtividadesPorPlano > 0 && (
        <div
          className={`${styles.minCounter} ${isBelow ? styles.minCounterBelow : styles.minCounterOk}`}
        >
          <p className="p5">
            {cronograma.length} de {minAtividadesPorPlano} atividade
            {minAtividadesPorPlano !== 1 ? "s" : ""} mínima
            {minAtividadesPorPlano !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div className={`${styles.input} mb-2`}>
        <Input
          name="nomeAtividade"
          label="Nome da Atividade"
          placeholder="Digite o nome da atividade"
          disabled={loading}
          control={control}
        />
      </div>

      <div className={styles.dateRow}>
        <div className={styles.input}>
          <Input
            name="inicio"
            label="Data de Início"
            inputType="date"
            control={control}
            placeholder="DD/MM/AAAA"
            disabled={loading}
          />
        </div>
        <div className={styles.inputDuracao}>
          <Input
            name="duracao"
            label="Duração (dias)"
            inputType="number"
            control={control}
            placeholder="Ex: 30"
            disabled={loading}
          />
        </div>
        <div className={styles.input}>
          <Input
            name="fim"
            label="Data de Fim"
            inputType="date"
            control={control}
            placeholder="DD/MM/AAAA"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <Button
          onClick={(e) => {
            e.preventDefault();
            handleAddAtividade();
          }}
          className="btn-primary"
          disabled={loading}
        >
          + Adicionar Atividade
        </Button>
      </div>

      {errorAdd && (
        <div className="notification notification-error mt-1">
          <p className="p5">{errorAdd}</p>
        </div>
      )}

      <GanttChart cronograma={cronograma} />

      <div className={styles.lista}>
        {sortedItems.map((item) => {
          if (editingIndex === item._idx) {
            return (
              <div key={`edit-${item._idx}`} className={styles.listaItem}>
                <div className={styles.listaItemEditForm}>
                  <input
                    className={styles.editInput}
                    value={editValues.nome}
                    onChange={(e) =>
                      setEditValues((p) => ({ ...p, nome: e.target.value }))
                    }
                    placeholder="Nome da atividade"
                  />
                  <div className={styles.editDateRow}>
                    <input
                      className={styles.editInput}
                      value={editValues.inicio}
                      onChange={(e) => {
                        const v = applyDateMask(e.target.value);
                        setEditValues((p) => {
                          const fim = p.duracao ? calcFim(v, p.duracao) : p.fim;
                          return { ...p, inicio: v, fim: fim || p.fim };
                        });
                      }}
                      placeholder="Início DD/MM/AAAA"
                    />
                    <input
                      className={`${styles.editInput} ${styles.editInputSmall}`}
                      value={editValues.duracao}
                      onChange={(e) => {
                        const duracao = e.target.value.replace(/\D/g, "");
                        setEditValues((p) => {
                          const fim = calcFim(p.inicio, duracao);
                          return { ...p, duracao, ...(fim ? { fim } : {}) };
                        });
                      }}
                      placeholder="Dias"
                      inputMode="numeric"
                    />
                    <input
                      className={styles.editInput}
                      value={editValues.fim}
                      onChange={(e) => {
                        const v = applyDateMask(e.target.value);
                        setEditValues((p) => ({ ...p, fim: v, duracao: "" }));
                      }}
                      placeholder="Fim DD/MM/AAAA"
                    />
                  </div>
                  {editError && <p className={styles.editError}>{editError}</p>}
                  <div className={styles.editActions}>
                    <button
                      type="button"
                      className={styles.editSave}
                      onClick={handleSaveEdit}
                    >
                      <RiCheckLine size={14} /> Salvar
                    </button>
                    <button
                      type="button"
                      className={styles.editCancel}
                      onClick={handleCancelEdit}
                    >
                      <RiCloseLine size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={`item-${item._idx}`} className={styles.listaItem}>
              <div className={styles.listaItemContent}>
                <p className={styles.itemName}>{item.nome}</p>
                <p className={`p5 ${styles.itemDates}`}>
                  {item.inicio} – {item.fim}
                </p>
              </div>
              <div className={styles.listaItemActions}>
                <div
                  className={`${styles.actionIcon} ${styles.actionIconEdit}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleStartEdit(item._idx);
                  }}
                >
                  <RiPencilLine />
                </div>
                <div
                  className={`${styles.actionIcon} ${styles.actionIconDelete}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveAtividade(item._idx);
                  }}
                >
                  <RiDeleteBinLine />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={aiModalOpen}
        onClose={() => {
          setAiModalOpen(false);
          setAiTexto("");
          setAiPreview(null);
          setAiError("");
        }}
        size="medium"
      >
        {aiPreview === null ? (
          <>
            <h4 className="mb-2">Inserir Atividades em Massa</h4>
            <p className="mb-2">
              Cole abaixo o texto com as atividades e os períodos. Pode ser uma
              tabela copiada, uma lista ou texto corrido.
            </p>
            <textarea
              className={styles.aiTextarea}
              rows={10}
              placeholder={`Exemplos aceitos:\n• Levantamento bibliográfico: agosto a outubro\n• Coleta de dados — novembro/dezembro\n• Análise dos resultados: janeiro a março`}
              value={aiTexto}
              onChange={(e) => setAiTexto(e.target.value)}
              disabled={aiLoading}
            />
            {aiError && (
              <div className="notification notification-error mt-1">
                <p className="p5">{aiError}</p>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Button
                icon={RiSparklingLine}
                className="btn-primary"
                onClick={handleAnalisarComIA}
                disabled={aiLoading}
              >
                {aiLoading ? "Processando..." : "Processar com IA"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h4 className="mb-1">Revise as atividades identificadas</h4>
            <p className="mb-2">
              Verifique e edite os dados antes de adicionar ao cronograma.
              Linhas com data em branco serão ignoradas.
            </p>
            <div className={styles.aiPreviewTable}>
              <div className={styles.aiPreviewHeader}>
                <span>Atividade</span>
                <span>Início</span>
                <span>Fim</span>
                <span></span>
              </div>
              {aiPreview.map((item, idx) => {
                const semData = !item.inicio || !item.fim;
                return (
                  <div
                    key={idx}
                    className={`${styles.aiPreviewRow} ${semData ? styles.aiPreviewRowWarn : ""}`}
                  >
                    <input
                      className={styles.aiPreviewInput}
                      value={item.nome || ""}
                      onChange={(e) =>
                        setAiPreview((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, nome: e.target.value } : r,
                          ),
                        )
                      }
                      placeholder="Nome da atividade"
                    />
                    <input
                      className={styles.aiPreviewInput}
                      value={item.inicio || ""}
                      onChange={(e) => {
                        const v = applyDateMask(e.target.value);
                        setAiPreview((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, inicio: v } : r,
                          ),
                        );
                      }}
                      placeholder="DD/MM/AAAA"
                    />
                    <input
                      className={styles.aiPreviewInput}
                      value={item.fim || ""}
                      onChange={(e) => {
                        const v = applyDateMask(e.target.value);
                        setAiPreview((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, fim: v } : r,
                          ),
                        );
                      }}
                      placeholder="DD/MM/AAAA"
                    />
                    <button
                      type="button"
                      className={styles.aiPreviewRemove}
                      onClick={() =>
                        setAiPreview((prev) => prev.filter((_, i) => i !== idx))
                      }
                      title="Remover"
                    >
                      <RiCloseLine size={16} />
                    </button>
                    {semData && (
                      <span
                        className={styles.aiPreviewWarnIcon}
                        title="Data não identificada"
                      >
                        <RiAlertLine size={14} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {aiError && (
              <div className="notification notification-error mt-1">
                <p className="p5">{aiError}</p>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Button
                icon={RiCheckLine}
                className="btn-primary"
                onClick={handleAdicionarDoAI}
                disabled={aiPreview.every(
                  (a) => !a.nome || !a.inicio || !a.fim,
                )}
              >
                Adicionar ao cronograma
              </Button>
              <Button
                icon={RiArrowLeftLine}
                className="btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  setAiPreview(null);
                  setAiError("");
                }}
              >
                Voltar
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        size="medium"
      >
        <h4 className="mb-2">Importar Atividades</h4>
        <p className="mb-3">
          Selecione um plano de trabalho para importar suas atividades no
          cronograma atual.
        </p>

        {loadingPlanos && <p>Carregando planos...</p>}

        {errorImport && (
          <div className="notification notification-error mb-2">
            <p className="p5">{errorImport}</p>
          </div>
        )}

        {!loadingPlanos && !errorImport && planosDisponiveis.length === 0 && (
          <div className="notification notification-warning">
            <p className="p5">
              Nenhum outro plano de trabalho com atividades encontrado.
            </p>
          </div>
        )}

        {!loadingPlanos &&
          planosDisponiveis.map((plano) => (
            <div key={plano.id} className={styles.planoImportItem}>
              <div className={styles.planoImportContent}>
                <h6>{plano.titulo}</h6>
                <div className={styles.planoImportMeta}>
                  <p className="p5">
                    {plano.inscricao?.edital?.titulo}
                    {plano.inscricao?.edital?.ano
                      ? ` · ${plano.inscricao.edital.ano}`
                      : ""}
                  </p>
                  <span className={styles.planoImportBadge}>
                    <RiCalendarLine size={12} />
                    <p className="p5">
                      {plano.CronogramaPlanoDeTrabalho.length} atividade
                      {plano.CronogramaPlanoDeTrabalho.length !== 1 ? "s" : ""}
                    </p>
                  </span>
                </div>
              </div>
              <div className={styles.planoImportAction}>
                <Button
                  className="btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    handleImportFromPlano(plano);
                  }}
                >
                  Importar
                </Button>
              </div>
            </div>
          ))}
      </Modal>
    </div>
  );
};

export default Atividades;

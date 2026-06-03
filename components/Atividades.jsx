// Atividades.js
"use client";

import React, { useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import GanttChart from "./GanttChart";
import Modal from "@/components/Modal";
import { RiDeleteBinLine, RiDownloadLine, RiCalendarLine } from "@remixicon/react";
import styles from "@/components/Formularios/Form.module.scss";
import { formatDateToISO } from "@/lib/formatarDatas";
import { useForm } from "react-hook-form";
import { getPlanosDeTrabalhoByUser } from "@/app/api/client/planoDeTrabalho";

const Atividades = ({ cronograma, setCronograma, tenantSlug, currentPlanoId }) => {
  const [errorAddAtividade, setErrorAddAtividade] = useState("");
  const [loading, setLoading] = useState("");
  const [atividade, setAtividade] = useState({
    nome: "",
    inicio: "",
    fim: "",
    comentario: "",
  });
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [errorImport, setErrorImport] = useState("");

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    reset,
    getValues,
    resetField,
  } = useForm({});

  const handleAddAtividade = () => {
    const nomeAtividade = getValues("nomeAtividade");
    const inicio = getValues("inicio");
    const fim = getValues("fim");

    if (!nomeAtividade || !inicio || !fim) {
      setErrorAddAtividade(
        "Preencha todos os campos obrigatórios da atividade!"
      );
      return;
    }

    const dataInicio = new Date(formatDateToISO(inicio));
    const dataFim = new Date(formatDateToISO(fim));

    if (dataFim < dataInicio) {
      setErrorAddAtividade(
        "A data de fim não pode ser anterior à data de início."
      );
      return;
    }

    setCronograma((prev) => [...prev, { nome: nomeAtividade, inicio, fim }]);
    setErrorAddAtividade("");

    resetField("nomeAtividade");
    resetField("inicio");
    resetField("fim");
  };

  const handleRemoveAtividade = (index) => {
    setCronograma((prev) => prev.filter((_, i) => i !== index));
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
          p.id !== currentPlanoId &&
          p.CronogramaPlanoDeTrabalho?.length > 0
      );
      setPlanosDisponiveis(planosComCronograma);
    } catch (err) {
      setErrorImport("Erro ao carregar planos de trabalho.");
    } finally {
      setLoadingPlanos(false);
    }
  };

  const handleImportFromPlano = (plano) => {
    const atividadesImportadas = plano.CronogramaPlanoDeTrabalho.map((item) => ({
      nome: item.atividade,
      inicio: item.inicio,
      fim: item.fim,
    }));
    setCronograma((prev) => [...prev, ...atividadesImportadas]);
    setImportModalOpen(false);
  };

  return (
    <div className={styles.cronograma}>
      <div className={`${styles.input} mb-2`}>
        <Input
          name="nomeAtividade"
          label="Nome da Atividade"
          value={atividade.nome}
          onChange={(e) =>
            setAtividade((prev) => ({ ...prev, nome: e.target.value }))
          }
          placeholder="Digite o nome da atividade"
          disabled={loading}
          control={control}
        />
      </div>

      <div className={`${styles.inputGroup} flex`}>
        <div className={`${styles.input} mr-2`}>
          <Input
            name="inicio"
            label="Data de Início"
            inputType="date"
            control={control}
            placeholder="Selecione a data de início"
            disabled={loading}
          />
        </div>
        <div className={styles.input}>
          <Input
            name="fim"
            label="Data de Fim"
            inputType="date"
            control={control}
            placeholder="Selecione a data de fim"
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
          className="btn-secondary"
          disabled={loading}
        >
          Adicionar Atividade
        </Button>
        {tenantSlug && (
          <Button
            icon={RiDownloadLine}
            onClick={handleOpenImportModal}
            className="btn-secondary"
            disabled={loading}
          >
            Importar de outro Plano
          </Button>
        )}
      </div>

      {errorAddAtividade && (
        <div className="notification notification-error">
          <p className="p5">{errorAddAtividade}</p>
        </div>
      )}

      <GanttChart cronograma={cronograma} />

      <div className={styles.lista}>
        {cronograma
          .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
          .map((item, index) => (
            <div key={index} className={styles.listaItem}>
              <div
                className={styles.icon}
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveAtividade(index);
                }}
                disabled={loading}
              >
                <RiDeleteBinLine />
              </div>
              <div className={styles.content}>
                <h6>
                  {item.inicio} - {item.fim}
                </h6>
                <p>{item.nome}</p>
              </div>
            </div>
          ))}
      </div>

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
                    <p className="p5">{plano.CronogramaPlanoDeTrabalho.length} atividade{plano.CronogramaPlanoDeTrabalho.length !== 1 ? "s" : ""}</p>
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

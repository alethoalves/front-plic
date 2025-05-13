"use client";

import styles from "./ModalStyleInscricao.module.scss";
import {
  RiAlertLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { getEditais, getEdital, updateEdital } from "@/app/api/client/edital";

const RestricaoInscricao = ({ params }) => {
  /* ───────── estados ───────── */
  const [editais, setEditais] = useState([]);
  const [selectedEdital, setSelectedEdital] = useState(null);

  const [numbers, setNumbers] = useState({
    maxAlunosPorPlano: 0,
    maxSolicitacaoBolsa: 0,
    maxPlanos: 0,
  });

  const [saving, setSaving] = useState({
    maxAlunosPorPlano: false,
    maxSolicitacaoBolsa: false,
    maxPlanos: false,
  });

  const [loadingEdital, setLoadingEdital] = useState(false);
  const toast = useRef(null);

  /* ───────── 1. lista de editais ───────── */
  useEffect(() => {
    (async () => {
      try {
        setEditais(await getEditais(params.tenant, params.ano));
      } catch (e) {
        console.error(e);
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao buscar editais",
        });
      }
    })();
  }, [params.tenant, params.ano]);

  /* ───────── 2. detalhes do edital ───────── */
  useEffect(() => {
    if (!selectedEdital) return;
    (async () => {
      setLoadingEdital(true);
      try {
        const ed = await getEdital(params.tenant, selectedEdital.id);
        setNumbers({
          maxAlunosPorPlano: ed?.maxAlunosPorPlano ?? 0,
          maxSolicitacaoBolsa: ed?.maxSolicitacaoBolsa ?? 0,
          maxPlanos: ed?.maxPlanos ?? 0,
        });
      } catch (e) {
        console.error(e);
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao carregar edital",
        });
      } finally {
        setLoadingEdital(false);
      }
    })();
  }, [selectedEdital, params.tenant]);

  /* ───────── persistência ───────── */
  const persistNumber = async (field, value) => {
    if (!selectedEdital) return;
    setSaving((prev) => ({ ...prev, [field]: true }));
    try {
      await updateEdital(params.tenant, selectedEdital.id, { [field]: value });
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Valor salvo",
      });
    } catch (e) {
      console.error(e);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível salvar",
      });
      // se falhar, reverte visualmente ao valor anterior do state
    } finally {
      setSaving((prev) => ({ ...prev, [field]: false }));
    }
  };

  /* ───────── alteração pelo UI ───────── */
  const changeNumber = (field, delta) => {
    setNumbers((prev) => {
      const newVal = Math.max(0, (prev[field] || 0) + delta);
      persistNumber(field, newVal);
      return { ...prev, [field]: newVal };
    });
  };

  /* ───────── opções dropdown ───────── */
  const options = editais.map((ed) => ({
    label: `${ed.titulo} (${ed.ano})`,
    value: ed,
  }));

  /* ───────── render helper ───────── */
  const NumberInput = ({ field, label }) => (
    <div className={styles.labelNumber}>
      <label>
        <p>{label}</p>
        <div className={styles.input}>
          <input
            type="text"
            value={numbers[field]}
            readOnly
            disabled={saving[field]}
          />
          <div className={styles.controles}>
            <div
              className={styles.aumentar}
              onClick={() => !saving[field] && changeNumber(field, +1)}
            >
              <RiArrowUpSLine />
            </div>
            <div
              className={styles.diminuir}
              onClick={() => !saving[field] && changeNumber(field, -1)}
            >
              <RiArrowDownSLine />
            </div>
          </div>
        </div>
      </label>
    </div>
  );

  return (
    <div className={styles.content}>
      <Toast ref={toast} position="top-right" />

      <div className={styles.head}>
        <div className={styles.headIcon}>
          <RiAlertLine />
        </div>

        <div className={styles.item}>
          <h5>Restrições</h5>
          <p>
            Selecione um edital e configure os limites de inscrições, bolsas e
            planos.
          </p>

          {/* Dropdown */}
          <label>
            <span className="mt-3 mr-2">Escolha o edital:</span>
            <Dropdown
              value={selectedEdital}
              options={options}
              onChange={(e) => setSelectedEdital(e.value)}
              placeholder="Selecione o edital"
              className="w-full md:w-20rem"
            />
          </label>

          {selectedEdital && loadingEdital && <p>Carregando edital…</p>}

          {selectedEdital && !loadingEdital && (
            <>
              {false && (
                <NumberInput
                  field="maxAlunosPorPlano"
                  label="Máx. alunos por plano:"
                />
              )}
              <NumberInput
                field="maxSolicitacaoBolsa"
                label="Máx. de solicitações de bolsa:"
              />
              <NumberInput
                field="maxPlanos"
                label="Máx. planos de trabalho por orientador:"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestricaoInscricao;

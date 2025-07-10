"use client";

import styles from "./ModalStyleInscricao.module.scss";
import {
  RiCalendarCheckFill,
  RiCalendarCloseLine,
  RiCalendarEventLine,
} from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast"; // ★
import { getEditais, getEdital, updateEdital } from "@/app/api/client/edital";
import PeriodoVigencia from "./PeriodoVigencia";

const PeriodoInscricao = ({ params }) => {
  /* ---------- estados ---------- */
  const [editais, setEditais] = useState([]);
  const [selectedEdital, setSelectedEdital] = useState(null);
  const [dates, setDates] = useState({ inicio: "", fim: "" });
  const [loadingEdital, setLoadingEdital] = useState(false);
  const [saving, setSaving] = useState({ inicio: false, fim: false });

  const toast = useRef(null); // ★ ref do Toast

  /* ---------- 1. lista ---------- */
  useEffect(() => {
    (async () => {
      try {
        setEditais(await getEditais(params.tenant, params.ano));
      } catch (e) {
        console.error(e);
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao buscar editais",
        });
      }
    })();
  }, [params.tenant, params.ano]);

  /* ---------- 2. detalhes ---------- */
  useEffect(() => {
    if (!selectedEdital) return;
    (async () => {
      setLoadingEdital(true);
      try {
        const ed = await getEdital(params.tenant, selectedEdital.id);
        setDates({
          inicio: ed?.inicioInscricao?.split("T")[0] || "",
          fim: ed?.fimInscricao?.split("T")[0] || "",
        });
      } catch (e) {
        console.error(e);
        toast.current?.show({
          severity: "error",
          summary: "Erro",
          detail: "Falha ao carregar edital",
        });
      } finally {
        setLoadingEdital(false);
      }
    })();
  }, [selectedEdital, params.tenant]);

  /* ---------- salva e mostra toast ---------- */
  const persistDate = async (field, value) => {
    if (!selectedEdital) return;
    const apiField = field === "inicio" ? "inicioInscricao" : "fimInscricao";
    setSaving((p) => ({ ...p, [field]: true }));
    try {
      await updateEdital(params.tenant, selectedEdital.id, {
        [apiField]: value ? `${value}T00:00:00.000Z` : null,
      });
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Data salva",
      });
    } catch (e) {
      console.error(e);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível salvar",
      });
    } finally {
      setSaving((p) => ({ ...p, [field]: false }));
    }
  };

  /* ---------- onChange ---------- */
  const handleDateChange = (field, value) => {
    setDates((p) => ({ ...p, [field]: value }));
    persistDate(field, value); // ★ grava na hora
  };

  /* ---------- opções ---------- */
  const options = editais.map((e) => ({
    label: `${e.titulo} (${e.ano})`,
    value: e,
  }));

  return (
    <>
      <div className={styles.content}>
        {/* Toast global */}
        <Toast ref={toast} position="top-right" />

        <div className={styles.head}>
          <div className={styles.headIcon}>
            <RiCalendarEventLine />
          </div>

          <div className={styles.item}>
            <h5>Período de Inscrições</h5>
            <p>Selecione um edital e defina início e fim das inscrições.</p>

            {/* Dropdown de editais */}
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
                {/* data de início */}
                <div className={styles.labelDate}>
                  <label>
                    <p>As inscrições começam dia:</p>
                    <div className={styles.input}>
                      <div className={styles.icon}>
                        <RiCalendarCheckFill />
                      </div>
                      <input
                        type="date"
                        value={dates.inicio}
                        onChange={(e) =>
                          handleDateChange("inicio", e.target.value)
                        }
                        disabled={saving.inicio}
                      />
                    </div>
                  </label>
                </div>

                {/* data de fim */}
                <div className={styles.labelDate}>
                  <label>
                    <p>As inscrições terminam dia:</p>
                    <div className={styles.input}>
                      <div className={styles.icon}>
                        <RiCalendarCloseLine />
                      </div>
                      <input
                        type="date"
                        value={dates.fim}
                        onChange={(e) =>
                          handleDateChange("fim", e.target.value)
                        }
                        disabled={saving.fim}
                      />
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <PeriodoVigencia params={params} />
    </>
  );
};

export default PeriodoInscricao;

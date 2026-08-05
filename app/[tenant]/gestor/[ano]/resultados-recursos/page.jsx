"use client";

import { useCallback, useEffect, useState } from "react";
import { RiScales3Line, RiToggleFill, RiToggleLine } from "@remixicon/react";

import styles from "./page.module.scss";
import Header from "@/components/Header";
import Skeleton from "@/components/Skeleton";
import NoData from "@/components/NoData";
import { getEditais, updateEdital } from "@/app/api/client/edital";
import { atualizarHabilitarRecurso } from "@/app/api/client/recurso";

const Page = ({ params }) => {
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const fetchEditais = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEditais(params.tenant, params.ano);
      setEditais(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar editais:", error);
    } finally {
      setLoading(false);
    }
  }, [params.tenant, params.ano]);

  useEffect(() => {
    fetchEditais();
  }, [fetchEditais]);

  // Usa sempre o edital retornado pelo backend para atualizar o estado local
  // (não só mescla o campo tocado): a cascata do backend (desligar resultado
  // desliga recurso) e a validação da invariante alteram campos que o front
  // não pediu explicitamente, então a resposta do servidor é a fonte da verdade.
  const handleToggleResultado = async (edital) => {
    const novoValor = !edital.habilitarResultados;
    setSavingId(edital.id);
    try {
      const editalAtualizado = await updateEdital(params.tenant, edital.id, {
        habilitarResultados: novoValor,
      });
      setEditais((prev) =>
        prev.map((e) => (e.id === edital.id ? { ...e, ...editalAtualizado } : e))
      );
    } catch (error) {
      console.error("Erro ao atualizar edital:", error);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleRecurso = async (edital) => {
    const novoValor = !edital.habilitarRecurso;
    setSavingId(edital.id);
    try {
      const editalAtualizado = await atualizarHabilitarRecurso(
        params.tenant,
        edital.id,
        novoValor
      );
      setEditais((prev) =>
        prev.map((e) => (e.id === edital.id ? { ...e, ...editalAtualizado } : e))
      );
    } catch (error) {
      console.error("Erro ao atualizar habilitação de recurso:", error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main>
      <Header
        className="mb-3"
        titulo="Resultados e Recursos"
        subtitulo={`Editais de ${params.ano}`}
        descricao="Controle, por edital deste ano, se o item “Resultados e Recursos” aparece para alunos e orientadores."
      />

      <div className={styles.list}>
        {loading ? (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        ) : editais.length > 0 ? (
          editais.map((edital) => (
            <div className={styles.item} key={edital.id}>
              <div className={styles.itemInfo}>
                <div className={styles.icon}>
                  <RiScales3Line />
                </div>
                <div>
                  <h6>{edital.titulo}</h6>
                  <p>{edital.ano}</p>
                </div>
              </div>
              <div className={styles.toggles}>
                <div className={styles.toggleGroup}>
                  <span className={styles.toggleGroupLabel}>Resultado</span>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${
                      edital.habilitarResultados ? styles.toggleAtivo : ""
                    }`}
                    onClick={() => handleToggleResultado(edital)}
                    disabled={savingId === edital.id}
                  >
                    {edital.habilitarResultados ? (
                      <RiToggleFill size={28} />
                    ) : (
                      <RiToggleLine size={28} />
                    )}
                    <span>
                      {edital.habilitarResultados ? "Habilitado" : "Desabilitado"}
                    </span>
                  </button>
                </div>
                <div className={styles.toggleGroup}>
                  <span className={styles.toggleGroupLabel}>Recurso</span>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${
                      edital.habilitarRecurso ? styles.toggleAtivo : ""
                    }`}
                    onClick={() => handleToggleRecurso(edital)}
                    disabled={savingId === edital.id || !edital.habilitarResultados}
                    title={
                      !edital.habilitarResultados
                        ? "Habilite a divulgação do resultado antes de habilitar recurso"
                        : undefined
                    }
                  >
                    {edital.habilitarRecurso ? (
                      <RiToggleFill size={28} />
                    ) : (
                      <RiToggleLine size={28} />
                    )}
                    <span>
                      {edital.habilitarRecurso ? "Habilitado" : "Desabilitado"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <NoData description={`Nenhum edital encontrado em ${params.ano}.`} />
        )}
      </div>
    </main>
  );
};

export default Page;

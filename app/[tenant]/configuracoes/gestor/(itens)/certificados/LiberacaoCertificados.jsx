"use client";
import { useEffect, useState } from "react";
import { RiAwardLine, RiToggleFill, RiToggleLine } from "@remixicon/react";
import Skeleton from "@/components/Skeleton";
import NoData from "@/components/NoData";
import { atualizarLiberarCertificado, getEditais } from "@/app/api/client/edital";
import styles from "./LiberacaoCertificados.module.scss";

// Liga/desliga, por edital, a emissão do certificado de conclusão dos planos.
// Mesmo padrão de toggle de gestor/[ano]/resultados-recursos.

const LiberacaoCertificados = ({ tenant }) => {
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const fetchEditais = async () => {
      setLoading(true);
      try {
        const data = await getEditais(tenant);
        setEditais(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar editais:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEditais();
  }, [tenant]);

  const handleToggle = async (edital) => {
    setSavingId(edital.id);
    setErro(null);
    try {
      const atualizado = await atualizarLiberarCertificado(tenant, edital.id, !edital.liberarCertificado);
      setEditais((prev) => prev.map((e) => (e.id === edital.id ? { ...e, ...atualizado } : e)));
    } catch (error) {
      console.error("Erro ao atualizar liberação de certificado:", error);
      setErro(`Não foi possível atualizar o edital ${edital.titulo} (${edital.ano}).`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={styles.secao}>
      <h5>Liberação do certificado de conclusão</h5>
      <p className={styles.descricao}>
        Com a liberação ligada, alunos e orientadores dos planos do edital conseguem emitir o certificado de
        conclusão — desde que todas as atividades do plano estejam concluídas ou dispensadas e, se o edital
        exigir apresentação em evento, o aluno tenha apresentado ou tenha justificativa aceita.
      </p>
      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.list}>
        {loading ? (
          <>
            <Skeleton />
            <Skeleton />
          </>
        ) : editais.length > 0 ? (
          editais.map((edital) => (
            <div className={styles.item} key={edital.id}>
              <div className={styles.itemInfo}>
                <div className={styles.icon}>
                  <RiAwardLine />
                </div>
                <div>
                  <h6>{edital.titulo}</h6>
                  <p>{edital.ano}</p>
                </div>
              </div>
              <button
                type="button"
                className={`${styles.toggleBtn} ${edital.liberarCertificado ? styles.toggleAtivo : ""}`}
                onClick={() => handleToggle(edital)}
                disabled={savingId === edital.id}
              >
                {edital.liberarCertificado ? <RiToggleFill size={28} /> : <RiToggleLine size={28} />}
                <span>{edital.liberarCertificado ? "Liberado" : "Bloqueado"}</span>
              </button>
            </div>
          ))
        ) : (
          <NoData description="Nenhum edital encontrado." />
        )}
      </div>
    </section>
  );
};

export default LiberacaoCertificados;

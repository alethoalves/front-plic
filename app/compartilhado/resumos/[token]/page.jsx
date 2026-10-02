"use client";
import { useState, useEffect } from "react";
import { getCompartilhamentoResumosPublico } from "@/app/api/client/compartilhamentoResumos";
import RelatorioResumosAvaliacoes from "@/components/evento/RelatorioResumosAvaliacoes";
import styles from "./page.module.scss";

const Page = ({ params }) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        setDados(await getCompartilhamentoResumosPublico(params.token));
      } catch (err) {
        const status = err?.response?.status;
        if (status === 410) {
          setError("Este link expirou ou foi revogado pelo responsável. Solicite um novo link.");
        } else if (status === 404) {
          setError("Este link é inválido.");
        } else {
          setError("Erro ao carregar o conteúdo. Tente novamente.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [params.token]);

  if (loading) {
    return (
      <div className={styles.centralized}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centralized}>
        <div className={styles.errorCard}>
          <p className={styles.errorMsg}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <RelatorioResumosAvaliacoes
      token={params.token}
      nomeEvento={dados.evento?.nome}
      recorte={dados.recorte}
      filtros={dados.filtros}
      exibicaoComentarios={dados.exibicaoComentarios}
      permitirFeedback={dados.permitirFeedback}
      validade={dados.validade}
      submissoes={dados.submissoes || []}
    />
  );
};

export default Page;

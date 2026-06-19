"use client";
import { useState, useEffect } from "react";
import { getResultadosPublicos } from "@/app/api/client/questionarioSatisfacao";
import QuestionarioResultados from "@/components/QuestionarioResultados";
import styles from "./page.module.scss";

const Page = ({ params }) => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const data = await getResultadosPublicos(params.token);
        setDados(data);
      } catch (err) {
        if (err?.response?.status === 404) {
          setError("Este link é inválido ou foi desativado pelo responsável.");
        } else {
          setError("Erro ao carregar os resultados. Tente novamente.");
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
        <p>Carregando resultados...</p>
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
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>{dados.titulo}</h1>
        {dados.descricao && <p className={styles.descricao}>{dados.descricao}</p>}
        <p className={styles.aviso}>
          Resultados públicos — visualização somente leitura
        </p>
      </header>

      <div className={styles.content}>
        <QuestionarioResultados
          titulo={dados.titulo}
          descricao={dados.descricao}
          schema={dados.schema}
          respostas={dados.respostas}
        />
      </div>
    </main>
  );
};

export default Page;

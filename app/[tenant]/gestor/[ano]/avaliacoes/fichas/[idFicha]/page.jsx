"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import Header from "@/components/Header";
import NoData from "@/components/NoData";
import { getFichaAvaliacaoDetalheGestor } from "@/app/api/client/avaliador";
import { rotuloValor } from "@/lib/fichaAvaliacaoScoring";

/** Renderiza (somente leitura) a árvore de respostas salva em FichaAvaliacao.respostas. */
const renderRespostas = (nos) =>
  (nos || []).map((no) =>
    no.tipo === "grupo" ? (
      <div key={no.id} className={styles.quesito}>
        <p className={styles.label}>
          <strong>{no.label}</strong> ({no.pontosObtidos}/{no.pontosMaximos} pts)
        </p>
        {renderRespostas(no.itens)}
      </div>
    ) : (
      <div key={no.id} className={styles.quesito}>
        <p className={styles.label}>{no.label}</p>
        <p className={styles.nota}>
          Resposta: {rotuloValor(no.escala, no.valorSelecionado)}
          <strong> | Pontos: {no.pontosObtidos}/{no.peso}</strong>
        </p>
      </div>
    )
  );

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [ficha, setFicha] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getFichaAvaliacaoDetalheGestor(
          params.tenant,
          params.idFicha
        );
        setFicha(data);
      } catch (err) {
        console.error("Erro ao buscar ficha:", err);
        setError("Erro ao carregar a ficha de avaliação.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idFicha]);

  if (loading || error || !ficha) {
    return (
      <div className={styles.noData}>
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : (
          <NoData description={error || "Ficha não encontrada."} />
        )}
      </div>
    );
  }

  return (
    <div className={styles.navContent}>
      <Header className="mb-3" titulo="Ficha de Avaliação" />

      <div className={styles.squares}>
        <div className={`${styles.square} ${styles.squareWarning}`}>
          <div className={styles.squareContent}>
            <div className={styles.info}>
              <p className={styles.area}>
                {ficha.area?.area || "sem área"} —{" "}
                {ficha.edital?.tenant?.sigla?.toUpperCase()} —{" "}
                {ficha.edital?.titulo?.toUpperCase()}
              </p>
            </div>
            <div className={styles.submissaoData}>
              <h6>{ficha.titulo}</h6>
              <p>
                Avaliador: <strong>{ficha.avaliador?.nome}</strong>
              </p>
            </div>
          </div>

          <div className={styles.quesitos}>
            <div className={styles.quesito}>
              <p className={`${styles.label} text-align-right`}>
                <strong>Nota Final: {ficha.notaTotal}</strong>
              </p>
            </div>
            <div className={styles.quesito}>
              <p className={styles.label}>
                Observação:
                <br />
                <strong>{ficha.observacao}</strong>
              </p>
            </div>
            {renderRespostas(ficha.respostas)}
          </div>

          {ficha.planos?.length > 0 && (
            <div className={styles.subPlanos}>
              <h6 className="mt-3">Planos de trabalho vinculados</h6>
              {ficha.planos.map((plano) => (
                <div
                  key={plano.id}
                  className={`${styles.square} ${styles.squareInfo}`}
                >
                  <div className={styles.squareContent}>
                    <div className={styles.info}>
                      <p className={styles.area}>
                        {plano.area?.area || "sem área"}
                      </p>
                    </div>
                    <div className={styles.submissaoData}>
                      <h6>{plano.titulo}</h6>
                    </div>
                  </div>

                  <div className={styles.quesitos}>
                    <div className={styles.quesito}>
                      <p className={`${styles.label} text-align-right`}>
                        <strong>Nota Final: {plano.notaTotal}</strong>
                      </p>
                    </div>
                    {renderRespostas(plano.respostas)}
                    <div className={styles.quesito}>
                      <p className={styles.label}>
                        Observação:
                        <br />
                        <strong>{plano.observacao}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;

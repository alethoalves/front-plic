"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.scss";
import { Tag } from "primereact/tag";
import Header from "@/components/Header";
import NoData from "@/components/NoData";
import { getFichaAvaliacaoDetalheGestor } from "@/app/api/client/avaliador";
import { rotuloValor } from "@/lib/fichaAvaliacaoScoring";

// Severidade do Tag de resposta a partir da fração de pontos obtidos — funciona
// pra qualquer tipo de escala (binária, likert, numérica...), já que não depende
// do texto do rótulo, só da proporção pontosObtidos/peso.
const severidadePontos = (pontosObtidos, peso) => {
  if (!peso) return "info";
  const fracao = pontosObtidos / peso;
  if (fracao >= 1) return "success";
  if (fracao <= 0) return "danger";
  return "warning";
};

/** Renderiza (somente leitura) a árvore de respostas salva em FichaAvaliacao.respostas. */
const renderRespostas = (nos) =>
  (nos || []).map((no) =>
    no.tipo === "grupo" ? (
      <div key={no.id} className={styles.grupo}>
        <div className={styles.grupoHeader}>
          <p className={styles.grupoLabel}>{no.label}</p>
          <p className={styles.grupoPontos}>
            {no.pontosObtidos}/{no.pontosMaximos} pts
          </p>
        </div>
        <div className={styles.grupoItens}>{renderRespostas(no.itens)}</div>
      </div>
    ) : (
      <div key={no.id} className={styles.criterio}>
        <p className={styles.criterioPergunta}>{no.label}</p>
        <div className={styles.criterioResposta}>
          <Tag rounded severity={severidadePontos(no.pontosObtidos, no.peso)}>
            {rotuloValor(no.escala, no.valorSelecionado)}
          </Tag>
          <span className={styles.respostaPontos}>
            {no.pontosObtidos}/{no.peso} pts
          </span>
        </div>
        {no.comentario && (
          <p className={styles.criterioComentario}>
            <strong>Comentário:</strong> {no.comentario}
          </p>
        )}
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
            <div className={styles.notaFinalBox}>
              <p className={styles.notaFinalLabel}>Nota Final</p>
              <p className={styles.notaFinalValor}>{ficha.notaTotal}</p>
            </div>
            {ficha.observacao && (
              <div className={styles.observacao}>
                <p className={styles.observacaoLabel}>Observação</p>
                <p>{ficha.observacao}</p>
              </div>
            )}
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
                    <div className={styles.notaFinalBox}>
                      <p className={styles.notaFinalLabel}>Nota Final</p>
                      <p className={styles.notaFinalValor}>
                        {plano.notaTotal}
                      </p>
                    </div>
                    {renderRespostas(plano.respostas)}
                    {plano.observacao && (
                      <div className={styles.observacao}>
                        <p className={styles.observacaoLabel}>Observação</p>
                        <p>{plano.observacao}</p>
                      </div>
                    )}
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

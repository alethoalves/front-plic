"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NoData from "@/components/NoData";
import { getFichasAvaliacoesEvento } from "@/app/api/client/submissaoAvaliador";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [avaliacoes, setAvalaliacoes] = useState([]);
  const [accordionAberto, setAccordionAberto] = useState(null);

  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log(params.edicao);
      const avaliacoesData = await getFichasAvaliacoesEvento(params.edicao);
      console.log(avaliacoesData);
      setAvalaliacoes(avaliacoesData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleAccordion = (id) => {
    setAccordionAberto(accordionAberto === id ? null : id);
  };

  return (
    <>
      <div className={styles.navContent}>
        {/* Cabeçalho estilizado com contador */}
        <div className={styles.headerAvaliacoes}>
          <div className={styles.tituloContainer}>
            <h1 className={styles.tituloPrincipal}>Projetos Avaliados</h1>
            <div className={styles.contadorAvaliacoes}>
              <span className={styles.numeroContador}>{avaliacoes.length}</span>
              <span className={styles.textoContador}>
                {avaliacoes.length === 1
                  ? "avaliação realizada"
                  : "avaliações realizadas"}
              </span>
            </div>
          </div>
          <p className={styles.subtitulo}>
            Visualize todas as suas avaliações realizadas neste evento
          </p>
        </div>

        {avaliacoes?.length > 0 && (
          <div className={`${styles.squares} ${styles.minhasAvaliacoes}`}>
            {avaliacoes.map((item) => (
              <div
                key={item.id}
                className={`${styles.square} ${styles.squareWarning} ${styles.accordionItem}`}
              >
                <div
                  onClick={() => toggleAccordion(item.id)}
                  className={`${styles.accordionHeader} ${styles.squareContent}`}
                >
                  <div className={styles.accordionHeaderContent}>
                    <div className={styles.info}>
                      <div>
                        <p className={styles.area}>
                          {item?.area?.area || "sem área"} -{" "}
                          {getInstituicaoSigla(item)} -{" "}
                          {item?.categoria?.toUpperCase()}
                        </p>
                        <h6 className={`mt-1 ${styles.tituloProjeto}`}>
                          ID {item.submissaoId} - {item?.titulo}
                        </h6>
                      </div>
                    </div>
                    <div className={styles.submissaoData}>
                      <div className={styles.notaFinalHeader}>
                        Nota Final: <strong>{item.notaTotal}</strong>
                      </div>
                    </div>
                  </div>
                  <div className={styles.accordionIndicator}>
                    {accordionAberto === item.id ? "▲" : "▼"}
                  </div>
                  {error[item.id] && (
                    <div className={styles.error}>
                      <p>{error[item.id]}</p>
                    </div>
                  )}
                </div>

                {accordionAberto === item.id && (
                  <div className={styles.accordionContent}>
                    <div className={styles.indicacoesContainer}>
                      {(item.indicacaoPremio ||
                        item.mencaoHonrosa ||
                        item.premio) && (
                        <div className={styles.indicacoes}>
                          <h6>Indicações e Premiações</h6>
                          <div className={styles.indicacoesLista}>
                            {item.indicacaoPremio && (
                              <span className={styles.indicacaoItem}>
                                ⭐ Indicação a Prêmio
                              </span>
                            )}
                            {item.mencaoHonrosa && (
                              <span className={styles.indicacaoItem}>
                                🏅 Menção Honrosa
                              </span>
                            )}
                            {item.premio && (
                              <span className={styles.indicacaoItem}>
                                🏆 Premiado
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.quesitos}>
                      {item.registros?.map((registro) => (
                        <div key={registro.id} className={styles.quesito}>
                          <div className={styles.quesitoHeader}>
                            <h6>{registro.titulo}</h6>
                            <span className={styles.notaQuesito}>
                              Nota: {registro.nota}
                            </span>
                          </div>
                          {registro.descricao && (
                            <p className={styles.descricaoQuesito}>
                              {registro.descricao}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Campo de Observação - aparece apenas se houver conteúdo */}
                    {item.observacao && (
                      <div className={styles.observacaoContainer}>
                        <h6>Observações do Avaliador</h6>
                        <div className={styles.observacaoBox}>
                          <p className={styles.observacaoTexto}>
                            {item.observacao}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className={styles.metadados}>
                      <p>
                        <strong>Evento:</strong> {item.evento.nomeEvento} (
                        {item.evento.edicaoEvento})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {(!avaliacoes || avaliacoes.length === 0) && (
          <div className={styles.noData}>
            {loading && <p className="p-4">Carregando...</p>}
            {!loading && (
              <NoData description="Não há projetos avaliados no ano corrente" />
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Page;

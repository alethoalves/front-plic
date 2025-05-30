"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFichasAvaliacaoProjeto } from "@/app/api/client/avaliador";
import NoData from "@/components/NoData";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [fichasAvaliacaoProjeto, setFichasAvaliacaoProjeto] = useState([]);
  const [mostrarNotas, setMostrarNotas] = useState({});

  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const fichasProjeto = await getFichasAvaliacaoProjeto(params.tenant);
      setFichasAvaliacaoProjeto(fichasProjeto);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleNotas = (id) => {
    setMostrarNotas((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      <div className={styles.navContent}>
        <h6 className="mb-1">Projetos avaliados</h6>

        {fichasAvaliacaoProjeto?.length > 0 && (
          <div className={`${styles.squares} ${styles.minhasAvaliacoes}`}>
            {fichasAvaliacaoProjeto.map((item) => (
              <div
                key={item.id}
                className={`${styles.square} ${styles.squareWarning}`}
              >
                <div
                  onClick={() => toggleNotas(item.id)}
                  className={styles.squareContent}
                >
                  <div className={styles.info}>
                    <p className={styles.area}>
                      {item?.area?.area || "sem área"} -{" "}
                      {item?.edital?.tenant?.sigla?.toUpperCase()} -{" "}
                      {item?.edital?.titulo?.toUpperCase()}
                    </p>
                  </div>
                  <div className={styles.submissaoData}>
                    <h6>{item?.titulo}</h6>
                  </div>
                  {error[item.id] && (
                    <div className={styles.error}>
                      <p>{error[item.id]}</p>
                    </div>
                  )}
                </div>

                {mostrarNotas[item.id] && (
                  <>
                    <div className={styles.quesitos}>
                      <div className={styles.quesito}>
                        <p className={`${styles.label} text-align-right`}>
                          <strong>Nota Final: {item.notaTotal}</strong>
                        </p>
                      </div>
                      <div className={styles.quesito}>
                        <p className={styles.label}>
                          Observação:
                          <br />
                          <strong>{item.observacao}</strong>
                        </p>
                      </div>
                      {item.RegistroFichaAvaliacao?.map((registro) => (
                        <div key={registro.id} className={styles.quesito}>
                          <p className={styles.label}>{registro.label}</p>
                          <p className={styles.nota}>
                            Peso: {registro.peso} | Nota: {registro.nota}
                            <strong>
                              {" "}
                              | Nota final: {registro.nota * registro.peso}
                            </strong>
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Renderiza fichas de planos de trabalho */}
                    {item.planos?.length > 0 && (
                      <div className={styles.subPlanos}>
                        <h6 className="mt-3">Planos de trabalho vinculados</h6>
                        {item.planos.map((plano) => (
                          <div
                            key={plano.id}
                            className={`${styles.square} ${styles.squareInfo}`}
                          >
                            <div
                              onClick={() => toggleNotas(plano.id)}
                              className={styles.squareContent}
                            >
                              <div className={styles.info}>
                                <p className={styles.area}>
                                  {plano?.area?.area || "sem área"}
                                </p>
                              </div>
                              <div className={styles.submissaoData}>
                                <h6>{plano.titulo}</h6>
                              </div>
                              {error[plano.id] && (
                                <div className={styles.error}>
                                  <p>{error[plano.id]}</p>
                                </div>
                              )}
                            </div>

                            {mostrarNotas[plano.id] && (
                              <div className={styles.quesitos}>
                                <div className={styles.quesito}>
                                  <p
                                    className={`${styles.label} text-align-right`}
                                  >
                                    <strong>
                                      Nota Final: {plano.notaTotal}
                                    </strong>
                                  </p>
                                </div>
                                <div className={styles.quesito}>
                                  <p className={styles.label}>
                                    Observação:
                                    <br />
                                    <strong>{plano.observacao}</strong>
                                  </p>
                                </div>
                                {plano.RegistroFichaAvaliacao?.map(
                                  (registro) => (
                                    <div
                                      key={registro.id}
                                      className={styles.quesito}
                                    >
                                      <p className={styles.label}>
                                        {registro.label}
                                      </p>
                                      <p className={styles.nota}>
                                        Peso: {registro.peso} | Nota:{" "}
                                        {registro.nota}
                                        <strong>
                                          {" "}
                                          | Nota final:{" "}
                                          {registro.nota * registro.peso}
                                        </strong>
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {(!fichasAvaliacaoProjeto || fichasAvaliacaoProjeto.length === 0) && (
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

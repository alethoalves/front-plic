"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiEyeLine } from "@remixicon/react";
import {
  getFichasAvaliacaoProjeto,
  getProjetosAguardandoAvaliacao,
  getProjetosEmAvaliacao,
} from "@/app/api/client/avaliador";
import NoData from "@/components/NoData";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({}); // Erros individuais por submissão
  const [submissoes, setSubmissoes] = useState({
    submissoesData: [],
    areasPendentesDeAvaliacao: {},
  }); // Estado para submissões e áreas pendentes de avaliação
  const [submissoesEmAvaliacao, setSubmissoesEmAvaliacao] = useState([]);
  const [filteredSubmissoes, setFilteredSubmissoes] = useState([]); // Submissões filtradas exibidas
  const [fichasAvaliacaoProjeto, setFichasAvaliacaoProjeto] = useState([]); // Submissões filtradas exibidas

  const router = useRouter();

  // Função de busca dos dados ao renderizar o componente
  const fetchData = async () => {
    setLoading(true);
    try {
      const fichasProjeto = await getFichasAvaliacaoProjeto(params.tenant);
      setFichasAvaliacaoProjeto(fichasProjeto);
      const data = await getProjetosAguardandoAvaliacao(params.tenant);
      setSubmissoes(data);
      setFilteredSubmissoes(data.submissoesData); // Inicializa com todas as submissões
      const submissaoEmAvaliacao = await getProjetosEmAvaliacao(params.tenant);
      setSubmissoesEmAvaliacao(submissaoEmAvaliacao);
      console.log(submissaoEmAvaliacao);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Inicializa sem filtros
  }, []);
  const [mostrarNotas, setMostrarNotas] = useState({});
  const toggleNotas = (id) => {
    setMostrarNotas((prevState) => ({
      ...prevState,
      [id]: !prevState[id], // Alterna entre true e false para o id da ficha
    }));
  };
  return (
    <>
      <div className={styles.navContent}>
        <h6 className="mb-1">Projetos avaliados</h6>
        {fichasAvaliacaoProjeto && fichasAvaliacaoProjeto.length > 0 && (
          <>
            <div className={`${styles.squares} ${styles.minhasAvaliacoes}`}>
              {fichasAvaliacaoProjeto.length > 0 &&
                fichasAvaliacaoProjeto.map((item, index) => (
                  <>
                    <div
                      key={index}
                      className={`${styles.square}  ${styles.squareWarning}`}
                    >
                      <div
                        onClick={() => toggleNotas(item.id)}
                        className={styles.squareContent}
                      >
                        <div className={styles.info}>
                          <p className={styles.area}>
                            {item?.projeto?.projeto?.area?.area || "sem área"} -{" "}
                            {item?.projeto?.inscricao?.edital?.tenant?.sigla.toUpperCase()}{" "}
                            -{" "}
                            {item?.projeto?.inscricao?.edital?.titulo.toUpperCase()}
                          </p>
                        </div>
                        <div className={styles.submissaoData}>
                          <h6>{item?.projeto?.projeto?.titulo}</h6>
                        </div>
                        {error[item.id] && (
                          <div className={styles.error}>
                            <p>{error[item.id]}</p>
                          </div>
                        )}
                      </div>

                      {mostrarNotas[item.id] && ( // Renderiza as notas se mostrarNotas[item.id] for true
                        <div className={styles.quesitos}>
                          <div className={styles.quesito}>
                            <p className={`${styles.label} text-align-right`}>
                              <strong>
                                Nota Final:
                                {item.notaTotal}
                              </strong>
                            </p>
                          </div>
                          <div className={styles.quesito}>
                            <p className={styles.label}>
                              Observação:<br></br>
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
                      )}
                    </div>
                  </>
                ))}
            </div>
          </>
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

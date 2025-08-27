import { useEffect, useState } from "react";
import Button from "@/components/Button";
import styles from "./VerInscricao.module.scss";
import {
  getInscricaoUserById,
  submissaoInscricao,
} from "@/app/api/client/inscricao";
import { RiAlertLine } from "@remixicon/react";
import { useRouter } from "next/navigation";

const VerInscricao = ({ inscricaoSelected, tenant, setErrors, onClose }) => {
  const [inscricao, setInscricao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false); // Novo estado para controlar a exibição do erro
  const [errorMessage, setErrorMessage] = useState(""); // Novo estado para armazenar a mensagem de erro
  const [apiErrors, setApiErrors] = useState([]);
  const router = useRouter();

  const handleSubmitInscricao = async () => {
    setSubmitting(true);
    setApiErrors([]); // Limpa os erros anteriores
    try {
      await submissaoInscricao(tenant, inscricaoSelected);
      alert("Inscrição enviada com sucesso!");
      setErrors([]);
      router.push(
        `/${tenant}/user/editais/inscricoes/${inscricaoSelected}/acompanhamento`
      );
    } catch (error) {
      console.error("Erro ao enviar a inscrição:", error);

      if (Array.isArray(error.response?.data?.errors)) {
        setErrors(error.response.data.errors);
        setApiErrors(error.response.data.errors); // Armazena os erros para exibição
      } else {
        setApiErrors([
          error.message ||
            "Ocorreu um erro inesperado ao enviar sua inscrição. Por favor, tente novamente mais tarde.",
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getInscricaoUserById(tenant, inscricaoSelected);
        setInscricao(response);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, inscricaoSelected]);

  if (loading) return <p>Carregando...</p>;
  if (notFound) return <p>Inscrição não encontrada.</p>;

  return (
    <>
      {inscricao && (
        <div className={styles.detalhesProjeto}>
          <h6>Inscrição ID {inscricao.id}</h6>

          {/* Renderiza um bloco completo para cada erro */}
          {apiErrors.map((errorMsg, index) => (
            <div key={index} className={`${styles.pendente} mb-1 mt-2`}>
              <RiAlertLine />
              <p>{errorMsg}</p>
            </div>
          ))}

          {/* Botão de Enviar */}
          <Button className="btn-primary mt-2" onClick={handleSubmitInscricao}>
            {submitting ? "Enviando..." : "Finalizar a inscrição"}
          </Button>
          {/* Exibe Edital */}
          <div className={`${styles.conteudo} ${styles.fadeIn}`}>
            <div className={`${styles.card}`}>
              <h6 className={`${styles.label}`}>Edital</h6>
              <div className={`${styles.value}`}>
                <p>
                  {inscricao.edital.titulo} - {inscricao.edital.ano}
                </p>
              </div>
            </div>
          </div>

          {/* Exibe Projetos e seus subcards */}
          {inscricao.InscricaoProjeto.map((item, index) => {
            const planosDoProjeto = inscricao.planosDeTrabalho.filter(
              (plano) => plano.projetoId === item.projeto.id
            );

            return (
              <div key={index}>
                {/* Exibe o Projeto */}
                <div className={`${styles.conteudo} ${styles.fadeIn}`}>
                  <div className={`${styles.card}`}>
                    <h6 className={`${styles.label}`}>Projeto {index + 1}</h6>
                    <div className={`${styles.value}`}>
                      <p>
                        <strong>Título: </strong>
                        {item.projeto.titulo}
                      </p>
                      <p>
                        <strong>Área: </strong>
                        {item.projeto.area.area}
                      </p>

                      {/* Exibe Conteúdo do Projeto dentro do card pai */}
                      <div className={`${styles.conteudo} ${styles.fadeIn}`}>
                        {item.projeto.Resposta.sort(
                          (a, b) => a.campo.ordem - b.campo.ordem
                        ).map((item) => {
                          // Função para extrair o nome do arquivo da URL
                          const extractFileName = (url) => {
                            const parts = url.split("/");
                            const lastPart = parts[parts.length - 1];
                            return lastPart.split("_")[1] || lastPart; // Remove o timestamp inicial
                          };

                          return (
                            <div className={`${styles.card}`} key={item.id}>
                              <h6 className={`${styles.label}`}>
                                {item.campo.label}
                              </h6>
                              <div className={`${styles.value}`}>
                                {["link", "arquivo"].includes(
                                  item.campo.tipo
                                ) ? (
                                  <a
                                    href={item.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.link}
                                  >
                                    {item.campo.tipo === "arquivo" && "📁 "}
                                    {item.campo.tipo === "link" && "🔗 "}
                                    {extractFileName(item.value)}
                                  </a>
                                ) : (
                                  <p style={{ whiteSpace: "pre-wrap" }}>
                                    {item.value}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Exibe Cronograma do Projeto dentro do card pai */}
                      <div className={`${styles.conteudo} ${styles.fadeIn}`}>
                        <div className={`${styles.card}`}>
                          <h6 className={`${styles.label}`}>
                            Cronograma do projeto
                          </h6>
                          {item.projeto.CronogramaProjeto.sort(
                            (a, b) => new Date(a.inicio) - new Date(b.inicio)
                          ).map((atividade, i) => (
                            <div key={i} className={`${styles.value}`}>
                              <p>
                                <strong>{atividade.inicio}</strong> a{" "}
                                <strong>{atividade.fim}</strong> -{" "}
                                {atividade.atividade}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Exibe Planos de Trabalho dentro do card pai */}
                      {planosDoProjeto.map((plano, planoIndex) => (
                        <div
                          key={planoIndex}
                          className={`${styles.conteudo} ${styles.fadeIn}`}
                        >
                          <div className={`${styles.card}`}>
                            <h6 className={`${styles.label}`}>
                              Plano de Trabalho {planoIndex + 1}
                            </h6>
                            <div className={`${styles.value}`}>
                              <p>
                                <strong>Título: </strong>
                                {plano.titulo}
                              </p>
                              <p>
                                <strong>Área: </strong>
                                {plano.area.area}
                              </p>
                              <p>
                                <strong>Aluno(s): </strong>
                                {plano.participacoes
                                  .map((i) => i.user.nome)
                                  .join(", ")}
                              </p>

                              {plano.Resposta.sort(
                                (a, b) => a.campo.ordem - b.campo.ordem
                              ).map((item) => {
                                // Função para extrair o nome do arquivo da URL
                                const extractFileName = (url) => {
                                  const parts = url.split("/");
                                  const lastPart = parts[parts.length - 1];
                                  return lastPart.split("_")[1] || lastPart;
                                };

                                return (
                                  <div
                                    className={`${styles.card}`}
                                    key={item.id}
                                  >
                                    <h6 className={`${styles.label}`}>
                                      {item.campo.label}
                                    </h6>
                                    <div className={`${styles.value}`}>
                                      {["link", "arquivo"].includes(
                                        item.campo.tipo
                                      ) ? (
                                        <a
                                          href={item.value}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={styles.link}
                                        >
                                          {item.campo.tipo === "arquivo" &&
                                            "📁 "}
                                          {item.campo.tipo === "link" && "🔗 "}
                                          {extractFileName(item.value)}
                                        </a>
                                      ) : (
                                        <p style={{ whiteSpace: "pre-wrap" }}>
                                          {item.value}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default VerInscricao;

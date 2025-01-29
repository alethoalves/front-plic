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
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1);
  };
  const handleSubmitInscricao = async () => {
    setSubmitting(true);
    try {
      await submissaoInscricao(tenant, inscricaoSelected);
      alert("Inscrição enviada com sucesso!");
      setErrors([]); // Limpa os erros após o envio bem-sucedido
      router.push(
        `/${tenant}/user/editais/inscricoes/${inscricaoSelected}/acompanhamento`
      );
    } catch (error) {
      console.error("Erro ao enviar a inscrição:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(
          "Erro ao enviar a inscrição. Verifique os dados e tente novamente."
        );
      }
      onClose();
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

  // Calcula o total de passos
  const totalSteps =
    inscricao && inscricao.InscricaoProjeto
      ? 1 + // Passo do edital
        inscricao.InscricaoProjeto.length * 3 + // Passos dos projetos (título, conteúdo, cronograma)
        inscricao.InscricaoProjeto.reduce(
          (acc, item) =>
            acc +
            (inscricao.planosDeTrabalho.filter(
              (plano) => plano.projetoId === item.projeto.id
            ).length || 0),
          0
        ) // Passos dos planos de trabalho
      : 0;

  return (
    <>
      {inscricao && (
        <div className={styles.detalhesProjeto}>
          <h6>Inscrição ID {inscricao.id}</h6>

          {/* Exibe Edital */}
          {step >= 0 && (
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
          )}

          {/* Exibe Projetos e seus subcards */}
          {inscricao.InscricaoProjeto.map((item, index) => {
            const planosDoProjeto = inscricao.planosDeTrabalho.filter(
              (plano) => plano.projetoId === item.projeto.id
            );

            // Calcula o passo inicial para cada projeto
            const projectStartStep =
              1 +
              index * (3 + planosDoProjeto.length) +
              inscricao.InscricaoProjeto.slice(0, index).reduce(
                (acc, projeto) =>
                  acc +
                  inscricao.planosDeTrabalho.filter(
                    (plano) => plano.projetoId === projeto.projeto.id
                  ).length,
                0
              );

            return (
              <div key={index}>
                {/* Exibe o Projeto */}
                {step >= projectStartStep && (
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
                        {step >= projectStartStep + 1 && (
                          <div
                            className={`${styles.conteudo} ${styles.fadeIn}`}
                          >
                            <div className={`${styles.card}`}>
                              <h6 className={`${styles.label}`}>
                                Conteúdo do projeto
                              </h6>
                              <div className={`${styles.value}`}>
                                <p>{item.projeto.introducao}</p>
                                <p>{item.projeto.justificativa}</p>
                                <p>{item.projeto.metodologia}</p>
                                <p>{item.projeto.objetivos}</p>
                                <p>{item.projeto.referencias}</p>
                                <p>{item.projeto.resultados}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Exibe Cronograma do Projeto dentro do card pai */}
                        {step >= projectStartStep + 2 && (
                          <div
                            className={`${styles.conteudo} ${styles.fadeIn}`}
                          >
                            <div className={`${styles.card}`}>
                              <h6 className={`${styles.label}`}>
                                Cronograma do projeto
                              </h6>
                              {item.projeto.CronogramaProjeto.sort(
                                (a, b) =>
                                  new Date(a.inicio) - new Date(b.inicio)
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
                        )}

                        {/* Exibe Planos de Trabalho dentro do card pai */}
                        {planosDoProjeto.map(
                          (plano, planoIndex) =>
                            step >= projectStartStep + 3 + planoIndex && (
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
                                    <p>
                                      <strong>Conteúdo: </strong>
                                      {plano.conteudo}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {step >= totalSteps && (
            <div className={`${styles.pendente} mb-1 mt-2`}>
              <RiAlertLine />
              <p>
                Ao clicar no botão abaixo você não poderá mais fazer qualquer
                alteração na sua inscrição.
              </p>
            </div>
          )}
          {/* Botão de Avançar */}
          <Button
            className="btn-primary mt-2"
            onClick={() => {
              !(step >= totalSteps)
                ? handleNextStep()
                : handleSubmitInscricao();
            }}
            // disabled={step >= totalSteps}
          >
            {step >= totalSteps
              ? submitting
                ? "Enviando..."
                : "Enviar a inscrição"
              : step === 0
              ? "Iniciar revisão da inscrição"
              : "Aprovar"}
          </Button>
        </div>
      )}
    </>
  );
};

export default VerInscricao;

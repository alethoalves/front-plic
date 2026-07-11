"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getFichaAvaliacao,
  getProjetoParaAvaliar,
  processarFichaAvaliacao,
} from "@/app/api/client/avaliador";
import { RiQuillPenLine } from "@remixicon/react";
import Button from "@/components/Button";
import { flattenRespostas, listarCriterios, calcularArvoreComNotas } from "@/lib/fichaAvaliacaoScoring";
import FichaAvaliacaoTree from "@/components/avaliacoes/FichaAvaliacaoTree";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState({});
  const [fichaError, setFichaError] = useState(null);
  const router = useRouter();
  const [inscricaoProjeto, setInscricaoProjeto] = useState(null);
  const [fichaAvaliacao, setFichaAvaliacao] = useState(null);
  const [valoresSelecionados, setValoresSelecionados] = useState(new Map());
  const [observacao, setObservacao] = useState("");

  const fetchData = async () => {
    try {
      const data = await getProjetoParaAvaliar(params.tenant, params.idProjeto);
      setInscricaoProjeto(data);

      const fichaDeAvaliacao = await getFichaAvaliacao(
        params.tenant,
        "projeto",
        data.inscricao.edital.id
      );
      setFichaAvaliacao(fichaDeAvaliacao);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setFichaError(
        `Erro ao carregar a ficha de avaliação. Tente novamente. ${error.response?.data?.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNotaSelecionada = (criterioId, valor) => {
    setValoresSelecionados((prev) => {
      const next = new Map(prev);
      if (valor === undefined) next.delete(criterioId);
      else next.set(criterioId, valor);
      return next;
    });
  };

  const arvoreCalculada = fichaAvaliacao
    ? calcularArvoreComNotas(fichaAvaliacao.schemaCriterios, valoresSelecionados)
    : null;

  const handleTerminarAvaliacao = async () => {
    const totalCriterios = listarCriterios(fichaAvaliacao.schemaCriterios).length;
    const respostas = flattenRespostas(arvoreCalculada.arvore);
    if (respostas.length < totalCriterios) {
      setError({ geral: "Preencha a nota de todos os critérios antes de terminar a avaliação." });
      return;
    }

    setLoading(true);
    setError({});

    try {
      const body = {
        objeto: "PROJETO",
        projetoId: params.idProjeto,
        observacao,
        respostas,
      };
      const response = await processarFichaAvaliacao(params.tenant, body);

      if (response.status === "success") {
        alert("Avaliação processada com sucesso!");
        router.push(`/${params.tenant}/avaliador/avaliacoes/projetos`);
      } else {
        setError({ geral: response.message || "Erro ao processar avaliação." });
        setLoading(false);
      }
    } catch (error) {
      setError({
        geral:
          error.response?.data?.message ||
          "Ocorreu um erro ao finalizar a avaliação.",
      });
      setLoading(false);
    }
  };
  return (
    <>
      <div className={styles.navContent}>
        <>
          <div className={styles.projeto}>
            <div className={styles.card}>
              <h6 className={styles.label}>Título</h6>
              <div className={styles.value}>
                <p>{inscricaoProjeto?.projeto?.titulo}</p>
              </div>
            </div>
            <div className={styles.card}>
              <h6 className={styles.label}>Área</h6>
              <div className={styles.value}>
                <p>{inscricaoProjeto?.projeto?.area.area}</p>
              </div>
            </div>
            <div className={`${styles.conteudo}`}>
              {inscricaoProjeto?.projeto?.Resposta?.sort(
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
                    <h6 className={`${styles.label}`}>{item.campo.label}</h6>
                    <div className={`${styles.value}`}>
                      {["link", "arquivo"].includes(item.campo.tipo) ? (
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
                        <p style={{ whiteSpace: "pre-wrap" }}>{item.value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.fichaDeAvaliacao}>
            <h5>Ficha de Avaliação</h5>

            {fichaError ? (
              <div className={styles.error}>
                <p>{fichaError}</p>
              </div>
            ) : (
              <>
                <FichaAvaliacaoTree
                  schemaCriterios={fichaAvaliacao?.schemaCriterios}
                  valores={valoresSelecionados}
                  onSelecionar={handleNotaSelecionada}
                />

                <div className={`${styles.item} mt-2`}>
                  <div className={styles.label}>
                    <h6>Feedback/Comentário ao aluno (OPCIONAL)</h6>
                  </div>

                  <textarea
                    type="text"
                    placeholder="Escreva aqui"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                  ></textarea>
                </div>

                <div className={styles.notaFinal}>
                  <h6>Nota Final:</h6>
                  <p>
                    {(arvoreCalculada?.pontosObtidos ?? 0).toFixed(2)} / {arvoreCalculada?.pontosMaximos ?? 0}
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      </div>
      {error.geral && (
        <div className={`${styles.error} `}>
          <p>{error.geral}</p>
        </div>
      )}
      {!error ||
        (!fichaError && (
          <Button
            className="button btn-warning mt-2 mb-2"
            onClick={handleTerminarAvaliacao}
            icon={RiQuillPenLine}
            disabled={loading}
          >
            {loading ? "Aguarde. Carregando..." : "Terminar Avaliação"}
          </Button>
        ))}
    </>
  );
};

export default Page;

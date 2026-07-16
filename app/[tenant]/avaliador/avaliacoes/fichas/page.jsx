"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tag } from "primereact/tag";
import {
  getFichasAvaliacaoProjeto,
  avaliadorRefazerAvaliacao,
} from "@/app/api/client/avaliador";
import NoData from "@/components/NoData";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { RiErrorWarningLine, RiEditLine } from "@remixicon/react";
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
      </div>
    )
  );

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({});
  const [fichasAvaliacaoProjeto, setFichasAvaliacaoProjeto] = useState([]);
  const [mostrarNotas, setMostrarNotas] = useState({});
  const [fichaParaEditar, setFichaParaEditar] = useState(null);
  const [editando, setEditando] = useState(false);

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

  const handleConfirmarEdicao = async () => {
    if (!fichaParaEditar) return;
    setEditando(true);
    try {
      const response = await avaliadorRefazerAvaliacao(
        params.tenant,
        fichaParaEditar.id,
      );
      if (response?.status === "success") {
        sessionStorage.setItem(
          `rascunhoAvaliacao:${params.tenant}:${response.inscricaoProjetoId}`,
          JSON.stringify(response.rascunho),
        );
        router.push(
          `/${params.tenant}/avaliador/avaliacoes/projetos/${response.inscricaoProjetoId}`,
        );
        return;
      }
      setError((prev) => ({
        ...prev,
        [fichaParaEditar.id]: response?.message || "Erro ao editar avaliação.",
      }));
    } catch (err) {
      setError((prev) => ({
        ...prev,
        [fichaParaEditar.id]:
          err.response?.data?.message || "Erro ao editar avaliação.",
      }));
    } finally {
      setEditando(false);
      setFichaParaEditar(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={!!fichaParaEditar}
        onClose={() => (editando ? null : setFichaParaEditar(null))}
        size="small"
      >
        <div className={styles.confirmModal}>
          <div className={styles.confirmModalIcon}>
            <RiErrorWarningLine size={28} />
          </div>
          <h4>Editar avaliação</h4>
          <p>
            A ficha atual desta avaliação (e das fichas dos planos de
            trabalho vinculados a ela) será apagada e você poderá revisar e
            reenviar a avaliação — as notas e comentários atuais virão
            preenchidos, mas o envio anterior será substituído pelo novo.
            Deseja continuar?
          </p>
          <div className={styles.confirmModalActions}>
            <Button
              className="btn-secondary"
              onClick={() => setFichaParaEditar(null)}
              disabled={editando}
            >
              Cancelar
            </Button>
            <Button
              className="btn-warning"
              onClick={handleConfirmarEdicao}
              loading={editando}
            >
              Sim, editar avaliação
            </Button>
          </div>
        </div>
      </Modal>

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

                <div className={styles.acoesCard}>
                  <Button
                    className="btn-warning-secondary"
                    icon={RiEditLine}
                    onClick={() => setFichaParaEditar(item)}
                  >
                    Editar avaliação
                  </Button>
                </div>

                {mostrarNotas[item.id] && (
                  <>
                    <div className={styles.quesitos}>
                      <div className={styles.notaFinalBox}>
                        <p className={styles.notaFinalLabel}>Nota Final</p>
                        <p className={styles.notaFinalValor}>
                          {item.notaTotal}
                        </p>
                      </div>
                      {item.observacao && (
                        <div className={styles.observacao}>
                          <p className={styles.observacaoLabel}>Observação</p>
                          <p>{item.observacao}</p>
                        </div>
                      )}
                      {renderRespostas(item.respostas)}
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
                                <div className={styles.notaFinalBox}>
                                  <p className={styles.notaFinalLabel}>
                                    Nota Final
                                  </p>
                                  <p className={styles.notaFinalValor}>
                                    {plano.notaTotal}
                                  </p>
                                </div>

                                {renderRespostas(plano.respostas)}
                                {plano.observacao && (
                                  <div className={styles.observacao}>
                                    <p className={styles.observacaoLabel}>
                                      Observação
                                    </p>
                                    <p>{plano.observacao}</p>
                                  </div>
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

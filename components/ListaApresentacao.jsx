"use client";

import { useEffect, useState } from "react";
import styles from "./ListaApresentacao.module.scss";
import Button from "@/components/Button";
import { getApresentacoesPublicas } from "@/app/api/client/submissao";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";

const PAGE_SIZE = 20;

const ListaApresentacao = ({ eventoSlug }) => {
  const [submissoes, setSubmissoes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Função para traduzir o status
  const getStatusLabel = (status) => {
    const statusMap = {
      AGUARDANDO_AVALIACAO: "Aguardando Avaliação",
      EM_AVALIACAO: "Em Avaliação",
      AVALIADA: "Avaliada",
      SELECIONADA: "Aguardando Check-in",
      DISTRIBUIDA: "Aguardando Check-in",
      AUSENTE: "Ausente",
      AUSENTE_COM_JUSTIFICATIVA: "Ausente com Justificativa",
    };
    return statusMap[status] || status;
  };

  // Função para obter classe CSS baseada no status
  const getStatusClass = (status) => {
    const statusClassMap = {
      AGUARDANDO_AVALIACAO: styles.statusAguardando,
      EM_AVALIACAO: styles.statusEmAvaliacao,
      AVALIADA: styles.statusAvaliada,
      SELECIONADA: styles.statusSelecionada,
      DISTRIBUIDA: styles.statusDistribuida,
      AUSENTE: styles.statusAusente,
      AUSENTE_COM_JUSTIFICATIVA: styles.statusAusenteJustificada,
    };
    return statusClassMap[status] || styles.statusDefault;
  };

  useEffect(() => {
    let cancelado = false;

    const fetchSubmissoes = async () => {
      try {
        setLoading(true);
        const data = await getApresentacoesPublicas(eventoSlug, {
          q: activeQuery,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelado) return;
        setSubmissoes(data.submissoes);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setError(null);
      } catch (err) {
        if (cancelado) return;
        setError(err.message);
        console.error("Erro ao buscar submissões:", err);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    fetchSubmissoes();

    return () => {
      cancelado = true;
    };
  }, [eventoSlug, activeQuery, page]);

  const dispararBusca = () => {
    setPage(1);
    setActiveQuery(searchInput.trim());
  };

  const limparBusca = () => {
    setSearchInput("");
    setPage(1);
    setActiveQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      dispararBusca();
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    if (!dateString) return "Data a ser definida";

    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obter número do poster
  const getPosterNumber = (submissao) => {
    if (!submissao.square || submissao.square.length === 0) {
      return "-";
    }

    const poster = submissao.square.find((sq) => sq.identificador === "POSTER");
    return poster && poster.numero ? poster.numero : "-";
  };

  return (
    <div className={styles.container}>
      <h2 className={`h-editorial-sm ${styles.title}`}>Lista de Apresentações</h2>

      {/* Campo de busca */}
      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          {searchInput && (
            <button
              className={styles.clearButton}
              onClick={limparBusca}
              aria-label="Limpar busca"
              type="button"
            >
              ×
            </button>
          )}
        </div>
        <div style={{ width: "120px" }}>
          <Button className="btn-primary" onClick={dispararBusca} type="button">
            Buscar
          </Button>
        </div>
      </div>

      {/* Contador de resultados */}
      {activeQuery && (
        <div className={styles.resultsCount}>
          {total} {total === 1 ? "resultado encontrado" : "resultados encontrados"}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>Carregando apresentações...</div>
      )}

      {!loading && error && (
        <div className={styles.error}>
          Erro ao carregar apresentações: {error}
        </div>
      )}

      {!loading && !error && submissoes.length === 0 && (
        <div className={styles.noResults}>
          {activeQuery
            ? "Nenhuma apresentação encontrada para sua busca."
            : "Nenhuma apresentação disponível no momento."}
        </div>
      )}

      {!loading && !error && submissoes.length > 0 && (
        <>
          <div className={styles.apresentacoesList}>
            {submissoes.map((submissao) => (
              <div key={submissao.id} className={styles.apresentacaoCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.titulo}>
                    ID {submissao.id} - {submissao.Resumo?.titulo || "Resumo não disponível"}
                  </h3>
                  <div className={styles.headerMeta}>
                    <div
                      className={`${styles.statusBadge} ${getStatusClass(
                        submissao.status
                      )}`}
                    >
                      {getStatusLabel(submissao.status)}
                    </div>
                    {submissao.indicacaoPremio && (
                      <span className={styles.premio}>Indicado a prêmio</span>
                    )}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Data e Horário:</span>
                      <span className={styles.infoValue}>
                        {formatarData(submissao.subsessao?.inicio)} -{" "}
                        {formatarHora(submissao.subsessao?.inicio)}
                      </span>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Sessão:</span>
                      <span className={styles.infoValue}>
                        {submissao.subsessao?.sessaoApresentacao?.titulo ||
                          "Sessão a definir"}
                      </span>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Número do Pôster:</span>
                      <span className={styles.infoValue}>
                        {getPosterNumber(submissao) === "-"
                          ? "O númeto do pôster ficará disponível no dia da aparesentação."
                          : getPosterNumber(submissao)}
                      </span>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Instituição:</span>
                      <span className={styles.infoValue}>
                        {getInstituicaoSigla(submissao)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.participantes}>
                    <h4 className={styles.sectionTitle}>Participantes:</h4>
                    {submissao.Resumo?.participacoes?.map((participante) => (
                      <div key={participante.id} className={styles.participante}>
                        <span className={styles.participanteNome}>
                          {participante.user.nome}
                        </span>
                        <span className={styles.participanteCargo}>
                          ({participante.cargo})
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.area}>
                    <span className={styles.sectionTitle}>
                      Área do Conhecimento:
                    </span>
                    <span className={styles.areaValue}>
                      {submissao.Resumo?.area?.area || "Não informada"}
                    </span>
                    <span className={styles.grandeAreaValue}>
                      {submissao.Resumo?.area?.grandeArea?.grandeArea
                        ? `(${submissao.Resumo.area.grandeArea.grandeArea})`
                        : ""}
                    </span>
                  </div>

                  {submissao.Resumo?.PalavraChave &&
                    submissao.Resumo.PalavraChave.length > 0 && (
                      <div className={styles.palavrasChave}>
                        <span className={styles.sectionTitle}>
                          Palavras-chave:
                        </span>
                        <div className={styles.palavrasChaveList}>
                          {submissao.Resumo.PalavraChave.map((palavra) => (
                            <span
                              key={palavra.id}
                              className={styles.palavraChave}
                            >
                              {palavra.palavra}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={`${styles.pagination} flex-space`}>
              <div style={{ width: "120px" }}>
                <Button
                  className="btn-secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  type="button"
                >
                  Anterior
                </Button>
              </div>
              <span className={styles.pageInfo}>
                Página {page} de {totalPages}
              </span>
              <div style={{ width: "120px" }}>
                <Button
                  className="btn-secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  type="button"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ListaApresentacao;

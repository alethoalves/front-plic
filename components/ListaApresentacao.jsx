"use client";

import { useEffect, useState, useMemo } from "react";
import styles from "./ListaApresentacao.module.scss";
import { getListaSubmissao } from "@/app/api/client/submissao";
import { formatarData, formatarHora } from "@/lib/formatarDatas";

const ListaApresentacao = ({ eventoSlug }) => {
  const [submissoes, setSubmissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
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
    const fetchSubmissoes = async () => {
      try {
        setLoading(true);
        const data = await getListaSubmissao(eventoSlug);
        setSubmissoes(data);
      } catch (err) {
        setError(err.message);
        console.error("Erro ao buscar submissões:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissoes();
  }, [eventoSlug]);

  // Filtrar submissões com base no termo de busca
  const filteredSubmissoes = useMemo(() => {
    if (!searchTerm) return submissoes;

    return submissoes.filter((submissao) => {
      const searchLower = searchTerm.toLowerCase();

      // Verificar se o termo de busca corresponde a qualquer participante
      return submissao.Resumo.participacoes.some(
        (participante) =>
          participante.user.nome.toLowerCase().includes(searchLower) ||
          participante.user.cpf.includes(searchTerm)
      );
    });
  }, [submissoes, searchTerm]);

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

  if (loading) {
    return <div className={styles.loading}>Carregando apresentações...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        Erro ao carregar apresentações: {error}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Lista de Apresentações</h2>

      {/* Campo de busca */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Buscar por nome ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        {searchTerm && (
          <button
            className={styles.clearButton}
            onClick={() => setSearchTerm("")}
            aria-label="Limpar busca"
          >
            ×
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {searchTerm && (
        <div className={styles.resultsCount}>
          {filteredSubmissoes.length}{" "}
          {filteredSubmissoes.length === 1
            ? "resultado encontrado"
            : "resultados encontrados"}
        </div>
      )}

      {/* Lista de apresentações */}
      {filteredSubmissoes.length === 0 ? (
        <div className={styles.noResults}>
          {searchTerm
            ? "Nenhuma apresentação encontrada para sua busca."
            : "Nenhuma apresentação disponível no momento."}
        </div>
      ) : (
        <div className={styles.apresentacoesList}>
          {filteredSubmissoes.map((submissao) => (
            <div key={submissao.id} className={styles.apresentacaoCard}>
              <div
                className={`${styles.statusBadge} ${getStatusClass(
                  submissao.status
                )}`}
              >
                {getStatusLabel(submissao.status)}
              </div>

              <div className={styles.cardHeader}>
                <h3 className={styles.titulo}>
                  ID {submissao.id} - {submissao.Resumo.titulo}
                </h3>
                <div className={styles.headerMeta}>
                  <span className={styles.categoria}>
                    <p className={styles.infoLabel}>Pôster:</p>
                    <h3 className={styles.infoValue}>
                      {getPosterNumber(submissao)}
                    </h3>
                  </span>
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
                      {submissao.tenant?.sigla || "Não informado"}
                    </span>
                  </div>
                </div>

                <div className={styles.participantes}>
                  <h4 className={styles.sectionTitle}>Participantes:</h4>
                  {submissao.Resumo.participacoes.map((participante) => (
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
                    {submissao.Resumo.area?.area || "Não informada"}
                  </span>
                  <span className={styles.grandeAreaValue}>
                    {submissao.Resumo.area?.grandeArea?.grandeArea
                      ? `(${submissao.Resumo.area.grandeArea.grandeArea})`
                      : ""}
                  </span>
                </div>

                {submissao.Resumo.PalavraChave &&
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
      )}
    </div>
  );
};

export default ListaApresentacao;

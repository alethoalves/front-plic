"use client";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiCalendarLine,
  RiErrorWarningLine,
  RiLoader4Line,
} from "@remixicon/react";
import { getEventosAnoCorrente } from "../api/client/eventos";
import { getTrabalhoEmAndamentoAvaliador } from "../api/client/submissaoAvaliador";

const Page = ({ params }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState(null);

  // Função para buscar os dados dos eventos
  const fetchEventos = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventosData = await getEventosAnoCorrente();
      setEventos(eventosData);
    } catch (err) {
      console.error("Erro ao buscar eventos:", err);
      setError(err.message || "Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Se o avaliador já está logado (cookie authTokenAvaliador, válido por
    // 24h e global a todos os eventos) e já tem uma submissão em avaliação
    // em algum evento, pula direto pro wizard daquele evento — evita ter
    // que escolher o evento e digitar CPF de novo só porque o celular
    // bloqueou/fechou o app enquanto ele avaliava o pôster.
    const verificarTrabalhoEmAndamento = async () => {
      const emAndamento = await getTrabalhoEmAndamentoAvaliador();
      if (emAndamento) {
        router.replace(
          `/evento/${emAndamento.eventoSlug}/edicao/${emAndamento.edicao}/avaliar`
        );
        return;
      }
      fetchEventos();
    };
    verificarTrabalhoEmAndamento();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.loadingContainer}>
          <RiLoader4Line size={48} className={styles.spinner} />
          <p>Carregando eventos...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.container}>
        <div className={styles.errorContainer}>
          <RiErrorWarningLine size={48} className={styles.errorIcon} />
          <h2>Erro ao carregar eventos</h2>
          <p>{error}</p>
          <button onClick={fetchEventos} className={styles.retryButton}>
            Tentar Novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <RiCalendarLine size={32} className={styles.headerIcon} />
            <div>
              <h1 className={styles.title}>Eventos</h1>
              <p className={styles.subtitle}>
                {eventos.length} evento{eventos.length !== 1 ? "s" : ""}{" "}
                encontrado{eventos.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </header>

        <div className={styles.eventsGrid}>
          {eventos.map((evento) => (
            <Link
              key={evento.id}
              href={`/evento/${evento.eventoRoot.slug}/edicao/${evento.slug}/login-avaliador`}
              className={styles.eventCard}
            >
              <div className={styles.cardContent}>
                <h3 className={styles.eventName}>{evento.nomeEvento}</h3>
                <div className={styles.eventDetails}>
                  <span className={styles.edition}>
                    Edição {evento.edicaoEvento}
                  </span>
                </div>
                <div className={styles.ctaButton}>
                  <span>Acessar Ambiente de Avaliação</span>
                  <div className={styles.arrowIcon}>→</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {eventos.length === 0 && (
          <div className={styles.emptyState}>
            <RiCalendarLine size={64} className={styles.emptyIcon} />
            <h2>Nenhum evento encontrado</h2>
            <p>Não há eventos cadastrados para o ano corrente.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Page;

"use client";

// HOOKS
import { useState, useEffect } from "react";

// ESTILOS E ÍCONES
import styles from "@/components/dashboards/Eventos.module.scss";
import {
  RiArrowLeftCircleFill,
  RiArrowRightCircleFill,
  RiBatteryLowLine,
  RiCalendarLine,
  RiGroupLine,
  RiPresentationFill,
} from "@remixicon/react";

// FUNÇÕES
import Link from "next/link";
import NoData from "../NoData";
import { getEventosDashboard } from "@/app/api/client/eventos";

const Inscricoes = ({ tenantSlug }) => {
  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentEventIndex, setCurrentEventIndex] = useState(0); // Estado para controlar o índice do evento atual
  const [eventos, setEventos] = useState(null);

  // Função para buscar os eventos da API
  const fetchEventos = async (tenantSlug) => {
    setLoading(true);
    try {
      const data = await getEventosDashboard(tenantSlug);
      setEventos(data);
    } catch (error) {
      setError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos(tenantSlug);
  }, [tenantSlug]);

  // Função para formatar data
  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar hora
  const formatarHora = (dataIso) => {
    const data = new Date(dataIso);
    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");
    return `${horas}h${minutos}`;
  };

  // Função para passar para o próximo evento
  const handleNextEvent = () => {
    if (currentEventIndex < eventos.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1);
    }
  };

  // Função para voltar ao evento anterior
  const handlePreviousEvent = () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(currentEventIndex - 1);
    }
  };

  return (
    <div className={`${styles.dashboard}`}>
      <div className={styles.head}>
        <div className={styles.left}>
          <div className={styles.icon}>
            <RiPresentationFill />
          </div>
          <div className={styles.title}>
            <h5>Eventos</h5>
          </div>
        </div>
        {eventos?.length > 1 && (
          <div className={styles.actions}>
            <div
              className={`${styles.btn} ${
                currentEventIndex === 0 ? styles.disabled : ""
              }`}
              onClick={handlePreviousEvent}
            >
              <RiArrowLeftCircleFill />
            </div>
            <div
              className={`${styles.btn} ${
                currentEventIndex === eventos.length - 1 ? styles.disabled : ""
              }`}
              onClick={handleNextEvent}
            >
              <RiArrowRightCircleFill />
            </div>
          </div>
        )}
      </div>

      {eventos ? (
        eventos.length > 0 ? (
          <div className={styles.content}>
            <Link
              href={`/eventos/${eventos[currentEventIndex].data.evento.slug}/admin`}
            >
              <h5>{eventos[currentEventIndex].data.evento.nomeEvento}</h5>
            </Link>
            <div className={styles.totais}>
              {eventos[currentEventIndex].info.tenantsTotais.map((tenant) => (
                <div
                  className={`${styles.total} ${styles.light}`}
                  key={tenant.tenant}
                >
                  <p>{tenant.quantidadeSubmissoesTotal}</p>
                  <h6>{tenant.tenant}</h6>
                </div>
              ))}
            </div>
            <div className={styles.sessoes}>
              {eventos[currentEventIndex].info.sessaoInfo[0] &&
              eventos[currentEventIndex].info.sessaoInfo[0].subsessoes[0] ? (
                eventos[currentEventIndex].info.sessaoInfo.map((sessao) => {
                  const sessaoLabel = sessao.titulo;
                  const capacidadeTotal = sessao.capacidade;
                  return sessao.subsessoes.map((subs) => (
                    <div className={styles.sessao} key={subs.inicio}>
                      <h6>{sessaoLabel}</h6>
                      <div className={styles.subsessoes}>
                        <div className={styles.subsessao}>
                          <div className={styles.description}>
                            <div className={styles.icon}>
                              <RiCalendarLine />
                            </div>
                            <div className={styles.infoBoxDescription}>
                              <p>
                                <strong>Início: </strong>
                                {formatarData(subs.inicio)} -{" "}
                                {formatarHora(subs.inicio)}
                              </p>
                              <p>
                                <strong>Fim: </strong>
                                {formatarData(subs.fim)} -{" "}
                                {formatarHora(subs.fim)}
                              </p>
                            </div>
                          </div>
                          <div className={styles.description}>
                            <div className={styles.icon}>
                              <RiBatteryLowLine />
                            </div>
                            <div className={styles.infoBoxDescription}>
                              <p>
                                <strong>Capacidade: </strong>
                                {subs.submissaoTotal} inscritos | capacidade:{" "}
                                {capacidadeTotal}
                              </p>
                            </div>
                          </div>
                          <div className={styles.description}>
                            <div className={styles.icon}>
                              <RiGroupLine />
                            </div>
                            <div className={styles.infoBoxDescription}>
                              <p>
                                <strong>Avaliadores: </strong>
                                {subs.convitesAceitos}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })
              ) : (
                <NoData description="Este evento ainda não tem sessões cadastradas." />
              )}
            </div>
          </div>
        ) : (
          <NoData description="Nenhum evento encontrado" />
        )
      ) : (
        <NoData description="Nenhum evento encontrado" />
      )}
    </div>
  );
};

export default Inscricoes;

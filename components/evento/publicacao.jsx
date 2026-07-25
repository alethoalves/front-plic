"use client";

import styles from "./publicacao.module.scss";
import NoData from "@/components/NoData";
import { useEffect, useState } from "react";
import { getPublicacao } from "@/app/api/client/eventos";
import { RiAwardLine, RiCalendarEventLine, RiMapPinLine, RiTimeLine } from "@remixicon/react";
import { formatarHora } from "@/lib/formatarDatas";
import { transformarQuebrasEmParagrafos } from "@/lib/formatarParagrafo";
import { EventoNav } from "./EventoNav";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";

export const Publicacao = ({ params, evento, eventoRoot }) => {
  const [loading, setLoading] = useState(true);
  const [publicacao, setPublicacao] = useState(null);
  const [loadingPublicacao, setLoadingPublicacao] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const response = await getPublicacao(params.idSubmissao);
        setPublicacao(response);
        setLoading(false);
        setLoadingPublicacao(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setLoading(false);
        setLoadingPublicacao(false);
      }
    };

    carregarDados();
  }, [params]);

  if (loading || loadingPublicacao) {
    return <div>Carregando...</div>;
  }

  if (!publicacao) {
    return <NoData />;
  }

  // Parse do conteúdo do resumo que está em formato JSON string
  const conteudoResumo = publicacao.Resumo ? publicacao.Resumo?.conteudo : [];

  return (
    <main className={styles.eventoSpread}>
      <nav className={styles.eventoIndex}>
        <EventoNav params={params} evento={evento} eventoRoot={eventoRoot} />

        <div className={styles.eventoCard}>
          <span className={styles.eventoIndexLabel}>Dados da apresentação</span>
          <div className={styles.dadosApresentacao}>
            {publicacao.subsessao?.sessaoApresentacao?.titulo && (
              <p>{publicacao.subsessao.sessaoApresentacao.titulo}</p>
            )}
            {publicacao.subsessao?.inicio && (
              <div className={styles.dadoItem}>
                <RiCalendarEventLine />
                {new Date(publicacao.subsessao.inicio).toLocaleDateString()}
              </div>
            )}
            {publicacao.subsessao?.inicio && (
              <div className={styles.dadoItem}>
                <RiTimeLine />
                {formatarHora(publicacao.subsessao.inicio)}
              </div>
            )}
            {publicacao.subsessao?.local && (
              <div className={styles.dadoItem}>
                <RiMapPinLine />
                {publicacao.subsessao.local}
              </div>
            )}
            {(publicacao.indicacaoPremio || publicacao.mencaoHonrosa) && (
              <div className={styles.dadoItem}>
                <RiAwardLine />
                {[
                  publicacao.indicacaoPremio && "Indicado a prêmio",
                  publicacao.mencaoHonrosa && "Menção honrosa",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className={styles.content}>
        <div className={`${styles.eventoCard} mb-3`}>
          <div className={styles.pubTags}>
            <span>{publicacao.categoria} · {getInstituicaoSigla(publicacao)}</span>
            <span>{publicacao.Resumo?.area?.area}</span>
          </div>
          <h1 className="h-editorial mb-2">{publicacao.Resumo?.titulo}</h1>
          <p className={styles.participantes}>
            {publicacao.Resumo?.participacoes?.map((p, index) => (
              <span key={p.user.id}>
                {`${p.user.nome} (${p.cargo.toLowerCase()})`}
                {index < publicacao.Resumo.participacoes.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>

        <div className={styles.eventoCard}>
          <h2 className="h-editorial-sm mb-2">Resumo</h2>
          <div className={styles.resumoContent}>
            {conteudoResumo.map((secao, index) => (
              <div key={index} className={styles.resumoSecao}>
                {transformarQuebrasEmParagrafos(secao.conteudo)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

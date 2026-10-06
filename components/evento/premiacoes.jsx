"use client";

import Link from "next/link";
import styles from "./premiacoes.module.scss";
import { RiEyeLine, RiGroupLine } from "@remixicon/react";
import NoData from "@/components/NoData";
import { EventoNav } from "./EventoNav";
import { useEffect, useState } from "react";
import { getPremiacoes } from "@/app/api/client/eventos";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";

// Premiados só aparecem quando o admin marcou algum — antes do resultado
// final a edição tem apenas indicações e menções.
const SECOES = [
  { chave: "premiados", titulo: "Premiados", ocultarSeVazia: true },
  {
    chave: "indicados",
    titulo: "Indicações ao Prêmio Destaque",
    vazia: "Nenhuma submissão indicada ao Prêmio Destaque.",
  },
  {
    chave: "mencoes",
    titulo: "Menções Honrosas",
    vazia: "Nenhuma submissão recebeu menção honrosa.",
  },
];

export const Premiacoes = ({ params, evento, eventoRoot }) => {
  const [loading, setLoading] = useState(true);
  const [premiacoes, setPremiacoes] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setPremiacoes(await getPremiacoes(evento.slug));
      } catch (error) {
        console.error("Erro ao carregar premiações:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [evento.slug]);

  const linkSubmissao = (id) =>
    `/evento/${params.eventoSlug}/edicao/${params.edicao}/publicacoes/${id}`;

  const renderConteudo = () => {
    if (loading) return <div>Carregando...</div>;
    if (!premiacoes) return <NoData message="Erro ao carregar as premiações." />;
    if (!premiacoes.liberado) {
      return (
        <NoData message="As premiações desta edição ainda não foram divulgadas." />
      );
    }

    return SECOES.filter(
      (secao) => !(secao.ocultarSeVazia && premiacoes[secao.chave].length === 0)
    ).map((secao) => {
      const itens = premiacoes[secao.chave];
      return (
        <section key={secao.chave} className={`${styles.eventoCard} mb-3`}>
          <div className={styles.sectionHead}>
            <h2 className="h-editorial-sm">{secao.titulo}</h2>
            <span className={styles.contagem}>{itens.length}</span>
            <div className={styles.rule}></div>
          </div>

          {itens.length === 0 ? (
            <p className={styles.vazia}>{secao.vazia}</p>
          ) : (
            itens.map((submissao) => (
              <div key={submissao.id} className={styles.pubItem}>
                <div className={styles.pubTags}>
                  <span>
                    {submissao.categoria} · {getInstituicaoSigla(submissao)}
                  </span>
                  {submissao.Resumo?.area?.area && (
                    <span>{submissao.Resumo.area.area}</span>
                  )}
                </div>
                <Link
                  href={linkSubmissao(submissao.id)}
                  className={styles.pubTitleLink}
                >
                  <h3 className={`preserve-line-breaks ${styles.pubTitle}`}>
                    {submissao.Resumo?.titulo || `Submissão ${submissao.id}`}
                  </h3>
                </Link>
                {submissao.Resumo?.participacoes?.length > 0 && (
                  <div className={styles.pubMeta}>
                    <RiGroupLine />
                    <p>
                      {submissao.Resumo.participacoes
                        .map((p) => `${p.user.nome} (${p.cargo.toLowerCase()})`)
                        .join(", ")}
                    </p>
                  </div>
                )}
                <Link
                  href={linkSubmissao(submissao.id)}
                  className={styles.pubLink}
                >
                  <RiEyeLine />
                  Ver trabalho
                </Link>
              </div>
            ))
          )}
        </section>
      );
    });
  };

  return (
    <main className={styles.eventoSpread}>
      <nav className={styles.eventoIndex}>
        <EventoNav params={params} evento={evento} eventoRoot={eventoRoot} />
      </nav>

      <div className={styles.content}>
        <div className={`${styles.eventoCard} mb-3`}>
          <span className={styles.eventoEyebrow}>Premiações</span>
          <h1 className="h-editorial">{evento.nomeEvento}</h1>
        </div>

        {renderConteudo()}
      </div>
    </main>
  );
};

"use client";

import Link from "next/link";
import styles from "./premiacoes.module.scss";
import { RiEyeLine, RiGroupLine } from "@remixicon/react";
import NoData from "@/components/NoData";
import { EventoNav } from "./EventoNav";
import { useEffect, useState } from "react";
import { getPremiacoes } from "@/app/api/client/eventos";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";

// Uma aba por tipo de premiação. A de premiados só aparece quando o admin
// marcou algum — antes do resultado final a edição tem apenas indicações e
// menções.
const ABAS = [
  { id: "premiados", label: "Premiados", ocultarSeVazia: true },
  {
    id: "indicados",
    label: "Prêmio Destaque",
    vazia: "Nenhuma submissão indicada ao Prêmio Destaque.",
  },
  {
    id: "mencoes",
    label: "Menção Honrosa",
    vazia: "Nenhuma submissão recebeu menção honrosa.",
  },
];

export const Premiacoes = ({ params, evento, eventoRoot }) => {
  const [loading, setLoading] = useState(true);
  const [premiacoes, setPremiacoes] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const dados = await getPremiacoes(evento.slug);
        setPremiacoes(dados);
        // Abre direto nos premiados quando o resultado final já saiu
        setAbaAtiva(dados.premiados?.length > 0 ? "premiados" : "indicados");
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

    const abasVisiveis = ABAS.filter(
      (aba) => !(aba.ocultarSeVazia && premiacoes[aba.id].length === 0)
    );
    const aba = abasVisiveis.find((a) => a.id === abaAtiva) ?? abasVisiveis[0];
    const itens = premiacoes[aba.id];

    return (
      <>
        <div className={`${styles.abas} mb-3`}>
          {abasVisiveis.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.aba} ${item.id === aba.id ? styles.abaAtiva : ""}`}
              onClick={() => setAbaAtiva(item.id)}
            >
              {item.label}
              <span className={styles.contagem}>{premiacoes[item.id].length}</span>
            </button>
          ))}
        </div>

        <div className={styles.eventoCard}>
          {itens.length === 0 ? (
            <p className={styles.vazia}>{aba.vazia}</p>
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
        </div>
      </>
    );
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

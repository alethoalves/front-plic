"use client";

import Link from "next/link";
import styles from "./publicacao.module.scss";
import { InscricaoButton } from "@/components/evento/InscricaoButton";
import NoData from "@/components/NoData";
import { useEffect, useState } from "react";
import { getPublicacao } from "@/app/api/client/eventos";
import { RiGroupLine } from "@remixicon/react";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";
import { formatarHora } from "@/lib/formatarDatas";
import { Fragment } from "react";

export const Publicacao = ({ params }) => {
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

  // Função para transformar quebras de linha em parágrafos
  const transformarQuebrasEmParagrafos = (texto) => {
    if (!texto) return null;

    return texto.split("\n").map((paragrafo, index) => (
      <p key={index} className="mb-3">
        {paragrafo}
      </p>
    ));
  };

  if (loading || loadingPublicacao) {
    return <div>Carregando...</div>;
  }

  if (!publicacao) {
    return <NoData />;
  }

  // Parse do conteúdo do resumo que está em formato JSON string
  const conteudoResumo = publicacao.Resumo
    ? JSON.parse(publicacao.Resumo.conteudo)
    : [];

  return (
    <main className={styles.main}>
      <article>
        <section className={`${styles.content} ${styles.descriptionSection}`}>
          <div className={styles.sectionContent}>
            <div className={styles.descriptionContent}>
              <div className={styles.tags}>
                <p>
                  {publicacao.categoria} - {publicacao.tenant?.sigla}
                </p>
                <p>{publicacao.Resumo?.area?.area}</p>
              </div>
              <h4 className="mb-2">{publicacao.Resumo?.titulo}</h4>
              <h6 className={`${styles.sectionTitle} ml-0`}></h6>

              {/* Autores e Orientadores */}
              <div className={styles.participantes}>
                <div className={`${styles.cardItem} mt-2 mb-1`}>
                  <p>
                    {publicacao.Resumo?.participacoes?.map((p, index) => (
                      <span key={p.user.id}>
                        {`${p.user.nome} (${p.cargo.toLowerCase()})`}
                        {index < publicacao.Resumo.participacoes.length - 1
                          ? ", "
                          : ""}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sectionContent}>
            <div className={styles.descriptionContent}>
              <h6 className={`${styles.sectionTitle} mb-2`}>Resumo</h6>
              <div className="space-y-6">
                {conteudoResumo.map((secao, index) => (
                  <div key={index} className="mb-1">
                    <div className="text-justify">
                      {transformarQuebrasEmParagrafos(secao.conteudo)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside>
          <div className={`${styles.edicoesContent}`}>
            <h6 className={styles.sectionTitle}>Dados da Apresentação</h6>
            <div className={styles.dadosApresentacao}>
              <p>
                <strong>Sessão:</strong>{" "}
                {publicacao.subsessao?.sessaoApresentacao?.titulo}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {new Date(publicacao.subsessao?.inicio).toLocaleDateString()}
              </p>
              <p>
                <strong>Horário:</strong>{" "}
                {formatarHora(publicacao.subsessao?.inicio)}
              </p>
              <p>
                <strong>Local:</strong> {publicacao.subsessao?.local}
              </p>

              {publicacao.indicacaoPremio && (
                <p>
                  <strong>Indicação a prêmio:</strong> Sim
                </p>
              )}
              {publicacao.mencaoHonrosa && (
                <p>
                  <strong>Menção honrosa:</strong> Sim
                </p>
              )}
            </div>
          </div>
        </aside>
      </article>
    </main>
  );
};

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getResumo } from "@/app/api/client/submissaoAvaliador";
import { transformarQuebrasEmParagrafos } from "@/lib/formatarParagrafo";
import styles from "./page.module.scss";
import {
  RiArrowLeftLine,
  RiQuillPenLine,
  RiMapPinLine,
} from "@remixicon/react";

export default function ResumoPage() {
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = useParams();
  const router = useRouter();

  const { eventoId, submissaoId, tenantId } = params;

  useEffect(() => {
    const fetchResumo = async () => {
      try {
        setLoading(true);
        const resumoData = await getResumo(eventoId, submissaoId, tenantId);
        setResumo(resumoData);
      } catch (err) {
        setError("Erro ao carregar o resumo");
        console.error("Erro:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResumo();
  }, [eventoId, submissaoId, tenantId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>Carregando resumo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Obter informações dos pôsteres
  const posters = resumo?.square || [];
  const hasMultiplePosters = posters.length > 1;

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <RiArrowLeftLine size={18} />
          Voltar
        </button>

        <div className={styles.metaInfo}>
          <span className={styles.area}>
            {resumo?.Resumo?.area?.area || "Área não definida"}
          </span>
          <span className={styles.tenant}>
            {resumo?.tenant?.sigla?.toUpperCase()}
          </span>
          <span className={styles.categoria}>
            {resumo?.categoria?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Informações do Pôster */}
      {posters.length > 0 && (
        <div className={styles.posterInfo}>
          <div className={styles.posterHeader}>
            <RiMapPinLine size={20} />
            <h3>Número do Pôster</h3>
          </div>

          <div className={styles.posterDetails}>
            {hasMultiplePosters ? (
              <div className={styles.multiplePosters}>
                <span className={styles.warningText}>
                  Atenção: Esta submissão está associada a múltiplos pôsteres
                </span>
                <div className={styles.posterNumbers}>
                  {posters.map((poster, index) => (
                    <span key={index} className={styles.posterNumber}>
                      {poster.numero}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.singlePoster}>
                <span className={styles.posterNumber}>{posters[0].numero}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo do Resumo */}
      <div className={styles.content}>
        <h1 className={styles.titulo}>{resumo?.Resumo?.titulo || "Resumo"}</h1>

        <div className={styles.conteudoResumo}>
          {resumo?.Resumo?.conteudo?.map((secao, index) => (
            <div key={index} className={styles.secao}>
              <h3 className={styles.secaoTitulo}>{secao.nome}</h3>
              <div className={styles.conteudo}>
                {transformarQuebrasEmParagrafos(secao.conteudo)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ações */}
      <div className={styles.actions}>
        <button
          onClick={() =>
            router.push(
              `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliador/avaliacoes/avaliacao/${eventoId}/${submissaoId}/${tenantId}`
            )
          }
          className={styles.avaliarButton}
        >
          <RiQuillPenLine size={18} />
          Avaliar Agora
        </button>
      </div>
    </div>
  );
}

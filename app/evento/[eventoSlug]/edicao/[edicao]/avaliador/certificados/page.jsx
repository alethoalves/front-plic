"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import styles from "./page.module.scss";
import {
  generateAndDownloadAvaliadorCertificatePDF,
  getTiposCertificadoIngles,
} from "@/app/api/client/certificado";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Versão em inglês do certificado de avaliador configurada no evento?
  const [temIngles, setTemIngles] = useState(false);

  useEffect(() => {
    let ativo = true;
    getTiposCertificadoIngles(params.edicao).then(
      (tipos) => ativo && setTemIngles(tipos.includes("AVALIADOR"))
    );
    return () => {
      ativo = false;
    };
  }, [params.edicao]);

  const handleDownloadCertificate = async (eventoSlug, idioma = "pt") => {
    try {
      setLoading(true);
      setError(null);
      await generateAndDownloadAvaliadorCertificatePDF(eventoSlug, idioma);
      alert("Certificado baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar o certificado:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.certificadosContainer}>
        {loading && (
          <div className={styles.loadingOverlay}>
            <p>Gerando certificado...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        <div
          className={`${styles.certificadoCard} ${
            loading ? styles.disabled : ""
          }`}
          onClick={() => !loading && handleDownloadCertificate(params.edicao)}
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <div className={styles.modernIcon}>
                <div className={styles.iconBadge}>
                  <span>✓</span>
                </div>
              </div>
            </div>
            <div className={styles.cardTitle}>
              <h3>Certificado de Avaliador</h3>
              <p>Congresso de Iniciação Científica da UnB e do DF</p>
            </div>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.eventoInfo}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Evento:</span>
                <span className={styles.value}>{params.edicao}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Função:</span>
                <span className={styles.value}>Avaliador</span>
              </div>
            </div>

            <div className={styles.cardActions}>
              <button className={styles.downloadButton} disabled={loading}>
                {loading ? "Gerando..." : "Baixar Certificado"}
                <span className={styles.downloadIcon}>↓</span>
              </button>
              {temIngles && (
                <button
                  className={`${styles.downloadButton} mt-1`}
                  disabled={loading}
                  onClick={(e) => {
                    // O card inteiro baixa em português
                    e.stopPropagation();
                    if (!loading) handleDownloadCertificate(params.edicao, "en");
                  }}
                >
                  {loading ? "Gerando..." : "Baixar em inglês"}
                  <span className={styles.downloadIcon}>↓</span>
                </button>
              )}
            </div>
          </div>

          <div className={styles.cardFooter}>
            <p>
              Clique para baixar seu certificado de participação como avaliador
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;

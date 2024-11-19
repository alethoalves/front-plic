"use client";
import { useState } from "react";
import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import { generateAndDownloadCertificatePDF } from "@/app/api/client/certificado";

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para lidar com o clique e chamar a geração do certificado
  const handleDownloadCertificate = async (eventoSlug) => {
    try {
      setLoading(true);
      setError(null);

      await generateAndDownloadCertificatePDF(eventoSlug);

      alert("Certificado baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar o certificado:", error);
      setError("Erro ao baixar o certificado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <Header
        className="mb-3"
        titulo="Certificados"
        subtitulo="Você foi avaliador(a) nos eventos abaixo."
        descricao="Clique para baixar o certificado."
      />
      <div className={styles.instituicoes}>
        {loading && <p className={styles.loading}>Gerando certificado...</p>}
        {error && <p className={styles.error}>{error}</p>}
        {/* Exemplo com um evento estático; substitua por um loop caso tenha vários eventos */}
        <div
          className={styles.instituicao}
          onClick={() => handleDownloadCertificate("cicdf2024")}
        >
          <div className={styles.logo}>
            <Image
              priority
              sizes="300 500 700"
              src={`/image/cicdf.png`}
              fill={true}
              alt="logo da instituição"
            />
          </div>
          <div className={styles.descricao}>
            <h6>2024 - Congresso de Iniciação Científica da UnB e do DF</h6>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;

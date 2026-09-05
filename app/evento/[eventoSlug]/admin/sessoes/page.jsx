"use client";
import { useEffect, useState } from "react";
import { getSessoesBySlug } from "@/app/api/client/sessoes";
import FormSessoes from "@/components/Formularios/FormSessoes";
import styles from "./page.module.scss";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [sessoes, setSessoes] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sessoes = await getSessoesBySlug(params.eventoSlug);
        setSessoes(sessoes);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading && !sessoes) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.navContent}>
      <div className={styles.dashboard}>
        <div className={styles.tituloPagina}>
          <h5>Sessões</h5>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <p>
              Crie e gerencie os horários e locais de apresentação do
              evento.
            </p>
          </div>

          {sessoes && (
            <FormSessoes
              eventoSlug={params.eventoSlug}
              initialSessoes={sessoes}
              basePath={`/evento/${params.eventoSlug}/admin/sessoes`}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default Page;

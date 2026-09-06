"use client";

import { Suspense, useEffect, useState } from "react";
import FormConfiguracoesEvento from "@/components/Formularios/FormConfiguracoesEvento";
import { getEventoConfiguracoes } from "@/app/api/client/eventos";
import styles from "./page.module.scss";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [evento, setEvento] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getEventoConfiguracoes(params.eventoSlug);
        setEvento(data);
      } catch (error) {
        console.error("Erro ao buscar configurações do evento:", error);
        setError("Erro ao buscar configurações do evento.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.eventoSlug]);

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.navContent}>
      <div className={styles.dashboard}>
        <div className={styles.tituloPagina}>
          <h5>Configurações</h5>
        </div>

        {error ? (
          <p>{error}</p>
        ) : (
          <Suspense fallback={<div className={styles.loading}>Carregando...</div>}>
            <FormConfiguracoesEvento
              eventoSlug={params.eventoSlug}
              initialData={evento}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Page;

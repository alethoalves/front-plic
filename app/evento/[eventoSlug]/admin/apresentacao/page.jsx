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

  return (
    <div className={styles.navContent}>
      {sessoes && (
        <FormSessoes
          eventoSlug={params.eventoSlug}
          initialSessoes={sessoes}
          basePath={`/evento/${params.eventoSlug}/admin/v2apresentacao`}
        />
      )}
    </div>
  );
};

export default Page;

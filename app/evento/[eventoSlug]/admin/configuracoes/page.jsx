"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/Skeleton";
import FormConfiguracoesEvento from "@/components/Formularios/FormConfiguracoesEvento";
import { getEventoConfiguracoes } from "@/app/api/client/eventos";

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
    return (
      <>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <FormConfiguracoesEvento eventoSlug={params.eventoSlug} initialData={evento} />
  );
};

export default Page;

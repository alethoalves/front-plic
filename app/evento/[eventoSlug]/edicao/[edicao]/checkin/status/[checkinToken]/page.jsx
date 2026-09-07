"use client";

import { useEffect, useState } from "react";
import { getEventoBySlug } from "@/app/api/client/eventos";
import { EventoBanner } from "@/components/evento/EventoBanner";
import CheckinStatusCard from "@/components/checkin/CheckinStatusCard";
import styles from "../../page.module.scss";

// Link de acompanhamento devolvido na tela final do wizard de check-in
// (checkin/page.jsx) — mesmo cartão, só que buscando o status por conta
// própria a partir do checkinToken na URL, sem precisar do CPF de novo.
const Page = ({ params }) => {
  const [evento, setEvento] = useState(null);

  useEffect(() => {
    getEventoBySlug(params.edicao).then(setEvento).catch(() => setEvento(null));
  }, [params.edicao]);

  return (
    <div className={styles.mainDiv}>
      <EventoBanner evento={evento} />
      <CheckinStatusCard eventoSlug={params.edicao} checkinToken={params.checkinToken} />
    </div>
  );
};

export default Page;

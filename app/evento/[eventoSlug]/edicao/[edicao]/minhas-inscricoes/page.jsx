import styles from "./page.module.scss";

import { getEventoBySlug, getEventoRootBySlug } from "@/app/api/serverReq";
import { EventoNav } from "@/components/evento/EventoNav";
import { EventoBanner } from "@/components/evento/EventoBanner";
import { MinhasInscricoesConteudo } from "@/components/evento/MinhasInscricoesConteudo";

const Page = async ({ params }) => {
  let evento;
  let eventoRoot;
  try {
    evento = await getEventoBySlug(params.edicao);
    eventoRoot = await getEventoRootBySlug(params.eventoSlug);
  } catch (error) {
    return <h6 className="p-4">Evento não encontrado</h6>;
  }

  return (
    <>
      <div className={`${styles.eventoPlatewrap} ${styles.eventoPlatewrapComNav}`}>
        <EventoBanner evento={evento} />
      </div>

      <main className={`${styles.eventoSpread} ${styles.eventoSpreadNavFixo}`}>
        <nav className={styles.eventoIndex}>
          <EventoNav params={params} evento={evento} eventoRoot={eventoRoot} />
        </nav>
        <div className={styles.content}>
          <div className={`${styles.eventoCard} mb-3`}>
            <span className={styles.eventoEyebrow}>{evento.nomeEvento}</span>
            <h1 className="h-editorial">Minhas inscrições</h1>
          </div>

          <div className={styles.eventoCard}>
            <MinhasInscricoesConteudo params={params} />
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;

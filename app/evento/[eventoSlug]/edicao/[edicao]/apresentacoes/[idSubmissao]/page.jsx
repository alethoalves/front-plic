import styles from "./page.module.scss";
import {
  getEventoBySlug,
  getEventoRootBySlug,
} from "@/app/api/serverReq";
import { Publicacao } from "@/components/evento/publicacao";
import { EventoBanner } from "@/components/evento/EventoBanner";

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

      <Publicacao params={params} evento={evento} eventoRoot={eventoRoot} />
    </>
  );
};

export default Page;

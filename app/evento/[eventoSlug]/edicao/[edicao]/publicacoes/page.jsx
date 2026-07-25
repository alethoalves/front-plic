import styles from "./page.module.scss";
import {
  getEventoBySlug,
  getEventoProgramacao,
  getEventoRootBySlug,
} from "@/app/api/serverReq";
import { Publicacoes } from "@/components/evento/publicacoes";
import { EventoBanner } from "@/components/evento/EventoBanner";

const Page = async ({ params }) => {
  let eventoRoot;
  let evento;
  let programacao;
  try {
    eventoRoot = await getEventoRootBySlug(params.eventoSlug);
    evento = await getEventoBySlug(params.edicao);
    programacao = await getEventoProgramacao(evento.id);
  } catch (error) {
    return <h6 className="p-4">Evento não encontrado</h6>;
  }

  return (
    <>
      <div className={`${styles.eventoPlatewrap} ${styles.eventoPlatewrapComNav}`}>
        <EventoBanner evento={evento} />
      </div>

      <Publicacoes
        eventoRoot={eventoRoot}
        evento={evento}
        programacao={programacao}
        params={params}
      />
    </>
  );
};

export default Page;

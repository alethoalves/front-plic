import Image from "next/image";
import styles from "./page.module.scss";

import { getEventoBySlug, getEventoRootBySlug } from "@/app/api/serverReq";
import ListaApresentacao from "@/components/ListaApresentacao";

const Page = async ({ params }) => {
  let eventoRoot;
  let evento;
  try {
    eventoRoot = await getEventoRootBySlug(params.eventoSlug);
    evento = await getEventoBySlug(params.edicao);
  } catch (error) {
    return <h6 className="p-4">Evento não encontrado</h6>;
  }

  return (
    <>
      <header>
        <div className={styles.banner}>
          <Image
            src={`/image/${params.eventoSlug}/bgImg.png`}
            alt="Background"
            fill
            quality={100}
            className={styles.bgImage}
          />
        </div>
      </header>
      <ListaApresentacao eventoSlug={params.edicao} />
    </>
  );
};

export default Page;

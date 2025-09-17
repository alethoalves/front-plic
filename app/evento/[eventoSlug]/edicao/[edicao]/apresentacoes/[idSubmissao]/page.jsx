import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.scss";
import {
  RiArticleLine,
  RiAwardFill,
  RiCalendarEventFill,
  RiCouponLine,
  RiHome6Line,
  RiMapPinLine,
  RiUserStarLine,
} from "@remixicon/react";
import { Card } from "primereact/card";
import {
  getEventoBySlug,
  getEventoProgramacao,
  getEventoRootBySlug,
} from "@/app/api/serverReq";
import { Fragment } from "react";
import { InscricaoButton } from "@/components/evento/InscricaoButton";
import { Accordion, AccordionTab } from "primereact/accordion";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";
import NoData from "@/components/NoData";
import { Publicacoes } from "@/components/evento/publicacoes";
import { Publicacao } from "@/components/evento/publicacao";

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
      <header>
        {false && (
          <div className={styles.login}>
            <p>Avaliador</p>
          </div>
        )}
        <div className={styles.banner}>
          <Image
            src={`/image/${params.eventoSlug}/bgImg.png`}
            alt="Background"
            fill
            quality={100}
            className={styles.bgImage}
          />
          <div className={styles.bannerOverlay}>
            <Image
              src={`/image/${params.eventoSlug}/${params.edicao}/pathBanner.png`}
              alt="Evento Banner"
              width={1200}
              height={400}
              priority // Adicionado para otimização de LCP
              className={styles.overlayImage}
            />
          </div>
        </div>
      </header>

      <Publicacao params={params} />
    </>
  );
};

export default Page;

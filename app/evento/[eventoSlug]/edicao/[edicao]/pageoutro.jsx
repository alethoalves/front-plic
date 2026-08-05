import Image from "next/image";
import styles from "./page.module.scss";
import {
  RiCalendarEventFill,
  RiHome6Line,
  RiMapPinLine,
  RiUserStarLine,
} from "@remixicon/react";
import { Card } from "primereact/card";
import { getEventoBySlug } from "@/app/api/serverReq";

const Page = async ({ params }) => {
  let evento;
  try {
    evento = await getEventoBySlug(params.edicao);
  } catch (error) {
    return <h6 className="p-4">Evento não encontrado</h6>;
  }
  return (
    <main className={styles.main}>
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
          <section className={`${styles.contentMain}`}>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.cardActions}>
                  <div className={`${styles.cardAction} ${styles.cta}`}>
                    <p>REALIZAR SUBMISSÃO</p>
                  </div>
                </div>
                <div>
                  <h5 className="preserve-line-breaks">{evento.nomeEvento}</h5>
                  {evento.inicio && evento.fim && (
                    <div className={`${styles.cardItem} mt-2 mb-1`}>
                      <RiCalendarEventFill />
                      <p>
                        de <strong>{evento.inicio}</strong> a{" "}
                        <strong>{evento.inicio}</strong>
                      </p>
                    </div>
                  )}
                  {evento.inicio && evento.fim && (
                    <div className={styles.cardItem}>
                      <RiMapPinLine />
                      <p>
                        Centro Comunitários Athos Bulcão, Campus Darcy Ribeiro,
                        Asa Norte, Brasília DF
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className={styles.login}>
          <p>Login</p>
        </div>
      </div>
      <div className={styles.nav}>
        <div className={styles.home}>
          <RiHome6Line />
        </div>
        <ul>
          <li>
            <p>Programação</p>
          </li>
          <li>
            <p>Apresentações</p>
          </li>

          <li>
            <p>Publicações</p>
          </li>
        </ul>
      </div>

      <section className={`${styles.content}`}></section>
    </main>
  );
};

export default Page;

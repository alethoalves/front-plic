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
import { getEventoRootBySlug } from "@/app/api/serverReq";
import { Fragment } from "react";
import { InscricaoButton } from "@/components/evento/InscricaoButton";
import { Accordion, AccordionTab } from "primereact/accordion";
import {
  LoginAvaliadorEvento,
  LoginEvento,
} from "@/components/evento/LoginAvaliadorEvento";

const Page = async ({ params }) => {
  let evento;
  try {
    evento = await getEventoRootBySlug(params.eventoSlug);
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
          <div className={styles.bannerOverlay}>
            <Image
              src={`/image/${params.eventoSlug}/pathBanner.png`}
              alt="Evento Banner"
              width={1200}
              height={400}
              priority
              className={styles.overlayImage}
            />
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <article>
          <section className={`${styles.content} ${styles.descriptionSection}`}>
            {evento?.EventoPage?.map((page) => (
              <div key={page.id} className={styles.sectionContent}>
                <div className={styles.descriptionContent}>
                  <h5 className={`${styles.sectionTitle} ml-0  mb-2`}>
                    {page.titulo}
                  </h5>
                  {page.conteudo
                    .split("\n")
                    .filter((paragraph) => paragraph.trim() !== "") // Remove linhas vazias
                    .map((paragraph, index) => (
                      <p key={index} className={styles.paragraph}>
                        {paragraph}
                      </p>
                    ))}
                </div>
              </div>
            ))}
          </section>
          <aside>
            <div className={styles.actions}>
              <div className={styles.action}>
                <RiAwardFill />
                <h6>Certificados</h6>
              </div>
              <div className={styles.action}>
                <RiArticleLine />
                <h6>Publicações</h6>
              </div>
            </div>

            <div className={`${styles.edicoesContent}`}>
              <h6 className={styles.sectionTitle}>Últimas Edições</h6>
              <div className={styles.edicoes}>
                {evento?.eventos
                  .sort((a, b) => b.id - a.id)
                  .map((edicao) => (
                    <Link
                      key={edicao.id}
                      href={`/evento/${params.eventoSlug}/edicao/${edicao.slug}`}
                      className={styles.edicaoLink}
                      target="_blank"
                    >
                      <div className={styles.edicao}>
                        <h6>{edicao.edicaoEvento}</h6>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </article>
      </main>
    </>
  );
};

export default Page;

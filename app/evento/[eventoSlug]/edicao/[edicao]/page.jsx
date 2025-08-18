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
import { MinhasInscricoes } from "@/components/evento/MinhasInscricoes";
// Função para formatar AAAA-MM-DD para DD/MM/AAAA
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

// Função para extrair apenas horas e minutos de uma data ISO
const formatTime = (isoString) => {
  // Extrai a parte do tempo (HH:MM:SS) da string ISO
  const timePart = isoString.split("T")[1] || "";
  // Pega apenas horas e minutos
  const [hours, minutes] = timePart.split(":");
  return `${hours}:${minutes}`;
};
const formatDateFromISO = (isoString) => {
  // Extrai a parte da data (AAAA-MM-DD) da string ISO
  const datePart = isoString.split("T")[0];
  // Divide em componentes
  const [year, month, day] = datePart.split("-");
  // Remonta no formato DD/MM/AAAA
  return `${day}/${month}/${year}`;
};
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
  console.log(evento);
  console.log(programacao);
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

      <main className={styles.main}>
        <article>
          <aside>
            <div className={styles.actions}>
              <div className={styles.desktop}>
                <InscricaoButton params={params} />
              </div>
              <div className={styles.desktop}>
                <MinhasInscricoes params={params} />
              </div>
              <Link
                href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/publicacoes`}
                className={styles.edicaoLink}
              >
                <div className={styles.action}>
                  <RiArticleLine />
                  <h6>Publicações</h6>
                </div>
              </Link>

              {false && (
                <div className={styles.action}>
                  <RiAwardFill />
                  <h6>Certificados</h6>
                </div>
              )}
            </div>

            <div className={`${styles.edicoesContent}`}>
              <h6 className={styles.sectionTitle}>Últimas Edições</h6>
              <div className={styles.edicoes}>
                {eventoRoot?.eventos
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
          <section className={`${styles.content} ${styles.descriptionSection}`}>
            <div className={`${styles.mobile}`}>
              <div className={`${styles.sectionContent} mb-1`}>
                <InscricaoButton params={params} />
              </div>
              <div className={`${styles.sectionContent}`}>
                <MinhasInscricoes params={params} />
              </div>
            </div>

            <div className={styles.sectionContent}>
              <div className={styles.descriptionContent}>
                <h5
                  className={`preserve-line-breaks ${styles.sectionTitle} ml-0  mb-2`}
                >
                  {evento.nomeEvento}
                </h5>
                <div className={styles.card}>
                  <div className={styles.cardContent}>
                    <div>
                      <div className={`${styles.cardItem} mt-2 mb-1`}>
                        <RiCalendarEventFill />
                        <p>
                          de <strong>{formatDateFromISO(evento.inicio)}</strong>{" "}
                          a <strong>{formatDateFromISO(evento.fim)}</strong>
                        </p>
                      </div>
                      <div className={styles.cardItem}>
                        <RiMapPinLine />
                        <p>{evento.local}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.sectionContent}>
              <div className={styles.descriptionContent}>
                <h5
                  className={`preserve-line-breaks ${styles.sectionTitle} ml-0  mb-2`}
                >
                  Programação
                </h5>
                {(!programacao || programacao.length === 0) && <NoData />}
                <div className={styles.accordionWrapper}>
                  <Accordion activeIndex={0}>
                    {programacao.map((eventosDoDia) => (
                      <AccordionTab header={formatDate(eventosDoDia.data)}>
                        <div className={styles.atividades}>
                          {eventosDoDia.eventos.map((atividade) => (
                            <div className={styles.atividade}>
                              <div className={styles.hora}>
                                <p>{formatTime(atividade.inicio)}</p>
                              </div>
                              <div className={styles.conteudo}>
                                <div className={styles.titulo}>
                                  <h6>{atividade.titulo}</h6>
                                </div>
                                <div className={styles.descricao}>
                                  <p>{atividade.descricao}</p>
                                </div>
                                <div className={styles.local}>
                                  <RiMapPinLine />
                                  <p>{atividade.local}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionTab>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>
    </>
  );
};

export default Page;

import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import {
  RiArrowRightUpLine,
  RiArrowUpLine,
  RiStarLine,
  RiUserLine,
} from "@remixicon/react";

const Page = () => {
  return (
    <>
      <main className={styles.main}>
        <div className={styles.bg}>
          <Image
            priority
            fill
            src={`/image/cmbRevistaBg.png`}
            alt="logo"
            sizes="300 500 700"
          />
        </div>

        <div className={styles.content}>
          <div className={`${styles.img} ${styles.center}`}>
            <Image
              priority
              fill
              src={`/image/cmbLogoRevistaWhite.png`}
              alt="logo"
              sizes="300 500 700"
            />
          </div>
          <div className={`${styles.title} ${styles.center}`}>
            <h1>O Saber</h1>
            <h2>Revista Técnico-científica</h2>
            <h3>ANO XIV - Nº 14 - DEZEMBRO 2022</h3>
            <p>ISSN: 1983-7658</p>
          </div>

          <div className={`${styles.editorialFlex} ${styles.center} mt-2`}>
            <div className={`${styles.pdf} `}>
              <div className={`${styles.pdfBg} `}>
                <div className={`${styles.img} `}>
                  <Image
                    priority
                    fill
                    src={`/image/capaRevistaCMB.png`}
                    alt="logo"
                    sizes="300 500 700"
                  />
                </div>
                <p>Baixar em PDF</p>
              </div>
            </div>

            <div className={`${styles.editorial} `}>
              <p className={`${styles.label} ${styles.center} mb-1`}>
                Editorial
              </p>
              <div className={`${styles.editorialContent} ${styles.center} `}>
                <p>
                  Ao final do ano de 2022, lançamos a presente XIV edição da
                  Revista Técnico-Científica O SABER, do Colégio Militar de
                  Brasília (CMB). Este compêndio de produções, elaboradas pelos
                  autores nos anos de 2021 e 2022, representa um colégio que,
                  mesmo durante a Pandemia Covid-19, “teimou” em manter aceso o
                  espírito da pesquisa, do registro e do debate de ideias.
                </p>
                <p>
                  Esta edição apresenta uma coletânea de 11 trabalhos, entre
                  três artigos científicos e oito artigos de opinião ou de
                  revisão. Os trabalhos apresentam iniciativas pedagógicas
                  inovadoras e adaptações da rotina escolar, debatem possíveis
                  adequações curriculares, além de visões de futuro no contexto
                  escolar pós-pandêmico. Mantendo a linha editorial da revista,
                  trabalhos com assuntos específicos de interesse dos autores
                  também foram incluídos na edição. A coletânea reúne os
                  trabalhos autorais de 14 servidores civis e militares, os
                  quais contam com a participação de 30 alunos e alunas do CMB
                  (um recorde para O SABER).{" "}
                </p>
                <p>
                  É uma satisfação disponibilizar ao público escolar a presente
                  materialização destes trabalhos. Trabalhos de um conjunto
                  autoral que, além de todas as rotinas escolares, destinaram
                  fração preciosa de seu tempo para eternizar – nas páginas d’O
                  Saber – assuntos tão caros ao CMB.
                </p>
                <p>
                  Convidamos você, leitor (a), para realizar um mergulho nesse
                  mundo fascinante da educação!{" "}
                </p>
              </div>
            </div>
          </div>
          <p className={`${styles.label} ${styles.center}`}>Publicações</p>
          <div className={`${styles.articles} ${styles.center}`}>
            <Link
              href={`/artigo/diversidade-de-especies-arboreas-usadas-na-arborizacao-do-Colegio-Militar-de-Brasilia`}
            >
              <div className={styles.article}>
                <div className={styles.imgArticle}>
                  <Image
                    priority
                    fill
                    src={`/image/cmbTeste.webp`}
                    alt="logo"
                    sizes="300 500 700"
                  />
                </div>
                <div className={styles.title}>
                  <h6>
                    Diversidade de espécies arbóreas usadas na arborização do
                    Colégio Militar de Brasília
                  </h6>
                  <div className={styles.articleFooter}>
                    <div className={styles.journalLogo}>
                      <div className={`${styles.img}`}>
                        <Image
                          priority
                          fill
                          src={`/image/cmbLogoRevistaWhite.png`}
                          alt="logo"
                          sizes="300 500 700"
                        />
                      </div>
                    </div>
                    <p>Revista Técnico-científica: O Saber</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link
              href={`/artigo/diversidade-de-especies-arboreas-usadas-na-arborizacao-do-Colegio-Militar-de-Brasilia`}
            >
              <div className={styles.article}>
                <div className={styles.imgArticle}>
                  <Image
                    priority
                    fill
                    src={`/image/cmbTeste.webp`}
                    alt="logo"
                    sizes="300 500 700"
                  />
                </div>
                <div className={styles.title}>
                  <h6>
                    Diversidade de espécies arbóreas usadas na arborização do
                    Colégio Militar de Brasília
                  </h6>
                  <div className={styles.articleFooter}>
                    <div className={styles.journalLogo}>
                      <div className={`${styles.img}`}>
                        <Image
                          priority
                          fill
                          src={`/image/cmbLogoRevistaWhite.png`}
                          alt="logo"
                          sizes="300 500 700"
                        />
                      </div>
                    </div>
                    <p>Revista Técnico-científica: O Saber</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link
              href={`/artigo/diversidade-de-especies-arboreas-usadas-na-arborizacao-do-Colegio-Militar-de-Brasilia`}
            >
              <div className={styles.article}>
                <div className={styles.imgArticle}>
                  <Image
                    priority
                    fill
                    src={`/image/cmbTeste.webp`}
                    alt="logo"
                    sizes="300 500 700"
                  />
                </div>
                <div className={styles.title}>
                  <h6>
                    Diversidade de espécies arbóreas usadas na arborização do
                    Colégio Militar de Brasília
                  </h6>
                  <div className={styles.articleFooter}>
                    <div className={styles.journalLogo}>
                      <div className={`${styles.img}`}>
                        <Image
                          priority
                          fill
                          src={`/image/cmbLogoRevistaWhite.png`}
                          alt="logo"
                          sizes="300 500 700"
                        />
                      </div>
                    </div>
                    <p>Revista Técnico-científica: O Saber</p>
                  </div>
                </div>
              </div>
            </Link>
            <Link
              href={`/artigo/diversidade-de-especies-arboreas-usadas-na-arborizacao-do-Colegio-Militar-de-Brasilia`}
            >
              <div className={styles.article}>
                <div className={styles.imgArticle}>
                  <Image
                    priority
                    fill
                    src={`/image/cmbTeste.webp`}
                    alt="logo"
                    sizes="300 500 700"
                  />
                </div>
                <div className={styles.title}>
                  <h6>
                    Diversidade de espécies arbóreas usadas na arborização do
                    Colégio Militar de Brasília
                  </h6>
                  <div className={styles.articleFooter}>
                    <div className={styles.journalLogo}>
                      <div className={`${styles.img}`}>
                        <Image
                          priority
                          fill
                          src={`/image/cmbLogoRevistaWhite.png`}
                          alt="logo"
                          sizes="300 500 700"
                        />
                      </div>
                    </div>
                    <p>Revista Técnico-científica: O Saber</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;

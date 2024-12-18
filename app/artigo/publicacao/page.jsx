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
            <p>ISSN: 1983-7658</p>
          </div>
          <p className={`${styles.label} ${styles.center}`}>Edições</p>
          <div className={`${styles.list} ${styles.center}`}>
            <ul>
              <Link
                href={`/artigo/diversidade-de-especies-arboreas-usadas-na-arborizacao-do-Colegio-Militar-de-Brasilia`}
              >
                <li>
                  <div className={styles.text}>
                    <div className={styles.itemListSmall}>
                      <p>dez 2022</p>
                    </div>
                    <div className={styles.itemListContent}>
                      <h1>O Saber 2022:</h1>
                      <h2>Revista técnico-científica</h2>
                    </div>
                  </div>
                  <div className={styles.icon}>
                    <RiArrowRightUpLine />
                  </div>
                </li>
              </Link>
              <Link href={`/artigo/publicacao/edicao`}>
                <li>
                  <div className={styles.text}>
                    <div className={styles.itemListSmall}>
                      <p>dez 2022</p>
                    </div>
                    <div className={styles.itemListContent}>
                      <h1>O Saber 2022:</h1>
                      <h2>Revista técnico-científica</h2>
                    </div>
                  </div>
                  <div className={styles.icon}>
                    <RiArrowRightUpLine />
                  </div>
                </li>
              </Link>
              <Link href={`/artigo/publicacao/edicao`}>
                <li>
                  <div className={styles.text}>
                    <div className={styles.itemListSmall}>
                      <p>dez 2022</p>
                    </div>
                    <div className={styles.itemListContent}>
                      <h1>O Saber 2022:</h1>
                      <h2>Revista técnico-científica</h2>
                    </div>
                  </div>
                  <div className={styles.icon}>
                    <RiArrowRightUpLine />
                  </div>
                </li>
              </Link>
              <Link href={`/artigo/publicacao/edicao`}>
                <li>
                  <div className={styles.text}>
                    <div className={styles.itemListSmall}>
                      <p>dez 2022</p>
                    </div>
                    <div className={styles.itemListContent}>
                      <h1>O Saber 2022:</h1>
                      <h2>Revista técnico-científica</h2>
                    </div>
                  </div>
                  <div className={styles.icon}>
                    <RiArrowRightUpLine />
                  </div>
                </li>
              </Link>
              <Link href={`/artigo/publicacao/edicao`}>
                <li>
                  <div className={styles.text}>
                    <div className={styles.itemListSmall}>
                      <p>dez 2022</p>
                    </div>
                    <div className={styles.itemListContent}>
                      <h1>O Saber 2022:</h1>
                      <h2>Revista técnico-científica</h2>
                    </div>
                  </div>
                  <div className={styles.icon}>
                    <RiArrowRightUpLine />
                  </div>
                </li>
              </Link>
            </ul>
          </div>
          <p className={`${styles.label} ${styles.center}`}>
            Publicações em destaque
          </p>
          <div className={styles.articles}>
            <div className={styles.slider}>
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
        </div>
      </main>
    </>
  );
};

export default Page;

import { getEventoBySlug, getSubmissoes } from "@/app/api/serverReq";
import Image from "next/image";
import styles from "./page.module.scss";
import {
  RiCalendarEventFill,
  RiHome6Line,
  RiMapPinLine,
  RiUserStarLine,
} from "@remixicon/react";
import { Card } from "primereact/card";

const Page = async ({ params }) => {
  //const submissoes = await getSubmissoes(evento.id);

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
            src={`/image/${params.eventoSlug}/pathBanner.png`}
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
                  <div className={`${styles.cardAction} ${styles.secondary}`}>
                    <p>REALIZAR INSCRIÇÃO</p>
                  </div>
                </div>
                <div>
                  <h5>
                    23º Congresso de Iniciação Científica da Universidade de
                    Brasília e 13º Congresso de Iniciação Cinetífica do Distrito
                    Federal
                  </h5>
                  <div className={`${styles.cardItem} mt-2 mb-1`}>
                    <RiCalendarEventFill />
                    <p>
                      de <strong>14/06/2025</strong> a{" "}
                      <strong>16/06/2025</strong>
                    </p>
                  </div>
                  <div className={styles.cardItem}>
                    <RiMapPinLine />
                    <p>
                      Centro Comunitários Athos Bulcão, Campus Darcy Ribeiro,
                      Asa Norte, Brasília DF
                    </p>
                  </div>
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
            <p>Inscrição</p>
          </li>
          <li>
            <p>Submissão</p>
          </li>
          <li>
            <p>Programação</p>
          </li>
          <li>
            <p>Convidados e Palestrantes</p>
          </li>

          <li>
            <p>Anais</p>
          </li>
          <li>
            <p>Certificados</p>
          </li>
        </ul>
      </div>

      <section className={`${styles.content}`}>
        <h6 className={styles.sectionTitle}>Últimas Edições:</h6>
        <div className={styles.edicoes}>
          <div className={styles.edicao}>
            <h6>2024</h6>
            <p>23º Congresso de Iniciação Científica da UnB e 14º do DF</p>
          </div>
          <div className={styles.edicao}>
            <h6>2023</h6>
            <p>22º Congresso de Iniciação Científica da UnB e 13º do DF</p>
          </div>
        </div>
        <h6 className={`${styles.sectionTitle} mt-2`}>Trabalhos Premiados:</h6>
        <div className={styles.premiados}>
          <div className={styles.premiado}>
            <div className={styles.tags}>
              <p className={styles.tag}>Artes e Humanidades</p>
              <p className={styles.tag}>PIBIC EM</p>
            </div>
            <div className={styles.descricao}>
              <h5 className="mb-1">
                Diversidade de espécies arbóreas usadas na arborização do
                Colégio Militar de Brasília
              </h5>
              <p>
                <strong>Aluno:</strong> Aletho Alves de Sá Oliveira
              </p>
              <p>
                <strong>Orientador:</strong> Lúcia Helena Poncio
              </p>
            </div>
          </div>
          <div className={styles.premiado}>
            <div className={styles.tags}>
              <p className={styles.tag}>Artes e Humanidades</p>
              <p className={styles.tag}>PIBIC EM</p>
            </div>
            <div className={styles.descricao}>
              <h5 className="mb-1">
                Diversidade de espécies arbóreas usadas na arborização do
                Colégio Militar de Brasília
              </h5>
              <p>
                <strong>Aluno:</strong> Aletho Alves de Sá Oliveira
              </p>
              <p>
                <strong>Orientador:</strong> Lúcia Helena Poncio
              </p>
            </div>
          </div>
          <div className={styles.premiado}>
            <div className={styles.tags}>
              <p className={styles.tag}>Artes e Humanidades</p>
              <p className={styles.tag}>PIBIC EM</p>
            </div>
            <div className={styles.descricao}>
              <h5 className="mb-1">
                Diversidade de espécies arbóreas usadas na arborização do
                Colégio Militar de Brasília
              </h5>
              <p>
                <strong>Aluno:</strong> Aletho Alves de Sá Oliveira
              </p>
              <p>
                <strong>Orientador:</strong> Lúcia Helena Poncio
              </p>
            </div>
          </div>
          <div className={styles.premiado}>
            <div className={styles.tags}>
              <p className={styles.tag}>Artes e Humanidades</p>
              <p className={styles.tag}>PIBIC EM</p>
            </div>
            <div className={styles.descricao}>
              <h5 className="mb-1">
                Diversidade de espécies arbóreas usadas na arborização do
                Colégio Militar de Brasília
              </h5>
              <p>
                <strong>Aluno:</strong> Aletho Alves de Sá Oliveira
              </p>
              <p>
                <strong>Orientador:</strong> Lúcia Helena Poncio
              </p>
            </div>
          </div>
          <div className={styles.premiado}>
            <div className={styles.tags}>
              <p className={styles.tag}>Artes e Humanidades</p>
              <p className={styles.tag}>PIBIC EM</p>
            </div>
            <div className={styles.descricao}>
              <h5 className="mb-1">
                Diversidade de espécies arbóreas usadas na arborização do
                Colégio Militar de Brasília
              </h5>
              <p>
                <strong>Aluno:</strong> Aletho Alves de Sá Oliveira
              </p>
              <p>
                <strong>Orientador:</strong> Lúcia Helena Poncio
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;

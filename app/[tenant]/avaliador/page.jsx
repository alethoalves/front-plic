import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import { RiAwardFill, RiQuillPenLine } from "@remixicon/react";

const Page = ({ params }) => {
  return (
    <main className={styles.main}>
      <div className={styles.instituicoes}>
        {/** LINK PARA AVALIAÇÃO DE PROJETOS COM OU SEM AVALIAÇÃO DE PLANOS DE TRABALHO **/}
        {/** edital tem formulário de avaliação de projeto **/}
        {/** a avaliação do plano dependerá se o edital possui formulário de avaliação de plano **/}
        <Link href={`/${params.tenant}/avaliador/avaliacoes/projetos`}>
          <div className={styles.menu}>
            <div className={styles.logo}>
              <RiQuillPenLine />
            </div>
            <div className={styles.descricao}>
              <h6>Avaliar Projetos</h6>
            </div>
          </div>
        </Link>
        {/** LINK PARA AVALIAÇÃO APENAS DE PLANOS DE TRABALHO **/}
        {/** quando o edital prevê apenas formulário de avaliação do plano **/}
        {false && (
          <Link href={`/avaliador/avaliacoes/planos`}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiQuillPenLine />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliar Planos de Trabalho</h6>
              </div>
            </div>
          </Link>
        )}
        {/** LINK PARA AVALIAÇÃO DE ATIVIDADES **/}
        {false && (
          <Link href={`${params.tenant}/avaliador/avaliacoes/atividades`}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiQuillPenLine />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliar atividades</h6>
              </div>
            </div>
          </Link>
        )}
        {false && (
          <Link href={"/avaliador/home/certificados"}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiAwardFill />
              </div>
              <div className={styles.descricao}>
                <h6>Avaliações concluídas</h6>
              </div>
            </div>
          </Link>
        )}
        {false && (
          <Link href={"/avaliador/home/certificados"}>
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiAwardFill />
              </div>
              <div className={styles.descricao}>
                <h6>Declarações e Certificados</h6>
              </div>
            </div>
          </Link>
        )}
      </div>
    </main>
  );
};

export default Page;

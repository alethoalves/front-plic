"use client";
import styles from "./page.module.scss";
import { RiListCheck2, RiSurveyLine } from "@remixicon/react";
import Header from "@/components/Header";
import EditalFormularios from "@/components/EditalFormularios";
import EditalAtividades from "@/components/EditalAtividades";

const Page = ({ params }) => {
  return (
    <>
      <Header />
      <div className={styles.content}>
        <div className={styles.head}>
          <div className={styles.headIcon}>
            <RiListCheck2 />
          </div>
          <div className={styles.item}>
            <h5>Atividades</h5>
            <p>Aqui você gerencia as atividades deste edital.</p>
            <EditalAtividades params={params} />
          </div>
        </div>
        <div className={styles.head}>
          <div className={styles.headIcon}>
            <RiSurveyLine />
          </div>
          <div className={styles.item}>
            <h5>Formulários Personalizados</h5>
            <p>
              Aqui você gerencia quais formulários serão utilizados neste
              edital.
            </p>
            <EditalFormularios params={params} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;

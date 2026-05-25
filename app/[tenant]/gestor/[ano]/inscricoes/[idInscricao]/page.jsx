"use client";
import styles from "./page.module.scss";
import FluxoInscricaoEdital from "@/components/FluxoInscricaoEdital";

export default function Page({ params }) {
  return (
    <div className={styles.navContent}>
      <div className={styles.content}>
        <FluxoInscricaoEdital
          tenant={params.tenant}
          inscricaoSelected={params.idInscricao}
          gestorMode={true}
        />
      </div>
    </div>
  );
}

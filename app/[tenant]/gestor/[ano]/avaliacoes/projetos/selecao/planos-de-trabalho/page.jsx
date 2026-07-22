"use client";
// ESTILO
import styles from "./page.module.scss";
// COMPONENTES
import Header from "@/components/Header";
import TabelaPlanoDeTrabalhoAcompanhamento from "@/components/tabelas/TabelaPlanoDeTrabalhoAcompanhamento";

const Page = ({ params }) => {
  return (
    <>
      <main className={styles.main}>
        <Header className="mb-3" titulo="Planos de Trabalho" />
        <TabelaPlanoDeTrabalhoAcompanhamento params={params} />
      </main>
    </>
  );
};

export default Page;

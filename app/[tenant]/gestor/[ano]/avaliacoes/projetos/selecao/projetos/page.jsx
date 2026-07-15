"use client";
import styles from "./page.module.scss";
import Header from "@/components/Header";
import TabelaProjetos from "@/components/tabelas/TabelaProjetos";

const Page = ({ params }) => (
  <main className={styles.main}>
    <Header className="mb-3" titulo="Projetos" />
    <TabelaProjetos params={params} />
  </main>
);

export default Page;

import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import { RiAwardFill, RiQuillPenLine } from "@remixicon/react";

const Page = () => {
  return (
    <main className={styles.main}>
      <div className={styles.instituicoes}>
        <Link href={"/avaliador/home/avaliacoes"}>
          <div className={styles.menu}>
            <div className={styles.logo}>
              <RiQuillPenLine />
            </div>
            <div className={styles.descricao}>
              <h6>Começar a avaliar</h6>
            </div>
          </div>
        </Link>
        <Link href={"/avaliador/home/certificados"}>
          <div className={styles.menu}>
            <div className={styles.logo}>
              <RiAwardFill />
            </div>
            <div className={styles.descricao}>
              <h6>Meus certificados</h6>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
};

export default Page;

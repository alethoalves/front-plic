import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";
import { RiAwardFill, RiQuillPenLine } from "@remixicon/react";

const Page = ({ params }) => {
  return (
    <main className={styles.main}>
      <div className={styles.instituicoes}>
        <Link
          href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliador/avaliacoes`}
        >
          <div className={styles.menu}>
            <div className={styles.logo}>
              <RiQuillPenLine />
            </div>
            <div className={styles.descricao}>
              <h6>Começar a avaliar</h6>
            </div>
          </div>
        </Link>
        {false && (
          <Link
            href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliador/certificados`}
          >
            <div className={styles.menu}>
              <div className={styles.logo}>
                <RiAwardFill />
              </div>
              <div className={styles.descricao}>
                <h6>Meus certificados</h6>
              </div>
            </div>
          </Link>
        )}
      </div>
    </main>
  );
};

export default Page;

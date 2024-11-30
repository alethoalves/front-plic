import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";

const Page = () => {
  return (
    <main className={styles.main}>
      <Header className="mb-2" subtitulo="Olá, ALETHO" />

      <h6 className="mb-2 mt-2">
        Clique para visualizar um esboço da página do seu artigo
      </h6>
      <div className={styles.instituicoes}>
        <Link href={"/studio/temp/pages/1/1"}>
          <div className={styles.instituicao}>
            <div className={styles.descricao}>
              <h6>
                Testes de germinação e emergência de Miconia minutiflora
                (Bonpl.) DC. em laboratório e casa de vegetação
              </h6>
            </div>
          </div>
        </Link>
        <Link href={"/avaliador/home/avaliacoes/1"}>
          <div className={styles.instituicao}>
            <div className={styles.descricao}>
              <h6>
                Testes de germinação e emergência de Miconia minutiflora
                (Bonpl.) DC. em laboratório e casa de vegetação
              </h6>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
};

export default Page;

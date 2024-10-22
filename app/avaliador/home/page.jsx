import Header from "@/components/Header";
import styles from "./page.module.scss";
import Image from "next/image";
import Link from "next/link";

const Page = () => {
  return (
    <main className={styles.main}>
      <Header
        className="mb-3"
        titulo="Avaliações"
        subtitulo="Selecione um evento ou uma instituição para iniciar as avaliações."
      />
      <div className={styles.instituicoes}>
        <Link href={"home/1"}>
          <div className={styles.instituicao}>
            <div className={styles.logo}>
              <Image
                priority
                sizes="300 500 700"
                src={`/image/cicdf.png`}
                fill={true}
                alt="logo da instituição"
              />
            </div>
            <div className={styles.descricao}>
              <h6>Congresso de Iniciação Científica da UnB e do DF</h6>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
};

export default Page;

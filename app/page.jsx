import Image from "next/image";
import styles from "./page.module.scss";
import { getTenants } from "./api/server/getTenant";
import Link from "next/link";

const Page = async () => {
  let tenants;
  try {
    tenants = await getTenants(); // Chama a função que faz a requisição
  } catch (error) {
    console.error("Erro ao carregar tenants:", error);
  }
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <h4>Selecione a sua instituição</h4>
        {tenants ? (
          tenants.map((item) => (
            <Link href={`/${item.slug}`}>
              <div className={styles.boxButton}>
                <div className={styles.logo}>
                  <Image
                    priority
                    fill
                    src={`/image/${item.pathLogo}`}
                    alt="logo"
                    sizes="300 500 700"
                  />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className={styles.noData}>
            <div className={styles.logo}>
              <Image
                priority
                fill
                src={`/image/noData.svg`}
                alt="logo"
                sizes="300 500 700"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
export default Page;

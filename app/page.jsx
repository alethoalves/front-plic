import Image from "next/image";
import styles from "./page.module.scss";
import { getTenants } from "./api/server/getTenant";
import ClientSelect from "@/components/ClientSelect";

const Page = async () => {
  let tenants;
  try {
    tenants = await getTenants();
  } catch (error) {
    console.error("Erro ao carregar tenants:", error);
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Selecione sua instituição</h1>
          <ClientSelect tenants={tenants || []} />
        </div>
      </div>
    </main>
  );
};

export default Page;

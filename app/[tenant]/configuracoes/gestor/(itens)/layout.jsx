import Header from "@/components/Header";
import styles from "./page.module.scss";
import { getInscricao } from "@/app/api/serverReq";
import { redirect } from "next/navigation";
import MenuGestorConfiguracoes from "@/components/MenuGestorConfiguracoes";

const Layout = async ({ children, params }) => {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <MenuGestorConfiguracoes />
        <div className={`${styles.navContent} mt-3`}>{children}</div>
      </div>
    </main>
  );
};

export default Layout;

import SideNav from "@/components/SideNav";
import NavBar from "@/components/NavBar";

import styles from "./layout.module.scss";
import { headers } from "next/headers";

const Layout = ({ children, params }) => {
  // Acessar os cabeçalhos da requisição
  const headersList = headers();
  const pathLogo = headersList.get("x-tenant-path-logo");
  return (
    <div className={styles.dashboard}>
      <div className={styles.item1}>
        <SideNav pathLogo={pathLogo} />
      </div>
      <div className={styles.item2}>
        <NavBar slug={params.tenant} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Layout;

import SideNav from "@/components/SideNav";
import NavBarAvaliadorTenant from "@/components/NavBarAvaliadorTenant";

import styles from "./layout.module.scss";
import { headers } from "next/headers";

const Layout = ({ children, params }) => {
  // Acessar os cabeçalhos da requisição
  const headersList = headers();
  const pathLogo = headersList.get("x-tenant-path-logo");

  return (
    <div className={styles.dashboard}>
      <div className={styles.item1}>
        <SideNav pathLogo={pathLogo} menuType="avaliadorTenant" />
      </div>
      <div className={styles.item2}>
        <NavBarAvaliadorTenant pathLogo={pathLogo} slug={params.tenant} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Layout;

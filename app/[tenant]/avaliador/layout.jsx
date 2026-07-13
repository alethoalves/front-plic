import NavBarAvaliadorTenant from "@/components/NavBarAvaliadorTenant";

import styles from "./layout.module.scss";
import { headers } from "next/headers";

const Layout = ({ children, params }) => {
  // Acessar os cabeçalhos da requisição
  const headersList = headers();
  const pathLogo = headersList.get("x-tenant-path-logo");

  return (
    <div className={styles.dashboard}>
      <NavBarAvaliadorTenant pathLogo={pathLogo} slug={params.tenant} />
      <div className={styles.content}>{children}</div>
    </div>
  );
};

export default Layout;

import SideNav from "@/components/SideNav";
import NavBar from "@/components/NavBar";

import styles from "./layout.module.scss";
import { headers } from "next/headers";
import NavBarAluno from "@/components/NavBarAluno";

const Layout = ({ children, params }) => {
  // Acessar os cabeçalhos da requisição
  const headersList = headers();
  const pathLogo = headersList.get("x-tenant-path-logo");
  console.log("pathLogo");
  console.log(pathLogo);
  return (
    <div className={styles.dashboard}>
      {true && (
        <div className={`${styles.item1} no-print`}>
          <SideNav pathLogo={pathLogo} menuType="user" />
        </div>
      )}
      <div className={styles.item2}>
        <div className="no-print">
          <NavBarAluno pathLogo={pathLogo} slug={params.tenant} />
        </div>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Layout;

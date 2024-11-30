import SideNav from "@/components/SideNav";
import NavBarAvaliador from "@/components/NavBarAvaliador";

import styles from "./layout.module.scss";
import { headers } from "next/headers";
const Layout = ({ children, params }) => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.item1}>
        <SideNav pathLogo={"plicRoot.png"} menuType="root" />
      </div>
      <div className={styles.item2}>
        <NavBarAvaliador slug={params.eventoSlug} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Layout;

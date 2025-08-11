import SideNav from "@/components/SideNav";
import NavBarAvaliador from "@/components/NavBarAvaliador";

import styles from "./layout.module.scss";
import { headers } from "next/headers";
import NavBarAvaliadorEvento from "@/components/NavBarAvaliadorEvento";
const Layout = ({ children, params }) => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.item1}>
        <SideNav
          pathLogoExtended={`/image/${params.eventoSlug}/logoMenu.png`}
          menuType="avaliadorEvento"
        />
      </div>
      <div className={styles.item2}>
        <NavBarAvaliadorEvento params={params} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Layout;

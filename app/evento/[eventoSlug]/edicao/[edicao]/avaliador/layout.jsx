import SideNav from "@/components/SideNav";
import NavBarAvaliador from "@/components/NavBarAvaliador";

import styles from "./layout.module.scss";
import { headers } from "next/headers";
import NavBarAvaliadorEvento from "@/components/NavBarAvaliadorEvento";
import { getEventoBySlug } from "@/app/api/serverReq";
import {
  resolveEventoImageSrc,
  DEFAULT_EVENTO_LOGO,
} from "@/lib/resolveEventoImage";

const Layout = async ({ children, params }) => {
  let evento;
  try {
    evento = await getEventoBySlug(params.edicao);
  } catch (error) {
    evento = null;
  }
  const pathLogoExtended = resolveEventoImageSrc(evento?.pathLogo, DEFAULT_EVENTO_LOGO);

  return (
    <div className={styles.dashboard}>
      <div className={styles.item1}>
        <SideNav
          pathLogoExtended={pathLogoExtended}
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

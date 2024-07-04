import SideNav from "@/components/SideNav";
import NavBar from "@/components/NavBar";

import styles from "./layout.module.scss"
import { getTenant } from "@/app/api/serverReq";

const Layout = async ({ children,params }) => {
  const tenant = params.tenant;
  const tenantExists = await getTenant({ slug: tenant });

  if (!tenantExists.tenant) {
    // Redirecionar para a página padrão de erro 404 se o tenant não existir
    redirect('/404/jjj');
    //return null // Substitua com o caminho para sua página 404 personalizada se necessário
  }
  const {primaryColor,whiteColor, pathLogo } = tenantExists.tenant;
  return (
    
    <div className={styles.dashboard} style={{ '--primary-color': primaryColor,'--white-color': whiteColor }}>
      <div className={styles.item1}>
        <SideNav pathLogo={pathLogo}/>
      </div>
      <div className={styles.item2}>
        <NavBar/>
        <div className={styles.content}>{children}</div>
      </div>
    </div>

  );
}

export default Layout;
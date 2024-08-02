import SideNav from "@/components/SideNav";
import NavBar from "@/components/NavBar";

import styles from "./page.module.scss"
import { getEdital } from "@/app/api/serverReq";
import Header from "@/components/Header";

const Layout = async ({ children,params }) => {
  const edital = await getEdital(params.tenant, params.idEdital);
console.log(edital)
  
  return (
    
    <main className={styles.main}>
        <Header
          className="mb-3"
          titulo="Edital"
          subtitulo={`${edital.titulo} - ${edital.ano}`}
        />
        {children}
      </main>

  );
}

export default Layout;
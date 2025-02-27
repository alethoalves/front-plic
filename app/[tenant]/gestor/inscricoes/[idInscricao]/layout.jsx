import Header from "@/components/Header";
import styles from "./page.module.scss";
import MenuInscricao from "@/components/MenuInscricao";
import { getInscricao } from "@/app/api/serverReq";
import { redirect } from "next/navigation";

const Layout = async ({ children, params }) => {
  return (
    <main className={styles.main}>
      <Header
        className="mb-3"
        //titulo={`Inscrição nº ${inscricao.id}`}
        //status={{ label: inscricao.status, type: statusType }}
        subtitulo={`Inscrição nº ${params.idInscricao}`}
        //{`Edital ${inscricao.edital.titulo} - ${inscricao.edital.ano}`}
        //descricao={<><strong>Proponente: </strong>{inscricao.proponente.nome}</>}
      />
      <div className={styles.content}>
        <MenuInscricao />
        <div className={styles.navContent}>{children}</div>
      </div>
    </main>
  );
};

export default Layout;

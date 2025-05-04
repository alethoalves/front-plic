import SideNav from "@/components/SideNav";
import NavBar from "@/components/NavBar";
import { redirect } from "next/navigation";
import styles from "./layout.module.scss";
import { headers } from "next/headers";
import { getEditais } from "@/app/api/serverReq";
import { getCookie } from "cookies-next";

const Layout = async ({ children, params }) => {
  // Acessar os cabeçalhos da requisição
  const headersList = headers();
  const pathLogo = headersList.get("x-tenant-path-logo");
  const editais = await getEditais(params.tenant);
  // Redirecionar se não houver editais
  if (!editais || editais.length === 0) {
    redirect(`/${params.tenant}/configuracoes/gestor/editais`);
  }
  const anoSelected = getCookie("anoSelected");
  let anosUnicos;
  let selectedAno;

  editais.sort((a, b) => b.ano - a.ano);
  // Extrair anos únicos dos editais
  anosUnicos = [...new Set(editais.map((edital) => edital.ano))].sort(
    (a, b) => b - a
  );

  // Definir o ano mais recente como selecionado
  if (anosUnicos.length > 0) {
    selectedAno = anosUnicos[0];
  }
  return (
    <div className={styles.dashboard}>
      <div className={styles.item1}>
        <SideNav pathLogo={pathLogo} menuType="gestor" />
      </div>
      <div className={styles.item2}>
        <NavBar
          slug={params.tenant}
          anoSelected={params.ano}
          menuType="gestor"
        />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Layout;

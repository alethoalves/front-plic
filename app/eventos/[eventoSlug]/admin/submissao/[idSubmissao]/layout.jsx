import Header from "@/components/Header";
import styles from "./page.module.scss";
import MenuInscricao from "@/components/MenuInscricao";
import { getInscricao } from "@/app/api/serverReq";
import { redirect } from "next/navigation";

const Layout = async ({ children, params }) => {
  let submissao;

  try {
    //inscricao = await getInscricao(params.tenant, params.idInscricao);
    //console.log(inscricao.id);
  } catch (error) {
    console.error("Erro ao buscar inscrição:", error);

    return <p>Submissão não encontrada</p>; // Garante que nada mais será renderizado após o redirecionamento
  }

  //if (!submissao) {
  //  redirect("/404");
  //  return null; // Garante que nada mais será renderizado após o redirecionamento
  //}

  return (
    <main className={styles.main}>
      <Header
        className="mb-3"
        //titulo={`Inscrição nº ${inscricao.id}`}
        //status={{ label: inscricao.status, type: statusType }}
        subtitulo={`Submissão 1209`}
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

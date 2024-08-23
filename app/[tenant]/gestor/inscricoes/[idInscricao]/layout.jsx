import Header from "@/components/Header";
import styles from "./page.module.scss";
import MenuInscricao from "@/components/MenuInscricao";
import { getInscricao } from "@/app/api/serverReq";
import { redirect } from "next/navigation";

const Layout = async ({ children, params }) => {
  let inscricao;

  try {
    inscricao = await getInscricao(params.tenant, params.idInscricao);
    console.log(inscricao.id);
  } catch (error) {
    console.error("Erro ao buscar inscrição:", error);

    return <p>Inscrição não encontrada</p>; // Garante que nada mais será renderizado após o redirecionamento
  }

  if (!inscricao) {
    redirect("/404");
    return null; // Garante que nada mais será renderizado após o redirecionamento
  }
  const statusType =
    inscricao.status === "incompleta"
      ? "incompleto"
      : inscricao.status === "aprovada" && "ativo";
  return (
    <main className={styles.main}>
      <Header
        className="mb-3"
        //titulo={`Inscrição nº ${inscricao.id}`}
        status={{ label: inscricao.status, type: statusType }}
        subtitulo={`Inscrição nº ${inscricao.id}`}
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

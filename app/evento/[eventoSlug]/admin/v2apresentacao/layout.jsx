import Header from "@/components/Header";
import styles from "./layout.module.scss";
import MenuAdminEvento from "@/components/MenuAdminEvento";
import { redirect } from "next/navigation";
import { getSessoesBySlug } from "@/app/api/serverReq";

const Layout = async ({ children, params }) => {
  let sessoesData;
  let menuItens = [];
  try {
    sessoesData = await getSessoesBySlug(params.eventoSlug);
    sessoesData.forEach((element) => {
      menuItens.push({
        title: element.titulo,
        path: `/eventos/${params.eventoSlug}/admin/apresentacao/${element.id}`,
      });
    });
  } catch (error) {
    console.error("Erro:", error);

    return <p>Dados não encontrados</p>; // Garante que nada mais será renderizado após o redirecionamento
  }

  return (
    <main className={styles.main}>
      <Header
        className="mb-3"
        //titulo={`Inscrição nº ${inscricao.id}`}
        //status={{ label: "pendente", type: statusType }}
        subtitulo="Apresentação de Trabalhos"
        //{`Edital ${inscricao.edital.titulo} - ${inscricao.edital.ano}`}
        //descricao={<><strong>Proponente: </strong>{inscricao.proponente.nome}</>}
      />
      <div className={styles.content}>
        <div className={styles.navContent}>{children}</div>
      </div>
    </main>
  );
};

export default Layout;

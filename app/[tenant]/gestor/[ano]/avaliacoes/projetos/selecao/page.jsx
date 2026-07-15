import { redirect } from "next/navigation";

const Page = ({ params }) => {
  redirect(
    `/${params.tenant}/gestor/${params.ano}/avaliacoes/projetos/selecao/projetos`
  );
};

export default Page;

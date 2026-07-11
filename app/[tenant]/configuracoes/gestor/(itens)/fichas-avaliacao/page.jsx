"use client";

import { getCookie } from "cookies-next";
import FormularioFichaAvaliacao from "@/components/FormularioFichaAvaliacao";

const Page = ({ params }) => {
  const ano = getCookie("anoSelected");

  return (
    <main>
      <FormularioFichaAvaliacao params={{ tenant: params.tenant, ano }} />
    </main>
  );
};

export default Page;

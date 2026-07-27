"use client";
import TabelaDocumentos from "@/components/tabelas/TabelaDocumentos";

const Page = ({ params }) => {
  return (
    <main>
      <TabelaDocumentos params={params} />
    </main>
  );
};

export default Page;

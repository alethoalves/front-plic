import colorGenerate from "@/lib/colorGenerate";
import { headers } from "next/headers";
import Head from "next/head";
import { getEventoBySlug } from "@/app/api/serverReq";

export const generateMetadata = async ({ params }) => {
  const { eventoSlug } = params;
  //Necessário personalizar isso para cada evento
  return {
    title: `PLIC | Plataforma de Iniciação Científica`,
    description: `A PLIC é uma plataforma de gerenciamento de programas de iniciação científica, eventos acadêmicos e científicos no Brasil. Gerencie editais, inscrições e divulgue trabalhos científicos.`,
    keywords:
      "iniciação científica,PIIC - Programa de Incentivo à Iniciação Científica,Programa Institucional de Iniciação Científica e Tecnológica,PAIC,proic,Programas de Iniciação Científica - FGV CPDOC, ic, pibic, pibiti, pibic ensino médio, jovens cientistas, pic, encuca, ceub, udf, ifg, ifb, unb, iesb, gerenciamento de eventos científicos, submissão de artigos, programas de fomento, CNPq, FAPDF, eventos acadêmicos",
    openGraph: {
      title: `PLIC | ${eventoSlug}`,
      description: `Gerencie programas de iniciação científica e eventos acadêmicos com a PLIC.`,
      url: "https://www.plic.app.br",
      type: "website",
    },
  };
};

const Layout = async ({ children, params }) => {
  // Acessar os cabeçalhos da requisição
  const evento = await getEventoBySlug(params.eventoSlug);
  const primaryColor = evento.primaryColor;

  const primaryVariants =
    colorGenerate.createPrimaryColorVariants(primaryColor);
  const whiteVariants = colorGenerate.createWhiteColorVariants(primaryColor);

  return (
    <>
      <Head>
        <meta
          name="description"
          content="A PLIC é uma plataforma de gerenciamento de programas de iniciação científica, eventos acadêmicos e científicos no Brasil. Gerencie editais, inscrições e divulgue trabalhos científicos."
        />
        <meta
          name="keywords"
          content="iniciação científica, gerenciamento de eventos científicos, submissão de artigos, programas de fomento, CNPq, FAPDF, eventos acadêmicos"
        />
        <meta
          property="og:title"
          content="PLIC | Plataforma de Iniciação Científica"
        />
        <meta
          property="og:description"
          content="Gerencie programas de iniciação científica e eventos acadêmicos com a PLIC."
        />
        <meta property="og:url" content="https://www.plic.app.br" />
        <meta property="og:type" content="website" />
      </Head>
      <div
        style={{
          "--primary-darken": primaryVariants.darken,
          "--primary-dark": primaryVariants.dark,
          "--primary-normal": primaryVariants.normal,
          "--primary-light": primaryVariants.light,

          "--white-darken": whiteVariants.darken,
          "--white-dark": whiteVariants.dark,
          "--white-normal": whiteVariants.normal,
          "--white-light": whiteVariants.light,
        }}
      >
        {children}
      </div>
    </>
  );
};

export default Layout;

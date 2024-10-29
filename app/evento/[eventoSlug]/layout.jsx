import colorGenerate from "@/lib/colorGenerate";
import { headers } from "next/headers";
import Head from "next/head";
import { getEventoBySlug } from "@/app/api/serverReq";

export const generateMetadata = async ({ params }) => {
  const { eventoSlug } = params;
  //Necessário personalizar isso para cada evento
  return {
    title: `CICDF | Congresso de Iniciação Científica da UnB e do DF`,
    description: `"Participe do Congresso de Iniciação Científica da UnB e DF, onde jovens cientistas apresentam pesquisas inovadoras.`,
    keywords:
      "iniciação científica,PIIC - Programa de Incentivo à Iniciação Científica,Programa Institucional de Iniciação Científica e Tecnológica,PAIC,proic,Programas de Iniciação Científica - FGV CPDOC, ic, pibic, pibiti, pibic ensino médio, jovens cientistas, pic, encuca, ceub, udf, ifg, ifb, unb, iesb, gerenciamento de eventos científicos, submissão de artigos, programas de fomento, CNPq, FAPDF, eventos acadêmicos",
    openGraph: {
      title: `EvenPLIC | ${params.eventoSlug}`,
      description: `Participe do Congresso de Iniciação Científica da UnB e DF, onde jovens cientistas apresentam pesquisas inovadoras.`,
      url: `https://www.plic.app.br/eventos/${params.eventoSlug}`,
      type: "website",
    },
  };
};

const Layout = async ({ children, params }) => {
  // Acessar os cabeçalhos da requisição
  const headersList = headers();
  const primaryColor = headersList.get("x-tenant-primary-color");

  const primaryVariants =
    colorGenerate.createPrimaryColorVariants(primaryColor);
  const whiteVariants = colorGenerate.createWhiteColorVariants(primaryColor);

  return (
    <>
      <Head>
        <meta
          name="description"
          content="Participe do Congresso de Iniciação Científica da UnB e DF, onde jovens cientistas apresentam pesquisas inovadoras."
        />
        <meta
          name="keywords"
          content="iniciação científica, PIIC - Programa de Incentivo à Iniciação Científica, Programa Institucional de Iniciação Científica e Tecnológica, PAIC, proic, Programas de Iniciação Científica - FGV CPDOC, ic, pibic, pibiti, pibic ensino médio, jovens cientistas, pic, encuca, ceub, udf, ifg, ifb, unb, iesb, gerenciamento de eventos científicos, submissão de artigos, programas de fomento, CNPq, FAPDF, eventos acadêmicos"
        />
        <meta
          property="og:title"
          content="CICDF | Congresso de Iniciação Científica da UnB e do DF"
        />
        <meta
          property="og:description"
          content="Programação do 30º Congresso de Iniciação Científica da UnB e 21º Congresso do Distrito Federal"
        />
        <meta
          property="og:url"
          content={`https://www.plic.app.br/eventos/${params.eventoSlug}`}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://www.plic.app.br/default-event-image.jpg"
        />
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

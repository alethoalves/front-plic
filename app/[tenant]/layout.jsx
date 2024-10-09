import colorGenerate from "@/lib/colorGenerate";
import styles from "./page.module.scss";
import { headers } from "next/headers";
import Head from "next/head";

export const generateMetadata = async ({ params }) => {
  const { tenant } = params;
  return {
    title: `PLIC | Plataforma de Iniciação Científica`,
    description: `A PLIC é uma plataforma de gerenciamento de programas de iniciação científica, eventos acadêmicos e científicos no Brasil. Gerencie editais, inscrições e divulgue trabalhos científicos.`,
    keywords:
      "iniciação científica, ic, pibic, pibiti, pibic ensino médio, jovens cientistas, pic, encuca, ceub, udf, ifg, ifb, unb, iesb, gerenciamento de eventos científicos, submissão de artigos, programas de fomento, CNPq, FAPDF, eventos acadêmicos",
    openGraph: {
      title: `PLIC | ${tenant}`,
      description: `Gerencie programas de iniciação científica e eventos acadêmicos com a PLIC.`,
      url: "https://www.plic.app.br",
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
        className={styles.main}
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

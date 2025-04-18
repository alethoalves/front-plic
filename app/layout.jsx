import { lato, kanit } from "@/styles/fonts";
import "@/styles/globals.scss";

export const generateMetadata = async ({ params }) => {
  return {
    title: `PLIC | Plataforma de Iniciação Científica`,
    description: `PLIC é uma plataforma de gerenciamento de programas de iniciação científica, eventos acadêmicos e científicos no Brasil. Gerencie editais, inscrições e divulgue trabalhos científicos.`,
    keywords:
      "iniciação científica,PIIC - Programa de Incentivo à Iniciação Científica,Programa Institucional de Iniciação Científica e Tecnológica,PAIC,proic,Programas de Iniciação Científica - FGV CPDOC, ic, pibic, pibiti, pibic ensino médio, jovens cientistas, pic, encuca, ceub, udf, ifg, ifb, unb, iesb, gerenciamento de eventos científicos, submissão de artigos, programas de fomento, CNPq, FAPDF, eventos acadêmicos",
    openGraph: {
      title: `PLIC`,
      description: `Gerencie programas de iniciação científica e eventos acadêmicos com a plataforma PLIC.`,
      url: "https://www.plic.app.br",
      type: "website",
    },
  };
};

const RootLayout = ({ children }) => {
  return (
    <html
      lang="pt-br" //
    >
      <body
        className={`${lato.variable} ${kanit.variable}`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
};

export default RootLayout;

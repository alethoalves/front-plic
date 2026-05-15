import { lato, kanit } from "@/styles/fonts";
import "@/styles/globals.scss";
import styles from "./page.module.scss";
import Image from "next/image";

// SEO agora é feito pelo generateMetadata!
export const generateMetadata = async ({ params }) => {
  return {
    title: "Diversidade de espécies arbóreas - Colégio Militar de Brasília",
    description:
      "Levantamento florístico realizado no Colégio Militar de Brasília, destacando espécies arbóreas do bioma Cerrado.",
    keywords: "botânica, levantamento florístico, cerrado, arborização urbana",
    openGraph: {
      title: "Diversidade de espécies arbóreas - Colégio Militar de Brasília",
      description:
        "Um estudo sobre a arborização e diversidade de espécies arbóreas no Colégio Militar de Brasília.",
      url: "https://seudominio.com/detalhes-arborizacao",
      type: "website",
      images: [
        {
          url: "https://seudominio.com/imagem-compartilhamento.jpg",
          width: 800,
          height: 600,
          alt: "Destaque da diversidade de árvores no CMB",
        },
      ],
    },
  };
};

const RootLayout = ({ children }) => {
  return (
    <html lang="pt-br">
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

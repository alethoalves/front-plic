import { lato, kanit } from "@/styles/fonts";
import "@/styles/globals.scss";
import Head from "next/head";

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
      <Head>
        {/* SEO Base */}
        <title>
          Diversidade de espécies arbóreas - Colégio Militar de Brasília
        </title>
        <meta
          name="description"
          content="Levantamento florístico realizado no Colégio Militar de Brasília, destacando espécies arbóreas do bioma Cerrado."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="keywords"
          content="botânica, levantamento florístico, cerrado, arborização urbana"
        />
        {/* Open Graph para redes sociais */}
        <meta
          property="og:title"
          content="Diversidade de espécies arbóreas - Colégio Militar de Brasília"
        />
        <meta
          property="og:description"
          content="Levantamento florístico realizado no Colégio Militar de Brasília, destacando espécies arbóreas do bioma Cerrado."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://seudominio.com/detalhes-arborizacao"
        />
        <meta
          property="og:image"
          content="https://seudominio.com/imagem-compartilhamento.jpg"
        />
        <meta
          property="og:image:alt"
          content="Destaque da diversidade de árvores no CMB"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
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

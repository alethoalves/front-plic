import { lato, kanit } from "@/styles/fonts";
import "@/styles/globals.scss";

export const generateMetadata = async ({ params }) => {
  return {
    title: `evenPLIC | Plataforma de Eventos Científicos e Acadêmicos`,
    description: `A evenPLIC é uma plataforma completa para o gerenciamento de eventos científicos, acadêmicos e de iniciação científica. Permite criar eventos, receber inscrições e submissões de trabalhos de forma simples e eficiente.`,
    keywords: `eventos científicos, eventos acadêmicos, submissão de trabalhos, gerenciamento de eventos, PLIC, plataforma de eventos, iniciação científica, congresso, simpósio, conferências acadêmicas`,

    openGraph: {
      title: `evenPLIC | Plataforma de Eventos Científicos`,
      description: `Gerencie seus eventos científicos e acadêmicos com a PLIC. Crie eventos, organize submissões e gerencie inscrições com uma plataforma intuitiva.`,
      url: "https://www.plic.app.br/eventos",
      type: "website",
      images: [
        {
          url: "/image/logoEvenPLIC.svg", // Caminho relativo para a imagem na pasta pública
          width: 1200,
          height: 630,
          alt: "evenPLIC Logo",
        },
      ],
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

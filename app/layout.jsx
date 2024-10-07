import { lato, kanit } from "@/styles/fonts";
import "@/styles/globals.scss";

export const metadata = {
  title: "PLIC",
  description: "Plataforma de Iniciação Científica",
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

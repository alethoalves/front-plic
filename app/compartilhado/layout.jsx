// Páginas acessadas via link/token compartilhado: fora de buscadores e sem
// vazar a URL (que contém o token) no Referer de links externos.
export const metadata = {
  title: "PLIC | Conteúdo compartilhado",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const Layout = ({ children }) => children;

export default Layout;

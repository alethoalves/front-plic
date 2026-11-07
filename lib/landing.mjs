// Landing de vendas (repo plic-home, publicada em contato.plic.app.br) servida
// também na raiz deste domínio. O next.config.mjs reescreve estes caminhos para a
// landing (proxy, o endereço no navegador não muda) e o middleware os deixa passar
// sem tratar o primeiro trecho da URL como slug de instituição.
// A seleção de instituição do sistema fica em /entrar.

export const LANDING_ORIGIN = process.env.LANDING_ORIGIN || "https://contato.plic.app.br";

// Caminhos exatos da landing (página inicial, imagens e páginas institucionais).
export const LANDING_EXACT = ["/", "/plicLogo.svg", "/plic-advantages.png", "/privacidade", "/termos"];
// Pasta do bundle gerado pelo Vite.
export const LANDING_PREFIXES = ["/assets/"];

export const isLandingPath = (pathname) =>
  LANDING_EXACT.includes(pathname) || LANDING_PREFIXES.some((p) => pathname.startsWith(p));

export const landingRewrites = () => [
  ...LANDING_EXACT.map((source) => ({ source, destination: `${LANDING_ORIGIN}${source}` })),
  ...LANDING_PREFIXES.map((p) => ({ source: `${p}:path*`, destination: `${LANDING_ORIGIN}${p}:path*` })),
];

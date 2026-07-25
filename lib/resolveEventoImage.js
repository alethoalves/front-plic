// Eventos antigos guardam só o nome do arquivo (ex: "cicdf.png"), esperando
// que quem exibe prefixe com "/image/"; eventos novos guardam a URL já
// completa (upload no Firebase) ou um caminho já absoluto. next/image exige
// um dos dois formatos, então resolvemos o legado aqui antes de renderizar.
export const resolveEventoImageSrc = (value, fallback = null) => {
  if (!value) return fallback;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/image/${value}`;
};

// Mesmos valores usados como default na criação de uma nova edição
// (ver DEFAULTS_EVENTO em api-plic/src/controllers/evento/tenantEventoController.js)
export const DEFAULT_EVENTO_BANNER = "/image/logoEvenPLIC.svg";
export const DEFAULT_EVENTO_LOGO = "/image/plicLogo.png";

import DOMPurify from "dompurify"; // ou "dompurify" se só roda no client

export const sanitize = (html) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel", "style"],
    // remova style se quiser bloquear CSS inline
  });
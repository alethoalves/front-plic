import styles from "./EventoBanner.module.scss";
import {
  resolveEventoImageSrc,
  DEFAULT_EVENTO_BANNER,
} from "@/lib/resolveEventoImage";

// Breakpoint "xs" de _eventoEditorial.scss ($container-s = 620px) — é onde
// .eventoPlate muda de proporção (2,6:1 → 4:3), então é aí que a imagem
// também deve trocar pra versão mobile (se o gestor tiver enviado uma).
const MOBILE_BREAKPOINT = "(max-width: 620px)";

export const EventoBanner = ({ evento }) => {
  const desktopSrc = resolveEventoImageSrc(evento?.pathBanner, DEFAULT_EVENTO_BANNER);
  const mobileSrc = evento?.pathBannerMobile
    ? resolveEventoImageSrc(evento.pathBannerMobile)
    : null;

  return (
    <div className={styles.eventoPlate}>
      <picture className={styles.eventoBannerPicture}>
        {mobileSrc && <source media={MOBILE_BREAKPOINT} srcSet={mobileSrc} />}
        <img
          src={desktopSrc}
          alt={`Banner do ${evento?.nomeEvento ?? "evento"}`}
          className={styles.eventoBannerImg}
          loading="eager"
          fetchPriority="high"
        />
      </picture>
    </div>
  );
};

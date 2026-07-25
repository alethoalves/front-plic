"use client";

import Link from "next/link";
import { useState } from "react";
import {
  RiArticleLine,
  RiAwardFill,
  RiCouponLine,
  RiPresentationFill,
  RiMenuLine,
  RiCloseLine,
} from "@remixicon/react";
import styles from "./EventoNav.module.scss";
import { InscricaoButton } from "./InscricaoButton";
import {
  resolveEventoImageSrc,
  DEFAULT_EVENTO_LOGO,
} from "@/lib/resolveEventoImage";

// Menu principal da edição do evento (inscrição, apresentações, publicações,
// certificado, outras edições). Reaproveitado em todas as subtelas públicas
// da edição — não só na tela inicial — por isso recebe evento/eventoRoot como
// props em vez de buscar os dados sozinho.
export const EventoNav = ({ params, evento, eventoRoot }) => {
  const [open, setOpen] = useState(false);

  const edicoesOrdenadas = eventoRoot?.eventos
    ? [...eventoRoot.eventos].sort((a, b) => b.id - a.id)
    : [];

  const closeMenu = () => setOpen(false);
  const logoSrc = resolveEventoImageSrc(evento?.pathLogo, DEFAULT_EVENTO_LOGO);

  return (
    <div
      className={`${styles.eventoNavPanel} ${open ? styles.eventoNavOpen : ""}`}
    >
      <button
        type="button"
        className={styles.eventoNavToggle}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="Menu da edição"
      >
        <span className={styles.eventoNavToggleLogo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt={evento?.nomeEvento || "Logo do evento"} />
        </span>
        {open ? <RiCloseLine /> : <RiMenuLine />}
      </button>

      {evento?.permitirSubmissoes && <InscricaoButton params={params} />}

      <div className={styles.eventoNavBody}>
        <span className={styles.eventoIndexLabel}>Nesta edição</span>
        <div className={styles.eventoIndexList}>
          <Link
            href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/minhas-inscricoes`}
            className={styles.eventoIndexItem}
            onClick={closeMenu}
          >
            <RiCouponLine />
            Minhas inscrições
          </Link>
          <Link
            href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/apresentacoes`}
            className={styles.eventoIndexItem}
            onClick={closeMenu}
          >
            <RiPresentationFill />
            Lista de apresentações
          </Link>
          <Link
            href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/publicacoes`}
            className={styles.eventoIndexItem}
            onClick={closeMenu}
          >
            <RiArticleLine />
            Publicações
          </Link>
          <Link
            href={`/evento/${params.eventoSlug}/edicao/${params.edicao}/certificado`}
            className={styles.eventoIndexItem}
            onClick={closeMenu}
          >
            <RiAwardFill />
            Emitir certificado
          </Link>
        </div>

        {edicoesOrdenadas.length > 1 && (
          <div className={styles.eventoEditions}>
            <span className={styles.eventoIndexLabel}>Outras edições</span>
            <div>
              {edicoesOrdenadas.map((edicaoItem) => {
                const atual = edicaoItem.slug === params.edicao;
                return (
                  <Link
                    key={edicaoItem.id}
                    href={`/evento/${params.eventoSlug}/edicao/${edicaoItem.slug}`}
                    className={`${styles.eventoEditionItem} ${
                      atual ? styles.eventoEditionCurrent : ""
                    }`}
                    onClick={closeMenu}
                  >
                    {edicaoItem.edicaoEvento}
                    {atual && (
                      <span className={styles.eventoEditionTag}>atual</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

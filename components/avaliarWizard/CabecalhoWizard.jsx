"use client";

import Link from "next/link";
import { RiArrowLeftSLine } from "@remixicon/react";
import styles from "./wizard.module.scss";

// Cabeçalho leve do wizard — só "voltar ao painel" como link de texto
// simples, sem replicar o menu lateral do dashboard (decisão tomada com o
// usuário: a tela fica fora do avaliador/layout.jsx).
const CabecalhoWizard = ({ eventoSlug, edicao }) => {
  return (
    <div className={styles.cabecalho}>
      <Link
        href={`/evento/${eventoSlug}/edicao/${edicao}/avaliador`}
        className={styles.linkCabecalho}
      >
        <RiArrowLeftSLine />
        Sair da sala de avaliação
      </Link>
    </div>
  );
};

export default CabecalhoWizard;

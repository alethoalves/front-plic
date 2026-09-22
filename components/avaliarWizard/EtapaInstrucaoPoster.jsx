"use client";

import Button from "@/components/Button";
import ProgressoEtapas from "./ProgressoEtapas";
import { RiWalkLine } from "@remixicon/react";
import styles from "./wizard.module.scss";

// Passo 3: lembrete único, sem chamada de API — a pessoa vai se levantar e
// sair da tela, então o número do pôster é repetido em destaque.
const EtapaInstrucaoPoster = ({ submissao, onChegar, onVoltar }) => {
  const numeroPoster =
    submissao?.square?.length > 0 ? submissao.square[0].numero : "-";
  const nomesAutores = submissao?.Resumo?.participacoes
    ?.map((participacao) => participacao.user?.nome)
    .filter(Boolean)
    .join(", ");

  return (
    <div className={styles.card}>
      <ProgressoEtapas atual={3} total={4} />
      <div className={styles.iconeCentral}>
        <RiWalkLine />
      </div>
      <h1 className="h-editorial-sm mb-2 text-center">Vá até o pôster</h1>
      <p className="mb-3 text-center">
        Dirija-se ao pôster abaixo, ouça a apresentação do(a) aluno(a) e
        preencha a ficha de avaliação.
      </p>

      <div className={styles.posterDestaque}>
        <p className={styles.posterLabel}>Pôster nº</p>
        <span className={styles.posterNumero}>{numeroPoster}</span>
      </div>

      {/* Título/autor pra conferir no pôster físico, além do número. */}
      <div className={styles.infoTrabalho}>
        {nomesAutores && <p className={styles.metaTrabalho}>{nomesAutores}</p>}
        <h6>{submissao?.Resumo?.titulo}</h6>
      </div>

      <Button className="btn-primary w-100 mt-3" onClick={onChegar}>
        Preencher a ficha de avaliação
      </Button>
      <Button className="btn-link w-100 mt-1" onClick={onVoltar}>
        Voltar
      </Button>
    </div>
  );
};

export default EtapaInstrucaoPoster;

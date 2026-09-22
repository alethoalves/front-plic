"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import ProgressoEtapas from "./ProgressoEtapas";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";
import {
  RiFileList3Line,
  RiShuffleLine,
  RiListCheck3,
  RiArrowGoBackLine,
  RiTimeLine,
} from "@remixicon/react";
import styles from "./wizard.module.scss";

// Não há devolução automática no sistema — isso é só um aviso informal pro
// avaliador se organizar, sabendo que o admin PODE retirar manualmente o
// trabalho da carga dele depois desse tempo.
const LIMITE_MINUTOS = 50;
const LIMIAR_ALERTA_MINUTOS = 30;
const LIMIAR_URGENTE_MINUTOS = 45;

// A partir de quantos minutos com a ficha o card muda de cor: verde
// discreto (< 30min) → warning (30–45min) → vermelho, com aviso extra de
// que o trabalho pode ser retirado da carga (45min em diante).
const calcularStatusTempo = (dataAtribuicao, agora) => {
  if (!dataAtribuicao) return null;
  const inicio = new Date(dataAtribuicao).getTime();
  if (Number.isNaN(inicio)) return null;

  const minutos = Math.max(0, Math.floor((agora - inicio) / 60000));
  const restante = LIMITE_MINUTOS - minutos;

  let variante = "ok";
  if (minutos >= LIMIAR_URGENTE_MINUTOS) variante = "urgente";
  else if (minutos >= LIMIAR_ALERTA_MINUTOS) variante = "alerta";

  return { minutos, restante, variante };
};

// Passo 2: o sistema distribuiu um trabalho pro avaliador (ou ele já tinha
// um em andamento). Número do pôster em destaque — é a primeira coisa que a
// pessoa precisa achar. Uma única ação primária ("Ir para o pôster"); as
// demais (ler resumo, trocar, ver lista manual) são secundárias.
const EtapaTrabalhoAtribuido = ({
  submissao,
  jaEstavaEmAndamento,
  onLerResumo,
  onAtribuirOutro,
  onVerEspecificos,
  onIrParaPoster,
  onDevolver,
  loadingAtribuirOutro,
  loadingDevolver,
  erro,
}) => {
  const numeroPoster =
    submissao?.square?.length > 0 ? submissao.square[0].numero : "-";

  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 30000);
    return () => clearInterval(intervalo);
  }, []);
  const statusTempo = calcularStatusTempo(submissao?.dataAtribuicao, agora);
  const classeCardTempo = {
    ok: styles.cardTempoOk,
    alerta: styles.cardTempoAlerta,
    urgente: styles.cardTempoUrgente,
  }[statusTempo?.variante];

  return (
    <div className={styles.card}>
      <ProgressoEtapas atual={2} total={4} />
      <h1 className="h-editorial-sm mb-2 text-center">
        {jaEstavaEmAndamento
          ? "Avaliação iniciada"
          : "Atribuímos o trabalho abaixo para sua avaliação"}
      </h1>
      <p className="mb-3 text-center">
        {jaEstavaEmAndamento
          ? "O trabalho abaixo foi atribuído para você. Continue a avaliação ou devolva-o."
          : "Você pode ler o resumo antes de ir ao pôster. Caso você queira outro trabalho ou não possa avaliar este trabalho, devolva-o para a fila de avaliacão."}
      </p>

      {statusTempo && (
        <div className={`${styles.cardTempo} ${classeCardTempo}`}>
          <RiTimeLine />
          <p>
            Este trabalho está atribuído a você há {statusTempo.minutos} min.{" "}
            {statusTempo.restante > 0
              ? `Tente concluí-lo em até ${statusTempo.restante} min.`
              : `Você já passou do tempo sugerido de ${LIMITE_MINUTOS} min.`}{" "}
            {statusTempo.variante === "urgente" &&
              "Este trabalho poderá ser retirado da sua carga de avaliação em breve."}
          </p>
        </div>
      )}

      <div className={styles.cardTrabalho}>
        <div className={styles.posterDestaque}>
          <p className={styles.posterLabel}>Pôster nº</p>
          <span className={styles.posterNumero}>{numeroPoster}</span>
        </div>

        <div className={styles.infoTrabalho}>
          <p className={styles.metaTrabalho}>
            {submissao?.Resumo?.area?.area || "sem área"} ·{" "}
            {getInstituicaoSigla(submissao)} ·{" "}
            {submissao?.categoria?.toUpperCase()}
          </p>
          <h6>{submissao?.Resumo?.titulo}</h6>
        </div>

        <Button
          className="btn-secondary w-100"
          onClick={onLerResumo}
          icon={RiFileList3Line}
        >
          Ler resumo
        </Button>

        <Button className="btn-primary w-100 mt-1" onClick={onIrParaPoster}>
          Continuar avaliação
        </Button>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.cardOpcoes}>
        <h6 className="mb-1 text-center">
          Não quer ou não pode avaliar este trabalho?
        </h6>
        <p className="mb-1 text-center">Clique em uma das opções abaixo</p>

        <div className={styles.acoesSecundarias}>
          <Button
            className="btn-link"
            onClick={onAtribuirOutro}
            icon={RiShuffleLine}
            loading={loadingAtribuirOutro}
          >
            Solicitar outro trabalho
          </Button>
          <Button
            className="btn-link"
            onClick={onVerEspecificos}
            icon={RiListCheck3}
          >
            Escolher trabalho específico
          </Button>
          <Button
            className="btn-link"
            onClick={onDevolver}
            icon={RiArrowGoBackLine}
            loading={loadingDevolver}
          >
            Devolver trabalho
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EtapaTrabalhoAtribuido;

"use client";

import { useState } from "react";
import Button from "@/components/Button";
import styles from "./checkin.module.scss";
import listStyles from "./EtapaSelecaoSubmissao.module.scss";

// Só aparece quando o CPF tem mais de uma submissão elegível pro check-in —
// com só uma, o fluxo pula direto pra etapa de localização.
const EtapaSelecaoSubmissao = ({ elegiveis, onSelecionar }) => {
  const [selecionadoId, setSelecionadoId] = useState(elegiveis[0]?.submissaoId ?? null);

  return (
    <div className={styles.card}>
      <h1 className="h-editorial-sm mb-2">Selecione sua submissão</h1>
      <p className="mb-3">Você tem mais de uma submissão liberada para check-in. Escolha qual apresentará agora.</p>

      <div className={listStyles.lista}>
        {elegiveis.map((submissao) => (
          <label key={submissao.submissaoId} className={listStyles.item}>
            <input
              type="radio"
              name="submissao"
              checked={selecionadoId === submissao.submissaoId}
              onChange={() => setSelecionadoId(submissao.submissaoId)}
            />
            <span>{submissao.titulo}</span>
          </label>
        ))}
      </div>

      <Button
        className="btn-primary mt-3 w-100"
        onClick={() => onSelecionar(selecionadoId)}
        disabled={!selecionadoId}
      >
        Continuar
      </Button>
    </div>
  );
};

export default EtapaSelecaoSubmissao;

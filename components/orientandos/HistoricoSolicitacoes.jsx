"use client";
import {
  RiArrowRightLine,
  RiShieldUserLine,
  RiUserVoiceLine,
} from "@remixicon/react";
import StatusSolicitacaoTag from "@/components/alteracoesParticipacao/StatusSolicitacaoTag";
import { formatarDataCurta, formatarDataHora, rotuloSolicitacao } from "@/lib/alteracaoParticipacao";
import styles from "./orientandos.module.scss";

const envolvidos = (s) => {
  const alvo = s.participacao?.user?.nome || "Aluno";
  if (s.tipo === "SUBSTITUICAO" && s.novoUser) return [alvo, s.novoUser.nome];
  if (s.participacaoDestino?.user) return [alvo, s.participacaoDestino.user.nome];
  return [alvo];
};

const HistoricoSolicitacoes = ({ solicitacoes, carregando, onCancelar }) => {
  if (carregando) return <p className={styles.estadoVazio}>Carregando histórico…</p>;
  if (!solicitacoes?.length) {
    return <p className={styles.estadoVazio}>Nenhuma solicitação registrada até agora.</p>;
  }

  return (
    <ol className={styles.linhaTempo}>
      {solicitacoes.map((s) => {
        const [de, para] = envolvidos(s);
        return (
          <li key={s.id} className={styles.itemTempo}>
            <span className={`${styles.marcador} ${styles[`marcador_${s.status}`]}`} />
            <div className={styles.itemConteudo}>
              <div className={styles.itemTopo}>
                <strong>{rotuloSolicitacao(s)}</strong>
                <StatusSolicitacaoTag status={s.status} />
                {s.grupoId && (
                  <span className={styles.seloBloco}>
                    Bloco #{s.grupoId} · etapa {s.ordemNoGrupo}
                  </span>
                )}
                <span className={styles.origem}>
                  {s.origem === "GESTOR" ? (
                    <>
                      <RiShieldUserLine size={14} /> Ação direta da gestão
                    </>
                  ) : (
                    <>
                      <RiUserVoiceLine size={14} /> Solicitado por {s.solicitante?.nome}
                    </>
                  )}
                </span>
              </div>
              <p className={styles.itemEnvolvidos}>
                {de}
                {para && (
                  <>
                    <RiArrowRightLine size={14} /> {para}
                  </>
                )}
                <small> · {s.edital?.titulo}</small>
              </p>
              <p className={styles.itemMotivo}>{s.motivo}</p>
              <p className={styles.itemDatas}>
                Enviada em {formatarDataHora(s.createdAt)} · data de efeito{" "}
                {formatarDataCurta(s.dataEfeito || s.dataEfeitoSolicitada)}
                {s.decididoEm && s.origem !== "GESTOR" && (
                  <>
                    {" "}
                    · decidida em {formatarDataHora(s.decididoEm)}
                    {s.decididoPor?.nome ? ` por ${s.decididoPor.nome}` : ""}
                  </>
                )}
              </p>
              {s.motivoRecusa && <p className={styles.itemRecusa}>Motivo da recusa: {s.motivoRecusa}</p>}
              {s.observacaoGestor && <p className={styles.itemObservacao}>Gestão: {s.observacaoGestor}</p>}
              {s.status === "PENDENTE" && s.minha && (
                <button type="button" className={styles.linkCancelar} onClick={() => onCancelar(s.id)}>
                  Cancelar solicitação
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default HistoricoSolicitacoes;

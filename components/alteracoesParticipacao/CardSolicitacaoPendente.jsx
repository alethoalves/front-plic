"use client";
import { Button } from "primereact/button";
import { RiAlertLine, RiArrowRightLine, RiTimeLine } from "@remixicon/react";
import {
  ICONE_TIPO,
  estadoAntesDe,
  situacaoDoAluno,
  formatarCpf,
  formatarDataCurta,
  formatarDataHora,
  rotuloSolicitacao,
} from "@/lib/alteracaoParticipacao";
import styles from "./fila.module.scss";

// "há 3 dias", "há 2 horas"… (fila: o tempo de espera importa)
const tempoDesde = (data) => {
  const segundos = Math.round((new Date(data).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const passos = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
  ];
  let valor = segundos;
  for (const [limite, unidade] of passos) {
    if (Math.abs(valor) < limite) return rtf.format(valor, unidade);
    valor = Math.round(valor / limite);
  }
  return rtf.format(valor, "year");
};

// Pessoa + situação dela antes do pedido (bolsa e cota, fila ou voluntário)
const Pessoa = ({ pessoa, situacao, destaque }) => (
  <span className={`${styles.pessoa} ${destaque ? styles.pessoaDestaque : ""}`}>
    <strong>{pessoa?.nome || "—"}</strong>
    {pessoa?.cpf && <small>CPF {formatarCpf(pessoa.cpf)}</small>}
    {situacao && <span className={`${styles.situacao} ${styles[`situacao_${situacao.tom}`]}`}>{situacao.texto}</span>}
  </span>
);

const Etapa = ({ s, numero }) => {
  const Icone = ICONE_TIPO[s.tipo];
  const outro = s.tipo === "SUBSTITUICAO" ? s.novoUser : s.participacaoDestino?.user;
  return (
    <div className={styles.etapa}>
      <div className={styles.etapaTipo}>
        {numero && <span className={styles.etapaNumero}>{numero}</span>}
        {Icone && <Icone size={16} />}
        <span>{rotuloSolicitacao(s)}</span>
      </div>
      <div className={styles.envolvidos}>
        <Pessoa pessoa={s.participacao?.user} situacao={situacaoDoAluno(estadoAntesDe(s, s.participacaoId))} />
        {outro && (
          <>
            <RiArrowRightLine size={16} className={styles.seta} />
            <Pessoa
              pessoa={outro}
              destaque
              situacao={
                s.tipo === "SUBSTITUICAO"
                  ? { texto: "Novo no plano", tom: "neutro" }
                  : situacaoDoAluno(estadoAntesDe(s, s.participacaoDestinoId))
              }
            />
          </>
        )}
      </div>
      {s.participacao?.planoDeTrabalho?.titulo && (
        <p className={styles.plano} title={s.participacao.planoDeTrabalho.titulo}>
          Plano: {s.participacao.planoDeTrabalho.titulo}
        </p>
      )}
      <p className={styles.motivo}>“{s.motivo}”</p>
    </div>
  );
};

// Card de uma solicitação pendente (ou de um bloco, com as etapas em ordem).
const CardSolicitacaoPendente = ({ item, onAnalisar }) => {
  const membros = item.membros?.length > 1 ? item.membros : [item];
  const ehBloco = membros.length > 1;
  const avisos = membros.flatMap((m) => m.avisos || []);

  return (
    <article className={styles.card}>
      <header className={styles.cardTopo}>
        <div className={styles.cardTitulo}>
          {ehBloco && <span className={styles.seloBloco}>Bloco #{item.grupoId} · {membros.length} etapas</span>}
          <small>
            {item.edital?.titulo} · {item.edital?.ano} · solicitado por <strong>{item.solicitante?.nome}</strong>
          </small>
        </div>
        <span className={styles.tempo} title={formatarDataHora(item.createdAt)}>
          <RiTimeLine size={14} /> {tempoDesde(item.createdAt)}
        </span>
      </header>

      <div className={styles.etapas}>
        {membros.map((m, i) => (
          <Etapa key={m.id} s={m} numero={ehBloco ? i + 1 : null} />
        ))}
      </div>

      {avisos.length > 0 && (
        <ul className={styles.avisos}>
          {avisos.map((a, i) => (
            <li key={i}>
              <RiAlertLine size={14} />
              <span>{a.mensagem}</span>
            </li>
          ))}
        </ul>
      )}

      <footer className={styles.cardRodape}>
        <small>Data solicitada: {formatarDataCurta(item.dataEfeitoSolicitada)}</small>
        <Button label={ehBloco ? "Analisar bloco" : "Analisar e decidir"} icon="pi pi-arrow-right" iconPos="right" onClick={() => onAnalisar(item)} />
      </footer>
    </article>
  );
};

export default CardSolicitacaoPendente;

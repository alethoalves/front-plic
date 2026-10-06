"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RiAlertLine, RiArrowLeftRightLine } from "@remixicon/react";
import StatusSolicitacaoTag from "./StatusSolicitacaoTag";
import {
  getSolicitacoesAlteracaoGestor,
  notificarAlteracoesParticipacao,
} from "@/app/api/client/alteracaoParticipacao";
import { formatarDataHora, rotuloSolicitacao } from "@/lib/alteracaoParticipacao";
import styles from "./alteracoes.module.scss";

// Seção do ParticipacaoGestorController: solicitações (do orientador e ações
// diretas da gestão) que envolvem esta participação. `versao` muda quando a
// participação é recarregada, para a lista acompanhar as ações do gestor.
const SolicitacoesDaParticipacao = ({ tenant, ano, participacaoId, versao }) => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const primeiraCarga = useRef(true);

  useEffect(() => {
    if (!participacaoId) return;
    let ativo = true;
    getSolicitacoesAlteracaoGestor(tenant, null, { participacaoId, pageSize: 20 })
      .then((resposta) => ativo && setSolicitacoes(resposta.itens || []))
      .catch((error) => console.error("Erro ao buscar solicitações da participação:", error));
    // Depois de uma ação direta do gestor, um pedido pendente pode ter virado
    // PREJUDICADA: atualiza o contador do menu.
    if (!primeiraCarga.current) notificarAlteracoesParticipacao();
    primeiraCarga.current = false;
    return () => {
      ativo = false;
    };
  }, [tenant, participacaoId, versao]);

  if (solicitacoes.length === 0) return null;
  const pendente = solicitacoes.find((s) => s.status === "PENDENTE");

  return (
    <div className={styles.secaoParticipacao}>
      <p className={styles.secaoTitulo}>
        <RiArrowLeftRightLine size={16} /> Solicitações de alteração
      </p>
      {pendente && (
        <p className={styles.aviso}>
          <RiAlertLine size={16} />
          <span>
            Há uma solicitação pendente do orientador ({rotuloSolicitacao(pendente)}). Se você executar uma ação
            diretamente neste aluno, ela será marcada como prejudicada.{" "}
            {ano && (
              <Link href={`/${tenant}/gestor/${ano}/participacoes/solicitacoes-alteracao`}>
                Decidir na fila de solicitações
              </Link>
            )}
          </span>
        </p>
      )}
      <ul className={styles.listaCompacta}>
        {solicitacoes.map((s) => (
          <li key={s.id}>
            <StatusSolicitacaoTag status={s.status} />
            <span>
              <strong>{rotuloSolicitacao(s)}</strong> ·{" "}
              {s.origem === "GESTOR" ? `gestão (${s.solicitante?.nome})` : `orientador (${s.solicitante?.nome})`} ·{" "}
              {formatarDataHora(s.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SolicitacoesDaParticipacao;

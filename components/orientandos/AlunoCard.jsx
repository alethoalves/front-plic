"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  RiAlertLine,
  RiArrowLeftRightLine,
  RiDraggable,
  RiFileTextLine,
  RiPenNibLine,
  RiForbidLine,
  RiHandCoinLine,
  RiHourglassLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiUserForbidLine,
  RiUserSharedLine,
} from "@remixicon/react";
import {
  ROTULO_CLASSE,
  ROTULO_STATUS_PARTICIPACAO,
  ROTULO_STATUS_VINCULO,
  ROTULO_TIPO,
  formatarDataHora,
  motivoNaoRecebeDe,
  podeReceberDe,
} from "@/lib/alteracaoParticipacao";
import styles from "./orientandos.module.scss";

// Visual da ficha da bolsa (usado no card e no "fantasma" durante o arraste).
// Bolsista: ficha da bolsa (com cota). Lista de espera: ficha da vaga na fila.
export const BolsaConteudo = ({
  aluno,
  arrastavel = false,
  className = "",
}) => {
  const status = aluno.vinculo?.status;
  const fila = aluno.classe === "LISTA_ESPERA";
  return (
    <div
      className={`${styles.bolsaToken} ${fila ? styles.filaToken : ""} ${
        arrastavel ? styles.bolsaArrastavel : ""
      } ${className}`}
    >
      {arrastavel && <RiDraggable size={16} className={styles.bolsaAlca} />}
      {fila ? (
        <RiHourglassLine size={18} />
      ) : (
        <RiMoneyDollarCircleLine size={18} />
      )}
      <span className={styles.bolsaTexto}>
        {fila ? (
          <>
            <strong>Vaga na lista de espera</strong>
            <small>
              {aluno.vinculo?.ordemRecebimentoBolsa
                ? `Ordem ${aluno.vinculo.ordemRecebimentoBolsa}`
                : "Sem ordem"}{" "}
              · sem cota
            </small>
          </>
        ) : (
          <>
            <strong>{aluno.vinculo?.instituicaoPagadora || "Bolsa"}</strong>
            <small>{ROTULO_STATUS_VINCULO[status] || status}</small>
          </>
        )}
      </span>
    </div>
  );
};

// Ficha da bolsa: é o que o orientador arrasta até outro aluno.
const BolsaToken = ({ aluno }) => {
  const arrastavel = Boolean(aluno.acoes?.transferirBolsa);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bolsa-${aluno.participacaoId}`,
    data: { participacaoId: aluno.participacaoId },
    disabled: !arrastavel,
  });

  return (
    <div
      ref={setNodeRef}
      title={
        arrastavel
          ? aluno.classe === "LISTA_ESPERA"
            ? "Arraste até um voluntário para transferir a vaga na lista de espera"
            : "Arraste até um voluntário para transferir a bolsa"
          : undefined
      }
      aria-label={`${aluno.classe === "LISTA_ESPERA" ? "Vaga na lista de espera" : "Bolsa"} de ${aluno.nome}${
        arrastavel ? ". Pressione espaço para mover" : ""
      }`}
      {...listeners}
      {...attributes}
    >
      <BolsaConteudo
        aluno={aluno}
        arrastavel={arrastavel}
        className={isDragging ? styles.bolsaArrastando : ""}
      />
    </div>
  );
};

// ocultarPlano: o card já está dentro do bloco do plano de trabalho.
// Quem ainda precisa agir num documento em aberto.
const situacaoDocumento = (doc) => {
  if (doc.status === "AGUARDANDO_VALIDACAO")
    return "Aguardando validação da gestão";
  if (doc.status === "ENVIADO") return "Enviado, aguardando análise";
  const faltam = [
    doc.faltaAluno && "aluno",
    doc.minhaAssinaturaPendente && "você",
    doc.faltaOrientador && "outro orientador",
  ].filter(Boolean);
  return faltam.length ? `Falta assinar: ${faltam.join(", ")}` : "Pendente";
};

const DocumentosPendentes = ({ documentos }) => {
  const { tenant } = useParams();
  if (!documentos?.length) return null;
  return (
    <div className={styles.documentosPendentes}>
      <p className={styles.documentosPendentesTitulo}>
        <RiFileTextLine size={14} />
        {documentos.length === 1
          ? "1 documento pendente"
          : `${documentos.length} documentos pendentes`}
      </p>
      <ul>
        {documentos.map((doc) => (
          <li
            key={doc.id}
            className={
              doc.minhaAssinaturaPendente ? styles.docMinhaAssinatura : ""
            }
          >
            <span className={styles.docTexto}>
              <strong>{doc.titulo}</strong>
              <small>{situacaoDocumento(doc)}</small>
            </span>
            {doc.souSignatario && (
              <Link
                href={`/${tenant}/user/documentos/${doc.id}`}
                className={
                  doc.minhaAssinaturaPendente
                    ? styles.docAssinar
                    : styles.docVer
                }
              >
                {doc.minhaAssinaturaPendente ? (
                  <>
                    <RiPenNibLine size={14} /> Assinar
                  </>
                ) : (
                  "Ver"
                )}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const AlunoCard = ({
  aluno,
  arrastando,
  origemId,
  origem,
  onAcao,
  onCancelarSolicitacao,
  ocultarPlano = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `aluno-${aluno.participacaoId}`,
    data: { participacaoId: aluno.participacaoId },
    // Habilitado mesmo para quem não pode receber: soltar ali mostra o motivo.
    disabled: aluno.classe === "ENCERRADO",
  });

  const pendente = aluno.solicitacaoPendente;
  const ehOrigem = origemId === aluno.participacaoId;
  // Quem pode receber depende do que está sendo arrastado (bolsa ou vaga na fila)
  const podeReceber = podeReceberDe(aluno, origem);
  const alvoValido = arrastando && !ehOrigem && podeReceber;
  const alvoInvalido = arrastando && !ehOrigem && !podeReceber;

  // Ações sempre visíveis no card (só as permitidas: em edital encerrado ou
  // com solicitação pendente, nenhuma aparece).
  const acoes = [
    aluno.acoes.transferirBolsa && {
      tipo: "TRANSFERENCIA_BOLSA",
      label:
        aluno.classe === "LISTA_ESPERA"
          ? "Transferir vaga na fila"
          : "Transferir bolsa",
      icone: RiArrowLeftRightLine,
      tom: "primario",
      dica:
        aluno.classe === "LISTA_ESPERA"
          ? "Passar a vaga na lista de espera para um voluntário desta inscrição (você também pode arrastar a ficha)"
          : "Passar a bolsa para um voluntário desta inscrição (você também pode arrastar a ficha da bolsa)",
    },
    aluno.acoes.devolverBolsa && {
      tipo: "DEVOLUCAO_BOLSA",
      label:
        aluno.classe === "LISTA_ESPERA" ? "Desistir da fila" : "Devolver bolsa",
      icone: RiHandCoinLine,
      tom: "neutro",
      dica:
        aluno.classe === "LISTA_ESPERA"
          ? "Abrir mão da vaga na lista de espera; o aluno continua como voluntário"
          : "Devolver a bolsa à gestão; o aluno continua como voluntário",
    },
    aluno.acoes.substituir && {
      tipo: "SUBSTITUICAO",
      label: "Substituir aluno",
      icone: RiUserSharedLine,
      tom: "neutro",
      dica: "Trocar este aluno por outro no mesmo plano de trabalho",
    },
    aluno.acoes.cancelar && {
      tipo: "CANCELAMENTO",
      label: "Cancelar participação",
      icone: RiUserForbidLine,
      tom: "perigo",
      dica: "Encerrar a participação deste aluno",
    },
  ].filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      className={`${styles.alunoCard} ${pendente ? styles.alunoTravado : ""} ${
        alvoValido ? styles.alunoAlvo : ""
      } ${alvoValido && isOver ? styles.alunoAlvoAtivo : ""} ${alvoInvalido ? styles.alunoIndisponivel : ""} ${
        alvoInvalido && isOver ? styles.alunoAlvoInvalido : ""
      }`}
    >
      <div className={styles.alunoTopo}>
        <div className={styles.alunoIdentificacao}>
          <strong>{aluno.nome}</strong>
          {!ocultarPlano && aluno.plano?.titulo && (
            <small title={aluno.plano.titulo}>{aluno.plano.titulo}</small>
          )}
        </div>
      </div>

      <div className={styles.alunoInfo}>
        <span
          className={`${styles.chipClasse} ${styles[`classe_${aluno.classe}`]}`}
        >
          {ROTULO_CLASSE[aluno.classe] || aluno.classe}
        </span>
        <span className={styles.chipStatus} title="Status da participação">
          {ROTULO_STATUS_PARTICIPACAO[aluno.statusParticipacao] ||
            aluno.statusParticipacao}
        </span>
        {!ocultarPlano && aluno.plano?.nota != null && (
          <span className={styles.chipNota}>Nota {aluno.plano.nota}</span>
        )}
        {aluno.iraAbaixoMinimoRemunerado && (
          <span
            className={styles.chipAlerta}
            title="IRA abaixo do mínimo exigido para remunerado neste edital"
          >
            <RiAlertLine size={12} /> IRA {aluno.ira}
          </span>
        )}
      </div>

      {(aluno.classe === "BOLSISTA" || aluno.classe === "LISTA_ESPERA") && (
        <BolsaToken aluno={aluno} />
      )}

      {alvoValido && (
        <p className={styles.dicaSoltar}>
          {origem?.classe === "LISTA_ESPERA"
            ? isOver
              ? "Solte para transferir a vaga na fila"
              : "Pode receber a vaga na fila"
            : isOver
              ? "Solte para transferir a bolsa"
              : "Pode receber a bolsa"}
        </p>
      )}
      {alvoInvalido && (
        <p className={styles.motivoBloqueio}>
          <RiForbidLine size={14} /> Não pode receber:{" "}
          {motivoNaoRecebeDe(aluno, origem)}
        </p>
      )}

      {!arrastando && (
        <DocumentosPendentes documentos={aluno.documentosPendentes} />
      )}

      {acoes.length > 0 && !arrastando && (
        <div className={styles.acoesAluno}>
          {acoes.map(({ tipo, label, icone: Icone, tom, dica }) => (
            <button
              key={tipo}
              type="button"
              className={`${styles.acaoAluno} ${styles[`acao_${tom}`]}`}
              onClick={() => onAcao(tipo, aluno)}
              title={dica}
            >
              <Icone size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {pendente && (
        <div className={styles.pendencia}>
          <RiTimeLine size={14} />
          <span>
            {pendente.papel === "DESTINO" ? "Destino de " : ""}
            {ROTULO_TIPO[pendente.tipo]} aguardando aprovação da gestão
            {pendente.grupoId && (
              <span className={styles.seloBloco}>
                {" "}
                em bloco #{pendente.grupoId}
              </span>
            )}
            <small> · {formatarDataHora(pendente.createdAt)}</small>
          </span>
          {pendente.minha && pendente.papel === "ALVO" && (
            <button
              type="button"
              className={styles.linkCancelar}
              onClick={() => onCancelarSolicitacao(pendente.id)}
            >
              Cancelar solicitação
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AlunoCard;

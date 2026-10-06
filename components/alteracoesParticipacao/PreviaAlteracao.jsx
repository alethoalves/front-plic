"use client";
import {
  RiAlertLine,
  RiArrowRightLine,
  RiErrorWarningLine,
  RiFileAddLine,
  RiFileForbidLine,
} from "@remixicon/react";
import styles from "./alteracoes.module.scss";
import {
  ROTULO_CLASSE,
  ROTULO_STATUS_PARTICIPACAO,
  ROTULO_STATUS_VINCULO,
} from "@/lib/alteracaoParticipacao";

const descreverEstado = (estado) => {
  if (!estado) return null;
  const partes = [];
  const v = estado.vinculo;
  if (estado.classe === "BOLSISTA" && v) {
    partes.push(v.instituicaoPagadora || "Bolsa");
    partes.push(ROTULO_STATUS_VINCULO[v.status] || v.status);
  } else if (estado.classe === "LISTA_ESPERA" && v) {
    partes.push(
      v.ordemRecebimentoBolsa ? `Ordem ${v.ordemRecebimentoBolsa} na inscrição` : "Sem ordem definida"
    );
  }
  return partes.join(" · ");
};

const EstadoAluno = ({ estado, vazio }) => {
  if (!estado) return <div className={`${styles.estado} ${styles.estadoVazio}`}>{vazio}</div>;
  return (
    <div className={styles.estado}>
      <span className={`${styles.classe} ${styles[`classe_${estado.classe}`]}`}>
        {ROTULO_CLASSE[estado.classe] || estado.classe}
      </span>
      <span className={styles.estadoDetalhe}>
        {ROTULO_STATUS_PARTICIPACAO[estado.statusParticipacao] || estado.statusParticipacao}
        {descreverEstado(estado) ? ` · ${descreverEstado(estado)}` : ""}
      </span>
    </div>
  );
};

const ListaDocumentos = ({ titulo, icone, itens, tom }) => {
  if (!itens?.length) return null;
  return (
    <div className={`${styles.documentos} ${styles[`documentos_${tom}`]}`}>
      <p className={styles.documentosTitulo}>
        {icone}
        {titulo}
      </p>
      <ul>
        {itens.map((d) => (
          <li key={`${d.id}-${d.participacaoId}`}>
            <strong>{d.titulo}</strong> — {d.nome}
          </li>
        ))}
      </ul>
    </div>
  );
};

// previa: { valida, erro, antes, depois, documentos: { criados, cancelados }, avisos }
// executada: true quando mostra o resultado de uma solicitação já aprovada.
const PreviaAlteracao = ({ previa, executada = false }) => {
  if (!previa) return null;
  const avisos = previa.avisos || [];
  const antes = previa.antes || [];
  const depois = previa.depois || [];
  const ids = [...new Set([...antes, ...depois].map((p) => p.participacaoId))];

  return (
    <div className={styles.previa}>
      {avisos.length > 0 && (
        <div className={styles.avisos}>
          {avisos.map((aviso, i) => (
            <p key={i} className={styles.aviso}>
              <RiAlertLine size={16} />
              <span>{aviso.mensagem}</span>
            </p>
          ))}
        </div>
      )}

      {previa.valida === false && (
        <p className={styles.erro}>
          <RiErrorWarningLine size={18} />
          <span>{previa.erro}</span>
        </p>
      )}

      {previa.valida !== false && ids.length > 0 && (
        <>
          <div className={styles.comparativo}>
            <div className={styles.comparativoCabecalho}>
              <span>Aluno</span>
              <span>Antes</span>
              <span />
              <span>{executada ? "Depois" : "Depois da aprovação"}</span>
            </div>
            {ids.map((id) => {
              const a = antes.find((p) => p.participacaoId === id);
              const d = depois.find((p) => p.participacaoId === id);
              const ref = d || a;
              return (
                <div key={id} className={styles.comparativoLinha}>
                  <div className={styles.aluno}>
                    <strong>{ref.nome}</strong>
                    {ref.plano && <small>{ref.plano}</small>}
                  </div>
                  <EstadoAluno estado={a} vazio="Nova participação" />
                  <RiArrowRightLine className={styles.seta} size={18} />
                  <EstadoAluno estado={d} vazio="—" />
                </div>
              );
            })}
          </div>

          <ListaDocumentos
            titulo={executada ? "Documentos criados" : "Documentos que serão criados"}
            icone={<RiFileAddLine size={16} />}
            itens={previa.documentos?.criados}
            tom="criados"
          />
          <ListaDocumentos
            titulo={executada ? "Documentos cancelados" : "Documentos que serão cancelados"}
            icone={<RiFileForbidLine size={16} />}
            itens={previa.documentos?.cancelados}
            tom="cancelados"
          />
        </>
      )}
    </div>
  );
};

export default PreviaAlteracao;

"use client";
import { useState } from "react";
import { RiPrinterLine } from "@remixicon/react";
import Button from "@/components/Button";
import { getInstituicaoSigla } from "@/lib/instituicaoDisplay";
import { descreverFiltros } from "@/lib/compartilhamentoResumos";
import FeedbackTrabalho from "./FeedbackTrabalho";
import styles from "./RelatorioResumosAvaliacoes.module.scss";

// Relatório "Resumos + Avaliações" de um evento. Usado pela página pública
// /compartilhado/resumos/[token] (substitui o antigo download .html).

const CARGOS = [
  ["AUTOR", "Autores"],
  ["COAUTOR", "Coautores"],
  ["ORIENTADOR", "Orientador(es)"],
  ["COORIENTADOR", "Coorientador(es)"],
  ["COLABORADOR", "Colaborador(es)"],
];

const VERSOES_COMENTARIO = [
  { id: "DEPURADO", label: "Comentário depurado (IA)" },
  { id: "ORIGINAL", label: "Comentário original" },
];

const simNao = (v) => (v ? "Sim" : "Não");

const formatarData = (d) => new Date(d).toLocaleDateString("pt-BR");

// Escolhe qual comentário mostrar. A API já omite os que o admin não liberou;
// com as duas versões disponíveis, cai na outra quando a escolhida está vazia.
const comentarioParaExibir = (avaliacao, versao) => {
  const original = avaliacao.observacao?.trim();
  const depurado = avaliacao.observacaoDepuradaIA?.trim();
  if (versao === "ORIGINAL") {
    if (original) return { texto: original, titulo: "Comentário original" };
    if (depurado) return { texto: depurado, titulo: "Comentário depurado (IA) — sem versão original", ia: true };
  } else {
    if (depurado) return { texto: depurado, titulo: "Comentário depurado (IA)", ia: true };
    if (original) return { texto: original, titulo: "Comentário original — sem versão depurada" };
  }
  return null;
};

const Avaliacao = ({ avaliacao, indice, versaoComentario }) => {
  const comentario = comentarioParaExibir(avaliacao, versaoComentario);
  return (
    <div className={styles.avaliacao}>
      <p className={styles.avaliacaoTitulo}>Avaliação {indice}</p>
      <div className={styles.avaliacaoInfo}>
        <div><strong>Nota total:</strong> {avaliacao.notaTotal ?? "N/A"}</div>
        <div><strong>Indicação prêmio:</strong> {simNao(avaliacao.indicacaoPremio)}</div>
        <div><strong>Menção honrosa:</strong> {simNao(avaliacao.mencaoHonrosa)}</div>
        <div><strong>Premiado:</strong> {simNao(avaliacao.premio)}</div>
      </div>

      {comentario && (
        <div className={comentario.ia ? styles.observacaoIA : styles.observacao}>
          <strong>{comentario.titulo}:</strong>
          <p>{comentario.texto}</p>
        </div>
      )}

      {avaliacao.registros?.length > 0 && (
        <div className={styles.criterios}>
          <strong>Critérios avaliados:</strong>
          {avaliacao.registros.map((registro, i) => (
            <div key={i} className={styles.criterio}>
              <span>{registro.titulo}</span>
              <strong>Nota: {registro.nota}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Trabalho = ({ submissao, indice, versaoComentario, token, permitirFeedback }) => {
  const resumo = submissao.Resumo || {};
  const avaliacoes = submissao.Avaliacao || [];
  const participantes = (resumo.participacoes || []).reduce((acc, p) => {
    (acc[p.cargo] ||= []).push(p.user?.nome || "Nome não disponível");
    return acc;
  }, {});
  const palavras = resumo.PalavraChave?.map((p) => p.palavra).join(", ");
  const destaques = [
    submissao.indicacaoPremio && "Indicação a prêmio",
    submissao.mencaoHonrosa && "Menção honrosa",
    submissao.premio && "Premiado",
  ].filter(Boolean);

  return (
    <article className={styles.trabalho}>
      <h2 className={styles.tituloTrabalho}>
        {indice}. {resumo.titulo || "Sem título"}
      </h2>

      <div className={styles.infoBasica}>
        <span><strong>ID:</strong> {submissao.id}</span>
        <span><strong>Instituição:</strong> {getInstituicaoSigla(submissao)}</span>
        <span><strong>Categoria:</strong> {submissao.categoria || "N/A"}</span>
        <span><strong>Status:</strong> {submissao.status || "N/A"}</span>
        <span>
          <strong>Nota final:</strong>{" "}
          {submissao.notaFinal != null ? submissao.notaFinal.toFixed(2) : "N/A"}
        </span>
        {destaques.map((d) => (
          <span key={d} className={styles.destaque}>{d}</span>
        ))}
      </div>

      <div className={styles.participantes}>
        {CARGOS.filter(([cargo]) => participantes[cargo]?.length).map(([cargo, label]) => (
          <p key={cargo}>
            <strong>{label}:</strong> {participantes[cargo].join(", ")}
          </p>
        ))}
      </div>

      <div className={styles.areaInfo}>
        <p><strong>Área:</strong> {resumo.area?.area || "Sem área"}</p>
        <p><strong>Grande área:</strong> {resumo.area?.grandeArea?.grandeArea || "Sem grande área"}</p>
        <p><strong>Palavras-chave:</strong> <em>{palavras || "Sem palavras-chave"}</em></p>
      </div>

      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>Resumo</h3>
        {Array.isArray(resumo.conteudo) ? (
          resumo.conteudo.map((secao, i) => (
            <div key={i} className={styles.secaoResumo}>
              <h4>{secao.nome}</h4>
              <p className={styles.conteudoResumo}>{secao.conteudo}</p>
            </div>
          ))
        ) : (
          <p className={styles.semDados}>Resumo não disponível</p>
        )}
      </section>

      <section className={styles.secao}>
        <h3 className={styles.secaoTitulo}>Avaliações ({avaliacoes.length})</h3>
        {avaliacoes.length > 0 ? (
          avaliacoes.map((avaliacao, i) => (
            <Avaliacao key={i} avaliacao={avaliacao} indice={i + 1} versaoComentario={versaoComentario} />
          ))
        ) : (
          <p className={styles.semDados}>Nenhuma avaliação disponível</p>
        )}
      </section>

      {permitirFeedback && (
        <FeedbackTrabalho token={token} submissaoId={submissao.id} feedbacksIniciais={submissao.feedbacks} />
      )}
    </article>
  );
};

const RelatorioResumosAvaliacoes = ({
  token,
  nomeEvento,
  recorte,
  filtros,
  exibicaoComentarios = "AMBOS",
  permitirFeedback = false,
  validade,
  submissoes,
}) => {
  // Com "AMBOS" quem acessa escolhe; nos outros modos a API só manda uma versão
  const [versaoComentario, setVersaoComentario] = useState(
    exibicaoComentarios === "ORIGINAL" ? "ORIGINAL" : "DEPURADO"
  );
  const descricaoFiltros = descreverFiltros(filtros);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerTexto}>
          <h1>Resumos e Avaliações</h1>
          <h2>{nomeEvento}</h2>
          {recorte && (
            <p><strong>Instituição:</strong> {recorte.sigla?.toUpperCase()} — {recorte.nome}</p>
          )}
          {descricaoFiltros.length > 0 && (
            <p><strong>Seleção:</strong> {descricaoFiltros.join(" · ")}</p>
          )}
          <p><strong>Total de trabalhos:</strong> {submissoes.length}</p>
          {validade && (
            <p className={styles.aviso}>
              Link compartilhado — somente leitura, válido até {formatarData(validade)}.
              {permitirFeedback && " Você pode avaliar cada trabalho com estrelas e um comentário."}
            </p>
          )}
        </div>
        <div className={styles.acoes}>
          <Button onClick={() => window.print()} icon={RiPrinterLine} className="btn-secondary" type="button">
            Imprimir / salvar PDF
          </Button>
        </div>
      </header>

      {exibicaoComentarios === "AMBOS" && (
        <div className={`${styles.abas} ${styles.naoImprimir}`}>
          {VERSOES_COMENTARIO.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`${styles.aba} ${versaoComentario === v.id ? styles.abaAtiva : ""}`}
              onClick={() => setVersaoComentario(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {submissoes.length > 0 ? (
        submissoes.map((s, i) => (
          <Trabalho
            key={s.id}
            submissao={s}
            indice={i + 1}
            versaoComentario={versaoComentario}
            token={token}
            permitirFeedback={permitirFeedback}
          />
        ))
      ) : (
        <p className={styles.semDados}>Nenhum trabalho encontrado.</p>
      )}
    </main>
  );
};

export default RelatorioResumosAvaliacoes;

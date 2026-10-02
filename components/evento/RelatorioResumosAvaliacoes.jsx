"use client";
import { useDeferredValue, useMemo, useState } from "react";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { RiPrinterLine, RiSearchLine } from "@remixicon/react";
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

// Filtro pelas estrelas dadas por quem acessa o link (média por trabalho)
const FILTROS_ESTRELAS = [
  { value: "TODOS", label: "Todas as avaliações" },
  { value: "SEM", label: "Sem avaliações" },
  { value: "COM", label: "Com avaliações" },
  { value: "5", label: "Média 5 estrelas" },
  { value: "4", label: "Média de 4 estrelas ou mais" },
  { value: "3", label: "Média de 3 estrelas ou mais" },
  { value: "2", label: "Média de 2 estrelas ou mais" },
  { value: "BAIXA", label: "Média abaixo de 3 estrelas" },
];

const mediaEstrelas = (feedbacks = []) =>
  feedbacks.length ? feedbacks.reduce((s, f) => s + f.estrelas, 0) / feedbacks.length : null;

const passaFiltroEstrelas = (feedbacks, filtro) => {
  const media = mediaEstrelas(feedbacks);
  if (filtro === "TODOS") return true;
  if (filtro === "SEM") return media == null;
  if (filtro === "COM") return media != null;
  if (filtro === "BAIXA") return media != null && media < 3;
  return media != null && media >= Number(filtro);
};

// Busca sem diferenciar maiúsculas nem acentos
const normalizar = (texto) =>
  (texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Texto pesquisável de um trabalho: título + nomes de todos os participantes
const textoBusca = (submissao) =>
  normalizar(
    [submissao.Resumo?.titulo, ...(submissao.Resumo?.participacoes || []).map((p) => p.user?.nome)].join(" ")
  );

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

const Trabalho = ({ submissao, indice, versaoComentario, token, permitirFeedback, feedbacks, onFeedbacksChange }) => {
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
        <FeedbackTrabalho
          token={token}
          submissaoId={submissao.id}
          feedbacks={feedbacks}
          onChange={onFeedbacksChange}
        />
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

  const [busca, setBusca] = useState("");
  const buscaAdiada = useDeferredValue(busca); // a lista pode ter milhares de trabalhos
  const [filtroEstrelas, setFiltroEstrelas] = useState("TODOS");

  // Feedbacks ficam aqui (e não em cada trabalho) para o filtro de estrelas
  // refletir na hora o que o acessante acabou de salvar
  const [feedbacksPorTrabalho, setFeedbacksPorTrabalho] = useState(() =>
    Object.fromEntries(submissoes.map((s) => [s.id, s.feedbacks || []]))
  );
  const atualizarFeedbacks = (submissaoId, lista) =>
    setFeedbacksPorTrabalho((atual) => ({ ...atual, [submissaoId]: lista }));

  // Índice de busca calculado uma vez; a numeração original é mantida ao filtrar
  const indexados = useMemo(
    () => submissoes.map((s, i) => ({ submissao: s, indice: i + 1, texto: textoBusca(s) })),
    [submissoes]
  );

  const termos = normalizar(buscaAdiada).split(/\s+/).filter(Boolean);
  const visiveis = indexados.filter(
    ({ submissao, texto }) =>
      termos.every((t) => texto.includes(t)) &&
      (!permitirFeedback || passaFiltroEstrelas(feedbacksPorTrabalho[submissao.id], filtroEstrelas))
  );
  const filtrando = termos.length > 0 || (permitirFeedback && filtroEstrelas !== "TODOS");

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

      <div className={`${styles.barraFiltros} ${styles.naoImprimir}`}>
        <div className={styles.filtros}>
          <span className={`p-input-icon-left ${styles.busca}`}>
            <RiSearchLine size={16} className={styles.buscaIcone} />
            <InputText
              className={styles.buscaInput}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título, aluno ou orientador"
              aria-label="Buscar por título, aluno ou orientador"
            />
          </span>
          {permitirFeedback && (
            <Dropdown
              className={styles.filtroEstrelas}
              value={filtroEstrelas}
              options={FILTROS_ESTRELAS}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => setFiltroEstrelas(e.value ?? "TODOS")}
              aria-label="Filtrar pelas estrelas"
            />
          )}
        </div>
        {filtrando && (
          <p className={styles.contagem}>
            Mostrando {visiveis.length} de {submissoes.length} trabalhos
          </p>
        )}

        {exibicaoComentarios === "AMBOS" && (
          <div className={styles.abas}>
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
      </div>

      {visiveis.length > 0 ? (
        visiveis.map(({ submissao, indice }) => (
          <Trabalho
            key={submissao.id}
            submissao={submissao}
            indice={indice}
            versaoComentario={versaoComentario}
            token={token}
            permitirFeedback={permitirFeedback}
            feedbacks={feedbacksPorTrabalho[submissao.id]}
            onFeedbacksChange={atualizarFeedbacks}
          />
        ))
      ) : (
        <p className={styles.semDados}>
          {filtrando ? "Nenhum trabalho corresponde à busca ou ao filtro." : "Nenhum trabalho encontrado."}
        </p>
      )}
    </main>
  );
};

export default RelatorioResumosAvaliacoes;

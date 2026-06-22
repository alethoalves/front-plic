"use client";
import { useState } from "react";
import styles from "./ImportarLattesGestor.module.scss";
import { importarLattesGestor } from "@/app/api/client/cvLattes";

// ─── adapter (client-side mirror of api-plic/src/adapters/lattesDOMAdapter.js) ─
// Must stay in sync with the server-side adapter.

function toXml2jsArray(arr) {
  if (!arr || arr.length === 0) return undefined;
  if (arr.length === 1) return arr[0];
  return arr;
}

function adaptarArtigo(a) {
  return {
    "DADOS-BASICOS-DO-ARTIGO": {
      "TITULO-DO-ARTIGO": a.titulo || "",
      "ANO-DO-ARTIGO": String(a.ano || ""),
      "NATUREZA": "COMPLETO",
      "PAIS-DE-PUBLICACAO": "Brasil",
      "FLAG-RELEVANCIA": a.flagRelevancia ? "SIM" : "NAO",
    },
    "DETALHAMENTO-DO-ARTIGO": {
      "ISSN": a.issn || "",
      "TITULO-DO-PERIODICO-OU-REVISTA": a.nomePeriodico || "",
      "VOLUME": a.volume || "",
      "PAGINA-INICIAL": a.paginaInicial || "",
      "DOI": a.doi || "",
    },
  };
}

function adaptarTrabalho(t) {
  return {
    "DADOS-BASICOS-DO-TRABALHO": {
      "TITULO-DO-TRABALHO": t.titulo || "",
      "ANO-DO-TRABALHO": String(t.ano || ""),
      "NATUREZA": "COMPLETO",
      "PAIS-DE-PUBLICACAO": "Brasil",
    },
    "DETALHAMENTO-DO-TRABALHO": {
      "CLASSIFICACAO-DO-EVENTO": t.classificacaoEvento || "",
      "NOME-DO-EVENTO": t.nomeEvento || "",
    },
  };
}

function adaptarLivro(l) {
  return {
    "DADOS-BASICOS-DO-LIVRO": {
      "TITULO-DO-LIVRO": l.titulo || "",
      "ANO": String(l.ano || ""),
      "TIPO": l.tipo || "LIVRO_PUBLICADO",
      "PAIS-DE-PUBLICACAO": "Brasil",
    },
    "DETALHAMENTO-DO-LIVRO": {
      "ISBN": l.isbn || "",
      "EDITORA": l.editora || "",
    },
  };
}

function adaptarCapitulo(c) {
  return {
    "DADOS-BASICOS-DO-CAPITULO": {
      "TITULO-DO-CAPITULO-DO-LIVRO": c.titulo || "",
      "ANO": String(c.ano || ""),
      "TIPO": "CAPITULO_DE_LIVRO_PUBLICADO",
      "PAIS-DE-PUBLICACAO": "Brasil",
    },
    "DETALHAMENTO-DO-CAPITULO": {
      "ISBN": c.isbn || "",
      "TITULO-DO-LIVRO": c.tituloLivro || "",
      "PAGINA-INICIAL": c.paginaInicial || "",
    },
  };
}

function adaptarOrientacaoMestrado(o) {
  return {
    "DADOS-BASICOS-DE-ORIENTACOES-CONCLUIDAS-PARA-MESTRADO": {
      "NATUREZA": "DISSERTACAO",
      "TITULO": o.titulo || "",
      "ANO": String(o.ano || ""),
      "PAIS": "Brasil",
      "TIPO": "",
    },
    "DETALHAMENTO-DE-ORIENTACOES-CONCLUIDAS-PARA-MESTRADO": {
      "TIPO-DE-ORIENTACAO": o.tipoOrientacao || "ORIENTADOR_PRINCIPAL",
    },
  };
}

function adaptarOrientacaoDoutorado(o) {
  return {
    "DADOS-BASICOS-DE-ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO": {
      "NATUREZA": "TESE",
      "TITULO": o.titulo || "",
      "ANO": String(o.ano || ""),
      "PAIS": "Brasil",
      "TIPO": "",
    },
    "DETALHAMENTO-DE-ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO": {
      "TIPO-DE-ORIENTACAO": o.tipoOrientacao || "ORIENTADOR_PRINCIPAL",
    },
  };
}

function adaptarOutraOrientacao(o) {
  return {
    "DADOS-BASICOS-DE-OUTRAS-ORIENTACOES-CONCLUIDAS": {
      "NATUREZA": o.natureza || "OUTRO",
      "TITULO": o.titulo || "",
      "ANO": String(o.ano || ""),
      "PAIS": "Brasil",
      "TIPO": o.tipo || "",
    },
    "DETALHAMENTO-DE-OUTRAS-ORIENTACOES-CONCLUIDAS": {
      "TIPO-DE-ORIENTACAO-CONCLUIDA": o.tipoOrientacao || "ORIENTADOR_PRINCIPAL",
    },
  };
}

function adaptarFormacao(f) {
  const obj = {};
  if (f?.posDoutorado)   obj["POS-DOUTORADO"]   = { "STATUS-DO-CURSO": "CONCLUIDO" };
  if (f?.doutorado)      obj["DOUTORADO"]        = { "STATUS-DO-CURSO": "CONCLUIDO" };
  if (f?.mestrado)       obj["MESTRADO"]         = { "STATUS-DO-CURSO": "CONCLUIDO" };
  if (f?.especializacao) obj["ESPECIALIZACAO"]   = { "STATUS-DO-CURSO": "CONCLUIDO" };
  if (f?.graduacao)      obj["GRADUACAO"]        = { "STATUS-DO-CURSO": "CONCLUIDO" };
  return obj;
}

function lattesDOMParaXml2js(domJSON) {
  if (!domJSON || domJSON._source !== "bookmarklet-lattes-dom") {
    throw new Error('JSON inválido: falta _source:"bookmarklet-lattes-dom"');
  }

  const artigos   = (domJSON.artigos           || []).map(adaptarArtigo);
  const trabalhos = (domJSON.trabalhosEmEventos || []).map(adaptarTrabalho);
  const livros    = (domJSON.livrosPublicados   || []).map(adaptarLivro);
  const capitulos = (domJSON.capitulosLivros    || []).map(adaptarCapitulo);
  const oMestrado = (domJSON.orientacoesMestrado  || []).map(adaptarOrientacaoMestrado);
  const oDoutorado= (domJSON.orientacoesDoutorado || []).map(adaptarOrientacaoDoutorado);
  const oOutras   = (domJSON.outrasOrientacoes    || []).map(adaptarOutraOrientacao);

  const prod = {};
  if (artigos.length)   prod["ARTIGOS-PUBLICADOS"]  = { "ARTIGO-PUBLICADO": toXml2jsArray(artigos) };
  if (trabalhos.length) prod["TRABALHOS-EM-EVENTOS"] = { "TRABALHO-EM-EVENTOS": toXml2jsArray(trabalhos) };

  const lc = {};
  if (livros.length)    lc["LIVROS-PUBLICADOS-OU-ORGANIZADOS"]  = { "LIVRO-PUBLICADO-OU-ORGANIZADO": toXml2jsArray(livros) };
  if (capitulos.length) lc["CAPITULOS-DE-LIVROS-PUBLICADOS"]    = { "CAPITULO-DE-LIVRO-PUBLICADO": toXml2jsArray(capitulos) };
  if (Object.keys(lc).length) prod["LIVROS-E-CAPITULOS"] = lc;

  const orientacoes = {};
  if (oMestrado.length)  orientacoes["ORIENTACOES-CONCLUIDAS-PARA-MESTRADO"]  = toXml2jsArray(oMestrado);
  if (oDoutorado.length) orientacoes["ORIENTACOES-CONCLUIDAS-PARA-DOUTORADO"] = toXml2jsArray(oDoutorado);
  if (oOutras.length)    orientacoes["OUTRAS-ORIENTACOES-CONCLUIDAS"]          = toXml2jsArray(oOutras);

  return {
    "CURRICULO-VITAE": {
      "NUMERO-IDENTIFICADOR": domJSON._lattesId || "",
      "DATA-ATUALIZACAO": domJSON._dataExtracao
        ? domJSON._dataExtracao.slice(0, 10).replace(/-/g, "")
        : "",
      "DADOS-GERAIS": {
        "NOME-COMPLETO": domJSON._nomeCompleto || "",
        "FORMACAO-ACADEMICA-TITULACAO": adaptarFormacao(domJSON.formacao),
        "LICENCAS": {},
      },
      "PRODUCAO-BIBLIOGRAFICA": Object.keys(prod).length ? prod : {},
      "OUTRA-PRODUCAO": Object.keys(orientacoes).length
        ? { "ORIENTACOES-CONCLUIDAS": orientacoes }
        : {},
    },
  };
}

// ─── componente ──────────────────────────────────────────────────────────────

const TIPO_LABEL = {
  "artigo-sem-issn":       "Artigo sem ISSN (não pontuará via Qualis)",
  "evento-classificacao":  "Classificação de evento inferida de texto livre",
  "orientacao-tipo":       "Tipo orientador/coorientador inferido de texto livre",
};

export default function ImportarLattesGestor({ tenant, participacaoId, onSuccess }) {
  const [texto, setTexto]         = useState("");
  const [parsed, setParsed]       = useState(null);
  const [erroValidacao, setErroValidacao] = useState("");
  const [loading, setLoading]     = useState(false);
  const [mensagem, setMensagem]   = useState("");

  function handleValidar() {
    setErroValidacao("");
    setParsed(null);
    setMensagem("");

    let obj;
    try {
      obj = JSON.parse(texto);
    } catch {
      setErroValidacao("JSON inválido: verifique se o texto foi copiado corretamente.");
      return;
    }

    if (obj._source !== "bookmarklet-lattes-dom") {
      setErroValidacao('Campo _source inválido. Certifique-se de usar o bookmarklet PLIC – Extrator Lattes.');
      return;
    }
    if (!obj._nomeCompleto) {
      setErroValidacao("Campo _nomeCompleto ausente. O JSON pode estar incompleto.");
      return;
    }
    if (!Array.isArray(obj._revisar)) {
      setErroValidacao("Campo _revisar ausente ou inválido.");
      return;
    }

    setParsed(obj);
  }

  async function handleImportar() {
    if (!parsed) return;
    setLoading(true);
    setMensagem("");
    try {
      const adaptado = lattesDOMParaXml2js(parsed);
      await importarLattesGestor(tenant, participacaoId, adaptado);
      setMensagem("Importação concluída. Clique em \"Gerar Ficha de Avaliação\" para continuar.");
      if (onSuccess) onSuccess();
    } catch (err) {
      setMensagem(
        "Erro ao importar: " +
          (err?.response?.data?.message || err?.message || "Erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  const totalItens = parsed
    ? (parsed.artigos?.length || 0) +
      (parsed.trabalhosEmEventos?.length || 0) +
      (parsed.livrosPublicados?.length || 0) +
      (parsed.capitulosLivros?.length || 0) +
      (parsed.orientacoesMestrado?.length || 0) +
      (parsed.orientacoesDoutorado?.length || 0) +
      (parsed.outrasOrientacoes?.length || 0)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.aviso}>
        <strong>Via alternativa — somente para uso do gestor</strong>
        <p>
          Use quando o proponente não enviou o XML do Lattes ou o arquivo está inválido.
          O CV público é subconjunto dos dados reais: esta via <strong>pode subpontuar</strong>{" "}
          em relação ao XML completo. O XML do proponente continua sendo o caminho preferencial.
        </p>
      </div>

      <ol className={styles.passos}>
        <li>
          Abra a página do CV Lattes do proponente em{" "}
          <code>lattes.cnpq.br</code> e resolva o captcha.
        </li>
        <li>
          Clique no favorito <strong>PLIC – Extrator Lattes</strong> na barra do
          navegador (instale conforme{" "}
          <code>api-plic/src/bookmarklet/INSTALACAO.md</code>).
        </li>
        <li>Cole o JSON copiado para o clipboard no campo abaixo.</li>
      </ol>

      <textarea
        className={styles.textarea}
        placeholder='Cole aqui o JSON copiado pelo bookmarklet {"_source":"bookmarklet-lattes-dom", ...}'
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setParsed(null);
          setErroValidacao("");
          setMensagem("");
        }}
        rows={6}
      />

      <button
        className={styles.btnValidar}
        onClick={handleValidar}
        disabled={!texto.trim()}
      >
        Validar JSON
      </button>

      {erroValidacao && (
        <div className={styles.erro}>{erroValidacao}</div>
      )}

      {parsed && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <strong>Preview — {parsed._nomeCompleto}</strong>
            <span className={styles.badge}>{totalItens} itens extraídos</span>
          </div>

          <div className={styles.previewGrid}>
            <span>Artigos</span>
            <span>{parsed.artigos?.length || 0}</span>
            <span>Trabalhos em eventos</span>
            <span>{parsed.trabalhosEmEventos?.length || 0}</span>
            <span>Livros</span>
            <span>{parsed.livrosPublicados?.length || 0}</span>
            <span>Capítulos</span>
            <span>{parsed.capitulosLivros?.length || 0}</span>
            <span>Orientações (mestrado)</span>
            <span>{parsed.orientacoesMestrado?.length || 0}</span>
            <span>Orientações (doutorado)</span>
            <span>{parsed.orientacoesDoutorado?.length || 0}</span>
            <span>Outras orientações</span>
            <span>{parsed.outrasOrientacoes?.length || 0}</span>
            <span>Formação</span>
            <span>
              {[
                parsed.formacao?.posDoutorado && "Pós-doc",
                parsed.formacao?.doutorado    && "Doutorado",
                parsed.formacao?.mestrado     && "Mestrado",
                parsed.formacao?.graduacao    && "Graduação",
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </span>
          </div>

          {parsed._revisar?.length > 0 && (
            <div className={styles.revisar}>
              <strong>Itens para revisão ({parsed._revisar.length})</strong>
              <ul>
                {parsed._revisar.map((item, i) => (
                  <li key={i}>
                    <span className={styles.tag}>
                      {TIPO_LABEL[item.tipo] || item.tipo}
                    </span>{" "}
                    {item.titulo && <span>{item.titulo}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            className={styles.btnImportar}
            onClick={handleImportar}
            disabled={loading}
          >
            {loading ? "Importando..." : "Confirmar importação"}
          </button>
        </div>
      )}

      {mensagem && (
        <div
          className={
            mensagem.startsWith("Erro") ? styles.erro : styles.sucesso
          }
        >
          {mensagem}
        </div>
      )}
    </div>
  );
}

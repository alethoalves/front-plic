"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import {
  RiArrowDownLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiArrowUpLine,
  RiBold,
  RiDeleteBinLine,
  RiItalic,
  RiListOrdered,
  RiUnderline,
} from "@remixicon/react";

import styles from "./TermoEditorVisual.module.scss";

// Editor "no próprio documento": o termo é carregado num iframe com o body
// editável. Só o conteúdo do body muda — o <style> do termo fica intacto, e
// os blocos novos usam as mesmas classes do termo, então o estilo se mantém.

// Blocos que o gestor pode inserir. Só aparecem os que o <style> do termo
// define (classe), para não inserir algo que sairia sem estilo.
const BLOCOS = [
  {
    id: "clausula",
    label: "Cláusula",
    classe: "clausula-item",
    html: '<div class="clausula-item"><div class="clausula-text">Novo item</div></div>',
  },
  {
    id: "secao",
    label: "Seção",
    classe: "clausula-section",
    html: '<section class="clausula-section"><h2 class="clausula-title">Nova seção</h2><div class="clausula-item"><div class="clausula-text">Novo item</div></div></section>',
  },
  {
    id: "destaque",
    label: "Destaque",
    classe: "highlight",
    html: '<div class="highlight"><strong>IMPORTANTE:</strong> texto do destaque.</div>',
  },
  {
    id: "atencao",
    label: "Atenção",
    classe: "warning",
    html: '<div class="warning"><strong>ATENÇÃO:</strong> texto do aviso.</div>',
  },
  { id: "paragrafo", label: "Parágrafo", classe: null, html: "<p>Novo parágrafo</p>" },
];

// O que conta como "bloco" para mover/remover. O título de seção (h2) não
// está aqui de propósito: com o cursor nele, o bloco é a seção inteira.
const SELETOR_BLOCO = ".clausula-section, .clausula-item, .highlight, .warning, .intro-text, li, p, h1";

const ID_ESTILO_EDITOR = "__estilo-editor";

// Conteúdo do body sem a marcação de bloco ativo (que muda só de mover o cursor)
const fotoDoBody = (doc) => doc.body.innerHTML.replaceAll(' data-editor-ativo=""', "");
const ZERO_WIDTH = "​";

// Estilo só do editor (removido ao salvar). Dentro do iframe não há SCSS:
// hex de $warning-light e rgba de $gray-500.
const ESTILO_EDITOR = `
  [data-var] { background: #ffd76b; border-radius: 4px; padding: 0 4px; font-weight: 600; white-space: nowrap; cursor: default; }
  [data-editor-ativo] { outline: 2px dashed rgba(108, 119, 129, 0.8); outline-offset: 4px; }
  body:focus { outline: none; }
`;

// Tira scripts e handlers antes de carregar o HTML num iframe sem sandbox
// (o editor precisa acessar o documento do iframe).
const sanitizar = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, iframe, object, embed").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      if (attr.name.toLowerCase().startsWith("on") || /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return (doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>\n` : "") + doc.documentElement.outerHTML;
};

const criarEtiqueta = (doc, nome, descricao) => {
  const span = doc.createElement("span");
  span.setAttribute("data-var", nome);
  span.setAttribute("contenteditable", "false");
  span.textContent = descricao;
  return span;
};

// [NOME_ALUNO] → etiqueta não editável "Nome do aluno"
const converterVariaveisEmEtiquetas = (doc, variaveis) => {
  const descricoes = new Map(variaveis.map((v) => [v.nome, v.descricao]));
  const walker = doc.createTreeWalker(doc.body, 4 /* SHOW_TEXT */);
  const nos = [];
  while (walker.nextNode()) nos.push(walker.currentNode);

  for (const no of nos) {
    if (!/\[[A-Z_]+\]/.test(no.nodeValue)) continue;
    const fragmento = doc.createDocumentFragment();
    for (const parte of no.nodeValue.split(/(\[[A-Z_]+\])/)) {
      const nome = parte.match(/^\[([A-Z_]+)\]$/)?.[1];
      if (nome && descricoes.has(nome)) {
        fragmento.appendChild(criarEtiqueta(doc, nome, descricoes.get(nome)));
      } else if (parte) {
        fragmento.appendChild(doc.createTextNode(parte));
      }
    }
    no.replaceWith(fragmento);
  }
};

// Documento do editor → HTML do termo (etiquetas voltam a ser [VARIAVEL])
const serializar = (doc) => {
  const clone = doc.documentElement.cloneNode(true);
  clone.querySelector(`#${ID_ESTILO_EDITOR}`)?.remove();
  clone.querySelectorAll("[data-var]").forEach((el) => {
    el.replaceWith(doc.createTextNode(`[${el.getAttribute("data-var")}]`));
  });
  clone.querySelectorAll("[data-editor-ativo]").forEach((el) => el.removeAttribute("data-editor-ativo"));
  const body = clone.querySelector("body");
  body?.removeAttribute("contenteditable");
  body?.removeAttribute("spellcheck");

  const walker = doc.createTreeWalker(clone, 4 /* SHOW_TEXT */);
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.includes(ZERO_WIDTH)) {
      walker.currentNode.nodeValue = walker.currentNode.nodeValue.replaceAll(ZERO_WIDTH, "");
    }
  }
  return (doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>\n` : "") + clone.outerHTML;
};

const TermoEditorVisual = ({ html, variaveis, onChange }) => {
  const iframeRef = useRef(null);
  const docRef = useRef(null);
  const rangeRef = useRef(null);
  // Desfazer/refazer próprio, com fotos do body: inserir campo/bloco mexe
  // direto no DOM, fora do desfazer nativo do navegador, e misturar os dois
  // deixa passos impossíveis de desfazer. Digitação vira um passo a cada
  // pausa de 400ms.
  const historicoRef = useRef({ passado: [], futuro: [], atual: "" });
  const pendenteRef = useRef(null);
  const onChangeRef = useRef(onChange);

  // O iframe carrega o HTML só na montagem; depois disso o documento do
  // iframe é a fonte da verdade (o pai remonta o editor via `key`).
  const [srcDoc] = useState(() => sanitizar(html));
  const [blocosDisponiveis, setBlocosDisponiveis] = useState([]);
  const [temCursor, setTemCursor] = useState(false);
  const [temBloco, setTemBloco] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => () => clearTimeout(pendenteRef.current), []);

  const emitir = useCallback(() => {
    if (docRef.current) onChangeRef.current(serializar(docRef.current));
  }, []);

  const elementoDoCursor = useCallback(() => {
    const no = rangeRef.current?.startContainer;
    if (!no) return null;
    return no.nodeType === 1 ? no : no.parentElement;
  }, []);

  const blocoDoCursor = useCallback(() => {
    const bloco = elementoDoCursor()?.closest(SELETOR_BLOCO);
    return bloco && docRef.current?.body.contains(bloco) ? bloco : null;
  }, [elementoDoCursor]);

  const marcarBlocoAtivo = useCallback(() => {
    const doc = docRef.current;
    doc.querySelectorAll("[data-editor-ativo]").forEach((el) => el.removeAttribute("data-editor-ativo"));
    const bloco = blocoDoCursor();
    bloco?.setAttribute("data-editor-ativo", "");
    setTemBloco(!!bloco);
  }, [blocoDoCursor]);

  const selecionar = useCallback((range) => {
    const doc = docRef.current;
    const sel = doc.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    rangeRef.current = range.cloneRange();
  }, []);

  // Devolve o teclado ao documento (depois de um clique na barra/menu)
  const focar = useCallback(() => {
    const doc = docRef.current;
    doc.defaultView.focus();
    doc.body.focus({ preventScroll: true });
  }, []);

  const restaurarSelecao = useCallback(() => {
    focar();
    if (rangeRef.current) selecionar(rangeRef.current);
  }, [focar, selecionar]);

  const registrar = useCallback(() => {
    clearTimeout(pendenteRef.current);
    pendenteRef.current = null;
    const doc = docRef.current;
    if (!doc) return;
    const historico = historicoRef.current;
    const agora = fotoDoBody(doc);
    if (agora === historico.atual) return;
    historico.passado.push(historico.atual);
    if (historico.passado.length > 100) historico.passado.shift();
    historico.atual = agora;
    historico.futuro = [];
  }, []);

  const registrarDepois = useCallback(() => {
    clearTimeout(pendenteRef.current);
    pendenteRef.current = setTimeout(registrar, 400);
  }, [registrar]);

  const voltarPara = useCallback(
    (direcao) => {
      if (pendenteRef.current) registrar();
      const historico = historicoRef.current;
      const [origem, destino] =
        direcao === "desfazer" ? [historico.passado, historico.futuro] : [historico.futuro, historico.passado];
      if (origem.length === 0) return;
      destino.push(historico.atual);
      historico.atual = origem.pop();
      docRef.current.body.innerHTML = historico.atual;
      rangeRef.current = null;
      setTemCursor(false);
      setTemBloco(false);
      emitir();
    },
    [registrar, emitir]
  );
  const desfazer = useCallback(() => voltarPara("desfazer"), [voltarPara]);
  const refazer = useCallback(() => voltarPara("refazer"), [voltarPara]);

  const comando = useCallback(
    (nome, valor) => {
      if (pendenteRef.current) registrar();
      restaurarSelecao();
      docRef.current.execCommand(nome, false, valor);
      registrar();
      emitir();
    },
    [restaurarSelecao, registrar, emitir]
  );

  const estrutural = useCallback(
    (acao) => {
      if (pendenteRef.current) registrar();
      focar();
      acao(docRef.current);
      registrar();
      marcarBlocoAtivo();
      emitir();
    },
    [focar, registrar, marcarBlocoAtivo, emitir]
  );

  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    docRef.current = doc;

    const estilo = doc.createElement("style");
    estilo.id = ID_ESTILO_EDITOR;
    estilo.textContent = ESTILO_EDITOR;
    doc.head.appendChild(estilo);

    converterVariaveisEmEtiquetas(doc, variaveis);
    doc.body.setAttribute("contenteditable", "true");
    doc.body.setAttribute("spellcheck", "true");

    const css = [...doc.querySelectorAll("style")].map((s) => s.textContent).join("\n");
    setBlocosDisponiveis(BLOCOS.filter((b) => !b.classe || css.includes(`.${b.classe}`)));

    historicoRef.current = { passado: [], futuro: [], atual: fotoDoBody(doc) };

    doc.addEventListener("input", () => {
      emitir();
      registrarDepois();
    });

    // Desfazer/refazer pelo menu Editar do navegador também usa o histórico próprio
    doc.addEventListener("beforeinput", (e) => {
      if (e.inputType === "historyUndo" || e.inputType === "historyRedo") {
        e.preventDefault();
        voltarPara(e.inputType === "historyUndo" ? "desfazer" : "refazer");
      }
    });

    doc.addEventListener("selectionchange", () => {
      const sel = doc.getSelection();
      if (sel.rangeCount > 0 && doc.body.contains(sel.anchorNode)) {
        rangeRef.current = sel.getRangeAt(0).cloneRange();
        setTemCursor(true);
        marcarBlocoAtivo();
      }
    });

    // Colar sempre como texto puro: formatação de fora (Word, sites) traria
    // fontes e cores que quebram o estilo do termo.
    doc.addEventListener("paste", (e) => {
      e.preventDefault();
      doc.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    });

    doc.addEventListener("keydown", (e) => {
      const atalho = e.metaKey || e.ctrlKey;
      const tecla = e.key.toLowerCase();
      if (atalho && (tecla === "z" || tecla === "y")) {
        e.preventDefault();
        voltarPara(tecla === "z" && !e.shiftKey ? "desfazer" : "refazer");
        return;
      }
      // Enter quebra a linha dentro do mesmo bloco; o navegador duplicaria a
      // caixa (ex.: um segundo .clausula-text dentro da mesma cláusula).
      // Em listas, Enter continua criando um novo item.
      if (e.key === "Enter" && !e.shiftKey) {
        const no = doc.getSelection().anchorNode;
        const el = no?.nodeType === 1 ? no : no?.parentElement;
        if (!el?.closest("li")) {
          e.preventDefault();
          doc.execCommand("insertLineBreak");
        }
      }
    });
  };

  // Insere a etiqueta exatamente no cursor. Não usa execCommand("insertHTML"):
  // com um elemento contenteditable=false, o Chrome quebra o bloco e a
  // etiqueta sai fora da caixa da cláusula.
  const inserirVariavel = (nome) => {
    const variavel = variaveis.find((v) => v.nome === nome);
    if (!variavel || !rangeRef.current) return;
    const range = rangeRef.current.cloneRange();
    estrutural((doc) => {
      range.deleteContents();
      // o espaço invisível depois da etiqueta dá onde pôr o cursor
      const depois = doc.createTextNode(ZERO_WIDTH);
      range.insertNode(depois);
      range.insertNode(criarEtiqueta(doc, variavel.nome, variavel.descricao));
      const cursor = doc.createRange();
      cursor.setStart(depois, 1);
      cursor.collapse(true);
      selecionar(cursor);
    });
  };

  const inserirBloco = (bloco) =>
    estrutural((doc) => {
      const molde = doc.createElement("template");
      molde.innerHTML = bloco.html;
      const novo = molde.content.firstElementChild;
      const el = elementoDoCursor();

      if (bloco.id === "secao") {
        const secao = el?.closest(".clausula-section");
        if (secao) secao.after(novo);
        else (doc.querySelector(".termo-content") || doc.body).appendChild(novo);
      } else {
        const referencia = el?.closest(".clausula-item, .highlight, .warning, .intro-text, .clausula-title, p");
        if (referencia && doc.body.contains(referencia)) referencia.after(novo);
        else
          (
            el?.closest(".clausula-section") ||
            [...doc.querySelectorAll(".clausula-section")].pop() ||
            doc.querySelector(".termo-content") ||
            doc.body
          ).appendChild(novo);
      }

      // Seleciona o texto do bloco novo: é só digitar por cima
      const alvo = novo.querySelector(".clausula-title, .clausula-text") || novo;
      const range = doc.createRange();
      range.selectNodeContents(alvo);
      selecionar(range);
      novo.scrollIntoView({ block: "nearest" });
    });

  const moverBloco = (direcao) =>
    estrutural((doc) => {
      const bloco = blocoDoCursor();
      if (!bloco) return;
      const vizinho = direcao < 0 ? bloco.previousElementSibling : bloco.nextElementSibling;
      // não passa por cima do título da seção / cabeçalho
      if (!vizinho || vizinho.matches(".clausula-title, header, h1, h2")) return;
      if (direcao < 0) vizinho.before(bloco);
      else vizinho.after(bloco);
      const range = doc.createRange();
      range.selectNodeContents(bloco);
      range.collapse(true);
      selecionar(range);
      bloco.scrollIntoView({ block: "nearest" });
    });

  const removerBloco = () =>
    estrutural(() => {
      const bloco = blocoDoCursor();
      if (!bloco) return;
      bloco.remove();
      rangeRef.current = null;
      setTemCursor(false);
    });

  // Botões da barra não podem tirar o foco/seleção do iframe
  const manterSelecao = (e) => e.preventDefault();

  const botao = (icone, titulo, onClick, disabled = false) => (
    <Button
      icon={icone}
      className="p-button-text p-button-sm"
      tooltip={titulo}
      tooltipOptions={{ position: "top" }}
      onMouseDown={manterSelecao}
      onClick={onClick}
      disabled={disabled}
      aria-label={titulo}
    />
  );

  return (
    <div className={styles.editor}>
      <div className={styles.barra}>
        <div className={styles.grupo}>
          {botao(<RiArrowGoBackLine />, "Desfazer (Ctrl+Z)", desfazer)}
          {botao(<RiArrowGoForwardLine />, "Refazer (Ctrl+Shift+Z)", refazer)}
        </div>
        <div className={styles.grupo}>
          {botao(<RiBold />, "Negrito", () => comando("bold"), !temCursor)}
          {botao(<RiItalic />, "Itálico", () => comando("italic"), !temCursor)}
          {botao(<RiUnderline />, "Sublinhado", () => comando("underline"), !temCursor)}
          {botao(<RiListOrdered />, "Lista numerada", () => comando("insertOrderedList"), !temCursor)}
        </div>
        <div className={styles.grupo}>
          <span className={styles.rotulo}>Campo dinâmico:</span>
          {/* botões (e não um dropdown): o dropdown puxa o foco de volta para
              si depois da escolha, e o que se digita em seguida se perde */}
          {variaveis.map((v) => (
            <Button
              key={v.nome}
              label={v.descricao}
              className={`p-button-sm p-button-warning p-button-outlined ${styles.botaoCampo}`}
              tooltip={temCursor ? `Insere [${v.nome}] no cursor` : "Clique no texto onde o campo deve entrar"}
              tooltipOptions={{ position: "top", showOnDisabled: true }}
              onMouseDown={manterSelecao}
              onClick={() => inserirVariavel(v.nome)}
              disabled={!temCursor}
            />
          ))}
        </div>
        <div className={styles.grupo}>
          <span className={styles.rotulo}>Inserir:</span>
          {blocosDisponiveis.map((bloco) => (
            <Button
              key={bloco.id}
              label={bloco.label}
              className="p-button-outlined p-button-sm"
              onMouseDown={manterSelecao}
              onClick={() => inserirBloco(bloco)}
            />
          ))}
        </div>
        <div className={styles.grupo}>
          <span className={styles.rotulo}>Bloco:</span>
          {botao(<RiArrowUpLine />, "Mover para cima", () => moverBloco(-1), !temBloco)}
          {botao(<RiArrowDownLine />, "Mover para baixo", () => moverBloco(1), !temBloco)}
          {botao(<RiDeleteBinLine />, "Remover bloco", removerBloco, !temBloco)}
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="Editor do termo"
        className={styles.iframe}
        srcDoc={srcDoc}
        onLoad={handleLoad}
      />
      <p className={styles.dica}>
        Clique no texto para editar. Enter quebra a linha; para um item novo, use
        &quot;Inserir&quot;. O bloco com contorno tracejado é o que &quot;Bloco&quot; move ou remove.
      </p>
    </div>
  );
};

export default TermoEditorVisual;

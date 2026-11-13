"use client";
import { useRef, useState } from "react";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { RiSaveLine } from "@remixicon/react";
import Button from "@/components/Button";
import { updateLayoutCertificado } from "@/app/api/client/certificadoPlanoDeTrabalho";
import styles from "./EditorTextoCertificado.module.scss";

// Edição do texto do certificado de conclusão + prévia sobre a imagem de fundo.
// Os marcadores são substituídos na emissão (generateCertificatePlano, API).
// Canvas do certificado emitido: 1123 x 794 px (A4 paisagem), fonte 18px.

const LARGURA = 1123;
const ALTURA = 794;

// exemploEn: como o valor sai na versão em inglês (só área/grande área são
// traduzidas; título, nomes, edital e instituição ficam como cadastrados)
const MARCADORES = [
  { chave: "<<[tituloPlano]>>", label: "Título do plano", exemplo: "TÍTULO DO PLANO DE TRABALHO", negrito: true },
  { chave: "<<[alunos]>>", label: "Alunos", exemplo: "NOME DO ALUNO", negrito: true },
  { chave: "<<[orientadores]>>", label: "Orientadores", exemplo: "NOME DO ORIENTADOR", negrito: true },
  { chave: "<<[coorientadores]>>", label: "Coorientadores", exemplo: "NOME DO COORIENTADOR", negrito: true },
  { chave: "<<[edital]>>", label: "Edital", exemplo: "PIBIC" },
  { chave: "<<[anoEdital]>>", label: "Ano do edital", exemplo: "2025" },
  { chave: "<<[instituicao]>>", label: "Instituição", exemplo: "Universidade" },
  { chave: "<<[area]>>", label: "Área", exemplo: "Ciência da Computação", exemploEn: "Computer Science" },
  {
    chave: "<<[grandeArea]>>",
    label: "Grande área",
    exemplo: "Ciências Exatas e da Terra",
    exemploEn: "Exact and Earth Sciences",
  },
];

const AUTENTICIDADE = {
  pt: "A autenticidade deste certificado pode ser verificada informando o código XXXXXX no endereço www.plic.app.br/autenticacao.",
  en: "The authenticity of this certificate can be verified with the code XXXXXX at www.plic.app.br/autenticacao.",
};

const REGEX_MARCADORES = new RegExp(
  `(${MARCADORES.map((m) => m.chave.replace(/[[\]]/g, "\\$&")).join("|")})`,
  "g"
);

// Texto com os marcadores trocados por valores de exemplo (React escapa o resto)
const TextoPrevia = ({ texto, idioma }) =>
  texto.split(REGEX_MARCADORES).map((parte, i) => {
    const marcador = MARCADORES.find((m) => m.chave === parte);
    if (!marcador) return parte;
    const exemplo = (idioma === "en" && marcador.exemploEn) || marcador.exemplo;
    return marcador.negrito ? <strong key={i}>{exemplo}</strong> : <span key={i}>{exemplo}</span>;
  });

// idioma "en" edita a versão em inglês (textoIngles + posição própria, que
// por padrão é a mesma do português).
const EditorTextoCertificado = ({ tenant, layout, onSalvo, idioma = "pt" }) => {
  const ingles = idioma === "en";
  const textoSalvo = (ingles ? layout.textoIngles : layout.texto) || "";
  const xSalvo = ingles ? layout.posicaoTextoXIngles ?? layout.posicaoTextoX : layout.posicaoTextoX;
  const ySalvo = ingles ? layout.posicaoTextoYIngles ?? layout.posicaoTextoY : layout.posicaoTextoY;
  const imagem = ingles ? layout.imagemFundoIngles : layout.imagemFundo;

  const [texto, setTexto] = useState(textoSalvo);
  const [posicaoX, setPosicaoX] = useState(xSalvo ?? 50);
  const [posicaoY, setPosicaoY] = useState(ySalvo ?? 360);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const textareaRef = useRef(null);

  const alterado = texto !== textoSalvo || posicaoX !== xSalvo || posicaoY !== ySalvo;
  // Em inglês, texto vazio é permitido (apaga a versão em inglês)
  const textoValido = ingles ? texto.trim().length === 0 || texto.trim().length >= 10 : texto.trim().length >= 10;

  // Insere o marcador onde está o cursor (ou no fim, se o campo não tem foco)
  const inserirMarcador = (chave) => {
    const el = textareaRef.current;
    const inicio = el?.selectionStart ?? texto.length;
    const fim = el?.selectionEnd ?? texto.length;
    setTexto(texto.slice(0, inicio) + chave + texto.slice(fim));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(inicio + chave.length, inicio + chave.length);
    });
  };

  const handleSalvar = async () => {
    setSalvando(true);
    setMensagem(null);
    try {
      // A rota exige o texto/posição do português; na aba Inglês reenvia os
      // valores já salvos do português junto com os da versão em inglês
      const dados = ingles
        ? {
            texto: layout.texto || "",
            posicaoTextoX: layout.posicaoTextoX ?? 0,
            posicaoTextoY: layout.posicaoTextoY ?? 0,
            textoIngles: texto.trim() ? texto : null,
            posicaoTextoXIngles: posicaoX ?? 0,
            posicaoTextoYIngles: posicaoY ?? 0,
          }
        : { texto, posicaoTextoX: posicaoX ?? 0, posicaoTextoY: posicaoY ?? 0 };
      const atualizado = await updateLayoutCertificado(tenant, layout.id, dados);
      onSalvo?.(atualizado);
      setMensagem({ tipo: "sucesso", texto: ingles ? "Texto em inglês salvo." : "Texto salvo." });
    } catch (error) {
      setMensagem({ tipo: "erro", texto: error?.response?.data?.message || "Erro ao salvar o texto." });
    } finally {
      setSalvando(false);
    }
  };

  const x = posicaoX ?? 0;
  const y = posicaoY ?? 0;

  return (
    <div className={styles.editor}>
      <label className={styles.label} htmlFor={`textoCertificado-${idioma}`}>
        {ingles ? "Texto do certificado em inglês" : "Texto do certificado"}
      </label>
      <InputTextarea
        id={`textoCertificado-${idioma}`}
        ref={textareaRef}
        className={styles.textarea}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={5}
        autoResize
        maxLength={3000}
        placeholder={
          ingles
            ? "Ex.: We certify that <<[alunos]>> completed the research project <<[tituloPlano]>>, under the supervision of <<[orientadores]>>..."
            : undefined
        }
      />

      <p className={`${styles.ajuda} mt-1`}>Clique para inserir um campo no texto, na posição do cursor:</p>
      <div className={styles.marcadores}>
        {MARCADORES.map((m) => (
          <button key={m.chave} type="button" className={styles.marcador} onClick={() => inserirMarcador(m.chave)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className={`${styles.posicoes} mt-2`}>
        <div>
          <label className={styles.label} htmlFor={`posicaoX-${idioma}`}>
            Margem lateral (px)
          </label>
          <InputNumber
            inputId={`posicaoX-${idioma}`}
            value={posicaoX}
            onValueChange={(e) => setPosicaoX(e.value)}
            min={0}
            max={500}
            showButtons
            step={10}
          />
        </div>
        <div>
          <label className={styles.label} htmlFor={`posicaoY-${idioma}`}>
            Distância do topo (px)
          </label>
          <InputNumber
            inputId={`posicaoY-${idioma}`}
            value={posicaoY}
            onValueChange={(e) => setPosicaoY(e.value)}
            min={0}
            max={760}
            showButtons
            step={10}
          />
        </div>
      </div>

      <p className={`${styles.label} mt-2`}>Prévia (com dados de exemplo)</p>
      <div
        className={styles.previa}
        style={imagem ? { backgroundImage: `url("${imagem}")` } : undefined}
      >
        <div
          className={styles.previaTexto}
          style={{
            left: `${(x / LARGURA) * 100}%`,
            top: `${(y / ALTURA) * 100}%`,
            width: `${Math.max(0, ((LARGURA - 2 * x) / LARGURA) * 100)}%`,
          }}
        >
          <div className={styles.previaCorpo}>
            <TextoPrevia texto={texto} idioma={idioma} />
          </div>
          <div className={styles.previaAutenticidade}>{AUTENTICIDADE[idioma]}</div>
        </div>
      </div>

      <div className={`${styles.acoes} mt-2`}>
        <Button
          onClick={handleSalvar}
          icon={RiSaveLine}
          className="btn-primary"
          type="button"
          loading={salvando}
          disabled={!alterado || !textoValido}
        >
          {ingles ? "Salvar texto em inglês" : "Salvar texto"}
        </Button>
        {mensagem && (
          <p className={mensagem.tipo === "erro" ? styles.erro : styles.sucesso}>{mensagem.texto}</p>
        )}
      </div>
    </div>
  );
};

export default EditorTextoCertificado;

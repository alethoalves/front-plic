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

const MARCADORES = [
  { chave: "<<[tituloPlano]>>", label: "Título do plano", exemplo: "TÍTULO DO PLANO DE TRABALHO", negrito: true },
  { chave: "<<[alunos]>>", label: "Alunos", exemplo: "NOME DO ALUNO", negrito: true },
  { chave: "<<[orientadores]>>", label: "Orientadores", exemplo: "NOME DO ORIENTADOR", negrito: true },
  { chave: "<<[coorientadores]>>", label: "Coorientadores", exemplo: "NOME DO COORIENTADOR", negrito: true },
  { chave: "<<[edital]>>", label: "Edital", exemplo: "PIBIC" },
  { chave: "<<[anoEdital]>>", label: "Ano do edital", exemplo: "2025" },
  { chave: "<<[instituicao]>>", label: "Instituição", exemplo: "Universidade" },
  { chave: "<<[area]>>", label: "Área", exemplo: "Ciência da Computação" },
  { chave: "<<[grandeArea]>>", label: "Grande área", exemplo: "Ciências Exatas e da Terra" },
];

const REGEX_MARCADORES = new RegExp(
  `(${MARCADORES.map((m) => m.chave.replace(/[[\]]/g, "\\$&")).join("|")})`,
  "g"
);

// Texto com os marcadores trocados por valores de exemplo (React escapa o resto)
const TextoPrevia = ({ texto }) =>
  texto.split(REGEX_MARCADORES).map((parte, i) => {
    const marcador = MARCADORES.find((m) => m.chave === parte);
    if (!marcador) return parte;
    return marcador.negrito ? <strong key={i}>{marcador.exemplo}</strong> : <span key={i}>{marcador.exemplo}</span>;
  });

const EditorTextoCertificado = ({ tenant, layout, onSalvo }) => {
  const [texto, setTexto] = useState(layout.texto || "");
  const [posicaoX, setPosicaoX] = useState(layout.posicaoTextoX ?? 50);
  const [posicaoY, setPosicaoY] = useState(layout.posicaoTextoY ?? 360);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const textareaRef = useRef(null);

  const alterado =
    texto !== (layout.texto || "") || posicaoX !== layout.posicaoTextoX || posicaoY !== layout.posicaoTextoY;

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
      const atualizado = await updateLayoutCertificado(tenant, layout.id, {
        texto,
        posicaoTextoX: posicaoX ?? 0,
        posicaoTextoY: posicaoY ?? 0,
      });
      onSalvo?.(atualizado);
      setMensagem({ tipo: "sucesso", texto: "Texto salvo." });
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
      <label className={styles.label} htmlFor="textoCertificado">
        Texto do certificado
      </label>
      <InputTextarea
        id="textoCertificado"
        ref={textareaRef}
        className={styles.textarea}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={5}
        autoResize
        maxLength={3000}
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
          <label className={styles.label} htmlFor="posicaoX">
            Margem lateral (px)
          </label>
          <InputNumber
            inputId="posicaoX"
            value={posicaoX}
            onValueChange={(e) => setPosicaoX(e.value)}
            min={0}
            max={500}
            showButtons
            step={10}
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="posicaoY">
            Distância do topo (px)
          </label>
          <InputNumber
            inputId="posicaoY"
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
        style={layout.imagemFundo ? { backgroundImage: `url("${layout.imagemFundo}")` } : undefined}
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
            <TextoPrevia texto={texto} />
          </div>
          <div className={styles.previaAutenticidade}>
            A autenticidade deste certificado pode ser verificada informando o código XXXXXX no endereço
            www.plic.app.br/autenticacao.
          </div>
        </div>
      </div>

      <div className={`${styles.acoes} mt-2`}>
        <Button
          onClick={handleSalvar}
          icon={RiSaveLine}
          className="btn-primary"
          type="button"
          loading={salvando}
          disabled={!alterado || texto.trim().length < 10}
        >
          Salvar texto
        </Button>
        {mensagem && (
          <p className={mensagem.tipo === "erro" ? styles.erro : styles.sucesso}>{mensagem.texto}</p>
        )}
      </div>
    </div>
  );
};

export default EditorTextoCertificado;

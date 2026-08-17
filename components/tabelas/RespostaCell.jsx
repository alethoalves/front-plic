"use client";
import { useState } from "react";
import { RiFilePdfLine, RiExternalLinkLine } from "@remixicon/react";
import { Dialog } from "primereact/dialog";
import BlockNoteContent from "@/components/BlockNoteContent";
import styles from "./RespostaCell.module.scss";

// Mesmo switch por campo.tipo já usado em VerProjeto.jsx (FieldValue). As
// colunas têm largura máxima fixa (ver TabelaRespostasAtividade.jsx); textos
// curtos quebram linha livremente, mas textLong/blockNote mostram só um
// preview de poucas linhas (não faz sentido renderizar uma resposta inteira
// dentro de uma célula de tabela) com um Dialog pra ver o conteúdo completo.
const RespostaCell = ({ campo, value }) => {
  const [expandido, setExpandido] = useState(false);

  if (value === undefined || value === null || value === "") {
    return <span className={styles.vazio}>–</span>;
  }

  const { tipo } = campo;

  if (tipo === "blockNote") {
    return (
      <>
        <div
          className={styles.clampBlockNote}
          onClick={() => setExpandido(true)}
        >
          <BlockNoteContent value={value} />
        </div>
        <span className={styles.verMais} onClick={() => setExpandido(true)}>
          Ver conteúdo completo
        </span>
        <Dialog
          header={campo.label}
          visible={expandido}
          style={{ width: "50vw" }}
          onHide={() => setExpandido(false)}
        >
          <BlockNoteContent value={value} />
        </Dialog>
      </>
    );
  }

  if (tipo === "textLong") {
    return (
      <>
        <p className={styles.clampText} onClick={() => setExpandido(true)}>
          {value}
        </p>
        <span className={styles.verMais} onClick={() => setExpandido(true)}>
          Ver mais
        </span>
        <Dialog
          header={campo.label}
          visible={expandido}
          style={{ width: "50vw" }}
          onHide={() => setExpandido(false)}
        >
          <p style={{ whiteSpace: "pre-wrap" }}>{value}</p>
        </Dialog>
      </>
    );
  }

  if (tipo === "arquivo") {
    const parts = value.split("/");
    const lastName = parts[parts.length - 1];
    const fileName = lastName.split("_").slice(1).join("_") || lastName;
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.fileLink}
        title={fileName}
      >
        <RiFilePdfLine size={14} />
        <span>Ver</span>
      </a>
    );
  }

  if (tipo === "link") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.fileLink}
        title={value}
      >
        <RiExternalLinkLine size={14} />
        <span>{value}</span>
      </a>
    );
  }

  if (tipo === "checkbox" || tipo === "multiselect") {
    let values = [];
    try {
      const parsed = JSON.parse(value);
      values = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      values = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return (
      <div className={styles.tagList}>
        {values.map((v, i) => (
          <span key={i} className={styles.tag}>
            {v}
          </span>
        ))}
      </div>
    );
  }

  if (tipo === "flag") {
    return <p>{value === "true" ? "Sim" : "Não"}</p>;
  }

  // text, number, date, select
  return <p className={styles.texto}>{value}</p>;
};

export default RespostaCell;

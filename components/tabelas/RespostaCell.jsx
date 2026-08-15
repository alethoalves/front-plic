"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { RiFilePdfLine, RiExternalLinkLine } from "@remixicon/react";
import { Dialog } from "primereact/dialog";
import styles from "./RespostaCell.module.scss";

const BlockNoteField = dynamic(
  () => import("@/components/Formularios/BlockNoteField"),
  { ssr: false }
);

const MAX_CHARS = 120;

// Mesmo switch por campo.tipo já usado em VerProjeto.jsx (FieldValue), com
// truncamento/"ver mais" adicional porque aqui o valor vive dentro de uma
// célula de tabela, não de uma página inteira.
const RespostaCell = ({ campo, value }) => {
  const [expandido, setExpandido] = useState(false);

  if (value === undefined || value === null || value === "") {
    return <span className={styles.vazio}>–</span>;
  }

  const { tipo } = campo;

  if (tipo === "blockNote") {
    return (
      <>
        <span className={styles.verMais} onClick={() => setExpandido(true)}>
          Ver conteúdo
        </span>
        <Dialog
          header={campo.label}
          visible={expandido}
          style={{ width: "50vw" }}
          onHide={() => setExpandido(false)}
        >
          <BlockNoteField value={value} readOnly={true} label={null} />
        </Dialog>
      </>
    );
  }

  if (tipo === "textLong" && value.length > MAX_CHARS) {
    return (
      <>
        <p className={styles.truncado} title={value}>
          {value.slice(0, MAX_CHARS)}…
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
        <span>{fileName}</span>
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
  return (
    <p className={styles.truncado} title={value}>
      {value}
    </p>
  );
};

export default RespostaCell;

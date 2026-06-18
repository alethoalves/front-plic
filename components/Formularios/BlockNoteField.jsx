"use client";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";

export const extractBlockNoteText = (value) => {
  if (!value) return "";
  try {
    const blocks = typeof value === "string" ? JSON.parse(value) : value;
    const extract = (arr) =>
      arr
        .flatMap((b) => {
          const content = Array.isArray(b.content)
            ? b.content.filter((c) => c.type === "text").map((c) => c.text).join("")
            : "";
          const children = b.children ? extract(b.children) : "";
          return [content, children].filter(Boolean);
        })
        .join("\n");
    return extract(blocks);
  } catch {
    return "";
  }
};

const BlockNoteField = ({
  value,
  onChange,
  maxChar,
  label,
  descricao,
  disabled = false,
  readOnly = false,
  error,
}) => {
  const initialContent = useMemo(() => {
    if (!value) return undefined;
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : undefined;
    } catch {
      return undefined;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = useCreateBlockNote({ initialContent });
  const initializedRef = useRef(false);

  const [charCount, setCharCount] = useState(() =>
    extractBlockNoteText(value).length
  );

  // Quando o formulário faz reset() com dados reais após o editor já ter montado
  // vazio (race condition com carregamento assíncrono do formulário), preenche o
  // editor na primeira vez que value chega com conteúdo e o editor ainda está vazio.
  useEffect(() => {
    if (initializedRef.current) return;
    if (!value) return;
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const currentDoc = editor.document;
      const editorIsEmpty =
        currentDoc.length === 1 &&
        (!currentDoc[0].content || currentDoc[0].content.length === 0);
      if (!editorIsEmpty) return;
      initializedRef.current = true;
      editor.replaceBlocks(editor.document, parsed);
      setCharCount(extractBlockNoteText(JSON.stringify(parsed)).length);
    } catch {
      // valor inválido, ignora
    }
  }, [value, editor]);

  const handleChange = useCallback(() => {
    const blocks = editor.document;
    const serialized = JSON.stringify(blocks);
    const text = extractBlockNoteText(serialized);
    setCharCount(text.length);
    if (onChange) onChange(serialized);
  }, [editor, onChange]);

  // BlockNote não preserva parágrafos ao colar texto com \n (nem texto puro
  // nem HTML do Word/Google Docs). Interceptamos e usamos insertBlocks para
  // criar blocos irmãos — evita o aninhamento que insertContent causa.
  const handlePasteCapture = useCallback(
    (e) => {
      const text = e.clipboardData?.getData("text/plain");
      if (!text || !text.includes("\n")) return;

      e.preventDefault();
      e.stopPropagation();

      const cursorBlock = editor.getTextCursorPosition().block;

      const newBlocks = text.split("\n").map((line) => ({
        type: "paragraph",
        content: line ? [{ type: "text", text: line }] : [],
      }));

      editor.insertBlocks(newBlocks, cursorBlock, "after");
    },
    [editor]
  );

  const isReadOnly = disabled || readOnly;
  const overLimit = maxChar && charCount > maxChar;

  return (
    <div style={{ marginBottom: "1rem" }}>
      {label && (
        <p className="p5" style={{ marginBottom: "0.35rem", fontWeight: 500 }}>
          {label}
        </p>
      )}
      {descricao && (
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
          {descricao}
        </p>
      )}
      <div
        onPasteCapture={isReadOnly ? undefined : handlePasteCapture}
        style={{
          border: error
            ? "1.5px solid #ef4444"
            : overLimit
            ? "1.5px solid #f59e0b"
            : "1px solid #e2e8f0",
          borderRadius: "8px",
          overflow: "hidden",
          background: isReadOnly ? "#f8fafc" : "#fff",
          minHeight: "120px",
        }}
      >
        <BlockNoteView
          editor={editor}
          editable={!isReadOnly}
          onChange={handleChange}
          theme="light"
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.25rem",
        }}
      >
        {error ? (
          <p style={{ fontSize: "0.75rem", color: "#ef4444" }}>{error}</p>
        ) : (
          <span />
        )}
        {maxChar && (
          <p
            style={{
              fontSize: "0.75rem",
              color: overLimit ? "#ef4444" : "#94a3b8",
              textAlign: "right",
            }}
          >
            {charCount}/{maxChar} caracteres
          </p>
        )}
      </div>
    </div>
  );
};

export default BlockNoteField;

"use client";
import { useState, useEffect } from "react";
import styles from "./EditalDocumentosViewer.module.scss";
import {
  RiFilePdf2Line,
  RiArrowRightSLine,
  RiFileTextLine,
} from "@remixicon/react";
import { Card } from "primereact/card";
import { getEditalDocumentos } from "@/app/api/client/editalDocumentos";

const EditalDocumentosViewer = ({ tenant, editalId, tipo = "INSCRICAO" }) => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!editalId) return;
    const fetch = async () => {
      try {
        const data = await getEditalDocumentos(tenant, editalId, tipo);
        setDocumentos(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tenant, editalId, tipo]);

  if (loading || documentos.length === 0) return null;

  return (
    <Card className={styles.wrapper}>
      <div className={styles.header}>
        <h4>Materiais do edital</h4>
        <p>Leia atentamente os documentos abaixo antes de realizar sua inscrição.</p>
      </div>

      <div className={styles.list}>
        {documentos.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>
    </Card>
  );
};

const DocumentCard = ({ doc }) => {
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const isPdf = doc.url.toLowerCase().includes(".pdf") || doc.nomeArquivo?.toLowerCase().endsWith(".pdf");

  return (
    <a href={doc.url} target="_blank" rel="noreferrer" className={styles.card}>
      {/* Thumbnail lateral */}
      <div className={styles.thumbnail}>
        {isPdf ? (
          <>
            <iframe
              src={`${doc.url}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              className={`${styles.pdfFrame} ${previewLoaded ? styles.visible : ""}`}
              onLoad={() => setPreviewLoaded(true)}
              title={doc.titulo}
              tabIndex={-1}
            />
            {!previewLoaded && (
              <div className={styles.placeholder}>
                <RiFilePdf2Line />
              </div>
            )}
          </>
        ) : (
          <div className={styles.placeholder}>
            <RiFileTextLine />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className={styles.content}>
        <span className={styles.chip}>
          <RiFilePdf2Line />
          PDF
        </span>
        <h5 className={styles.title}>{doc.titulo}</h5>
        {doc.descricao && <p className={styles.desc}>{doc.descricao}</p>}
      </div>

      {/* Ícone de ação */}
      <div className={styles.arrow}>
        <RiArrowRightSLine />
      </div>
    </a>
  );
};

export default EditalDocumentosViewer;

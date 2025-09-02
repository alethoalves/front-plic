"use client";

import {
  RiTimeLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiFileTextLine,
  RiCloseLine,
  RiCalendarLine,
  RiInformationLine,
  RiExternalLinkLine,
} from "@remixicon/react";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import styles from "./DocumentoDialog.module.scss";
import { useState, useEffect } from "react";
import { getDocumentById } from "@/app/api/client/documentos";
import { renderizarTextoComLinks } from "@/lib/renderizaTextoComLink";

const DocumentoDialog = ({
  visible,
  onHide,
  tenant,
  documentoId,
  documentoData,
}) => {
  const [loading, setLoading] = useState(true);
  const [documento, setDocumento] = useState(documentoData || null);
  const [error, setError] = useState(null);

  const formatarData = (dataString) => {
    if (!dataString) return "Não definido";

    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const traduzirStatus = (status) => {
    switch (status) {
      case "AGUARDANDO_VALIDACAO":
        return "Aguardando Validação";
      case "ACEITO":
        return "Aceito";
      case "RECUSADO":
        return "Recusado";
      case "PENDENTE":
        return "Pendente";
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "AGUARDANDO_VALIDACAO":
        return <RiTimeLine className={styles.statusIcon} />;
      case "ACEITO":
        return <RiCheckboxCircleLine className={styles.statusIcon} />;
      case "RECUSADO":
        return <RiAlertLine className={styles.statusIcon} />;
      case "PENDENTE":
        return <RiAlertLine className={styles.statusIcon} />;
      default:
        return <RiFileTextLine className={styles.statusIcon} />;
    }
  };

  const renderizarDadosFormulario = (dados) => {
    if (!dados)
      return <Message severity="info" text="Nenhum dado preenchido." />;

    return (
      <Card className={styles.dadosCard}>
        <div className={styles.dadosHeader}>
          <RiCheckboxCircleLine size={20} />
          <h3>Dados Preenchidos</h3>
        </div>
        <Divider />
        <div className={styles.dadosContent}>
          {Object.entries(dados).map(([campo, valor], index) => (
            <div key={index} className={styles.dadoItem}>
              <strong>{campo}:</strong>
              <span>
                {typeof valor === "boolean" ? (
                  valor ? (
                    "Sim"
                  ) : (
                    "Não"
                  )
                ) : valor && valor.toString().startsWith("http") ? (
                  <a
                    href={valor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkArquivo}
                  >
                    Ver arquivo <RiExternalLinkLine size={14} />
                  </a>
                ) : (
                  valor
                )}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderizarConteudoDocumento = () => {
    if (!documento?.conteudo) {
      return <Message severity="info" text="Nenhum conteúdo preenchido" />;
    }

    if (documento.documentoTemplate?.tipoDocumento === "FORMULARIO") {
      try {
        const formData = JSON.parse(documento.conteudo);
        return renderizarDadosFormulario(formData);
      } catch (e) {
        return (
          <div
            className={styles.documentoContent}
            dangerouslySetInnerHTML={{ __html: documento.conteudo }}
          />
        );
      }
    }

    return (
      <div
        className={styles.documentoContent}
        dangerouslySetInnerHTML={{ __html: documento.conteudo }}
      />
    );
  };

  const fetchDocumento = async () => {
    if (documentoData) {
      setDocumento(documentoData);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const documentoEncontrado = await getDocumentById(tenant, documentoId);

      if (documentoEncontrado) {
        setDocumento(documentoEncontrado);
      } else {
        setError("Documento não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar documento:", error);
      setError("Erro ao carregar documento");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && documentoId) {
      fetchDocumento();
    }
  }, [visible, documentoId, tenant]);

  const headerTemplate = (
    <div className={styles.dialogHeader}>
      <div className={styles.headerContent}>
        {documento && (
          <div className={styles.statusIndicator}>
            {getStatusIcon(documento.status)}
          </div>
        )}
        <div className={styles.headerText}>
          <h2>{documento?.documentoTemplate?.titulo || "Documento"}</h2>
          {documento && (
            <p className={styles.documentoId}>ID: {documento.id}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={headerTemplate}
      className={styles.documentoDialog}
      style={{ width: "90vw", maxWidth: "1200px" }}
      maximizable
      breakpoints={{ "960px": "75vw", "641px": "90vw", "320px": "95vw" }}
    >
      {loading ? (
        <div className={styles.loadingContainer}>
          <ProgressSpinner />
          <p>Carregando documento...</p>
        </div>
      ) : error ? (
        <Message severity="error" text={error} />
      ) : documento ? (
        <div className={styles.dialogContent}>
          {/* Informações básicas do documento */}
          <div className={styles.documentoInfo}>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <RiInformationLine />
                </div>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Status</span>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[`status-${documento.status.toLowerCase()}`]
                    }`}
                  >
                    {traduzirStatus(documento.status)}
                  </span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <RiCalendarLine />
                </div>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Criado em</span>
                  <span className={styles.infoValue}>
                    {formatarData(documento.createdAt)}
                  </span>
                </div>
              </div>

              {documento.updatedAt !== documento.createdAt && (
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <RiTimeLine />
                  </div>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>Atualizado em</span>
                    <span className={styles.infoValue}>
                      {formatarData(documento.updatedAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {documento.observacao && (
              <div className={styles.observacao}>
                <span className={styles.observacaoLabel}>Observações:</span>
                <p className={styles.observacaoText}>{documento.observacao}</p>
              </div>
            )}
          </div>

          <Divider className={styles.customDivider} />

          {/* Conteúdo do documento */}
          <div className={styles.conteudoSection}>
            <h4 className={styles.sectionTitle}>
              <RiFileTextLine className={styles.sectionIcon} />
              Conteúdo
            </h4>
            {renderizarConteudoDocumento()}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};

export default DocumentoDialog;

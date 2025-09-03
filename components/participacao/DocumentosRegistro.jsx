"use client";

import { useState } from "react";
import {
  RiFileTextLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiEyeLine,
  RiDeleteBinLine,
} from "@remixicon/react";
import styles from "./DocumentosRegistro.module.scss";
import { validarDocumento } from "@/app/api/client/documentos";
import DocumentoDialog from "./DocumentoDialog";

const DocumentosRegistro = ({
  documentos: initialDocumentos,
  tenant,
  userTenant,
}) => {
  const [expandedDocs, setExpandedDocs] = useState({});
  const [documentos, setDocumentos] = useState(initialDocumentos);
  const [loading, setLoading] = useState({});
  const [observacao, setObservacao] = useState({});
  const [documentoDialog, setDocumentoDialog] = useState({
    visible: false,
    documentoId: null,
    documentoData: null,
  });

  const toggleDocument = (docId) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  // Função para formatar data
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

  // Função para obter ícone baseado no status
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

  // Função para traduzir status
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

  // Função para validar documento
  const handleValidar = async (docId) => {
    setLoading((prev) => ({ ...prev, [docId]: true }));

    try {
      const payload = {
        documentoRegistroId: docId,
        acao: "ACEITO",
        observacao: observacao[docId] || null,
      };

      const response = await validarDocumento(tenant, payload);

      // Atualiza o documento localmente sem precisar fazer nova requisição
      setDocumentos((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "ACEITO",
                observacao: observacao[docId] || null,
                updatedAt: new Date().toISOString(),
              }
            : doc
        )
      );

      // Limpa a observação
      setObservacao((prev) => ({ ...prev, [docId]: "" }));
    } catch (error) {
      console.error("Erro ao validar documento:", error);
      alert(
        "Erro ao validar documento: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading((prev) => ({ ...prev, [docId]: false }));
    }
  };

  // Função para recusar documento
  const handleRecusar = async (docId) => {
    if (!observacao[docId] || observacao[docId].trim() === "") {
      alert("Por favor, informe uma observação para recusar o documento.");
      return;
    }

    setLoading((prev) => ({ ...prev, [docId]: true }));

    try {
      const payload = {
        documentoRegistroId: docId,
        acao: "RECUSADO",
        observacao: observacao[docId],
      };

      const response = await validarDocumento(tenant, payload);

      // Atualiza o documento localmente
      setDocumentos((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "RECUSADO",
                observacao: observacao[docId],
                updatedAt: new Date().toISOString(),
              }
            : doc
        )
      );

      // Limpa a observação
      setObservacao((prev) => ({ ...prev, [docId]: "" }));
    } catch (error) {
      console.error("Erro ao recusar documento:", error);
      alert(
        "Erro ao recusar documento: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading((prev) => ({ ...prev, [docId]: false }));
    }
  };

  // Função para abrir o dialog
  const handleVerDocumento = (docId, docData = null) => {
    setDocumentoDialog({
      visible: true,
      documentoId: docId,
      documentoData: docData,
    });
  };

  // Função para fechar o dialog
  const handleCloseDialog = () => {
    setDocumentoDialog({
      visible: false,
      documentoId: null,
      documentoData: null,
    });
  };

  const handleExcluirDocumento = (docId) => {
    console.log("Excluir documento:", docId);
    // Implementar lógica de exclusão aqui
  };

  // Função para atualizar observação
  const handleObservacaoChange = (docId, value) => {
    setObservacao((prev) => ({
      ...prev,
      [docId]: value,
    }));
  };

  // Função para renderizar o conteúdo do documento
  const renderConteudoDocumento = (documento) => {
    if (!documento.conteudo) {
      return <p className={styles.emptyContent}>Nenhum conteúdo preenchido</p>;
    }

    // Se for um formulário (JSON)
    if (documento.documentoTemplate.tipoDocumento === "FORMULARIO") {
      try {
        const formData = JSON.parse(documento.conteudo);
        return (
          <div className={styles.formContent}>
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className={styles.formField}>
                <strong>{key}:</strong>{" "}
                {typeof value === "boolean" ? (
                  value ? (
                    "Sim"
                  ) : (
                    "Não"
                  )
                ) : typeof value === "string" && value.startsWith("http") ? (
                  <a href={value} target="_blank" rel="noopener noreferrer">
                    Ver arquivo
                  </a>
                ) : (
                  value
                )}
              </div>
            ))}
          </div>
        );
      } catch (e) {
        // Se não for JSON válido, trata como HTML
        return <div dangerouslySetInnerHTML={{ __html: documento.conteudo }} />;
      }
    }

    // Se for HTML (TERMO)
    return <div dangerouslySetInnerHTML={{ __html: documento.conteudo }} />;
  };

  if (!documentos || documentos.length === 0) {
    return (
      <div className={styles.documentosSection}>
        <h6 className={styles.sectionTitle}>
          <RiFileTextLine className={styles.sectionIcon} />
          Documentos
        </h6>
        <div className={styles.emptyState}>
          <RiFileTextLine size={48} className={styles.emptyIcon} />
          <p>Nenhum documento encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.documentosSection}>
      <h6 className={styles.sectionTitle}>
        <RiFileTextLine className={styles.sectionIcon} />
        Documentos ({documentos.length})
      </h6>

      <div className={styles.documentosList}>
        {documentos.map((doc) => (
          <div key={doc.id} className={styles.documentoItem}>
            <div
              className={styles.documentoHeader}
              onClick={() => toggleDocument(doc.id)}
            >
              <div className={styles.documentoInfo}>
                <h6 className={styles.documentoTitulo}>
                  {getStatusIcon(doc.status)}
                  {doc.documentoTemplate.titulo}
                  <span className={styles.documentoId}>ID: {doc.id}</span>
                </h6>
                <div className={styles.documentoMeta}>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[`status-${doc.status.toLowerCase()}`]
                    }`}
                  >
                    {traduzirStatus(doc.status)}
                  </span>
                  <span>Criado em: {formatarData(doc.createdAt)}</span>
                  {doc.updatedAt !== doc.createdAt && (
                    <span>Atualizado em: {formatarData(doc.updatedAt)}</span>
                  )}
                </div>
              </div>
              <div className={styles.documentoArrow}>
                {expandedDocs[doc.id] ? "▲" : "▼"}
              </div>
            </div>

            {expandedDocs[doc.id] && (
              <div className={styles.documentoContent}>
                {/* Sempre mostra ID e Tipo */}
                <div className={styles.documentoInfoBasica}>
                  <p>
                    <strong>ID do Documento:</strong> {doc.id}
                  </p>
                  <p>
                    <strong>Tipo:</strong> {doc.documentoTemplate.tipoDocumento}
                  </p>
                  {doc.documentoTemplate.exigirDadosBancarios && (
                    <>
                      <p>
                        <strong>Banco:</strong> {userTenant?.banco}
                      </p>
                      <p>
                        <strong>Agência:</strong> {userTenant?.agencia}
                      </p>
                      <p>
                        <strong>Conta:</strong> {userTenant?.conta}
                      </p>
                    </>
                  )}
                  {doc.observacao && (
                    <p>
                      <strong>Observações:</strong> {doc.observacao}
                    </p>
                  )}
                </div>

                {/* Ações específicas por status */}
                {doc.status === "AGUARDANDO_VALIDACAO" && (
                  <>
                    {renderConteudoDocumento(doc)}

                    {/* Campo de observação */}
                    <div className={styles.observacaoContainer}>
                      <label htmlFor={`observacao-${doc.id}`}>
                        Observação (obrigatória para recusa):
                      </label>
                      <textarea
                        id={`observacao-${doc.id}`}
                        value={observacao[doc.id] || ""}
                        onChange={(e) =>
                          handleObservacaoChange(doc.id, e.target.value)
                        }
                        placeholder="Digite uma observação (obrigatória para recusa)"
                        rows={3}
                        className={styles.observacaoInput}
                      />
                    </div>

                    <div className={styles.acoesContainer}>
                      <button
                        className={styles.botaoValidar}
                        onClick={() => handleValidar(doc.id)}
                        disabled={loading[doc.id]}
                      >
                        {loading[doc.id] ? "Processando..." : "Validar"}
                      </button>
                      <button
                        className={styles.botaoRecusar}
                        onClick={() => handleRecusar(doc.id)}
                        disabled={
                          loading[doc.id] || !observacao[doc.id]?.trim()
                        }
                      >
                        {loading[doc.id] ? "Processando..." : "Recusar"}
                      </button>
                    </div>
                  </>
                )}

                {doc.status === "PENDENTE" && (
                  <div className={styles.acaoUnicaContainer}>
                    <button
                      className={styles.botaoExcluir}
                      onClick={() => handleExcluirDocumento(doc.id)}
                    >
                      <RiDeleteBinLine className={styles.acaoIcon} />
                      Excluir Documento
                    </button>
                  </div>
                )}

                {(doc.status === "ACEITO" || doc.status === "RECUSADO") && (
                  <div className={styles.acaoUnicaContainer}>
                    <button
                      className={styles.botaoVer}
                      onClick={() => handleVerDocumento(doc.id, doc)} // Passe os dados do documento
                    >
                      <RiEyeLine className={styles.acaoIcon} />
                      Ver Documento
                    </button>
                    {doc.observacao && (
                      <div className={styles.observacaoExibicao}>
                        <strong>Observações:</strong> {doc.observacao}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <DocumentoDialog
        visible={documentoDialog.visible}
        onHide={handleCloseDialog}
        tenant={tenant}
        documentoId={documentoDialog.documentoId}
        documentoData={documentoDialog.documentoData}
        userTenant={userTenant}
      />
    </div>
  );
};

export default DocumentosRegistro;

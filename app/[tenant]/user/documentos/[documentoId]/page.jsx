"use client";
import {
  RiTimeLine,
  RiCheckboxCircleLine,
  RiPenNibLine,
  RiArrowLeftLine,
  RiFileTextLine,
  RiAlertLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getMyDocuments, assinarDocumento } from "@/app/api/client/documentos";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toast } from "primereact/toast";
import { useRef } from "react";

const DocumentoDetailPage = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [documento, setDocumento] = useState(null);
  const [assinando, setAssinando] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const toast = useRef(null);

  // Função para mostrar toast
  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  // Função para renderizar o conteúdo do documento
  const renderizarConteudoDocumento = (conteudo) => {
    if (!conteudo) return null;

    const isHTML = /<[a-z][\s\S]*>/i.test(conteudo);

    if (isHTML) {
      return (
        <div
          className={styles.documentoContent}
          dangerouslySetInnerHTML={{ __html: conteudo }}
        />
      );
    } else {
      return (
        <div className={styles.documentoContent}>
          <p>{conteudo}</p>
        </div>
      );
    }
  };

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return "Não assinado";

    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para assinar documento
  const handleAssinar = async (assinatura) => {
    setAssinando(assinatura.id);

    try {
      const payload = {
        documentoRegistroId: assinatura.documentoRegistroId,
        tokenAssinatura: assinatura.tokenAssinatura,
        conteudo: documento.conteudo || documento.conteudoProcessado,
      };

      await assinarDocumento(params.tenant, payload);
      showToast("success", "Sucesso", "Documento assinado com sucesso!");

      // Recarregar os dados do documento
      fetchDocumento();
    } catch (error) {
      console.error("Erro ao assinar documento:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao assinar o documento. Tente novamente.";
      showToast("error", "Erro", errorMessage);
    } finally {
      setAssinando(null);
    }
  };

  // Buscar dados do documento específico
  const fetchDocumento = async () => {
    try {
      setLoading(true);
      const documentos = await getMyDocuments(params.tenant);
      const documentoEncontrado = documentos.find(
        (doc) => doc.id === parseInt(params.documentoId)
      );

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
    fetchDocumento();
  }, [params.tenant, params.documentoId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Carregando documento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <RiAlertLine className={styles.errorIcon} />
        <p>{error}</p>
        <Link
          href={`/${params.tenant}/user/documentos`}
          className={styles.backButton}
        >
          <RiArrowLeftLine /> Voltar para documentos
        </Link>
      </div>
    );
  }

  if (!documento) {
    return null;
  }

  return (
    <div className={styles.navContent}>
      <div className={styles.content}>
        <div className={styles.documentoDetailContainer}>
          <Toast ref={toast} position="top-right" />

          <div className={styles.header}>
            <Link
              href={`/${params.tenant}/user/documentos`}
              className={styles.backLink}
            >
              <RiArrowLeftLine /> Voltar
            </Link>
          </div>

          <div className={styles.documentContent}>
            {renderizarConteudoDocumento(
              documento.conteudo || documento.conteudoProcessado
            )}
          </div>

          <div className={styles.assinaturasSection}>
            <h2 className={styles.assinaturasTitle}>
              <RiPenNibLine className={styles.sectionIcon} />
              Assinaturas
            </h2>

            <div className={styles.assinaturasList}>
              {documento.assinaturas.map((assinatura) => (
                <div
                  key={assinatura.id}
                  className={`${styles.assinaturaItem} ${
                    assinatura.dataAssinatura
                      ? styles.assinaturaRealizada
                      : styles.assinaturaPendente
                  }`}
                >
                  <div className={styles.assinaturaInfo}>
                    <div className={styles.assinaturaUser}>
                      <h6 className={styles.assinaturaNome}>
                        {assinatura.user.nome}
                      </h6>
                      <p className={styles.assinaturaTipo}>
                        {assinatura.tipoSignatario}
                      </p>
                    </div>

                    <div className={styles.assinaturaStatus}>
                      {assinatura.dataAssinatura ? (
                        <p className={styles.statusRealizada}>
                          <RiCheckboxCircleLine className={styles.statusIcon} />
                          Assinado em: {formatarData(assinatura.dataAssinatura)}
                        </p>
                      ) : (
                        <p className={styles.statusPendente}>
                          <RiTimeLine className={styles.statusIcon} />
                          Aguardando assinatura
                        </p>
                      )}
                    </div>
                  </div>

                  {!assinatura.dataAssinatura && (
                    <div className={styles.assinaturaActions}>
                      <button
                        className={styles.assinarButton}
                        onClick={() => handleAssinar(assinatura)}
                        disabled={assinando === assinatura.id}
                      >
                        {assinando === assinatura.id ? (
                          <>
                            <RiPenNibLine className={styles.buttonIcon} />
                            Assinando...
                          </>
                        ) : (
                          <>
                            <RiPenNibLine className={styles.buttonIcon} />
                            Assinar Documento
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.documentoStatus}>
            <span
              className={`${styles.statusBadge} ${
                styles[`status-${documento.status.toLowerCase()}`]
              }`}
            >
              {documento.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentoDetailPage;

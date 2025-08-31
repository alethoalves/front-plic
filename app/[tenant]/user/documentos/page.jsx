"use client";
import {
  RiAlertLine,
  RiFoldersLine,
  RiFileTextLine,
  RiTimeLine,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { getMyDocuments } from "@/app/api/client/documentos";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [documentos, setDocumentos] = useState(null);
  const [documentosPendentes, setDocumentosPendentes] = useState([]);
  const [documentosAguardandoValidacao, setDocumentosAguardandoValidacao] =
    useState([]);
  const [documentosAssinados, setDocumentosAssinados] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Função para organizar documentos por status
  const organizarDocumentos = (docs) => {
    const pendentes = [];
    const aguardandoValidacao = [];
    const assinados = [];

    docs.forEach((doc) => {
      const todasAssinaturasRealizadas = doc.assinaturas.every(
        (assinatura) => assinatura.dataAssinatura !== null
      );

      if (doc.status === "AGUARDANDO_VALIDACAO") {
        aguardandoValidacao.push(doc);
      } else if (todasAssinaturasRealizadas) {
        assinados.push(doc);
      } else {
        pendentes.push(doc);
      }
    });

    return { pendentes, aguardandoValidacao, assinados };
  };

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return "Não assinado";

    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Função para obter ícone baseado no status
  const getStatusIcon = (status) => {
    switch (status) {
      case "AGUARDANDO_VALIDACAO":
        return <RiTimeLine className={styles.statusIcon} />;
      case "ACEITO":
        return <RiFileTextLine className={styles.statusIcon} />;
      default:
        return <RiAlertLine className={styles.statusIcon} />;
    }
  };

  // Componente para renderizar a lista de documentos
  const DocumentosList = ({ documentos, titulo, emptyMessage, statusType }) => (
    <div className={styles.documentosSection}>
      <h6 className={styles.sectionTitle}>
        {statusType === "aguardando" && (
          <RiTimeLine className={styles.sectionIcon} />
        )}
        {statusType === "assinados" && (
          <RiFileTextLine className={styles.sectionIcon} />
        )}
        {statusType === "pendentes" && (
          <RiAlertLine className={styles.sectionIcon} />
        )}
        {titulo}
      </h6>

      {documentos.length === 0 ? (
        <div className={styles.emptyState}>
          {statusType === "aguardando" && (
            <RiTimeLine size={48} className={styles.emptyIcon} />
          )}
          {statusType === "assinados" && (
            <RiFileTextLine size={48} className={styles.emptyIcon} />
          )}
          {statusType === "pendentes" && (
            <RiAlertLine size={48} className={styles.emptyIcon} />
          )}
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className={styles.documentosGrid}>
          {documentos.map((doc) => (
            <Link
              key={doc.id}
              href={`/${params.tenant}/user/documentos/${doc.id}`}
              className={styles.documentoCardLink}
            >
              <div className={styles.documentoCard}>
                <div className={styles.documentoCardHeader}>
                  <div className={styles.documentoInfo}>
                    <h6 className={styles.documentoTitulo}>
                      {doc.documentoTemplate.titulo}
                    </h6>
                    <p className={styles.documentoMeta}>
                      Criado em: {formatarData(doc.createdAt)}
                    </p>
                  </div>
                </div>

                <div className={styles.documentoDetails}>
                  {doc.participacao && (
                    <span className={styles.documentoDetail}>
                      Aluno: {doc.participacao.user.nome}
                    </span>
                  )}
                  {doc.inscricaoProjeto && (
                    <span className={styles.documentoDetail}>
                      Projeto: {doc.inscricaoProjeto.projeto.titulo}
                    </span>
                  )}
                </div>

                <div className={styles.documentoFooter}>
                  <span
                    className={`${styles.statusBadge} ${
                      styles[`status-${doc.status.toLowerCase()}`]
                    }`}
                  >
                    {doc.status === "AGUARDANDO_VALIDACAO"
                      ? "Aguardando Validação"
                      : doc.status}
                  </span>
                  <div className={styles.documentoAction}>
                    <RiFileTextLine size={16} />
                    <span>Visualizar</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  // Buscar dados
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMyDocuments(params.tenant);
        setDocumentos(response);
        const { pendentes, aguardandoValidacao, assinados } =
          organizarDocumentos(response);
        setDocumentosPendentes(pendentes);
        setDocumentosAguardandoValidacao(aguardandoValidacao);
        setDocumentosAssinados(assinados);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setError("Erro ao carregar documentos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  return (
    <div className={styles.navContent}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <RiFoldersLine />
          </div>
          <div className={styles.headerContent}>
            <h6>Documentos</h6>
            <p>Gerencie e visualize seus documentos</p>
          </div>
        </div>

        <div className={styles.mainContent}>
          {loading && (
            <div className={styles.loading}>
              <RiFileTextLine className={styles.loadingIcon} />
              <p>Carregando documentos...</p>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <RiAlertLine className={styles.errorIcon} />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && documentos && (
            <div className={styles.documentosContainer}>
              <DocumentosList
                documentos={documentosPendentes}
                titulo="Documentos Pendentes"
                emptyMessage="Nenhum documento pendente de assinatura"
                statusType="pendentes"
              />

              <DocumentosList
                documentos={documentosAguardandoValidacao}
                titulo="Aguardando Validação"
                emptyMessage="Nenhum documento aguardando validação"
                statusType="aguardando"
              />

              <DocumentosList
                documentos={documentosAssinados}
                titulo="Documentos Assinados"
                emptyMessage="Nenhum documento assinado"
                statusType="assinados"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;

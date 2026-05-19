"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Button from "@/components/Button";
import { RiLink, RiFilePdfLine, RiCheckLine, RiExternalLinkLine } from "@remixicon/react";
import styles from "./VerProjeto.module.scss";
import { linkProjetoToInscricao } from "@/app/api/client/projeto";

const BlockNoteField = dynamic(
  () => import("@/components/Formularios/BlockNoteField"),
  { ssr: false }
);

// Subcomponente: link para um arquivo PDF anexado
const DocLink = ({ doc }) => (
  <a
    href={doc.link}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.pdfLink}
  >
    <RiFilePdfLine size={14} />
    <span>{doc.nomeAnexo}</span>
  </a>
);

// Subcomponente: valor de um campo dinâmico
const FieldValue = ({ item }) => {
  const { tipo } = item.campo;

  if (tipo === "blockNote") {
    return (
      <BlockNoteField
        value={item.value}
        readOnly={true}
        label={null}
      />
    );
  }

  if (tipo === "arquivo") {
    const raw = item.value || "";
    const parts = raw.split("/");
    const lastName = parts[parts.length - 1];
    const fileName = lastName.split("_").slice(1).join("_") || lastName;
    return (
      <a
        href={raw}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.fileLink}
      >
        <RiFilePdfLine size={14} />
        <span>{fileName}</span>
        <RiExternalLinkLine size={12} />
      </a>
    );
  }

  if (tipo === "link") {
    return (
      <a
        href={item.value}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.fileLink}
      >
        <RiExternalLinkLine size={14} />
        <span>{item.value}</span>
      </a>
    );
  }

  if (tipo === "checkbox" || tipo === "multiselect") {
    const raw = typeof item.value === "string" ? item.value : "";
    let values = [];
    try {
      const parsed = JSON.parse(raw);
      values = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      values = raw.split(",").map((v) => v.trim()).filter(Boolean);
    }
    return (
      <div className={styles.tagList}>
        {values.map((v, i) => (
          <span key={i} className={styles.tag}>{v}</span>
        ))}
      </div>
    );
  }

  if (tipo === "flag") {
    const isTrue = item.value === "true" || item.value === true;
    return <p className={styles.fieldText}>{isTrue ? "Sim" : "Não"}</p>;
  }

  return <p className={styles.fieldText}>{item.value}</p>;
};

const VerProjeto = ({
  projetoDetalhes,
  loading,
  tenant,
  inscricaoSelected,
  onProjetoVinculado,
  closeModal,
}) => {
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState(null);

  // Aplica regras condicionais para filtrar campos visíveis
  let respostasVisiveis = projetoDetalhes.Resposta || [];
  try {
    const campos = respostasVisiveis.map((r) => r.campo);
    const camposDinamicosValues = {};
    respostasVisiveis.forEach((resp) => {
      camposDinamicosValues[`campo_${resp.campo.id}`] = resp.value;
    });
    const { applyConditionalRules } = require("@/lib/applyConditionalRules");
    const visibleFieldIds = applyConditionalRules(campos, camposDinamicosValues);
    respostasVisiveis = respostasVisiveis.filter((item) =>
      visibleFieldIds.includes(item.campo.id)
    );
  } catch {
    // fallback: mostra tudo
  }

  // Documentos regulatórios por tipo
  const anexos = projetoDetalhes.AnexoProjeto || [];
  const docCEPCONEP = anexos.find((a) => a.tipo === "CEP_CONEP");
  const docOGM = anexos.find((a) => a.tipo === "OGM");
  const docComiteEtica = anexos.find((a) => a.tipo === "COMITE_ETICA");

  const hasRegulatoryInfo =
    projetoDetalhes.envolveHumanos ||
    projetoDetalhes.envolveAnimais ||
    projetoDetalhes.envolveOGM ||
    projetoDetalhes.envolvePatrimonioGenetico ||
    projetoDetalhes.submetidoComiteEtica;

  const handleLinkProject = async () => {
    setIsLinking(true);
    setError(null);
    try {
      await linkProjetoToInscricao(tenant, inscricaoSelected, projetoDetalhes.id);
      if (typeof onProjetoVinculado === "function") {
        onProjetoVinculado(projetoDetalhes);
      }
      if (typeof closeModal === "function") {
        closeModal();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Falha ao vincular o projeto.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Cabeçalho ── */}
      <div className={styles.header}>
        <span className={styles.areaTag}>{projetoDetalhes.area?.area}</span>
        <h5 className={styles.titulo}>{projetoDetalhes.titulo}</h5>
      </div>

      {/* ── Aspectos Regulatórios e Éticos ── */}
      {hasRegulatoryInfo && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Aspectos Regulatórios e Éticos</p>
          <div className={styles.regulatoryList}>
            {/* Seres humanos e/ou animais */}
            {(projetoDetalhes.envolveHumanos || projetoDetalhes.envolveAnimais) && (
              <div className={styles.regulatoryItem}>
                <div className={styles.regulatoryHeader}>
                  <RiCheckLine size={14} className={styles.checkIcon} />
                  <span>
                    {projetoDetalhes.envolveHumanos && projetoDetalhes.envolveAnimais
                      ? "Envolve seres humanos e animais"
                      : projetoDetalhes.envolveHumanos
                      ? "Envolve seres humanos"
                      : "Envolve animais"}
                  </span>
                </div>
                {docCEPCONEP && <DocLink doc={docCEPCONEP} />}
                {projetoDetalhes.numeroCEPCONEP && (
                  <p className={styles.protocolText}>
                    Protocolo CEP/CONEP:{" "}
                    <strong>{projetoDetalhes.numeroCEPCONEP}</strong>
                  </p>
                )}
              </div>
            )}

            {/* OGM */}
            {projetoDetalhes.envolveOGM && (
              <div className={styles.regulatoryItem}>
                <div className={styles.regulatoryHeader}>
                  <RiCheckLine size={14} className={styles.checkIcon} />
                  <span>Envolve Organismo Geneticamente Modificado (OGM)</span>
                </div>
                {docOGM && <DocLink doc={docOGM} />}
              </div>
            )}

            {/* Patrimônio Genético */}
            {projetoDetalhes.envolvePatrimonioGenetico && (
              <div className={styles.regulatoryItem}>
                <div className={styles.regulatoryHeader}>
                  <RiCheckLine size={14} className={styles.checkIcon} />
                  <span>
                    Envolve Patrimônio Genético ou Conhecimento Tradicional
                    Associado
                  </span>
                </div>
                {projetoDetalhes.numeroSISGEN && (
                  <p className={styles.protocolText}>
                    Registro SISGEN:{" "}
                    <strong>{projetoDetalhes.numeroSISGEN}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Comitê de Ética */}
            {projetoDetalhes.submetidoComiteEtica && (
              <div className={styles.regulatoryItem}>
                <div className={styles.regulatoryHeader}>
                  <RiCheckLine size={14} className={styles.checkIcon} />
                  <span>Submetido a comitê de ética da área</span>
                </div>
                {docComiteEtica && <DocLink doc={docComiteEtica} />}
                {projetoDetalhes.numeroProtocoloEtica && (
                  <p className={styles.protocolText}>
                    Protocolo:{" "}
                    <strong>{projetoDetalhes.numeroProtocoloEtica}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Campos dinâmicos ── */}
      {respostasVisiveis.length > 0 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Conteúdo do Projeto</p>
          {respostasVisiveis
            .sort((a, b) => (a.campo.ordem ?? 999) - (b.campo.ordem ?? 999))
            .map((item) => (
              <div key={item.id} className={styles.field}>
                <p className={styles.fieldLabel}>{item.campo.label}</p>
                <FieldValue item={item} />
              </div>
            ))}
        </div>
      )}

      {/* ── Vincular à inscrição ── */}
      {inscricaoSelected && (
        <div className={styles.actions}>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <Button
            icon={RiLink}
            className="btn-secondary"
            type="button"
            onClick={handleLinkProject}
            disabled={loading || isLinking}
          >
            {isLinking ? "Vinculando..." : "Vincular projeto à inscrição"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VerProjeto;

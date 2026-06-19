"use client";
import { useState, useEffect } from "react";
import { RiLinkM, RiFileCopyLine, RiDeleteBinLine, RiRefreshLine, RiCheckLine, RiLockLine } from "@remixicon/react";
import {
  getRespostasQuestionario,
  generateTokenPublico,
  revokeTokenPublico,
} from "@/app/api/client/questionarioSatisfacao";
import QuestionarioResultados from "@/components/QuestionarioResultados";
import styles from "./RespostasView.module.scss";

// ─── Painel de link público ───────────────────────────────────────────────────

function LinkPublicoPanel({ params, tokenInicial }) {
  const [token, setToken] = useState(tokenInicial);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [confirmandoRevogacao, setConfirmandoRevogacao] = useState(false);

  const url = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${params.tenant}/public/questionarios/${token}`
    : null;

  const handleGerar = async () => {
    setLoading(true);
    try {
      const data = await generateTokenPublico(params.tenant, params.idQuestionario);
      setToken(data.tokenPublico);
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false);
    }
  };

  const handleRevogar = async () => {
    if (!confirmandoRevogacao) {
      setConfirmandoRevogacao(true);
      return;
    }
    setLoading(true);
    setConfirmandoRevogacao(false);
    try {
      await revokeTokenPublico(params.tenant, params.idQuestionario);
      setToken(null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className={styles.linkPanel}>
      <div className={styles.linkPanelHeader}>
        <RiLinkM size={16} />
        <span className={styles.linkPanelTitle}>Link público de resultados</span>
      </div>

      {token ? (
        <>
          <p className={styles.linkPanelDesc}>
            Qualquer pessoa com este link pode visualizar os resultados, sem precisar fazer login.
          </p>
          <div className={styles.linkRow}>
            <span className={styles.linkUrl}>{url}</span>
            <button type="button" className={styles.btnCopiar} onClick={handleCopiar} title="Copiar link">
              {copiado ? <RiCheckLine size={15} /> : <RiFileCopyLine size={15} />}
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <div className={styles.linkActions}>
            <button type="button" className={styles.btnRegenerar} onClick={handleGerar} disabled={loading} title="Gerar novo link (o link atual deixará de funcionar)">
              <RiRefreshLine size={14} /> {loading ? "Gerando..." : "Gerar novo link"}
            </button>
            <button
              type="button"
              className={`${styles.btnRevogar} ${confirmandoRevogacao ? styles.btnRevogarConfirm : ""}`}
              onClick={handleRevogar}
              disabled={loading}
            >
              <RiDeleteBinLine size={14} />
              {confirmandoRevogacao ? "Confirmar revogação?" : "Desativar link"}
            </button>
            {confirmandoRevogacao && (
              <button type="button" className={styles.btnCancelar} onClick={() => setConfirmandoRevogacao(false)}>
                Cancelar
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className={styles.linkPanelDesc}>
            Gere um link para compartilhar os resultados publicamente, sem exigir login.
            O link pode ser desativado ou substituído a qualquer momento.
          </p>
          <div className={styles.linkPanelEmpty}>
            <RiLockLine size={28} className={styles.lockIcon} />
            <button type="button" className={styles.btnGerar} onClick={handleGerar} disabled={loading}>
              <RiLinkM size={15} /> {loading ? "Gerando..." : "Gerar link público"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RespostasView({ params, schema, tokenPublicoInicial }) {
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRespostas = async () => {
      try {
        const data = await getRespostasQuestionario(params.tenant, params.idQuestionario);
        setRespostas(data);
      } catch {
        setError("Erro ao carregar respostas.");
      } finally {
        setLoading(false);
      }
    };
    fetchRespostas();
  }, [params.tenant, params.idQuestionario]);

  return (
    <div className={styles.wrap}>
      <LinkPublicoPanel params={params} tokenInicial={tokenPublicoInicial ?? null} />

      {loading && <p className={styles.loading}>Carregando respostas...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <QuestionarioResultados schema={schema} respostas={respostas} />
      )}
    </div>
  );
}

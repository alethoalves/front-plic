"use client";
import { useState } from "react";
import styles from "./ImportarLattesGestor.module.scss";
import { importarLattesGestor } from "@/app/api/client/cvLattes";

export default function ImportarLattesGestor({ tenant, participacaoId, onSuccess }) {
  const [html, setHtml]       = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleImportar() {
    if (!html.trim()) return;
    setLoading(true);
    setMensagem("");
    try {
      await importarLattesGestor(tenant, participacaoId, html);
      setMensagem("Importação concluída. Clique em \"Gerar Ficha de Avaliação\" para continuar.");
      if (onSuccess) onSuccess();
    } catch (err) {
      setMensagem(
        "Erro ao importar: " +
          (err?.response?.data?.message || err?.message || "Erro desconhecido")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.aviso}>
        <strong>Via alternativa — somente para uso do gestor</strong>
        <p>
          Use quando o proponente não enviou o XML do Lattes ou o arquivo está inválido.
          O CV público é subconjunto dos dados reais: esta via <strong>pode subpontuar</strong>{" "}
          em relação ao XML completo. O XML do proponente continua sendo o caminho preferencial.
        </p>
      </div>

      <ol className={styles.passos}>
        <li>
          Abra a página do CV Lattes do proponente em <code>lattes.cnpq.br</code> e
          resolva o captcha.
        </li>
        <li>
          Pressione <strong>Ctrl+U</strong> (ou clique com botão direito →{" "}
          <em>Ver código-fonte da página</em>).
        </li>
        <li>
          Na aba que abrir, pressione <strong>Ctrl+A</strong> (selecionar tudo) e depois{" "}
          <strong>Ctrl+C</strong> (copiar).
        </li>
        <li>Cole o código-fonte no campo abaixo e clique em <strong>Importar</strong>.</li>
      </ol>

      <textarea
        className={styles.textarea}
        placeholder="Cole aqui o código-fonte HTML da página do Lattes (Ctrl+U → Ctrl+A → Ctrl+C → Ctrl+V)"
        value={html}
        onChange={(e) => {
          setHtml(e.target.value);
          setMensagem("");
        }}
        rows={8}
      />

      <button
        className={styles.btnImportar}
        onClick={handleImportar}
        disabled={loading || !html.trim()}
      >
        {loading ? "Importando..." : "Importar"}
      </button>

      {mensagem && (
        <div className={mensagem.startsWith("Erro") ? styles.erro : styles.sucesso}>
          {mensagem}
        </div>
      )}
    </div>
  );
}

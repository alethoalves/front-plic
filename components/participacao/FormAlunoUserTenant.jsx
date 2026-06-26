"use client";
import { useState } from "react";
import { Button } from "primereact/button";
import { processarHistoricoEscolar } from "@/app/api/client/userTenant";
import styles from "./EditarParticipacao.module.scss";

const FormAlunoUserTenant = ({
  tenantSlug,
  participacaoInfo,
  editalInfo,
  userTenant,
  onBack,
  onSuccess,
}) => {
  const [participacaoExterna, setParticipacaoExterna] = useState(
    userTenant?.participacaoExterna ?? null,
  );
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [historicoUrl, setHistoricoUrl] = useState(
    userTenant?.historicoEscolarUrl ?? null,
  );

  const userId = participacaoInfo?.user?.id;
  const ano = editalInfo?.ano;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Selecione um arquivo PDF.");
      return;
    }
    setError("");
    setResult(null);
    setProcessing(true);
    try {
      const data = await processarHistoricoEscolar(
        tenantSlug,
        userId,
        ano,
        file,
        participacaoExterna,
      );
      setResult(data);
      setHistoricoUrl(null);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao processar o histórico.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.formularioStep}>
      {/* Seleção interno/externo */}
      {participacaoExterna === null ? (
        <div className="mb-3">
          <p className="mb-2">
            <strong>Este aluno é interno à instituição?</strong>
          </p>
          <div className="flex" style={{ gap: "0.75rem" }}>
            <Button
              label="Sim, o aluno é interno"
              icon="pi pi-building"
              className="p-button-outlined"
              type="button"
              onClick={() => setParticipacaoExterna(false)}
            />
            <Button
              label="Não, o aluno é externo"
              icon="pi pi-globe"
              className="p-button-outlined p-button-secondary"
              type="button"
              onClick={() => setParticipacaoExterna(true)}
            />
          </div>
        </div>
      ) : (
        <div className="mb-2 flex align-items-center" style={{ gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--color-text-secondary, #666)",
            }}
          >
            {participacaoExterna
              ? "Aluno externo à instituição"
              : "Aluno interno à instituição"}
          </span>
          <Button
            label="Alterar"
            className="p-button-text p-button-sm"
            type="button"
            style={{ padding: "0", fontSize: "0.8rem" }}
            onClick={() => {
              setParticipacaoExterna(null);
              setResult(null);
              setError("");
            }}
          />
        </div>
      )}

      {/* Upload — só aparece após a seleção */}
      {participacaoExterna !== null && (
        <>
          {historicoUrl ? (
            <div
              className="notification notification-success"
              style={{ marginBottom: "0.75rem" }}
            >
              <p className="p5">
                Histórico já enviado
                {!participacaoExterna && (
                  <>
                    {" "}
                    — Matrícula:{" "}
                    <strong>
                      {userTenant?.matricula || "não encontrada"}
                    </strong>{" "}
                    · IRA:{" "}
                    <strong>
                      {userTenant?.rendimentoAcademico ?? "não encontrado"}
                    </strong>
                  </>
                )}
                {" · "}
                <a
                  href={historicoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visualizar arquivo
                </a>
              </p>
            </div>
          ) : (
            <p className="mb-2" style={{ fontSize: "0.9rem" }}>
              {participacaoExterna
                ? "Faça o upload do histórico escolar em PDF."
                : "Faça o upload do histórico escolar em PDF. O sistema irá extrair automaticamente a matrícula e IRA."}
            </p>
          )}

          <input
            type="file"
            accept="application/pdf"
            onChange={handleUpload}
            disabled={processing}
            style={{ display: "block", marginBottom: "0.5rem" }}
          />

          {processing && (
            <div
              className="flex align-items-center"
              style={{ gap: "0.5rem", marginBottom: "0.5rem" }}
            >
              <i className="pi pi-spin pi-spinner" />
              <span style={{ fontSize: "0.85rem" }}>
                {participacaoExterna
                  ? "Enviando arquivo..."
                  : "Analisando histórico..."}
              </span>
            </div>
          )}

          {result && (
            <div
              className="notification notification-success"
              style={{ marginBottom: "0.5rem" }}
            >
              <p className="p5">
                {participacaoExterna ? (
                  "Histórico enviado com sucesso."
                ) : (
                  <>
                    Histórico processado — Matrícula:{" "}
                    <strong>{result.matricula || "não encontrada"}</strong> ·
                    IRA: <strong>{result.ira ?? "não encontrado"}</strong>
                  </>
                )}
              </p>
            </div>
          )}

          {error && (
            <div
              className="notification notification-error"
              style={{ marginBottom: "0.5rem" }}
            >
              <p className="p5">{error}</p>
            </div>
          )}
        </>
      )}

      <div className={styles.formularioActions}>
        <Button
          label="Voltar"
          icon="pi pi-arrow-left"
          className="p-button-outlined p-button-secondary"
          onClick={onBack}
          type="button"
          disabled={processing}
        />
        <Button
          label="Concluir"
          icon="pi pi-check"
          className="btn-primary"
          type="button"
          disabled={processing || participacaoExterna === null || (!historicoUrl && !result)}
          onClick={onSuccess}
        />
      </div>
    </div>
  );
};

export default FormAlunoUserTenant;

import { req } from "../axios.js";
import { getAuthHeadersClient } from "@/lib/headers.js";

// Histórico escolar, CV Lattes, justificativa de ausência e anexos de campo
// dinâmico deixaram de ser públicos no GCS (eram acessíveis por qualquer
// pessoa com a URL, sem login) — agora exigem essa checagem de autenticação.
// Mesmo padrão já usado em app/api/client/participacao.js/relatorios.js pra
// download de relatórios: busca o arquivo como blob com o header
// Authorization, abre numa aba nova (preserva o target="_blank" que os
// pontos substituídos já usavam).
export const abrirArquivoPrivado = async (downloadPath) => {
  const headers = getAuthHeadersClient();
  if (!headers) throw new Error("Não autenticado");

  const response = await req.get(downloadPath, { headers, responseType: "blob" });
  const url = URL.createObjectURL(new Blob([response.data]));
  window.open(url, "_blank", "noopener,noreferrer");
};

export const urlDownloadHistoricoEscolar = (tenantSlug, userId, ano) =>
  `/private/${tenantSlug}/user-tenant/${userId}/${ano}/historico/download`;

// `inscricaoId` é opcional: sem ele só o próprio dono do CV (ou gestor) pode
// baixar; com ele, qualquer participante da mesma inscrição também pode —
// necessário pras telas que mostram o CV de outros participantes da mesma
// inscrição (comprovante, fluxo de inscrição do proponente).
export const urlDownloadCvLattes = (tenantSlug, userId, inscricaoId) =>
  `/private/${tenantSlug}/cv-lattes/${userId}/download${
    inscricaoId ? `?inscricaoId=${inscricaoId}` : ""
  }`;

export const urlDownloadJustificativa = (tenantSlug, justificativaId) =>
  `/evenplic/${tenantSlug}/justificativa-apresentacao/${justificativaId}/download`;

// Variante do fluxo admin do evento (ModalSubmissaoAdmin), que não opera com
// slug de tenant na URL — só eventoSlug.
export const urlDownloadJustificativaAdmin = (eventoSlug, justificativaId) =>
  `/evenplic/evento/${eventoSlug}/justificativa-apresentacao/${justificativaId}/download`;

export const urlDownloadResposta = (tenantSlug, respostaId) =>
  `/private/${tenantSlug}/respostas/${respostaId}/download`;

export const urlDownloadDocumentoAnexo = (tenantSlug, documentId, campo) =>
  `/private/${tenantSlug}/documento/${documentId}/download?campo=${encodeURIComponent(campo)}`;

export const urlDownloadAnexoProjeto = (tenantSlug, anexoId) =>
  `/private/${tenantSlug}/anexo-projeto/${anexoId}/download`;

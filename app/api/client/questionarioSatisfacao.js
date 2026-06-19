import { req } from "./../axios.js";
import { getAuthHeadersClient } from "@/lib/headers.js";

// ─── USER (autenticado) ───────────────────────────────────────────────────────

export const getQuestionarioPublico = async (tenantSlug, contexto) => {
  const headers = getAuthHeadersClient();
  const response = await req.get(
    `/private/${tenantSlug}/questionarios-satisfacao/contexto/${contexto}`,
    { headers }
  );
  return response.data;
};

export const responderQuestionario = async (tenantSlug, questionarioId, respostas, inscricaoId) => {
  const headers = getAuthHeadersClient();
  const response = await req.post(
    `/private/${tenantSlug}/questionarios-satisfacao/${questionarioId}/respostas`,
    { respostas, inscricaoId },
    { headers }
  );
  return response.data;
};

// ─── GESTOR ──────────────────────────────────────────────────────────────────

export const getQuestionarios = async (tenantSlug) => {
  const headers = getAuthHeadersClient();
  const response = await req.get(`/private/${tenantSlug}/questionarios-satisfacao`, { headers });
  return response.data;
};

export const getQuestionario = async (tenantSlug, id) => {
  const headers = getAuthHeadersClient();
  const response = await req.get(`/private/${tenantSlug}/questionarios-satisfacao/${id}`, { headers });
  return response.data;
};

export const createQuestionario = async (tenantSlug, data) => {
  const headers = getAuthHeadersClient();
  const response = await req.post(`/private/${tenantSlug}/questionarios-satisfacao`, data, { headers });
  return response.data;
};

export const updateQuestionario = async (tenantSlug, id, data) => {
  const headers = getAuthHeadersClient();
  const response = await req.put(`/private/${tenantSlug}/questionarios-satisfacao/${id}`, data, { headers });
  return response.data;
};

export const deleteQuestionario = async (tenantSlug, id) => {
  const headers = getAuthHeadersClient();
  const response = await req.delete(`/private/${tenantSlug}/questionarios-satisfacao/${id}`, { headers });
  return response.data;
};

export const getRespostasQuestionario = async (tenantSlug, id) => {
  const headers = getAuthHeadersClient();
  const response = await req.get(`/private/${tenantSlug}/questionarios-satisfacao/${id}/respostas`, { headers });
  return response.data;
};

export const generateTokenPublico = async (tenantSlug, id) => {
  const headers = getAuthHeadersClient();
  const response = await req.post(`/private/${tenantSlug}/questionarios-satisfacao/${id}/token`, {}, { headers });
  return response.data;
};

export const revokeTokenPublico = async (tenantSlug, id) => {
  const headers = getAuthHeadersClient();
  const response = await req.delete(`/private/${tenantSlug}/questionarios-satisfacao/${id}/token`, { headers });
  return response.data;
};

export const getResultadosPublicos = async (token) => {
  const response = await req.get(`/public/questionarios-satisfacao/resultado/${token}`);
  return response.data;
};

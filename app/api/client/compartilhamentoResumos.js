import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

// Links públicos (token, 60 dias) de "Resumos + Avaliações" de um evento

// ─── Admin do evento ─────────────────────────────────────────────────────────

// config: { tenantSlug, instituicaoParceiraId, rotulo, filtros, exibicaoComentarios, permitirFeedback }
export const criarCompartilhamentoResumos = async (eventoSlug, config = {}) => {
  const headers = getAuthHeadersClient();
  const response = await req.post(`/evenplic/evento/${eventoSlug}/compartilhamentos-resumos`, config, { headers });
  return response.data.compartilhamento;
};

// Quantos trabalhos o link mostraria com esse recorte/filtros
export const previaCompartilhamentoResumos = async (eventoSlug, { tenantSlug, instituicaoParceiraId, filtros }) => {
  const headers = getAuthHeadersClient();
  const response = await req.post(
    `/evenplic/evento/${eventoSlug}/compartilhamentos-resumos/previa`,
    { tenantSlug, instituicaoParceiraId, filtros },
    { headers }
  );
  return response.data.total;
};

export const listarCompartilhamentosResumos = async (eventoSlug) => {
  const headers = getAuthHeadersClient();
  const response = await req.get(`/evenplic/evento/${eventoSlug}/compartilhamentos-resumos`, { headers });
  return response.data.compartilhamentos;
};

export const revogarCompartilhamentoResumos = async (eventoSlug, id) => {
  const headers = getAuthHeadersClient();
  const response = await req.delete(`/evenplic/evento/${eventoSlug}/compartilhamentos-resumos/${id}`, { headers });
  return response.data;
};

export const listarFeedbacksCompartilhamento = async (eventoSlug, id) => {
  const headers = getAuthHeadersClient();
  const response = await req.get(`/evenplic/evento/${eventoSlug}/compartilhamentos-resumos/${id}/feedbacks`, {
    headers,
  });
  return response.data.feedbacks;
};

export const urlCompartilhamentoResumos = (token) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/compartilhado/resumos/${token}`;

// ─── Público (quem acessa o link) ────────────────────────────────────────────

// Identificador anônimo do navegador do acessante — permite editar o próprio
// feedback sem login. Não é segredo forte; só evita misturar acessantes.
const CHAVE_STORAGE = "plic-acessante-chave";
const NOME_STORAGE = "plic-acessante-nome";

const gerarChave = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

export const getChaveAcessante = () => {
  try {
    let chave = localStorage.getItem(CHAVE_STORAGE);
    if (!chave) {
      chave = gerarChave();
      localStorage.setItem(CHAVE_STORAGE, chave);
    }
    return chave;
  } catch {
    // Sem storage (aba privada restrita): chave vale só para esta sessão da página
    getChaveAcessante.fallback ||= gerarChave();
    return getChaveAcessante.fallback;
  }
};

export const getNomeAcessante = () => {
  try {
    return localStorage.getItem(NOME_STORAGE) || "";
  } catch {
    return "";
  }
};

export const setNomeAcessante = (nome) => {
  try {
    localStorage.setItem(NOME_STORAGE, nome);
  } catch {
    // ignora — o nome só é lembrado por conveniência
  }
};

const headersAcessante = () => ({ "x-chave-acessante": getChaveAcessante() });

export const getCompartilhamentoResumosPublico = async (token) => {
  const response = await req.get(`/public/compartilhamentos-resumos/${encodeURIComponent(token)}`, {
    headers: headersAcessante(),
  });
  return response.data;
};

// Retorna a lista atualizada de feedbacks do trabalho
export const salvarFeedbackCompartilhamento = async (token, { submissaoId, nome, estrelas, comentario }) => {
  const response = await req.post(
    `/public/compartilhamentos-resumos/${encodeURIComponent(token)}/feedbacks`,
    { submissaoId, nome, estrelas, comentario },
    { headers: headersAcessante() }
  );
  return response.data.feedbacks;
};

export const excluirFeedbackCompartilhamento = async (token, submissaoId) => {
  const response = await req.delete(
    `/public/compartilhamentos-resumos/${encodeURIComponent(token)}/feedbacks/${submissaoId}`,
    { headers: headersAcessante() }
  );
  return response.data.feedbacks;
};

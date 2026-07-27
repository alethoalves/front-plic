import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * RESPOSTA
 **************************/

export const getSessoesBySlug = async (eventoSlug) => {
  try {
    
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/sessoes`,
    );
    return response.data.sessoes;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};

export const getSessaoById = async (eventoSlug,sessaoId) => {
  try {

    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/sessao/${sessaoId}`,
    );
    return response.data.sessao;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};

/**************************
 * SESSÃO - CRUD
 **************************/

export const criarSessao = async (eventoSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.post(
      `/evenplic/evento/${eventoSlug}/sessao`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    throw error;
  }
};

export const atualizarSessao = async (eventoSlug, sessaoId, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.put(
      `/evenplic/evento/${eventoSlug}/sessao/${sessaoId}`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar sessão:", error);
    throw error;
  }
};

export const excluirSessao = async (eventoSlug, sessaoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.delete(
      `/evenplic/evento/${eventoSlug}/sessao/${sessaoId}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao excluir sessão:", error);
    throw error;
  }
};

/**************************
 * SUBSESSÃO - CRUD
 **************************/

export const criarSubsessao = async (eventoSlug, sessaoId, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.post(
      `/evenplic/evento/${eventoSlug}/sessao/${sessaoId}/subsessao`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao criar subsessão:", error);
    throw error;
  }
};

export const atualizarSubsessao = async (eventoSlug, subsessaoId, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.put(
      `/evenplic/evento/${eventoSlug}/subsessao/${subsessaoId}`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar subsessão:", error);
    throw error;
  }
};

export const excluirSubsessao = async (eventoSlug, subsessaoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.delete(
      `/evenplic/evento/${eventoSlug}/subsessao/${subsessaoId}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao excluir subsessão:", error);
    throw error;
  }
};

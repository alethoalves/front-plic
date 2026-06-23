import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * RESPOSTA
 **************************/


export const createResposta = async (tenantSlug, campoId, respostaData) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.post(
        `/private/${tenantSlug}/campos/${campoId}/respostas`,
        respostaData,
        { headers }
      );
      return response.data.resposta;
    } catch (error) {
      console.error("Erro ao criar campo:", error);
      throw error;
    }
  };
  
  export const updateResposta = async (
    tenantSlug,
    respostaId,
    campoId,
    respostaData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/private/${tenantSlug}/campos/${campoId}/respostas/${respostaId}`,
        respostaData,
        { headers }
      );
      return response.data.resposta;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

  export const createRespostaByParticipante = async (tenantSlug, campoId, respostaData) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.post(
        `/private/${tenantSlug}/participante/campos/${campoId}/respostas`,
        respostaData,
        { headers }
      );
      return response.data.resposta;
    } catch (error) {
      console.error("Erro ao criar campo:", error);
      throw error;
    }
  };
  
  export const updateRespostaByParticipante = async (
    tenantSlug,
    respostaId,
    campoId,
    respostaData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/private/${tenantSlug}/participante/campos/${campoId}/respostas/${respostaId}`,
        respostaData,
        { headers }
      );
      return response.data.resposta;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

/**
 * Determines the navigation code for the activity submission modal.
 *
 * Accepts the full registroAtividade object and returns an object with either:
 *   - { response: { status: "concluido" } }  → activity already completed (read-only view)
 *   - { code: 1 }                             → plano de trabalho is missing its area
 *   - { code: 2 }                             → form is ready to be filled
 *
 * @param {Object} registroAtividade - The full registro de atividade object.
 * @returns {{ code?: number, response?: { status: string } }}
 */
export const startSubmission = (registroAtividade) => {
  if (!registroAtividade) {
    return { code: 2 };
  }

  if (registroAtividade.status === "concluido") {
    return { response: { status: "concluido" } };
  }

  if (!registroAtividade.planoDeTrabalho?.area) {
    return { code: 1 };
  }

  return { code: 2 };
};
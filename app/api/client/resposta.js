import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * RESPOSTA
 **************************/

export const startSubmission = async (registroAtividadeId, body) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/private/startSubmission/${registroAtividadeId}`,
      body,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar campo:", error);
    throw error;
  }
};
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
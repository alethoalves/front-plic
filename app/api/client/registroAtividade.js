import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * REGISTRO ATIVIDADE
 **************************/

export const createRegistroAtividade = async (
    tenantSlug,
    atividadeId,
    registroAtividadeData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.post(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades`,
        registroAtividadeData,
        { headers }
      );
      return response.data.registroAtividade;
    } catch (error) {
      console.error("Erro ao criar Registro de Atividade:", error);
      throw error;
    }
  };
  
  export const getRegistroAtividades = async (tenantSlug, atividadeId) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades`,
        {
          headers,
          params: { atividadeId },
        }
      );
      return response.data.registrosAtividade;
    } catch (error) {
      console.error("Erro ao obter Registros de Atividade:", error);
      throw error;
    }
  };
  
  export const getRegistroAtividade = async (tenantSlug, atividadeId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
        { headers }
      );
      return response.data.registroAtividade;
    } catch (error) {
      console.error("Erro ao obter Registro de Atividade:", error);
      throw error;
    }
  };
  
  export const updateRegistroAtividade = async (
    tenantSlug,
    atividadeId,
    id,
    registroAtividadeData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
        registroAtividadeData,
        { headers }
      );
      return response.data.registroAtividade;
    } catch (error) {
      console.error("Erro ao atualizar Registro de Atividade:", error);
      throw error;
    }
  };
  
  export const deleteRegistroAtividade = async (tenantSlug, atividadeId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.delete(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao deletar Registro de Atividade:", error);
      throw error;
    }
  };
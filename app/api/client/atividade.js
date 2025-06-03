import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * ATIVIDADE
 **************************/

export const createAtividade = async (tenantSlug, editalId, atividadeData) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.post(
        `/private/${tenantSlug}/${editalId}/atividades`,
        atividadeData,
        { headers }
      );
      return response.data.atividade;
    } catch (error) {
      console.error("Erro ao criar Atividade:", error);
      throw error;
    }
  };
  
  export const getAtividadesByAno = async (tenantSlug, ano) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${ano}/getAtividadesByAno`,
        {
          headers,
        }
      );
      return response.data.atividades;
    } catch (error) {
      console.error("Erro ao obter Atividades:", error);
      throw error;
    }
  };
  export const getRegistrosAtividadesByAno = async (tenantSlug, ano) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${ano}/getRegistrosAtividadesByAno`,
        {
          headers,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao obter Atividades:", error);
      throw error;
    }
  };
  export const getAtividade = async (tenantSlug, editalId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${editalId}/atividades/${id}`,
        { headers }
      );
      return response.data.atividade;
    } catch (error) {
      console.error("Erro ao obter Atividade:", error);
      throw error;
    }
  };
  
  export const updateAtividade = async (
    tenantSlug,
    editalId,
    id,
    atividadeData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/private/${tenantSlug}/${editalId}/atividades/${id}`,
        atividadeData,
        { headers }
      );
      return response.data.atividade;
    } catch (error) {
      console.error("Erro ao atualizar Atividade:", error);
      throw error;
    }
  };
  
  export const deleteAtividade = async (tenantSlug, editalId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.delete(
        `/private/${tenantSlug}/${editalId}/atividades/${id}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao deletar Atividade:", error);
      throw error;
    }
  };
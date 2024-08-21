import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * PLANO DE TRABALHO
 **************************/

export const createPlanoDeTrabalho = async (
    tenantSlug,
    inscricaoId,
    planoDeTrabalhoData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.post(
        `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho`,
        planoDeTrabalhoData,
        { headers }
      );
      return response.data.planoDeTrabalho;
    } catch (error) {
      console.error("Erro ao criar Plano de Trabalho:", error);
      throw error;
    }
  };
  
  export const getPlanoDeTrabalhos = async (tenantSlug, inscricaoId) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho`,
        {
          headers,
          params: { inscricaoId },
        }
      );
      return response.data.planosDeTrabalho;
    } catch (error) {
      console.error("Erro ao obter Planos de Trabalho:", error);
      throw error;
    }
  };
  
  export const getPlanoDeTrabalho = async (tenantSlug, inscricaoId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho/${id}`,
        { headers }
      );
      return response.data.planoDeTrabalho;
    } catch (error) {
      console.error("Erro ao obter Plano de Trabalho:", error);
      throw error;
    }
  };
  
  export const updatePlanoDeTrabalho = async (
    tenantSlug,
    inscricaoId,
    id,
    planoDeTrabalhoData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho/${id}`,
        planoDeTrabalhoData,
        { headers }
      );
      return response.data.planoDeTrabalho;
    } catch (error) {
      console.error("Erro ao atualizar Plano de Trabalho:", error);
      throw error;
    }
  };
  
  export const deletePlanoDeTrabalho = async (tenantSlug, inscricaoId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.delete(
        `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho/${id}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao deletar Plano de Trabalho:", error);
      throw error;
    }
  };
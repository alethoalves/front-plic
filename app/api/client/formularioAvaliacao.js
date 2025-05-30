import { req } from "./../axios.js";
import { getAuthHeadersClient } from "@/lib/headers.js";
/**************************
 * FORMULÁRIO DE AVALIAÇÃO
 **************************/

// CREATE
export const createFormularioAvaliacao = async (tenantSlug, formularioData) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) return false;
  
      const response = await req.post(
        `/private/${tenantSlug}/formularios-avaliacao`,
        formularioData,
        { headers }
      );
  
      return response.data.formularioAvaliacao; // <- veio assim no controller
    } catch (error) {
      console.error("Erro ao criar formulário de avaliação:", error);
      throw error;
    }
  };
  
  // UPDATE
  export const updateFormularioAvaliacao = async (
    tenantSlug,
    formularioAvaliacaoId,
    formularioData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) return false;
  
      const response = await req.put(
        `/private/${tenantSlug}/formularios-avaliacao/${formularioAvaliacaoId}`,
        formularioData,
        { headers }
      );
  
      return response.data.formularioAvaliacao;
    } catch (error) {
      console.error("Erro ao atualizar formulário de avaliação:", error);
      throw error;
    }
  };
  
  // DELETE
  export const deleteFormularioAvaliacao = async (tenantSlug, formularioAvaliacaoId) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) return false;
  
      const response = await req.delete(
        `/private/${tenantSlug}/formularios-avaliacao/${formularioAvaliacaoId}`,
        { headers }
      );
  
      return response.data; // geralmente só status / message
    } catch (error) {
      console.error("Erro ao deletar formulário de avaliação:", error);
      throw error;
    }
  };
  
  // LIST
  export const getFormulariosAvaliacao = async (tenantSlug) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) return false;
  
      const response = await req.get(
        `/private/${tenantSlug}/formularios-avaliacao`,
        { headers }
      );
  
      return response.data.formulariosAvaliacao;
    } catch (error) {
      console.error("Erro ao obter formulários de avaliação:", error);
      throw error;
    }
  };
  
  // GET (detalhe)
  export const getFormularioAvaliacao = async (tenantSlug, idFormulario) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) return false;
  
      const response = await req.get(
        `/private/${tenantSlug}/formularios-avaliacao/${idFormulario}`,
        { headers }
      );
  
      return response.data.formularioAvaliacao;
    } catch (error) {
      if (error.response?.status === 404) {
        console.error("Formulário de avaliação não encontrado:", error);
        return null;
      }
      console.error("Erro ao obter formulário de avaliação:", error);
      throw error;
    }
  };
  
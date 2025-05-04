import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

/************************** 
 * EDITAL
**************************/
export const createEdital = async (tenantSlug, editalData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(`/private/${tenantSlug}/edital`, editalData, {headers});
    return response.data.edital;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Edital não cadastrado:', error);
      return null;
    }
    console.error('Erro ao cadastrar edital:', error);
    throw error;
  }
};

export const updateEdital = async (tenantSlug, editalId, editalData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(`/private/${tenantSlug}/edital/${editalId}`, editalData, {headers});
    return response.data.edital;
  } catch (error) {
    console.error('Erro ao atualizar edital:', error);
    throw error;
  }
};

export const deleteEdital = async (tenantSlug, editalId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(`/private/${tenantSlug}/edital/${editalId}`, {headers});
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar edital:', error);
    throw error;
  }
};

export const getEditais = async (tenantSlug, ano = null) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    
    const params = {};
    if (ano !== null) {
      params.ano = ano;
    }

    const response = await req.get(`/private/${tenantSlug}/edital`, { 
      headers,
      params 
    });
    
    return response.data.editais;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Editais não encontrados:', error);
      return null;
    }
    console.error('Erro ao obter os editais:', error);
    throw error;
  }
};



export const getEdital = async (tenantSlug, editalId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/edital/${editalId}`, {headers});
    return response.data.edital;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Edital não encontrado:', error);
      return null;
    }
    console.error('Erro ao obter o edital:', error);
    throw error;
  }
};
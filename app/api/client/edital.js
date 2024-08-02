import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';



/************************** 
 * EDITAL
**************************/
export const createEdital = async (tenantSlug, editalData) => {
  
  try {
    const headers = getAuthHeadersClient();
    console.log(headers)
    if (!headers) return false;
      const response = await req.post(`/private/${tenantSlug}/edital`, editalData, {
        headers,
      });
      
    return response.data;
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
    const token = getCookie('authToken');
    if (!token) {
      return false;
    }
    const response = await req.put(`/private/${tenantSlug}/edital/${editalId}`, editalData, {
      headers: {
        "Authorization": `Token ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar edital:', error);
    throw error;
  }
};

export const deleteEdital = async (tenantSlug, editalId) => {
  try {
    const token = getCookie('authToken');
    if (!token) {
      return false;
    }
    const response = await req.delete(`/private/${tenantSlug}/edital/${editalId}`, {
      headers: {
        "Authorization": `Token ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar edital:', error);
    throw error;
  }
};

export const getEditais = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/edital`, { headers });
    return response.data.data.editais;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Editais não encontrados:', error);
      return null;
    }
    console.error('Erro ao obter os editais:', error);
    throw error;
  }
};//VALIDADO

export const getEdital = async (tenantSlug, editalId) => {
  try {
    const token = getCookie('authToken');
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/edital/${editalId}`, {
      headers: {
        "Authorization": `Token ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Edital não encontrado:', error);
      return null;
    }
    console.error('Erro ao obter o edital:', error);
    throw error;
  }
};
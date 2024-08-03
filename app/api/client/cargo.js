import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';
/**************************
 * CARGO
 **************************/
export const createCargo = async (tenantSlug, data) => {
  console.log(data)
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(`/private/${tenantSlug}/cargo`, data, {
      headers,
    });
      
    return response.data.cargo;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Edital não cadastrado:', error);
      return null;
    }
    console.error('Erro ao cadastrar edital:', error);
    throw error;
  }
};
  export const getCargos = async (tenantSlug) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) return false;
      const response = await req.get(`/private/${tenantSlug}/cargos`, {
        headers,
      });
      console.log(response)
      return response.data.cargos;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error("Cargos não encontrados:", error);
        return null;
      }
      console.error("Erro ao obter os cargos:", error);
      throw error;
    }
  }; 
  
  export const deleteCargo = async (tenantSlug, cargoId) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.delete(`/private/${tenantSlug}/cargo/${cargoId}`, {
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

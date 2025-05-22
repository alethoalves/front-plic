import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';
/**************************
 * CARGO
 **************************/
export const createCargo = async (tenantSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(`/private/${tenantSlug}/cargo`, data, {headers});
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
export const updateCargo = async (tenantSlug, data) => {
  try {
    console.log(data)
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(`/private/${tenantSlug}/cargo/${data.id}`, data, {headers});
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
export const getCargos = async (tenantSlug, filters = {}) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    // Cria um objeto URLSearchParams para adicionar as queries de filtro
    const queryParams = new URLSearchParams();

    // Adiciona as queries ao objeto URLSearchParams, se existirem
    if (filters.cargo) {
      queryParams.append('cargo', filters.cargo);
    }
    if (filters.nivel) {
      queryParams.append('nivel', filters.nivel);
    }
    if (filters.ano) {
      queryParams.append('ano', filters.ano);
    }
    console.log(filters)

    // Constrói a URL com as queries, se houver
    const url = `/private/${tenantSlug}/cargos${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    // Faz a requisição com a URL construída
    const response = await req.get(url, { headers });

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
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(`/private/${tenantSlug}/cargo/${cargoId}`, {headers});
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar edital:', error);
    throw error;
  }
};

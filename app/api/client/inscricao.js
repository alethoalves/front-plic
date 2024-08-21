import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';


/**************************
 * INSCRICAO
 **************************/
export const createInscricao = async (tenantSlug, inscricaoData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(
      `/private/${tenantSlug}/inscricoes`,
      inscricaoData,
      {headers}
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar inscrição:", error);
    throw error;
  }
};

export const getInscricoes = async (tenantSlug, page = 1, limit = 10, search="") => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/inscricoes?page=${page}&limit=${limit}&search=${search}`,
      {headers}
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao obter as inscrições:", error);
    throw error;
  }
};

export const getAllInscricoes = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/allInscricoes`, 
      {headers}
    );
    return response.data.inscricoes;
  } catch (error) {
    console.error("Erro ao obter as inscrições:", error);
    throw error;
  }
};

export const getInscricao = async (tenantSlug, idInscricao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/inscricoes/${idInscricao}`,
      {headers}
    );
    return response.data.inscricao;
  } catch (error) {
    console.error("Erro ao obter a inscrição:", error);
    throw error;
  }
};

export const updateInscricao = async (
  tenantSlug,
  idInscricao,
  inscricaoData
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(
      `/private/${tenantSlug}/inscricoes/${idInscricao}`,
      inscricaoData,
      {headers}
    );
    return response.data.inscricao;
  } catch (error) {
    console.error("Erro ao atualizar a inscrição:", error);
    throw error;
  }
};

export const deleteInscricao = async (tenantSlug, idInscricao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(
      `/private/${tenantSlug}/inscricoes/${idInscricao}`,
      {headers}
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar a inscrição:", error);
    throw error;
  }
};

export const searchInscricoes = async (tenantSlug, query) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/inscricoes/search?query=${query}`,
      {headers}
    );
    return response.data.inscricoes;
  } catch (error) {
    console.error("Erro ao buscar inscrições:", error);
    throw error;
  }
};

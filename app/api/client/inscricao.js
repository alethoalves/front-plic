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
export const submissaoInscricao = async (tenantSlug, inscricaoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/inscricoes/${inscricaoId}/submissaoInscricao`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao submeter inscrição:", error);
    throw error;
  }
};
export const reabrirInscricao = async (tenantSlug, inscricaoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    // PUT /private/:tenantSlug/inscricoes/:inscricaoId/reabrir
    const response = await req.put(
      `/private/${tenantSlug}/inscricoes/${inscricaoId}/reabrir`,
      {},          // corpo vazio
      { headers }  // cabeçalhos com token
    );

    return response.data; // { status, message, inscricao }
  } catch (error) {
    console.error("Erro ao reabrir inscrição:", error);
    throw error;
  }
};
export const createInscricaoByUser = async (tenantSlug, inscricaoData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(
      `/private/${tenantSlug}/inscricoesByUser`,
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

export const getMinhasInscricoes = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/inscricoes/getMinhasInscricoes`, 
      {headers}
    );
    return response.data.inscricoes;
  } catch (error) {
    console.error("Erro ao obter as inscrições:", error);
    throw error;
  }
};

export const getInscricaoUserById = async (tenantSlug,inscricaoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/getInscricaoUserById/${inscricaoId}`, 
      {headers}
    );
    return response.data.inscricao;
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

export const inscricoesDashboard = async (tenantSlug, { statusInscricao, editalAno, editalTitulo }) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    // Monta o objeto de query params
    const query = {};
    if (statusInscricao) query.statusInscricao = statusInscricao;
    if (editalAno) query.editalAno = editalAno;
    if (editalTitulo) query.editalTitulo = editalTitulo;

    // Monta a URL da requisição, incluindo as query params dinâmicas
    const response = await req.get(
      `/private/${tenantSlug}/dashboard/inscricoes?${new URLSearchParams(query).toString()}`,
      { headers }
    );

    // Retorna os dados de inscrições da resposta da API
    return response.data.inscricoes;
  } catch (error) {
    console.error("Erro ao buscar dashboard de inscrições:", error);
    throw error;
  }
};

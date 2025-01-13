import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
PROJETO
**************************/
export const createProjeto = async (
  tenantSlug,
  projetoData
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/projeto`,
      projetoData,
      { headers }
    );
    return response.data.projeto;
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    throw error;
  }
};
export const createProjetoInscricao = async (
    tenantSlug,
    idInscricao,
    projetoData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.post(
        `/private/${tenantSlug}/projetoInscricao/${idInscricao}`,
        projetoData,
        { headers }
      );
      return response.data.projeto;
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      throw error;
    }
  };
  
// Obter os projetos do usuário autenticado
export const getProjetosDoUsuario = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/projetosDoUsuario`, {
      headers,
    });
    return response.data.projetos;
  } catch (error) {
    console.error("Erro ao obter projetos do usuário:", error);
    throw error;
  }
};
// Obter os detalhes de um projeto pelo ID
export const getProjetoById = async (tenantSlug, projetoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/projeto/${projetoId}`,
      { headers }
    );
    return response.data.projeto;
  } catch (error) {
    console.error("Erro ao obter os detalhes do projeto:", error);
    throw error;
  }
};
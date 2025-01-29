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

// Atualizar os detalhes de um projeto pelo ID
export const updateProjetoById = async (tenantSlug, projetoId, projetoData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/projeto/${projetoId}`,
      projetoData,
      { headers }
    );
    return response.data.projeto; // Retorna o projeto atualizado
  } catch (error) {
    console.error("Erro ao atualizar os detalhes do projeto:", error);
    throw error;
  }
};
export const linkProjetoToInscricao = async (tenantSlug, idInscricao, idProjeto) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      throw new Error("Usuário não autenticado.");
    }
    const response = await req.post(
      `/private/${tenantSlug}/inscricao/${idInscricao}/projeto/${idProjeto}/link`,
      {},
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao vincular projeto à inscrição:", error);
    throw error;
  }
};

// Verificar se um projeto está vinculado a alguma inscrição
export const isProjetoLinkedToInscricao = async (tenantSlug, projetoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      throw new Error("Usuário não autenticado.");
    }
    const response = await req.get(
      `/private/${tenantSlug}/projeto/${projetoId}/isProjetoLinkedToInscricao`,
      { headers }
    );
    return response.data.linked; // Retorna true ou false com base na resposta
  } catch (error) {
    console.error("Erro ao verificar vínculo do projeto com inscrição:", error);
    throw error;
  }
};

// Desvincular um projeto de uma inscrição
export const unlinkProjetoFromInscricao = async (tenantSlug, idInscricao, idProjeto) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      throw new Error("Usuário não autenticado.");
    }

    const response = await req.delete(
      `/private/${idInscricao}/projeto/${idProjeto}/unlink`,
      { headers }
    );

    return response.data; // Retorna a resposta de sucesso da API
  } catch (error) {
    console.error("Erro ao desvincular projeto da inscrição:", error);
    throw error;
  }
};
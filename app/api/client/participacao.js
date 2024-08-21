import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * PARTICIPACAO
 **************************/
export const getParticipacoes = async (tenantSlug, idInscricao, tipos) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const tipoParam = tipos ? `&tipo=${tipos.join(',')}` : '';

    const response = await req.get(
      `/private/${tenantSlug}/participacoes?inscricaoId=${idInscricao}${tipoParam}`,
      { headers }
    );
    return response.data.participacoes;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participações não encontradas:", error);
      return null;
    }
    console.error("Erro ao obter as participações:", error);
    throw error;
  }
};

export const createParticipacao = async (tenantSlug, participacaoData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/participacoes`,
      participacaoData,
      { headers }
    );
    return response.data.participacao;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participação não criada:", error);
      return null;
    }
    console.error("Erro ao criar participação:", error);
    throw error;
  }
};

export const updateParticipacao = async (
  tenantSlug,
  idParticipacao,
  participacaoData
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/participacoes/${idParticipacao}`,
      participacaoData,
      { headers }
    );
    return response.data.participacao;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participação não atualizada:", error);
      return null;
    }
    console.error("Erro ao atualizar participação:", error);
    throw error;
  }
};
export const inativarParticipacao = async (
  tenantSlug,
  idParticipacao,
  fim
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/participacoes/inativar/${idParticipacao}`,{fim},
      { headers }
    );
    return response.data.participacao;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participação não atualizada:", error);
      throw error;
    }
    console.error("Erro ao atualizar participação:", error);
    throw error;
  }
};
export const deleteParticipacao = async (tenantSlug, idParticipacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/participacoes/${idParticipacao}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participação não deletada:", error);
      return null;
    }
    console.error("Erro ao deletar participação:", error);
    throw error;
  }
};
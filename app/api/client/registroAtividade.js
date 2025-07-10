import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * REGISTRO ATIVIDADE
 **************************/
export const aprovarAtividade = async (
  tenantSlug,
  registroAtividadeId
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/aprovar-atividade/${registroAtividadeId}`,
      { headers }
    );
    return response.data.registroAtividade;
  } catch (error) {
    console.error("Erro ao atualizar Registro de Atividade:", error);
    throw error;
  }
};

export const submissaoAtividade = async (
  tenantSlug,
  payload,
  registroAtividadeId
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/user/submissaoAtividade/${registroAtividadeId}`,
      payload,
      { headers }
    );
    return response.data.registroAtividade;
  } catch (error) {
    console.error("Erro ao criar Registro de Atividade:", error);
    throw error;
  }
};

export const createRegistroAtividade = async (
    tenantSlug,
    atividadeId,
    registroAtividadeData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.post(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades`,
        registroAtividadeData,
        { headers }
      );
      return response.data.registroAtividade;
    } catch (error) {
      console.error("Erro ao criar Registro de Atividade:", error);
      throw error;
    }
  };
  
  export const getRegistroAtividades = async (tenantSlug, atividadeId) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades`,
        {
          headers,
          params: { atividadeId },
        }
      );
      return response.data.registrosAtividade;
    } catch (error) {
      console.error("Erro ao obter Registros de Atividade:", error);
      throw error;
    }
  };

  export const getRegistroAtividadesOrientador = async (tenantSlug) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/orientador/atividadesOrientador`,
        {
          headers,
          
        }
      );
      return response.data.inscricoes;
    } catch (error) {
      console.error("Erro ao obter Registros de Atividade:", error);
      throw error;
    }
  };

  export const getRegistroAtividadesByCpfEditaisVigentes = async (tenantSlug) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/user/registroAtividadesByCPF`,
        {
          headers,
          
        }
      );
      return response.data.registrosAtividade;
    } catch (error) {
      console.error("Erro ao obter Registros de Atividade:", error);
      throw error;
    }
  };
  
  export const countRegistroAtividadesWithStatusNaoEntregueByCPF = async (tenantSlug) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/participante/count/registroAtividadesByCpf/status/naoEntregue`,
        {
          headers,
        }
      );
      return response.data.registrosAtividade;
    } catch (error) {
      console.error("Erro ao obter Registros de Atividade:", error);
      throw error;
    }
  };
  export const getRegistroAtividade = async (tenantSlug, atividadeId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
        { headers }
      );
      return response.data.registroAtividade;
    } catch (error) {
      console.error("Erro ao obter Registro de Atividade:", error);
      throw error;
    }
  };
  
  export const updateRegistroAtividade = async (
    tenantSlug,
    atividadeId,
    id,
    registroAtividadeData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
        registroAtividadeData,
        { headers }
      );
      return response.data.registroAtividade;
    } catch (error) {
      console.error("Erro ao atualizar Registro de Atividade:", error);
      throw error;
    }
  };
  
  export const deleteRegistroAtividade = async (tenantSlug, atividadeId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.delete(
        `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao deletar Registro de Atividade:", error);
      throw error;
    }
  };

  export const registroAtividadesDashboard = async (tenantSlug, { statusAtividade, editalAno, editalTitulo, idFormularioAtividade, searchValue }) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) return false;
  
      // Monta o objeto de query params
      const query = {};
      if (statusAtividade) query.statusAtividade = statusAtividade;
      if (editalAno) query.editalAno = editalAno;
      if (editalTitulo) query.editalTitulo = editalTitulo;
      if (idFormularioAtividade) query.idFormularioAtividade = idFormularioAtividade;
      if (searchValue) query.searchValue = searchValue;

      // Monta a URL da requisição, incluindo as query params dinâmicas
      const response = await req.get(
        `/private/${tenantSlug}/dashboard/registroDeAtividades?${new URLSearchParams(query).toString()}`,
        { headers }
      );
  
      // Retorna os dados de inscrições da resposta da API
      return response.data.atividades;
    } catch (error) {
      console.error("Erro ao buscar dashboard de inscrições:", error);
      throw error;
    }
  };
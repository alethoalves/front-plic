import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * BOLSA
 **************************/
export const getSolicitacoesBolsa = async (tenantSlug, ano) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.get(
      `/private/${tenantSlug}/bolsas/${ano}`,
      { headers }
    );
    return response.data.solicitacoes;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participações não encontradas:", error);
      return null;
    }
    console.error("Erro ao obter as participações:", error);
    throw error;
  }
};

export const getVinculosByTenant = async (tenantSlug, ano) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.get(
      `/private/${tenantSlug}/${ano}/getVinculosByTenant`,
      { headers }
    );
    return response.data.vinculos;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Vínculos não encontrados:", error);
      return null;
    }
    console.error("Erro ao obter os vínculos:", error);
    throw error;
  }
};

export const aplicarNotaCorteBolsa = async (tenantSlug, notaCorte, classificados, desclassificados) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      throw new Error("Token de autenticação não encontrado");
    }

    const response = await req.put(
      `/private/${tenantSlug}/solicitacoesBolsa/aplicarNotaDeCorte`,
      {
        notaCorte,
        classificados,
        desclassificados
      },
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao aplicar nota de corte:", error);
    throw error;
  }
};

export const aprovarSolicitacoesBolsa = async (tenantSlug, solicitacoesIds) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/aprovarSolicitacaoBolsa`,
      { solicitacoesIds },
      { headers }
    );
    
    return response.data.solicitacoes;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Solicitações não encontradas:", error);
      return null;
    }
    console.error("Erro ao aprovar solicitações:", error);
    throw error;
  }
};

export const negarSolicitacoesBolsa = async (tenantSlug, solicitacoesIds, justificativa) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/negarSolicitacaoBolsa`,
      { solicitacoesIds, justificativa },
      { headers }
    );
    
    return response.data.solicitacoes;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Solicitações não encontradas:", error);
      return null;
    }
    console.error("Erro ao reprovar solicitações:", error);
    throw error;
  }
};
export const toggleStatusSolicitacaoBolsa = async (tenantSlug, solicitacaoBolsaId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/solicitacao-bolsa/toggleStatus`,
      { solicitacaoBolsaId },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        console.error("Solicitação não encontrada:", error);
        throw new Error("Solicitação de bolsa não encontrada");
      }
      if (error.response.status === 400) {
        console.error("Não há cota vinculada:", error);
        throw new Error("Não é possível alterar o status sem cota vinculada");
      }
      if (error.response.status === 403) {
        console.error("Permissão negada:", error);
        throw new Error("Você não tem permissão para esta ação");
      }
    }
    console.error("Erro ao alternar status da solicitação:", error);
    throw error;
  }
};
export const aprovarVinculo = async (tenantSlug, vinculoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/aprovar-vinculo`,
      { vinculoId },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Erro na vinculação:", error);
      return null;
    }
    console.error("Erro ao vincular:", error);
    throw error;
  }
};
export const recusarVinculo = async (tenantSlug, vinculoId, motivoRecusa) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/recusar-vinculo`,
      { vinculoId, motivoRecusa },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Erro na vinculação:", error);
      return null;
    }
    console.error("Erro ao vincular:", error);
    throw error;
  }
};
export const ativarVinculo = async (tenantSlug, vinculoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/ativar-vinculo`,
      { vinculoId },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Erro na ativacão:", error);
      return null;
    }
    console.error("Erro ao ativar:", error);
    throw error;
  }
};
export const tornarPendenteVinculo = async (tenantSlug, vinculoId, observacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/tornar-pendente-vinculo`,
      { vinculoId, observacao },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Erro na ativacão:", error);
      return null;
    }
    console.error("Erro ao ativar:", error);
    throw error;
  }
};
export const cancelarVinculo = async (tenantSlug, vinculoId, observacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/cancelar-vinculo`,
      { vinculoId, observacao },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Erro na ativacão:", error);
      return null;
    }
    console.error("Erro ao ativar:", error);
    throw error;
  }
};

export const devolverBolsa = async (tenantSlug, solicitacaoBolsaId, observacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await await req.put(
      `/private/${tenantSlug}/devolver-bolsa`,
      { solicitacaoBolsaId, observacao },
      { headers }
  
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Erro na ativacão:", error);
      return null;
    }
    console.error("Erro ao ativar:", error);
    throw error;
  }
};
export const transferirBolsa = async (tenantSlug, vinculoOrigemId, participacaoDestinoId, observacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/transferir-bolsa`,
      { vinculoOrigemId, participacaoDestinoId, observacao },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Erro na ativacão:", error);
      return null;
    }
    console.error("Erro ao ativar:", error);
    throw error;
  }
};
/**************************
 * COTAS
 **************************/
export const alocarBolsa = async (tenantSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/alocar-bolsa`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao alocar bolsa:", error);
    throw error;
  }
};

export const desalocarBolsa = async (tenantSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/desalocar-bolsa`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao desalocar bolsa:", error);
    throw error;
  }
};
export const createCota = async (tenantSlug, cotaData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.post(
      `/private/${tenantSlug}/cotas`,
      cotaData,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Erro ao criar cota:", error);
    throw error;
  }
};

export const getCotas = async (tenantSlug, ano) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.get(
      `/private/${tenantSlug}/cotas/${ano}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Cotas não encontradas:", error);
      return null;
    }
    console.error("Erro ao obter cotas:", error);
    throw error;
  }
};

export const getCota = async (tenantSlug, id) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.get(
      `/private/${tenantSlug}/cota/${id}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Cota não encontrada:", error);
      return null;
    }
    console.error("Erro ao obter cota:", error);
    throw error;
  }
};

export const updateCota = async (tenantSlug, id, cotaData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const {titulo,quantidadeBolsas,ano,instituicaoPagadora,status} = cotaData
    const response = await req.put(
      `/private/${tenantSlug}/cotas/${id}`,
      {titulo,quantidadeBolsas,ano,instituicaoPagadora,status},
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar cota:", error);
    throw error;
  }
};

export const deleteCota = async (tenantSlug, id) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.delete(
      `/private/${tenantSlug}/cotas/${id}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir cota:", error);
    throw error;
  }
};
/**************************
 * PROCESSAMENTO DE SOLICITAÇÕES
 **************************/
export const processarSolicitacoesBolsa = async (tenantSlug, solicitacoesIds) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/processar-solicitacoes`,
      { ids: solicitacoesIds }, // Note que o parâmetro na API é "ids"
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400) {
        console.error("IDs inválidos ou limite excedido:", error);
        throw new Error(error.response.data.message || "IDs inválidos ou limite excedido");
      }
      if (error.response.status === 403) {
        console.error("Permissão negada ou IDs não pertencem ao tenant:", error);
        throw new Error(error.response.data.message || "Permissão negada ou IDs inválidos");
      }
      if (error.response.status === 404) {
        console.error("Endpoint não encontrado:", error);
        throw new Error("Endpoint de processamento não encontrado");
      }
    }
    console.error("Erro ao processar solicitações:", error);
    throw error;
  }
};
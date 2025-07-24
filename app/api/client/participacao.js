import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * PARTICIPACAO
 **************************/
export const getParticipacoes = async (tenantSlug, idInscricao, tipos, cpf, nome, status, editalId, page = 1, limit = 300) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const queryParams = new URLSearchParams();

    // Verifica cada parâmetro e adiciona ao queryParams se estiver presente
    if (idInscricao) queryParams.append('inscricaoId', idInscricao);
    if (tipos && tipos.length > 0) queryParams.append('tipo', tipos.join(','));
    if (cpf) queryParams.append('cpf', cpf);
    if (nome) queryParams.append('nome', nome);
    if (status) queryParams.append('status', status);
    if (editalId) queryParams.append('editalId', editalId);
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    const queryString = queryParams.toString();

    const response = await req.get(
      `/private/${tenantSlug}/participacoes?${queryString}`,
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

export const getParticipacao = async (tenantSlug, idParticipacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/participacoes/${idParticipacao}`,
      { headers }
    );
    return response.data.participacao;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participações não encontradas:", error);
      return null;
    }
    console.error("Erro ao obter as participações:", error);
    throw error;
  }
};

export const getParticipacoesDashboard = async (tenantSlug, idInscricao, tipos, cpf, nome, status, editalId, page = 1, limit = 300) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const queryParams = new URLSearchParams();

    // Verifica cada parâmetro e adiciona ao queryParams se estiver presente
    if (idInscricao) queryParams.append('inscricaoId', idInscricao);
    if (tipos && tipos.length > 0) queryParams.append('tipo', tipos.join(','));
    if (cpf) queryParams.append('cpf', cpf);
    if (nome) queryParams.append('nome', nome);
    if (status) queryParams.append('status', status);
    if (editalId) queryParams.append('editalId', editalId);
    queryParams.append('page', page);
    queryParams.append('limit', limit);

    const queryString = queryParams.toString();

    const response = await req.get(
      `/private/${tenantSlug}/dashboard/participacoes?${queryString}`,
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

export const getParticipacoesByTenant = async (tenantSlug, tipo, ano, solicitarBolsa) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    // Configurar os parâmetros de consulta (query params)
    const params = {};
    if (tipo) params.tipo = tipo; // Adicionar tipo, se fornecido
    if (ano) params.ano = ano;   // Adicionar ano, se fornecido
    if (solicitarBolsa) params.solicitarBolsa = solicitarBolsa;

    // Fazer a chamada à API com os parâmetros de consulta
    const response = await req.get(
      `/private/${tenantSlug}/getParticipacoesByTenant`,
      { 
        headers,
        params, // Passar os parâmetros de consulta
      }
    );

    // Retornar as participações
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
/**************************
 * APROVAR/REPROVAR PARTICIPAÇÕES
 **************************/
export const aprovarParticipacoes = async (tenantSlug, participacaoIds) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/aprovar/participacao`,
      { participacaoIds },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participações não encontradas:", error);
      return null;
    }
    console.error("Erro ao aprovar participações:", error);
    throw error;
  }
};

export const reprovarParticipacoes = async (tenantSlug, participacaoIds, justificativa) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/reprovar/participacao`,
      { participacaoIds, justificativa },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participações não encontradas:", error);
      return null;
    }
    console.error("Erro ao reprovar participações:", error);
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
export const ativarParticipacao = async (tenantSlug, idParticipacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/participacoes/ativar/${idParticipacao}`,
      {}, // Não precisa de body para esta requisição
      { headers }
    );
    return response.data.participacao;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participação não encontrada:", error);
      throw error;
    }
    console.error("Erro ao ativar participação:", error);
    throw error;
  }
};
export const inativarParticipacao = async (
  tenantSlug,
  idParticipacao,
  { fim, justificativa }
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      throw new Error('Não autenticado');
    }

    const response = await req.put(
      `/private/${tenantSlug}/participacoes/inativar/${idParticipacao}`,
      { fim, justificativa },
      { headers }
    );

    return response.data.participacao;
  } catch (error) {
    // Tratamento específico para erros 400 (validação)
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.message || 'Dados inválidos para inativação';
      throw new Error(errorMessage);
    }

    // Tratamento específico para erro 404 (não encontrado)
    if (error.response?.status === 404) {
      throw new Error('Participação não encontrada');
    }

    // Tratamento específico para erro 403 (sem permissão)
    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para inativar esta participação');
    }

    // Tratamento para outros erros
    console.error("Erro ao inativar participação:", error);
    throw new Error(error.response?.data?.message || 'Erro ao inativar participação');
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

export const validarParticipacao = async (tenantSlug, idParticipacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.put(
      `/private/${tenantSlug}/participacoes/validar/${idParticipacao}`,
      {}, // Não há necessidade de enviar um body para essa requisição
      { headers }
    );

    return response.data.participacao;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participação não encontrada ou não pertence ao tenant:", error);
      return null;
    }

    console.error("Erro ao validar participação:", error);
    throw error;
  }
};

/**************************
 * SUBSTITUIR PARTICIPAÇÃO DE ALUNO
 **************************/
export const substituirAlunoParticipacao = async (
  tenantSlug,
  participacaoId,
  userId,
  motivo,
  dataInicio
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      throw new Error('Não autenticado');
    }

    const response = await req.put(
      `/private/${tenantSlug}/substituicao/aluno`,
      { participacaoId, userId, motivo, dataInicio },
      { headers }
    );

    return response.data;
  } catch (error) {
    // Tratamento específico para erros 400 (validação)
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.message || 'Dados inválidos para substituição';
      throw new Error(errorMessage);
    }

    // Tratamento específico para erro 404 (não encontrado)
    if (error.response?.status === 404) {
      throw new Error('Participação ou usuário não encontrado');
    }

    // Tratamento específico para erro 403 (sem permissão)
    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para realizar esta substituição');
    }

    // Tratamento para outros erros
    console.error("Erro ao substituir participação de aluno:", error);
    throw new Error(error.response?.data?.message || 'Erro ao substituir participação de aluno');
  }
};

export const ativarOuPendenteParticipacao = async (
  tenantSlug,
  participacaoId,
  observacao = null,
  date
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      throw new Error('Não autenticado');
    }

    // O corpo da requisição só inclui observação se estiver definida
    const body = observacao ? { observacao } : {};

    const response = await req.put(
      `/private/${tenantSlug}/ativar-pendente/participacao/${participacaoId}/${date}`,
      body,
      { headers }
    );

    return response.data;
  } catch (error) {
    // Tratamento específico para erros 400 (validação)
    if (error.response?.status === 400) {
      const errorMessage = error.response.data?.message || 'Dados inválidos para alteração de status';
      throw new Error(errorMessage);
    }

    // Tratamento específico para erro 404 (não encontrado)
    if (error.response?.status === 404) {
      throw new Error('Participação não encontrada');
    }

    // Tratamento específico para erro 403 (sem permissão)
    if (error.response?.status === 403) {
      throw new Error('Você não tem permissão para alterar o status desta participação');
    }

    // Tratamento para outros erros
    console.error("Erro ao alterar status da participação:", error);
    throw new Error(error.response?.data?.message || 'Erro ao alterar status da participação');
  }
};

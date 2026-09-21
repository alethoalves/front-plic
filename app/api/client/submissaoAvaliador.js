import { getAuthHeadersClientAvaliador } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';


  //AVALIADOR

  export const getSubmissoesSemAvaliacao = async (eventoId, areasIds = []) => {
    try {
        const headers = getAuthHeadersClientAvaliador();
        if (!headers) {
            return false;
        }

        // Verifica se há áreas passadas e constrói a URL com query params, se necessário
        let url = `/evenplic/evento/${eventoId}/getSubmissoesSemAvaliacao`;
        if (areasIds.length > 0) {
            const query = areasIds.join(','); // Transforma o array de IDs em uma string separada por vírgulas
            url += `?areas=${query}`; // Adiciona os query params à URL
        }

        const response = await req.get(url, { headers });
        return response.data.submissoes;
    } catch (error) {
        console.error("Erro ao atualizar campo:", error.message);
        throw error;
    }
};

export const getSubmissoesEmAvaliacao = async (eventoId, areasIds = []) => {
  try {

    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/getSubmissoesEmAvaliacao`,
      { headers }
    );
    return response.data.submissoes;
      
  } catch (error) {
      console.error("Erro ao atualizar campo:", error.message);
      throw error;
  }
};


export const associarAvaliadorSubmissao = async (eventoId, idSubmissao) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/associarAvaliadorSubmissao/${idSubmissao}`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error.message);
      throw error;
  }
};

export const getResumo = async (eventoId, submissaoId, tenantId) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/getResumo/${submissaoId}/${tenantId}`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error.message);
      throw error;
  }
};

export const desvincularAvaliadorSubmissao = async (eventoId, idSubmissao) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/desvincularAvaliadorSubmissao/${idSubmissao}`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error.message);
      throw error;
  }
};

export const desvincularAvaliadorSubmissaoPeloGestor = async (eventoId, idSubmissao) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/desvincularAvaliadorSubmissaoPeloGestor/${idSubmissao}`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error.message);
      throw error;
  }
};

export const gerarFeedback = async (
  titulo,resumo, fichaAvaliacao,eventoId
) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/evenplic/evento/${eventoId}/gerarFeedback`,
      {titulo,resumo,fichaAvaliacao},
      { headers }
    );
    return response.data.feedback;
  } catch (error) {
    console.error("Erro ao atualizar campo:", error.message);
    throw error;
  }
};

export const processarAvaliacao = async (
  eventoId,body
) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/evenplic/evento/${eventoId}/processarAvaliacao`,
      body,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar campo:", error.message);
    throw error;
  }
};

// WIZARD MOBILE DO AVALIADOR (tela /avaliar) — endpoints novos e
// enxutos, não usados pela tela antiga (avaliacoes/page.jsx).

export const getAreasPendentesWizard = async (eventoId) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/avaliador/wizard/areas`,
      { headers }
    );
    return response.data.areas;
  } catch (error) {
      console.error("Erro ao buscar áreas pendentes:", error.message);
      throw error;
  }
};

export const atribuirTrabalhoWizard = async (eventoId, areasIds = [], excluirSubmissaoId = null) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const query = [];
    if (areasIds.length > 0) {
      query.push(`areas=${areasIds.join(',')}`);
    }
    if (excluirSubmissaoId) {
      // Usado pelo "Atribuir outro trabalho": exclui a submissão que acabou
      // de ser devolvida, senão ela costuma voltar a ser a próxima candidata.
      query.push(`excluir=${excluirSubmissaoId}`);
    }
    const url = `/evenplic/evento/${eventoId}/avaliador/wizard/atribuir${query.length ? `?${query.join('&')}` : ''}`;
    const response = await req.get(url, { headers });
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atribuir trabalho automaticamente:", error.message);
      throw error;
  }
};

// Sem eventoId: consultado a partir da tela /avaliador (antes de saber em
// qual evento o avaliador está) pra descobrir se ele já tem uma submissão
// em avaliação em algum evento e pular direto pro wizard, sem repetir
// CPF+"avaliar agora".
export const getTrabalhoEmAndamentoAvaliador = async () => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return null;
    }
    const response = await req.get(
      `/evenplic/avaliador/wizard/em-andamento`,
      { headers }
    );
    return response.data.emAndamento;
  } catch (error) {
    console.error("Erro ao buscar trabalho em andamento:", error.message);
    return null;
  }
};

export const getFichasAvaliacoesEvento = async (edicaoEventoSlug) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/fichas-avaliacao-evento/${edicaoEventoSlug}`,
      { headers }
    );
    return response.data.avaliacoes;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error.message);
      throw error;
  }
};
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

// "Escolher trabalho específico" quando o avaliador já tem outra submissão
// em avaliação: libera a atual e assume a nova numa única transação atômica
// no backend, em vez de duas chamadas separadas (desvincular + associar)
// que podiam deixar o avaliador travado se a primeira falhasse.
export const trocarSubmissaoAvaliador = async (eventoId, idSubmissao) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/trocarSubmissaoAvaliador/${idSubmissao}`,
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

// "Pedir outro trabalho": libera a submissão que o avaliador tem em mãos
// agora (estado real no banco, não um id lido daqui) sem atribuir nenhuma
// nova ainda. Chamar antes de checar admin/sortear.
export const liberarSubmissaoAtualWizard = async (eventoId) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/avaliador/wizard/liberar-atual`,
      { headers }
    );
    return response.data;
  } catch (error) {
      console.error("Erro ao liberar submissão atual:", error.message);
      throw error;
  }
};

// Se o avaliador ainda tiver uma submissão em mãos, o backend libera ela
// sozinho antes de atribuir a nova (consultando o vínculo real no banco) —
// não precisa informar qual é. `excluirSubmissaoId` é opcional: passe o id
// da submissão recém-devolvida (retorno de `liberarSubmissaoAtualWizard`)
// pra ela não ser sorteada de volta pro mesmo avaliador quando for a única
// candidata da área.
export const atribuirTrabalhoWizard = async (eventoId, areasIds = [], excluirSubmissaoId = null) => {
  try {
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      return false;
    }
    const partesQuery = [];
    if (areasIds.length > 0) partesQuery.push(`areas=${areasIds.join(',')}`);
    if (excluirSubmissaoId) partesQuery.push(`excluirSubmissaoId=${excluirSubmissaoId}`);
    const query = partesQuery.length > 0 ? `?${partesQuery.join('&')}` : '';
    const response = await req.get(
      `/evenplic/evento/${eventoId}/avaliador/wizard/atribuir${query}`,
      { headers }
    );
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
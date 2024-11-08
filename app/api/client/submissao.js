import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';




  
  export const getSubmissaoByIdForAdmin = async (
    eventoSlug,idSubmissao,idSquare
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/evenplic/evento/${eventoSlug}/getSubmissaoByIdForAdmin/${idSubmissao}`,
        
        { headers }
      );
      return response.data.submissao;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

  export const updateSubmissaoStatus = async (
    eventoSlug,idSubmissao,status
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/evenplic/evento/${eventoSlug}/submissao/atualizarStatus/${idSubmissao}`,
        {status},
        { headers }
      );
      return response.data.submissao;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

  
//PUBLICO

export const getSubmissoesFiltered = async (idEvento, searchValue) => {
  try {
    
    const response = await req.get(
      `/evenplic/submissoes/evento/${idEvento}/submissoesFiltered`,
      {
        params: { searchValue }, // Passa o searchValue como query
      }
    );
    return response.data.submissoes;
  } catch (error) {
    console.error("Erro ao atualizar campo:", error);
    throw error;
  }
};

  //AVALIADOR

  export const getSubmissoesSemAvaliacao = async (eventoId, areasIds = []) => {
    try {
        const headers = getAuthHeadersClient();
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
        console.error("Erro ao atualizar campo:", error);
        throw error;
    }
};

export const getSubmissoesEmAvaliacao = async (eventoId, areasIds = []) => {
  try {

    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/getSubmissoesEmAvaliacao`,
      { headers }
    );
    return response.data.submissoes;
      
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};


export const associarAvaliadorSubmissao = async (eventoId, idSubmissao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/associarAvaliadorSubmissao/${idSubmissao}`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const getResumo = async (eventoId, submissaoId, tenantId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/getResumo/${submissaoId}/${tenantId}`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const desvincularAvaliadorSubmissao = async (eventoId, idSubmissao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoId}/desvincularAvaliadorSubmissao/${idSubmissao}`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const gerarFeedback = async (
  titulo,resumo, fichaAvaliacao,eventoId
) => {
  try {
    const headers = getAuthHeadersClient();
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
    console.error("Erro ao atualizar campo:", error);
    throw error;
  }
};

export const processarAvaliacao = async (
  eventoId,body
) => {
  try {
    const headers = getAuthHeadersClient();
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
    console.error("Erro ao atualizar campo:", error);
    throw error;
  }
};

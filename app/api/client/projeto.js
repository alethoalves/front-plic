import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';
const convertToFormData = (data) => {
  const formData = new FormData();

  // Campos simples
  formData.append("titulo", data.titulo);
  formData.append("areaId", data.areaId);
  formData.append("conteudo", data.conteudo);
  formData.append("projetoId", data.projetoId);
  formData.append("envolveHumanos", data.envolveHumanos);
  formData.append("envolveAnimais", data.envolveAnimais);
  // Se o cronograma for necessário, pode ser convertido para JSON
  if (data.cronograma) {
    formData.append("cronograma", JSON.stringify(data.cronograma));
  }

  // Campos dinâmicos
  if (data.camposDinamicos) {
    Object.keys(data.camposDinamicos).forEach((key) => {
      const value = data.camposDinamicos[key];
      const fullKey = `camposDinamicos.${key}`; // Preserva o prefixo
      if (value instanceof FileList && value.length > 0) {
        formData.append(fullKey, value[0]);
      } else {
        formData.append(fullKey, value);
      }
    });
  }

  return formData;
};
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
    const token = getCookie("authToken"); 
    const formData = convertToFormData(projetoData);
    const response = await req.post(
      `/private/${tenantSlug}/projeto`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
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
export const getProjetosDoUsuario = async (tenantSlug, proponenteId = null) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    // Configura os parâmetros da requisição
    const params = {};
    if (proponenteId) {
      params.proponenteId = proponenteId;
    }

    const response = await req.get(`/private/${tenantSlug}/projetosDoUsuario`, {
      headers,
      params // Envia os parâmetros como query string
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
  console.log(projetoData)
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const token = getCookie("authToken"); 
    const formData = convertToFormData(projetoData);
    const response = await req.put(
      `/private/${tenantSlug}/projeto/${projetoId}`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
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
export const getInscricaoProjetoByTenant = async (tenantSlug, status) => {
  try {
      const headers = getAuthHeadersClient();
      if (!headers) {
          throw new Error("Usuário não autenticado.");
      }

      // Define os query parameters
      const params = {};
      if (status) {
          params.status = status; // Adiciona o status como query parameter, se fornecido
      }

      // Faz a requisição GET com os query parameters
      const response = await req.get(`/private/${tenantSlug}/inscricaoProjeto`, {
          headers,
          params // Passa os query parameters aqui
      });

      return response.data.inscricoesProjeto;
  } catch (error) {
      console.error("Erro ao buscar inscrições de projetos por tenant:", error);
      throw error;
  }
};

export const getInscricaoProjetoById = async (tenantSlug, idInscricao,idProjeto) => {
  try {
      const headers = getAuthHeadersClient();
      if (!headers) {
          throw new Error("Usuário não autenticado.");
      }

      const response = await req.get(`/private/${tenantSlug}/inscricaoProjeto/${idInscricao}/${idProjeto}`, { headers });
      return response.data.inscricaoProjeto;
  } catch (error) {
      console.error("Erro ao buscar inscrições de projetos por tenant:", error);
      throw error;
  }
};

export const updateInscricaoProjeto = async (
  tenantSlug,
  idInscricaoProjeto,
  data
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/inscricaoProjeto/${idInscricaoProjeto}`,
      data,
      { headers }
    );
    return response.data.inscricaoProjeto;
  } catch (error) {
    console.error("Erro ao atualizar Registro de Atividade:", error);
    throw error;
  }
};
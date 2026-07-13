import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';
const convertToFormData = (data) => {
  const formData = new FormData();

  // Campos simples
  formData.append("titulo", data.titulo);
  formData.append("areaId", data.areaId);
  if (data.conteudo !== undefined) formData.append("conteudo", data.conteudo);
  if (data.projetoId !== undefined) formData.append("projetoId", data.projetoId);
  formData.append("envolveHumanos", data.envolveHumanos ?? false);
  formData.append("envolveAnimais", data.envolveAnimais ?? false);
  formData.append("envolveOGM", data.envolveOGM ?? false);
  formData.append("envolvePatrimonioGenetico", data.envolvePatrimonioGenetico ?? false);
  formData.append("submetidoComiteEtica", data.submetidoComiteEtica ?? false);
  if (data.numeroCEPCONEP !== undefined && data.numeroCEPCONEP !== null)
    formData.append("numeroCEPCONEP", data.numeroCEPCONEP);
  if (data.numeroSISGEN !== undefined && data.numeroSISGEN !== null)
    formData.append("numeroSISGEN", data.numeroSISGEN);
  if (data.numeroProtocoloEtica !== undefined && data.numeroProtocoloEtica !== null)
    formData.append("numeroProtocoloEtica", data.numeroProtocoloEtica);

  if (data.cronograma) {
    formData.append("cronograma", JSON.stringify(data.cronograma));
  }

  // Campos dinâmicos
  if (data.camposDinamicos) {
    Object.keys(data.camposDinamicos).forEach((key) => {
      const value = data.camposDinamicos[key];
      const fullKey = `camposDinamicos.${key}`;
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
export const getProjetosDoUsuario = async (tenantSlug, proponenteId = null, ano = null, comConteudo = false) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const params = {};
    if (proponenteId) params.proponenteId = proponenteId;
    if (ano) params.ano = ano;
    if (comConteudo) params.comConteudo = true;

    const response = await req.get(`/private/${tenantSlug}/projetosDoUsuario`, {
      headers,
      params,
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

// Excluir um projeto pelo ID
export const deleteProjetoById = async (tenantSlug, projetoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) throw new Error("Usuário não autenticado.");
    const response = await req.delete(
      `/private/${tenantSlug}/projeto/${projetoId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
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
    return { linked: response.data.linked, fichaAvaliacaoId: response.data.fichaAvaliacaoId };
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
export const getInscricaoProjetoByTenant = async (tenantSlug, status, ano) => {
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
      if (ano) {
          params.ano = ano; // Adiciona o ano como query parameter, se fornecido
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
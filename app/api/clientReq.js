import { cpfValidatorSchema } from "@/lib/zodSchemas/cpfValidatorSchema.js";
import { req } from "./axios.js";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { getAuthHeadersClient } from "@/lib/headers.js";
const getAuthToken = () => {
  const token = getCookie("authToken");
  if (!token) return false;
  return token;
};
const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) return false;
  return { Authorization: `Token ${token}` };
};

export const isLogged = async () => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    // Consulta o servidor
    await req.get("/private/isLogged", {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const logout = () => {
  deleteCookie("authToken");
    deleteCookie("userProfiles");
};



export const signup = async (data, reqParams) => {
  try {
    const response = await req.post("/auth/signup", data, {
      params: reqParams,
    });

    if (response.data.success && response.data.success.token) {
      const { token } = response.data.success;
      setCookie("authToken", token, {
        maxAge: 24 * 60 * 60, // 24h
        path: "/", // Opcional: define o caminho do cookie
        //httpOnly: true, // Opcional: define o cookie como acessível apenas via HTTP
        secure: process.env.NODE_ENV === "production", // Opcional: define o cookie como seguro apenas em produção
        sameSite: "Strict", // Opcional: define a política de SameSite para o cookie
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Relança o erro para que o chamador possa tratá-lo
  }
};

export const getTenant = async (reqParams) => {
  try {
    const response = await req.get(`/tenant/${reqParams.slug}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Trata o erro 404 de forma específica
      console.error("Tenant não encontrado:", error);
      return null; // Retorna null ou algum valor padrão para indicar que o tenant não foi encontrado
    }
    // Para outros erros, relança o erro para que o chamador possa tratá-lo
    console.error("Erro ao obter o tenant:", error);
    throw error;
  }
};

export const getDataFromCPF = async (tenantSlug, cpf) => {
  try {
    // Validar o CPF antes de fazer a requisição
    const validation = cpfValidatorSchema.safeParse({ cpf });
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    // Se a validação passar, fazer a requisição
    const response = await req.post(
      `/private/${tenantSlug}/external/getDataFromCPF`,
      { cpf },
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("CPF não encontrado:", error);
      return null; // Retorna null ou algum valor padrão para indicar que o CPF não foi encontrado
    }
    // Para outros erros, relança o erro para que o chamador possa tratá-lo
    console.error("Erro ao obter dados pelo CPF:", error);
    throw error;
  }
};

export const uploadFile = async (file, tenantSlug) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await req.post(
      `/private/${tenantSlug}/external/upload`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};
export const deleteFile = async (tenantSlug, fileUrl) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }

    const formData = { fileUrl };
    console.log(formData);
    const response = await req.post(
      `/private/${tenantSlug}/external/deleteFile`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};
/**************************
 * USER
 **************************/
export const createUser = async (tenantSlug, userData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(`/private/${tenantSlug}/users`, userData, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
};

export const getUsers = async (tenantSlug) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/users`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data.users;
  } catch (error) {
    console.error("Erro ao obter os usuários:", error);
    throw error;
  }
};

export const getUserByCpf = async (tenantSlug, cpf) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/users/${cpf}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao obter o usuário:", error);
    return false;
  }
};

export const updateUser = async (tenantSlug, cpf, userData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/users/${cpf}`,
      userData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

export const deleteUser = async (tenantSlug, cpf) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(`/private/${tenantSlug}/users/${cpf}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    throw error;
  }
};

/**************************
 * CV LATTES
 **************************/
export const createCvLattes = async (tenantSlug, cvLattesData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/cvLattes`,
      cvLattesData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar CV Lattes:", error);
    throw error;
  }
};

export const xmlLattes = async (file, name, tenantSlug) => {
  console.log(`este é o nome passado: ${name}`);
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("nome", name);

    const response = await req.post(
      `/private/${tenantSlug}/external/xmlLattes`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao criar CV Lattes:", error);
    throw error;
  }
};

export const getCvLattes = async (tenantSlug, userId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/cvLattes`, {
      headers: {
        Authorization: `Token ${token}`,
      },
      params: { userId },
    });
    return response.data.cvLattes;
  } catch (error) {
    console.error("Erro ao obter CV Lattes:", error);
    throw error;
  }
};

export const getCvLattesById = async (tenantSlug, id) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/cvLattes/${id}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao obter CV Lattes:", error);
    throw error;
  }
};

export const updateCvLattes = async (tenantSlug, id, cvLattesData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/cvLattes/${id}`,
      cvLattesData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar CV Lattes:", error);
    throw error;
  }
};

export const deleteCvLattes = async (tenantSlug, id) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(`/private/${tenantSlug}/cvLattes/${id}`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar CV Lattes:", error);
    throw error;
  }
};

/**************************
 * EDITAL
 **************************/
export const createEdital = async (tenantSlug, editalData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/edital`,
      editalData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Edital não cadastrado:", error);
      return null;
    }
    console.error("Erro ao cadastrar edital:", error);
    throw error;
  }
};

export const updateEdital = async (tenantSlug, editalId, editalData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/edital/${editalId}`,
      editalData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar edital:", error);
    throw error;
  }
};

export const deleteEdital = async (tenantSlug, editalId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/edital/${editalId}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar edital:", error);
    throw error;
  }
};

export const getEditais = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/edital`, {
      headers,
    });
    return response.data.editais;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Editais não encontrados:", error);
      return null;
    }
    console.error("Erro ao obter os editais:", error);
    throw error;
  }
}; 

export const getEdital = async (tenantSlug, editalId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/edital/${editalId}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Edital não encontrado:", error);
      return null;
    }
    console.error("Erro ao obter o edital:", error);
    throw error;
  }
};

/**************************
 * INSCRICAO
 **************************/
export const createInscricao = async (tenantSlug, inscricaoData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/inscricoes`,
      inscricaoData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar inscrição:", error);
    throw error;
  }
};

export const getInscricoes = async (tenantSlug, page = 1, limit = 10) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/inscricoes?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao obter as inscrições:", error);
    throw error;
  }
};

export const getAllInscricoes = async (tenantSlug) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/allInscricoes`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao obter as inscrições:", error);
    throw error;
  }
};

export const getInscricao = async (tenantSlug, idInscricao) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/inscricoes/${idInscricao}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao obter a inscrição:", error);
    throw error;
  }
};

export const updateInscricao = async (
  tenantSlug,
  idInscricao,
  inscricaoData
) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/inscricoes/${idInscricao}`,
      inscricaoData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar a inscrição:", error);
    throw error;
  }
};

export const deleteInscricao = async (tenantSlug, idInscricao) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/inscricoes/${idInscricao}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar a inscrição:", error);
    throw error;
  }
};

export const searchInscricoes = async (tenantSlug, query) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/inscricoes/search?query=${query}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar inscrições:", error);
    throw error;
  }
};

/**************************
 * PARTICIPACAO
 **************************/

export const getParticipacoes = async (tenantSlug, idInscricao) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/participacoes?inscricaoId=${idInscricao}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
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
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/participacoes`,
      participacaoData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
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
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/participacoes/${idParticipacao}`,
      participacaoData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participação não atualizada:", error);
      return null;
    }
    console.error("Erro ao atualizar participação:", error);
    throw error;
  }
};

export const deleteParticipacao = async (tenantSlug, idParticipacao) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/participacoes/${idParticipacao}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
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

/**************************
 * FORMULÁRIO
 **************************/
export const createFormulario = async (tenantSlug, formularioData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/formularios`,
      formularioData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar formulário:", error);
    throw error;
  }
};

export const updateFormulario = async (
  tenantSlug,
  formularioId,
  formularioData
) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/formularios/${formularioId}`,
      formularioData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar formulário:", error);
    throw error;
  }
};

export const deleteFormulario = async (tenantSlug, formularioId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/formularios/${formularioId}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar formulário:", error);
    throw error;
  }
};

export const getFormularios = async (tenantSlug) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/formularios`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data.formularios;
  } catch (error) {
    console.error("Erro ao obter formulários:", error);
    throw error;
  }
};

export const getFormulario = async (tenantSlug, idFormulario) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/formularios/${idFormulario}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participações não encontradas:", error);
      return null;
    }
    console.error("Erro ao obter as participações:", error);
    throw error;
  }
};

/**************************
 * CAMPO
 **************************/
export const createCampo = async (tenantSlug, formularioId, campoData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/formularios/${formularioId}/campos`,
      campoData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar campo:", error);
    throw error;
  }
};

export const updateCampo = async (
  tenantSlug,
  formularioId,
  campoId,
  campoData
) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`,
      campoData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar campo:", error);
    throw error;
  }
};

export const deleteCampo = async (tenantSlug, formularioId, campoId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar campo:", error);
    throw error;
  }
};

export const getCampos = async (tenantSlug, formularioId) => {
  console.log(formularioId);
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/formularios/${formularioId}/campos`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data.campos;
  } catch (error) {
    console.error("Erro ao obter campos:", error);
    throw error;
  }
};

export const getCampo = async (tenantSlug, formularioId, campoId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participações não encontradas:", error);
      return null;
    }
    console.error("Erro ao obter as participações:", error);
    throw error;
  }
};

/**************************
 * RESPOSTA
 **************************/
export const createResposta = async (tenantSlug, campoId, respostaData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/campos/${campoId}/respostas`,
      respostaData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar campo:", error);
    throw error;
  }
};
export const updateResposta = async (
  tenantSlug,
  respostaId,
  campoId,
  respostaData
) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/campos/${campoId}/respostas/${respostaId}`,
      respostaData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar campo:", error);
    throw error;
  }
};
/**************************
 * PLANO DE TRABALHO
 **************************/

export const createPlanoDeTrabalho = async (
  tenantSlug,
  inscricaoId,
  planoDeTrabalhoData
) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho`,
      planoDeTrabalhoData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar Plano de Trabalho:", error);
    throw error;
  }
};

export const getPlanoDeTrabalhos = async (tenantSlug, inscricaoId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
        params: { inscricaoId },
      }
    );
    return response.data.planosDeTrabalho;
  } catch (error) {
    console.error("Erro ao obter Planos de Trabalho:", error);
    throw error;
  }
};

export const getPlanoDeTrabalho = async (tenantSlug, inscricaoId, id) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho/${id}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao obter Plano de Trabalho:", error);
    throw error;
  }
};

export const updatePlanoDeTrabalho = async (
  tenantSlug,
  inscricaoId,
  id,
  planoDeTrabalhoData
) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho/${id}`,
      planoDeTrabalhoData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar Plano de Trabalho:", error);
    throw error;
  }
};

export const deletePlanoDeTrabalho = async (tenantSlug, inscricaoId, id) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho/${id}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar Plano de Trabalho:", error);
    throw error;
  }
};

/**************************
 * ATIVIDADE
 **************************/

export const createAtividade = async (tenantSlug, editalId, atividadeData) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/${editalId}/atividades`,
      atividadeData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar Atividade:", error);
    throw error;
  }
};

export const getAtividades = async (tenantSlug, editalId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/${editalId}/atividades`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
        params: { editalId },
      }
    );
    return response.data.atividades;
  } catch (error) {
    console.error("Erro ao obter Atividades:", error);
    throw error;
  }
};

export const getAtividade = async (tenantSlug, editalId, id) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/${editalId}/atividades/${id}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao obter Atividade:", error);
    throw error;
  }
};

export const updateAtividade = async (
  tenantSlug,
  editalId,
  id,
  atividadeData
) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/${editalId}/atividades/${id}`,
      atividadeData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar Atividade:", error);
    throw error;
  }
};

export const deleteAtividade = async (tenantSlug, editalId, id) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/${editalId}/atividades/${id}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar Atividade:", error);
    throw error;
  }
};

/**************************
 * REGISTRO ATIVIDADE
 **************************/

export const createRegistroAtividade = async (
  tenantSlug,
  atividadeId,
  registroAtividadeData
) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.post(
      `/private/${tenantSlug}/${atividadeId}/registroAtividades`,
      registroAtividadeData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar Registro de Atividade:", error);
    throw error;
  }
};

export const getRegistroAtividades = async (tenantSlug, atividadeId) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/${atividadeId}/registroAtividades`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
        params: { atividadeId },
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
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
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
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
      registroAtividadeData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar Registro de Atividade:", error);
    throw error;
  }
};

export const deleteRegistroAtividade = async (tenantSlug, atividadeId, id) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/${atividadeId}/registroAtividades/${id}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar Registro de Atividade:", error);
    throw error;
  }
};

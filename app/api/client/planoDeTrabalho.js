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
 * PLANO DE TRABALHO
 **************************/

export const createPlanoDeTrabalho = async (
  tenantSlug,
  inscricaoId,
  planoDeTrabalhoData
) => {
  try {
    //const headers = getAuthHeadersClient();
    //if (!headers) {return false;}
    const token = getCookie("authToken"); 
    // Converte o payload para FormData
    const formData = convertToFormData(planoDeTrabalhoData);
    console.log(formData)
    // Certifique-se de não definir manualmente o Content-Type para multipart/form-data
    // Deixe o browser definir o boundary automaticamente
    const response = await req.post(
      `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.planoDeTrabalho;
  } catch (error) {
    console.error("Erro ao criar Plano de Trabalho:", error);
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
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const token = getCookie("authToken"); 
    // Converte o payload para FormData
    const formData = convertToFormData(planoDeTrabalhoData);
    console.log(formData)
      const response = await req.put(
        `/private/${tenantSlug}/${inscricaoId}/user/planosDeTrabalho/${id}`,
        formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
      );
      return response.data.planoDeTrabalho;
    } catch (error) {
      console.error("Erro ao atualizar Plano de Trabalho:", error);
      throw error;
    }
  };
  export const getPlanoDeTrabalhos = async (tenantSlug, inscricaoId) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho`,
        {
          headers,
          params: { inscricaoId },
        }
      );
      return response.data.planosDeTrabalho;
    } catch (error) {
      console.error("Erro ao obter Planos de Trabalho:", error);
      throw error;
    }
  };
  export const getAllPlanoDeTrabalhosByTenant = async (tenantSlug) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/planosDeTrabalho`,
        {headers}
      );
      return response.data.planosDeTrabalho;
    } catch (error) {
      console.error("Erro ao obter Planos de Trabalho:", error);
      throw error;
    }
  };
  export const getPlanoDeTrabalho = async (tenantSlug, inscricaoId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho/${id}`,
        { headers }
      );
      return response.data.planoDeTrabalho;
    } catch (error) {
      console.error("Erro ao obter Plano de Trabalho:", error);
      throw error;
    }
  };
  

  
  export const updatePlanoDeTrabalhoPerfilUser = async (
    tenantSlug,
    inscricaoId,
    id,
    planoDeTrabalhoData
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/private/${tenantSlug}/${inscricaoId}/user/planosDeTrabalho/${id}`,
        planoDeTrabalhoData,
        { headers }
      );
      return response.data.planoDeTrabalho;
    } catch (error) {
      console.error("Erro ao atualizar Plano de Trabalho:", error);
      throw error;
    }
  };
  
  export const deletePlanoDeTrabalho = async (tenantSlug, inscricaoId, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.delete(
        `/private/${tenantSlug}/${inscricaoId}/planosDeTrabalho/${id}`,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao deletar Plano de Trabalho:", error);
      throw error;
    }
  };
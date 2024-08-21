import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';
/**************************
 * CAMPO
 **************************/
export const createCampo = async (tenantSlug, formularioId, campoData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(
      `/private/${tenantSlug}/formularios/${formularioId}/campos`,
      campoData,
      {headers}
    );
    return response.data.campo;
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
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(
      `/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`,
      campoData,
      {headers}
    );
    return response.data.campo;
  } catch (error) {
    console.error("Erro ao atualizar campo:", error);
    throw error;
  }
};
  
export const deleteCampo = async (tenantSlug, formularioId, campoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(
      `/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`,
      {headers}
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar campo:", error);
    throw error;
  }
};
  
export const getCampos = async (tenantSlug, formularioId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/formularios/${formularioId}/campos`,
      {headers}
    );
    return response.data.campos;
  } catch (error) {
    console.error("Erro ao obter campos:", error);
    throw error;
  }
};
  
export const getCampo = async (tenantSlug, formularioId, campoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`,
      {headers}
    );
    return response.data.campo;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Participações não encontradas:", error);
      return null;
    }
    console.error("Erro ao obter as participações:", error);
    throw error;
  }
};
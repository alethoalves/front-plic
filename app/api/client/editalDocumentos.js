import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

export const createEditalDocumento = async (tenantSlug, editalId, formData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(
      `/private/${tenantSlug}/edital/${editalId}/documentos`,
      formData,
      { headers: { ...headers, "Content-Type": "multipart/form-data" } }
    );
    return response.data.documento;
  } catch (error) {
    console.error("Erro ao criar documento do edital:", error);
    throw error;
  }
};

export const getEditalDocumentos = async (tenantSlug, editalId, tipo = null) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const params = tipo ? { tipo } : {};
    const response = await req.get(
      `/private/${tenantSlug}/edital/${editalId}/documentos`,
      { headers, params }
    );
    return response.data.documentos;
  } catch (error) {
    console.error("Erro ao buscar documentos do edital:", error);
    throw error;
  }
};

export const deleteEditalDocumento = async (tenantSlug, editalId, documentoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(
      `/private/${tenantSlug}/edital/${editalId}/documentos/${documentoId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir documento do edital:", error);
    throw error;
  }
};

export const updateEditalDocumento = async (tenantSlug, editalId, documentoId, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(
      `/private/${tenantSlug}/edital/${editalId}/documentos/${documentoId}`,
      data,
      { headers }
    );
    return response.data.documento;
  } catch (error) {
    console.error("Erro ao atualizar documento do edital:", error);
    throw error;
  }
};

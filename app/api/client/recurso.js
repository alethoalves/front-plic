import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

export const getRecursoDetalhe = async (tenantSlug, planoId, tipoNota) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/user/plano-de-trabalho/${planoId}/recurso/${tipoNota}`,
      { headers }
    );
    return response.data.recurso;
  } catch (error) {
    console.error("Erro ao obter detalhe do recurso:", error);
    throw error;
  }
};

export const criarRecurso = async (tenantSlug, planoId, body) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(
      `/private/${tenantSlug}/user/plano-de-trabalho/${planoId}/recurso`,
      body,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar recurso:", error);
    throw error;
  }
};

export const excluirRecurso = async (tenantSlug, planoId, recursoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(
      `/private/${tenantSlug}/user/plano-de-trabalho/${planoId}/recurso/${recursoId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir recurso:", error);
    throw error;
  }
};

export const atualizarHabilitarRecurso = async (tenantSlug, editalId, habilitarRecurso) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(
      `/private/${tenantSlug}/edital/${editalId}/habilitar-recurso`,
      { habilitarRecurso },
      { headers }
    );
    return response.data.edital;
  } catch (error) {
    console.error("Erro ao atualizar habilitação de recurso:", error);
    throw error;
  }
};

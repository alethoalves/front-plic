import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

export const getResultadosByUser = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/user/resultados`,
      { headers }
    );
    return response.data.resultados;
  } catch (error) {
    console.error("Erro ao obter resultados do usuário:", error);
    throw error;
  }
};

export const atualizarHabilitarNotaFinal = async (tenantSlug, editalId, habilitarNotaFinal) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(
      `/private/${tenantSlug}/edital/${editalId}/habilitar-nota-final`,
      { habilitarNotaFinal },
      { headers }
    );
    return response.data.edital;
  } catch (error) {
    console.error("Erro ao atualizar habilitação de nota final:", error);
    throw error;
  }
};

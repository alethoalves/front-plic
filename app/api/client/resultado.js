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

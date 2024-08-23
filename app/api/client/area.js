import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

/************************** 
 * Área
**************************/

export const getAreas = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/areas`, { headers });
    return response.data.areas;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Áreas não encontradas:', error);
      return null;
    }
    console.error('Erro ao obter as áreas:', error);
    throw error;
  }
};

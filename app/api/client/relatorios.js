import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';


/**************************
 * DOWNLOADS
 **************************/


export const relatorioInscricoes = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/relatorios/participacoes`,
      {headers}
    );
    return response.data.participacoes;
  } catch (error) {
    console.error("Erro ao obter as inscrições:", error);
    throw error;
  }
};

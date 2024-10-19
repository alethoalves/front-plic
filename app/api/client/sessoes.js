import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * RESPOSTA
 **************************/

export const getSessoesBySlug = async (eventoSlug) => {
  try {
    
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/sessoes`,
    );
    return response.data.sessoes;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};

export const getSessaoById = async (eventoSlug,sessaoId) => {
  try {
    
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/sessao/${sessaoId}`,
    );
    return response.data.sessao;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};

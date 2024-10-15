import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * RESPOSTA
 **************************/

export const startSubmission = async (registroAtividadeId, body) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/private/startSubmission/${registroAtividadeId}`,
      body,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar campo:", error);
    throw error;
  }
};
export const consultarConviteByToken = async (token) => {
    try {
      
      const response = await req.get(
        `/evenplic/evento/convite/consultarConvite/${token}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar campo:", error);
      throw error;
    }
  };

  export const recusarConvite = async (token) => {
    try {
      
      const response = await req.get(
        `/evenplic/evento/convite/recusarConvite/${token}`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar campo:", error);
      throw error;
    }
  };
  export const aceitarConvite = async (token, body) => {
    try {
      
      const response = await req.put(
        `/evenplic/evento/convite/aceitarConvite/${token}`,
        body,
        
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar campo:", error);
      throw error;
    }
  };

import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

  export const consultarAvaliadoresEvento = async (
    slug
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/evenplic/consultarAvaliadoresEvento/${slug}`,
        
        { headers }
      );
      return response.data.avaliadores;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';




  
  export const getSubmissaoByIdForAdmin = async (
    eventoSlug,idSubmissao,idSquare
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/evenplic/evento/${eventoSlug}/getSubmissaoByIdForAdmin/${idSubmissao}`,
        
        { headers }
      );
      return response.data.submissao;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

  export const updateSubmissaoStatus = async (
    eventoSlug,idSubmissao,status
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/evenplic/evento/${eventoSlug}/submissao/atualizarStatus/${idSubmissao}`,
        {status},
        { headers }
      );
      return response.data.submissao;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

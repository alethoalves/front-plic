import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';



export const gerarSquareParaSubsessao = async (eventoSlug, idSubsessao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/gerarSquareParaSubsessao/${idSubsessao}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao gerar squares:", error);
    throw error;
  }
};
  
  export const vincularSubmissao = async (
    eventoSlug,idSubmissao,idSquare
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/evenplic/evento/${eventoSlug}/vincularSubmissao/${idSubmissao}/${idSquare}`,
        {},
        { headers }
      );
      return response.data.square;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

  export const desvincularSubmissao = async (
    eventoSlug,idSubmissao,idSquare
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/evenplic/evento/${eventoSlug}/desvincularSubmissao/${idSubmissao}/${idSquare}`,
        {},
        { headers }
      );
      return response.data.square;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

  export const vincularAutomaticamenteSubmissao = async (
    eventoSlug,idSubmissao
  ) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/evenplic/evento/${eventoSlug}/alocarSubmissaoAutomaticamente/${idSubmissao}`,
       
        { headers }
      );
      return response.data.square;
    } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
    }
  };

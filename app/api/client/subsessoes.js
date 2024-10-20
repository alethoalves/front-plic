import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';



export const getSubsessaoById = async (eventoSlug, subsessaoId, filters = {}) => {
  try {
    // Extrai os filtros se existirem (nome, cpf, titulo)
    const queryParams = new URLSearchParams(filters).toString();
    
    // Monta a URL com ou sem os parâmetros de query
    const url = queryParams
      ? `/evenplic/evento/${eventoSlug}/subsessao/${subsessaoId}?${queryParams}`
      : `/evenplic/evento/${eventoSlug}/subsessao/${subsessaoId}`;
    
    const response = await req.get(url);
    return response.data.subsessao;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};


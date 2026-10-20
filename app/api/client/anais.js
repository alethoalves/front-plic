import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";

// Anais em PDF e Word da edição (aba Anais das Configurações do evento). As
// três rotas devolvem o mesmo estado:
// { anais, gerando, desatualizado, totalResumos, isbn, sugestao }.

export const getAnaisEvento = async (eventoSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/evenplic/evento/${eventoSlug}/anais`, { headers });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar os Anais do evento:", error.message);
    throw error;
  }
};

export const salvarAnaisEvento = async (eventoSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(`/evenplic/evento/${eventoSlug}/anais`, data, { headers });
    return response.data;
  } catch (error) {
    console.error("Erro ao salvar os Anais do evento:", error.message);
    throw error;
  }
};

export const gerarAnaisEvento = async (eventoSlug, formato) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(`/evenplic/evento/${eventoSlug}/anais/gerar/${formato}`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error("Erro ao gerar os Anais do evento:", error.message);
    throw error;
  }
};

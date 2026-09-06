import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

export const getCriteriosAvaliacao = async (eventoSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/criterios-avaliacao`,
      { headers }
    );
    return response.data.criterios;
  } catch (error) {
    console.error("Erro ao buscar critérios de avaliação:", error);
    throw error;
  }
};

export const criarCriterioAvaliacao = async (eventoSlug, payload) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/evenplic/evento/${eventoSlug}/criterios-avaliacao`,
      payload,
      { headers }
    );
    return response.data.criterio;
  } catch (error) {
    console.error("Erro ao criar critério de avaliação:", error);
    throw error;
  }
};

export const atualizarCriterioAvaliacao = async (eventoSlug, id, payload) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.put(
      `/evenplic/evento/${eventoSlug}/criterios-avaliacao/${id}`,
      payload,
      { headers }
    );
    return response.data.criterio;
  } catch (error) {
    console.error("Erro ao atualizar critério de avaliação:", error);
    throw error;
  }
};

export const excluirCriterioAvaliacao = async (eventoSlug, id) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.delete(
      `/evenplic/evento/${eventoSlug}/criterios-avaliacao/${id}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir critério de avaliação:", error);
    throw error;
  }
};

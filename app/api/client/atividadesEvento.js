import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";

/**************************
 * ATIVIDADE - CRUD
 **************************/

export const getAtividadesBySlug = async (eventoSlug) => {
  try {
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/atividades`,
    );
    return response.data.atividades;
  } catch (error) {
    console.error("Erro:", error.message);
    throw error;
  }
};

export const criarAtividade = async (eventoSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.post(
      `/evenplic/evento/${eventoSlug}/atividade`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao criar atividade:", error.message);
    throw error;
  }
};

export const atualizarAtividade = async (eventoSlug, atividadeId, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.put(
      `/evenplic/evento/${eventoSlug}/atividade/${atividadeId}`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar atividade:", error.message);
    throw error;
  }
};

export const excluirAtividade = async (eventoSlug, atividadeId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.delete(
      `/evenplic/evento/${eventoSlug}/atividade/${atividadeId}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao excluir atividade:", error.message);
    throw error;
  }
};

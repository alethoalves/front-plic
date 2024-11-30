import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';

export const createPageForSubmissao = async (
  body
) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/studio/createPageForSubmissao`,
      body,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar campo:", error);
    throw error;
  }
};

export const getAllPages = async () => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/studio/getAllPages`,
      {headers}
    );
    return response.data.pages;
  } catch (error) {
    console.error("Erro ao obter Planos de Trabalho:", error);
    throw error;
  }
};
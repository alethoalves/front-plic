import { getCookie, deleteCookie } from "cookies-next";
import { cookies } from "next/headers"; //Funciona apenas do lado do servidor
import { req } from "./axios";
import { getAuthHeadersServer } from "@/lib/headers";


export const getInscricao = async (tenantSlug, idInscricao) => {
  try {
    const token = getCookie('authToken',{cookies});
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/inscricoes/${idInscricao}`, {
      headers: {
        "Authorization": `Token ${token}`
      }
    });
    return response.data.inscricao;
  } catch (error) {
    console.error('Erro ao obter a inscrição:', error);
    throw error;
  }
};

export const getEdital = async (tenantSlug, editalId) => {
  try {
    const token = getCookie('authToken',{cookies});
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/edital/${editalId}`, {
      headers: {
        "Authorization": `Token ${token}`
      }
    });
    return response.data.edital;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Edital não encontrado:', error);
      return null;
    }
    console.error('Erro ao obter o edital:', error);
    throw error;
  }
};


  
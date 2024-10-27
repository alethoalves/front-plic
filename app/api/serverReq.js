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

export const getEventoBySlug = async (slug) => {
  try {
    
    const response = await req.get(`/evenplic/eventoSlug/${slug}`);
    
    return response.data.evento;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const config = {
  runtime: 'nodejs', // Desativa o Edge Runtime e usa Node.js
};
export const getSubmissoes = async (id) => {
  try {
    
    const response = await req.get(`/evenplic/submissoes/evento/${id}/submissoes`);
    
    return response.data.submissoes;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const getSessoesBySlug = async (eventoSlug) => {
  try {
    
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/sessoes`,
    );
    return response.data.sessoes;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};

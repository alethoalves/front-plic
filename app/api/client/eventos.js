import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * Eventos
 **************************/
export const getEventoRootBySlug = async (slug) => {
  try {
    
    const response = await req.get(
      `/evenplic/eventoRootSlug/${slug}`,
      
    );
    return response.data.eventoRoot;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const getEventosByTenant = async (tenantSlug) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/evenplic/${tenantSlug}/eventos`,
        { headers }
      );
      return response.data.eventos;
    } catch (error) {
      console.error("Erro ao chamar a API:", error);
      throw error;
    }
  };
export const getEventoBySlug = async (slug) => {
  try {
    
    const response = await req.get(
      `/evenplic/eventoSlug/${slug}}`,
      
    );
    return response.data.evento;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getAllEvents = async () => {
  try {
    
    const response = await req.get(
      `/evenplic/allevents`,
      
    );
    return response.data.eventos;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const startSubmissaoEvento = async (tenantSlug,idEvento,idPlanoDeTrabalho,idFormulario,idSubsessaoApresentacao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      
      `/evenplic/${tenantSlug}/startSubmissaoEvento/${idEvento}/${idPlanoDeTrabalho}/${idFormulario}?idSubsessaoApresentacao=${idSubsessaoApresentacao}`,
      {},
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const getSubmissoesEvento = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      
      `/evenplic/${tenantSlug}/submissoes`,

      { headers }
    );
    return response.data.submissoes;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const deleteSubmissao = async (tenantSlug, idSubmissao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(`/evenplic/${tenantSlug}/submissao/${idSubmissao}`, {headers});
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar edital:', error);
    throw error;
  }
};

export const getEventosDashboard = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    

    // Monta a URL da requisição, incluindo as query params dinâmicas
    const response = await req.get(
      `/evenplic/${tenantSlug}/eventos/dashboard`,
      { headers }
    );

    // Retorna os dados de inscrições da resposta da API
    return response.data.eventos;
  } catch (error) {
    console.error("Erro ao buscar dashboard de inscrições:", error);
    throw error;
  }
};
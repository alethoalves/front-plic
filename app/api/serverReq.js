import { getCookie, deleteCookie } from "cookies-next";
import { cookies } from "next/headers"; //Funciona apenas do lado do servidor
import { req } from "./axios";
import { getAuthHeadersServer } from "@/lib/headers";






export const isTokenValid = async (token) => {
    try {
      const response = await req.get('/private/isLogged', {
        headers: getAuthHeaders(token)
      });
      return response.data.data
    } catch (error) {
      return false
    }
  };
  //Acho que não uso mais esta função
  export const getUserData = async () => {
    try {
      const token = getCookie('authToken',{cookies})
      if (!token) { 
        return false;
      }
      // Consulta o servidor
      const response = await req.get('/private/isLogged', {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      
      return response.data

    } catch (error) {
      return false
    }
  };
  


export const userTenant = async (idUser,slug) => {
  
  try {
      const response = await req.get(`/cargos/${idUser}/${slug}`);
    console.log(response.data.cargos)
      return response.data.cargos;
      
  } catch (error) {
      if (error.response && error.response.status === 404) {
          // Trata o erro 404 de forma específica
          //console.error('Usuário não possui acesso a esta instituição');
          return null; // Retorna null ou algum valor padrão para indicar que o tenant não foi encontrado
      }
      // Para outros erros, relança o erro para que o chamador possa tratá-lo
      console.error('Erro ao obter o tenant:', error);
      throw error;
  }
};
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
    return response.data;
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
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Edital não encontrado:', error);
      return null;
    }
    console.error('Erro ao obter o edital:', error);
    throw error;
  }
};


  
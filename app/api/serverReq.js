import { getCookie, deleteCookie } from "cookies-next";
import { cookies } from "next/headers"; //Funciona apenas do lado do servidor
import { req } from "./axios";

export const isLogged = async () => {
    try {
      const token = getCookie('authToken',{cookies})
      if (!token) { 
        return false;
      }
      // Consulta o servidor
      await req.get('/private/isLogged', {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return true

    } catch (error) {
      return false
    }
  };
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
  export const getTenant = async (reqParams) => {
    try {
        const response = await req.get(`/tenant/${reqParams.slug}`);
        return response.data;
        
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Trata o erro 404 de forma específica
            console.error('Tenant não encontrado:', error);
            return null; // Retorna null ou algum valor padrão para indicar que o tenant não foi encontrado
        }
        // Para outros erros, relança o erro para que o chamador possa tratá-lo
        console.error('Erro ao obter o tenant:', error);
        throw error;
    }
};

export const userTenant = async (reqParams) => {
  
  try {
      const response = await req.get(`/cargos/${reqParams.idUser}/${reqParams.slug}`);

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


  
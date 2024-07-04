import { req } from "./axios.js";
import { setCookie,getCookie, deleteCookie } from 'cookies-next';


export const isLogged = async () => {
    try {
      const token = getCookie('authToken')
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

export const logout = async () => {
    try {
        deleteCookie('authToken')
        
        return true
        
    } catch (error) {
        return false
    } 
}; 

export const signin = async (data, reqParams) => {
    try {
        const response = await req.post('/auth/signin', data, {
            params: reqParams
        });
        console.log(response)
        if (response.data.success && response.data.success.token) {
            const { token } = response.data.success;
            setCookie('authToken', token, {
                maxAge: 24 * 60 * 60, // 24h
                path: '/', // Opcional: define o caminho do cookie
                //httpOnly: true, // Opcional: define o cookie como acessível apenas via HTTP
                secure: process.env.NODE_ENV === 'production', // Opcional: define o cookie como seguro apenas em produção
                sameSite: 'Strict' // Opcional: define a política de SameSite para o cookie
            });
        }
        
        return response.data;
        
    } catch (error) {
        console.error('Error:', error);
        throw error; // Relança o erro para que o chamador possa tratá-lo
    }
};

export const signup = async (data, reqParams) => {
    try {
        const response = await req.post('/auth/signup', data, {
            params: reqParams
        });
        
        if (response.data.success && response.data.success.token) {
            const { token } = response.data.success;
            setCookie('authToken', token, {
                maxAge: 24 * 60 * 60, // 24h
                path: '/', // Opcional: define o caminho do cookie
                //httpOnly: true, // Opcional: define o cookie como acessível apenas via HTTP
                secure: process.env.NODE_ENV === 'production', // Opcional: define o cookie como seguro apenas em produção
                sameSite: 'Strict' // Opcional: define a política de SameSite para o cookie
            });
        }
        
        return response.data;
        
    } catch (error) {
        console.error('Error:', error);
        throw error; // Relança o erro para que o chamador possa tratá-lo
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

export const getEditais = async (tenantSlug) => {
    try {
        const token = getCookie('authToken');
        if (!token) {
            return false;
        }
        // Consulta a API de editais
        const response = await req.get(`/private/${tenantSlug}/edital`, {
            headers: {
                "Authorization": `Token ${token}`
            }
        });
        return response.data.editais;
  
    } catch (error) {
        if (error.response && error.response.status === 404) {
            // Trata o erro 404 de forma específica
            console.error('Editais não encontrados:', error);
            return null; // Retorna null ou algum valor padrão para indicar que os editais não foram encontrados
        }
        // Para outros erros, relança o erro para que o chamador possa tratá-lo
        console.error('Erro ao obter os editais:', error);
        throw error;
    }
  };

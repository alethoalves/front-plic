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


  export const getInscricoes = async (tenantSlug, page = 1, limit = 10) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      // Consulta a API de inscrições com paginação
      const response = await req.get(`/private/${tenantSlug}/inscricoes?page=${page}&limit=${limit}`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data;
  
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Inscrições não encontradas:', error);
        return null;
      }
      console.error('Erro ao obter as inscrições:', error);
      throw error;
    }
  };

  export const getInscricao = async (tenantSlug, idInscricao) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      // Consulta a API de inscrições com paginação
      const response = await req.get(`/private/${tenantSlug}/inscricoes/${idInscricao}`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data;
  
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Inscrições não encontradas:', error);
        return null;
      }
      console.error('Erro ao obter as inscrições:', error);
      throw error;
    }
  };
  export const createEdital = async (tenantSlug, editalData) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      // Consulta a API de inscrições com paginação
      const response = await req.post(`/private/${tenantSlug}/edital`, editalData, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data;
  
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Edital não cadastrado:', error);
        return null;
      }
      console.error('Erro ao obter ao cadastrar Edital:', error);
      throw error;
    }
  };
  export const createInscricao = async (tenantSlug, inscricaoData) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      // Consulta a API de inscrições com paginação
      const response = await req.post(`/private/${tenantSlug}/inscricoes`, inscricaoData, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data;
  
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Inscrições não encontradas:', error);
        return null;
      }
      console.error('Erro ao obter as inscrições:', error);
      throw error;
    }
  };

  export const getParticipacoes = async (tenantSlug, idInscricao) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.get(`/private/${tenantSlug}/participacoes?inscricaoId=${idInscricao}`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      
      return response.data.participacoes;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Participações não encontradas:', error);
        return null;
      }
      console.error('Erro ao obter as participações:', error);
      throw error;
    }
  };
  
  export const createParticipacao = async (tenantSlug, idInscricao, participacaoData) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.post(`/private/${tenantSlug}/${idInscricao}/participacoes`, participacaoData, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Participação não criada:', error);
        return null;
      }
      console.error('Erro ao criar participação:', error);
      throw error;
    }
  };
  
  export const deleteParticipacao = async (tenantSlug, idInscricao, idParticipacao) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.delete(`/private/${tenantSlug}/participacoes/${idParticipacao}`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Participação não deletada:', error);
        return null;
      }
      console.error('Erro ao deletar participação:', error);
      throw error;
    }
  };


  export const createFormulario = async (tenantSlug, formularioData) => {
    try {
      
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.post(`/private/${tenantSlug}/formularios`, formularioData, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar formulário:', error);
      throw error;
    }
  };
  
  export const updateFormulario = async (tenantSlug, formularioId, formularioData) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.put(`/private/${tenantSlug}/formularios/${formularioId}`, formularioData, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar formulário:', error);
      throw error;
    }
  };
  
  export const deleteFormulario = async (tenantSlug, formularioId) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.delete(`/private/${tenantSlug}/formularios/${formularioId}`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      console.log(response)
      return response.data;
    } catch (error) {
      console.error('Erro ao deletar formulário:', error);
      throw error;
    }
  };
  
  export const getFormularios = async (tenantSlug) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.get(`/private/${tenantSlug}/formularios`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return response.data.formularios;
    } catch (error) {
      console.error('Erro ao obter formulários:', error);
      throw error;
    }
  };
  export const getFormulario = async (tenantSlug, idFormulario) => {
    try {
      const token = getCookie('authToken');
      if (!token) {
        return false;
      }
      const response = await req.get(`/private/${tenantSlug}/formularios/${idFormulario}`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Participações não encontradas:', error);
        return null;
      }
      console.error('Erro ao obter as participações:', error);
      throw error;
    }
  };

  export const createCampo = async (tenantSlug, formularioId, campoData) => {
    try {
        const token = getCookie('authToken');
        if (!token) {
            return false;
        }
        const response = await req.post(`/private/${tenantSlug}/formularios/${formularioId}/campos`, campoData, {
            headers: {
                "Authorization": `Token ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao criar campo:', error);
        throw error;
    }
};

export const updateCampo = async (tenantSlug, formularioId, campoId, campoData) => {
    try {
        const token = getCookie('authToken');
        if (!token) {
            return false;
        }
        const response = await req.put(`/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`, campoData, {
            headers: {
                "Authorization": `Token ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar campo:', error);
        throw error;
    }
};

export const deleteCampo = async (tenantSlug, formularioId, campoId) => {
    try {
        const token = getCookie('authToken');
        if (!token) {
            return false;
        }
        const response = await req.delete(`/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`, {
            headers: {
                "Authorization": `Token ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao deletar campo:', error);
        throw error;
    }
};

export const getCampos = async (tenantSlug, formularioId) => {
  console.log(formularioId)
    try {
        const token = getCookie('authToken');
        if (!token) {
            return false;
        }
        const response = await req.get(`/private/${tenantSlug}/formularios/${formularioId}/campos`, {
            headers: {
                "Authorization": `Token ${token}`
            }
        });
        return response.data.campos;
    } catch (error) {
        console.error('Erro ao obter campos:', error);
        throw error;
    }
};

export const getCampo = async (tenantSlug, formularioId, campoId) => {
  try {
    const token = getCookie('authToken');
    if (!token) {
      return false;
    }
    const response = await req.get(`/private/${tenantSlug}/formularios/${formularioId}/campos/${campoId}`, {
      headers: {
        "Authorization": `Token ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error('Participações não encontradas:', error);
      return null;
    }
    console.error('Erro ao obter as participações:', error);
    throw error;
  }
};


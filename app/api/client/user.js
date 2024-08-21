import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';
/**************************
 * USER
 **************************/
export const createUser = async (tenantSlug, userData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.post(`/private/${tenantSlug}/users`, userData, 
      {headers}
    );
    return response.data.user;
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
};

export const getUsers = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/users`, {headers});
    return response.data.users;
  } catch (error) {
    console.error("Erro ao obter os usuários:", error);
    throw error;
  }
};

export const getUserByCpf = async (tenantSlug, cpf) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/users/${cpf}`, {headers});
    return response.data.user;
  } catch (error) {
    console.error("Erro ao obter o usuário:", error);
    return false;
  }
};

export const updateUser = async (tenantSlug, cpf, userData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(
      `/private/${tenantSlug}/users/${cpf}`,
      userData,
      {headers}
    );
    return response.data.user;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

export const deleteUser = async (tenantSlug, cpf) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(`/private/${tenantSlug}/users/${cpf}`, {headers});
    return response.data;
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    throw error;
  }
};

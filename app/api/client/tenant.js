import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';

/**************************
 * BOLSA
 **************************/
export const getTenantById = async (tenantSlug, ano) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.get(
      `/private/${tenantSlug}/info-tenant-gestor`,
      { headers }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Tenant não encontrado:", error);
      return null;
    }
    console.error("Erro ao obter tenant:", error);
    throw error;
  }
};
export const getTenantBySlug = async (tenant) => {
  try {
      

      const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    const response = await req.get(
      `/tenant/${tenant}`,
      { headers }
    );
    return response.data.tenant;
  } catch (error) {
      // Para outros erros, relança o erro para que o chamador possa tratá-lo
      console.error('Erro ao obter o tenant:', error);
      throw error;
  }
};
/**************************
 * CPF AUTORIZADO
 **************************/

/**
 * GET  /private/:tenant/cpf-autorizados
 * Retorna lista de CPFs autorizados do tenant.
 */
export const getCpfAutorizados = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.get(
      `/private/${tenantSlug}/cpf-autorizados`,
      { headers }
    );
    return data;                           // { registros: [...] }
  } catch (error) {
    console.error("Erro ao buscar CPFs autorizados:", error);
    throw error;
  }
};

/**
 * POST /private/:tenant/cpf-autorizado
 * body = { cpf, nome }
 */
export const createCpfAutorizado = async (tenantSlug, body) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.post(
      `/private/${tenantSlug}/cpf-autorizado`,
      body,
      { headers }
    );
    return data;                           // { message, registro }
  } catch (error) {
    if (error.response?.status === 400) {
      return { error: error.response.data.error?.message };
    }
    console.error("Erro ao criar CPF autorizado:", error);
    throw error;
  }
};

/**
 * DELETE /private/:tenant/cpf-autorizado/:id
 */
export const deleteCpfAutorizado = async (tenantSlug, id) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.delete(
      `/private/${tenantSlug}/cpf-autorizado/${id}`,
      { headers }
    );
    return data;                           // { message }
  } catch (error) {
    if (error.response?.status === 404) {
      return { error: "Registro não encontrado" };
    }
    console.error("Erro ao excluir CPF autorizado:", error);
    throw error;
  }
};

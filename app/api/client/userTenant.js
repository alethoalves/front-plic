import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

export const getOpcoesAluno = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    const response = await req.get(`/private/${tenantSlug}/user-tenant/opcoes-aluno`, { headers });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar opções do aluno:", error);
    throw error;
  }
};

export const getUserTenant = async (tenantSlug, userId, ano) => {
  try {
    const headers = getAuthHeadersClient();
    const response = await req.get(`/private/${tenantSlug}/user-tenant/${userId}/${ano}`, { headers });
    return response.data.userTenant;
  } catch (error) {
    console.error("Erro ao buscar UserTenant:", error);
    throw error;
  }
};

export const processarHistoricoEscolar = async (tenantSlug, userId, ano, file, participacaoExterna) => {
  try {
    const headers = getAuthHeadersClient();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("participacaoExterna", participacaoExterna ? "true" : "false");
    const response = await req.post(
      `/private/${tenantSlug}/user-tenant/${userId}/${ano}/historico`,
      formData,
      { headers: { ...headers, "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao processar histórico:", error);
    throw error;
  }
};

export const upsertUserTenantAluno = async (tenantSlug, userId, ano, data) => {
  try {
    const headers = getAuthHeadersClient();
    const response = await req.put(
      `/private/${tenantSlug}/user-tenant/${userId}/${ano}`,
      data,
      { headers }
    );
    return response.data.userTenant;
  } catch (error) {
    console.error("Erro ao salvar dados do aluno:", error);
    throw error;
  }
};

import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";

export const getConfiguracaoTabela = async (tenantSlug, chave) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/configuracao-tabela/${chave}`,
      { headers }
    );
    return response.data.configuracao?.valor ?? null;
  } catch (error) {
    console.error("Erro ao buscar configuração de tabela:", error);
    throw error;
  }
};

export const upsertConfiguracaoTabela = async (tenantSlug, chave, valor) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/configuracao-tabela/${chave}`,
      { valor },
      { headers }
    );
    return response.data.configuracao;
  } catch (error) {
    console.error("Erro ao salvar configuração de tabela:", error);
    throw error;
  }
};

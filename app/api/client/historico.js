import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";


export const updateDataHistorico = async (tenantSlug, dd,mm,yyyy,hh,min, tabelaHistorico, id) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(`/private/${tenantSlug}/atualizar-historico`, {dd,mm,yyyy,hh,min, tabelaHistorico, id}, {headers});
    return response.data.registro;
  } catch (error) {
    console.error('Erro ao atualizar edital:', error);
    throw error;
  }
};



import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';


/**************************
 * DOWNLOADS
 **************************/
// Função para solicitar a compilação do LaTeX e baixar o PDF resultante
export const baixarPdfCompilado = async (latexContent) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.post(
      `/compilar-latex`,
      { latexContent },
      {
        headers,
        responseType: 'blob' // Importante para obter a resposta como blob para download
      }
    );

    // Salva o PDF resultante no cliente
    const blob = new Blob([response.data], { type: 'application/pdf' });
    saveAs(blob, 'submissoes_compilado.pdf');
  } catch (error) {
    console.error("Erro ao compilar o LaTeX:", error);
    throw error;
  }
};

export const relatorioInscricoes = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
      `/private/${tenantSlug}/relatorios/participacoes`,
      {headers}
    );
    return response.data.participacoes;
  } catch (error) {
    console.error("Erro ao obter as inscrições:", error);
    throw error;
  }
};

export const getSubmissaoByEvento = async (eventoSlug, idEvento, tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }

    // Define os parâmetros da query condicionalmente
    const queryParams = tenantSlug ? `?tenantSlug=${tenantSlug}` : "";

    const response = await req.get(
      `/evenplic/${eventoSlug}/listaSubmissoes/${idEvento}${queryParams}`,
      { headers }
    );
    return response.data.submissoes;
  } catch (error) {
    console.error("Erro ao atualizar campo:", error);
    throw error;
  }
};


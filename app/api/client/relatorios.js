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

export const relatorioInscricoesExcel = async (tenantSlug, ano) => {
  const headers = getAuthHeadersClient();
  if (!headers) throw new Error('Não autenticado');

  const params = ano ? `?ano=${ano}` : '';
  const response = await req.get(`/private/${tenantSlug}/relatorios/inscricoes${params}`, {
    headers,
    responseType: 'blob',
  });

  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', ano ? `inscricoes_${ano}.xlsx` : 'inscricoes.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const relatorioProjetosExcel = async (tenantSlug, ano) => {
  const headers = getAuthHeadersClient();
  if (!headers) throw new Error('Não autenticado');

  const params = ano ? `?ano=${ano}` : '';
  const response = await req.get(`/private/${tenantSlug}/relatorios/projetos${params}`, {
    headers,
    responseType: 'blob',
  });

  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', ano ? `projetos_${ano}.xlsx` : 'projetos.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const relatorioEmailsUsuarios = async (tenantSlug) => {
  const headers = getAuthHeadersClient();
  if (!headers) throw new Error('Não autenticado');

  const response = await req.get(`/private/${tenantSlug}/relatorios/emails-usuarios`, {
    headers,
    responseType: 'blob',
  });

  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'emails_usuarios.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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


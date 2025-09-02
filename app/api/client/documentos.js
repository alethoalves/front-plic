import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';
const convertToFormData = (data) => {
  const formData = new FormData();

  // Campos simples
  formData.append("titulo", data.titulo);
  formData.append("areaId", data.areaId);
  formData.append("conteudo", data.conteudo);
  formData.append("projetoId", data.projetoId);

  // Se o cronograma for necessário, pode ser convertido para JSON
  if (data.cronograma) {
    formData.append("cronograma", JSON.stringify(data.cronograma));
  }

  // Campos dinâmicos
  if (data.camposDinamicos) {
    Object.keys(data.camposDinamicos).forEach((key) => {
      const value = data.camposDinamicos[key];
      const fullKey = `camposDinamicos.${key}`; // Preserva o prefixo
      if (value instanceof FileList && value.length > 0) {
        formData.append(fullKey, value[0]);
      } else {
        formData.append(fullKey, value);
      }
    });
  }

  return formData;
};
/**************************
 * DOCUMENTOS
 **************************/

export const criarRegistrosDocumento = async (tenantSlug, documentoTemplateId, participacaoIds) => {
  try {
    const token = getCookie("authToken");
    
    const response = await req.post(
      `/private/${tenantSlug}/documentos/criarRegistrosDocumento`,
      {
        documentoTemplateId,
        participacaoIds
      },
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Erro ao criar registros de documento:", error);
    throw error;
  }
};

// Função para buscar os templates de documento disponíveis
export const getDocumentoTemplates = async (tenantSlug) => {
  try {
    const token = getCookie("authToken");
    
    const response = await req.get(
      `/private/${tenantSlug}/documentos/getDocumentoTemplates`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar templates de documento:", error);
    throw error;
  }
};

export const getMyDocuments = async (tenantSlug) => {
  try {
    const token = getCookie("authToken");
    
    const response = await req.get(
      `/private/${tenantSlug}/documentos/getMyDocuments`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    
    return response.data.documentos;
  } catch (error) {
    console.error("Erro ao buscar templates de documento:", error);
    throw error;
  }
};

export const getDocumentById = async (tenantSlug,documentId) => {
  try {
    const token = getCookie("authToken");
    
    const response = await req.get(
      `/private/${tenantSlug}/documento/${documentId}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    
    return response.data.documento;
  } catch (error) {
    console.error("Erro ao buscar templates de documento:", error);
    throw error;
  }
};

export const assinarDocumento = async (tenantSlug, payload) => {
  try {
    const token = getCookie("authToken");
    
    const response = await req.post(
      `/private/${tenantSlug}/documentos/assinar`,
      payload,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error("Erro ao criar registros de documento:", error);
    throw error;
  }
};

export const salvarFormulario = async (tenantSlug, formData) => {
  try {
    const token = getCookie("authToken");
    
    const response = await req.post(
      `/private/${tenantSlug}/documentos/salvar-formulario`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data", // ← MANTER como no código que funciona
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Erro ao salvar formulário:", error);
    throw error;
  }
};

export const validarDocumento = async (tenantSlug, payload) => {
  try {
    const token = getCookie("authToken");
    
    const response = await req.put(
      `/private/${tenantSlug}/validar-documento`,
      payload,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Erro ao validar documento:", error);
    throw error;
  }
};

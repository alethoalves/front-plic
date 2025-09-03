import { req } from "./../axios.js";
import { getAuthHeadersClient } from "@/lib/headers.js";
/**************************
 * FORMULÁRIO
 **************************/
export const createFormulario = async (tenantSlug, formularioData) => {
    try {
        const headers = getAuthHeadersClient();
        if (!headers) return false;
        const response = await req.post(
            `/private/${tenantSlug}/formularios`,
            formularioData,
            {headers}
        );
      return response.data.formulario;
    } catch (error) {
      console.error("Erro ao criar formulário:", error);
      throw error;
    }
};
  
export const updateFormulario = async (
tenantSlug,
formularioId,
formularioData
) => {
try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.put(
    `/private/${tenantSlug}/formularios/${formularioId}`,
    formularioData,
    {headers}
    );
    return response.data.formulario;
} catch (error) {
    console.error("Erro ao atualizar formulário:", error);
    throw error;
}
};

export const deleteFormulario = async (tenantSlug, formularioId) => {
try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(
    `/private/${tenantSlug}/formularios/${formularioId}`,
    {headers}
    );
    return response.data;
} catch (error) {
    console.error("Erro ao deletar formulário:", error);
    throw error;
}
};

export const getFormularios = async (tenantSlug) => {
try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/formularios`,  {headers});
    return response.data.formularios;
} catch (error) {
    console.error("Erro ao obter formulários:", error);
    throw error;
}
};

export const getFormulario = async (tenantSlug, idFormulario) => {
try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(
    `/private/${tenantSlug}/formularios/${idFormulario}`,
    {headers}
    );
    return response.data.formulario;
} catch (error) {
    if (error.response && error.response.status === 404) {
    console.error("Participações não encontradas:", error);
    return null;
    }
    console.error("Erro ao obter as participações:", error);
    throw error;
}
};

export const getFormularioProjeto = async (tenantSlug) => {
    try {
        const headers = getAuthHeadersClient();
        if (!headers) return false;
        const response = await req.get(
        `/private/${tenantSlug}/getFormularioProjeto`,
        {headers}
        );
        return response.data.formulario;
    } catch (error) {
        if (error.response && error.response.status === 404) {
        console.error("Formulário não encontrado:", error);
        return null;
        }
        console.error("Erro ao obter as participações:", error);
        throw error;
    }
    };
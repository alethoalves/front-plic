import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';


/**************************
 * CV LATTES
 **************************/
export const createCvLattes = async (tenantSlug, cvLattesData) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.post(
        `/private/${tenantSlug}/cvLattes`,
        cvLattesData,
        { headers }
      );
      return response.data.cvLattes;
    } catch (error) {
      console.error("Erro ao criar CV Lattes:", error);
      throw error;
    }
  };
  
  export const xmlLattes = async (file, name, tenantSlug) => {
    console.log(`este é o nome passado: ${name}`);
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
  
      const formData = new FormData();
      formData.append("file", file);
      formData.append("nome", name);
  
      const response = await req.post(
        `/private/${tenantSlug}/external/xmlLattes`,
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      return response.data.cvLattes;
    } catch (error) {
      console.error("Erro ao criar CV Lattes:", error);
      throw error;
    }
  };
  
  export const getCvLattes = async (tenantSlug, userId) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(`/private/${tenantSlug}/cvLattes`, {
        headers,
        params: { userId },
      });
      return response.data.cvLattes;
    } catch (error) {
      console.error("Erro ao obter CV Lattes:", error);
      throw error;
    }
  };
  
  export const getCvLattesById = async (tenantSlug, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(`/private/${tenantSlug}/cvLattes/${id}`, {
        headers,
      });
      return response.data.cvLattes;
    } catch (error) {
      console.error("Erro ao obter CV Lattes:", error);
      throw error;
    }
  };
  
  export const updateCvLattes = async (tenantSlug, id, cvLattesData) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.put(
        `/private/${tenantSlug}/cvLattes/${id}`,
        cvLattesData,
        { headers }
      );
      return response.data.cvLattes;
    } catch (error) {
      console.error("Erro ao atualizar CV Lattes:", error);
      throw error;
    }
  };
  
  export const deleteCvLattes = async (tenantSlug, id) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.delete(`/private/${tenantSlug}/cvLattes/${id}`, {
        headers,
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao deletar CV Lattes:", error);
      throw error;
    }
  };
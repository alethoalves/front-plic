import { cpfValidatorSchema } from "@/lib/zodSchemas/cpfValidatorSchema.js";
import { req } from "./axios.js";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { getAuthHeadersClient } from "@/lib/headers.js";
const getAuthToken = () => {
  const token = getCookie("authToken");
  if (!token) return false;
  return token;
};
const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) return false;
  return { Authorization: `Token ${token}` };
};





export const getDataFromCPF = async (tenantSlug, cpf) => {
  console.log("ENTROU")
  try {
    // Validar o CPF antes de fazer a requisição
    const validation = cpfValidatorSchema.safeParse({ cpf });
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }
    // Se a validação passar, fazer a requisição
    const response = await req.post(
      `/private/${tenantSlug}/external/getDataFromCPF`,
      { cpf },
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("CPF não encontrado:", error);
      return null; // Retorna null ou algum valor padrão para indicar que o CPF não foi encontrado
    }
    // Para outros erros, relança o erro para que o chamador possa tratá-lo
    console.error("Erro ao obter dados pelo CPF:", error);
    throw error;
  }
};

export const uploadFile = async (file, tenantSlug) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await req.post(
      `/private/${tenantSlug}/external/upload`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};
export const deleteFile = async (tenantSlug, fileUrl) => {
  try {
    const token = getCookie("authToken");
    if (!token) {
      return false;
    }

    const formData = { fileUrl };
    console.log(formData);
    const response = await req.post(
      `/private/${tenantSlug}/external/deleteFile`,
      formData,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};












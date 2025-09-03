import { req } from "@/app/api/axios";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { getAuthHeadersClient } from "@/lib/headers.js";


export const signin = async (data) => {
  try {
    const response = await req.post("/auth/signin", data);
    const { token, perfis,nextStep } = response.data;
    if (token) {
      setCookie("authToken", token, {
        maxAge: 24 * 60 * 60, // 24h
        path: "/", // Opcional: define o caminho do cookie
        //httpOnly: true, // Opcional: define o cookie como acessível apenas via HTTP
        secure: process.env.NODE_ENV === "production", // Opcional: define o cookie como seguro apenas em produção
        sameSite: "Strict", // Opcional: define a política de SameSite para o cookie
      });
    }
    if (perfis) {
      setCookie("userProfiles", JSON.stringify(perfis), {
        maxAge: 24 * 60 * 60, // 24h
        path: "/", // Opcional: define o caminho do cookie
        //httpOnly: true, // Opcional: define o cookie como acessível apenas via HTTP
        secure: process.env.NODE_ENV === "production", // Opcional: define o cookie como seguro apenas em produção
        sameSite: "Strict", // Opcional: define a política de SameSite para o cookie
      });
    }
    

    

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error; // Relança o erro para que o chamador possa tratá-lo
  }
};

export const signinAvaliadorEvento = async (data) => {
  try {
    const response = await req.post("/auth/evento/avaliador/signin", data);
    const { token, codAvaliador } = response.data; // Adicione codAvaliador aqui
    
    if (token) {
      setCookie("authTokenAvaliador", token, {
        maxAge: 24 * 60 * 60,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });
    }
 
    return response.data; // Isso já inclui todas as propriedades da resposta
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const signup = async (data, reqParams) => {
  try {
    const response = await req.post("/auth/signup", data, {
      params: reqParams,
    });

    if (response.data.success && response.data.token) {
      const { token } = response.data;
      setCookie("authToken", token, {
        maxAge: 24 * 60 * 60, // 24h
        path: "/", // Opcional: define o caminho do cookie
        //httpOnly: true, // Opcional: define o cookie como acessível apenas via HTTP
        secure: process.env.NODE_ENV === "production", // Opcional: define o cookie como seguro apenas em produção
        sameSite: "Strict", // Opcional: define a política de SameSite para o cookie
      });
    }

    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error; 
  }
};

export const logout = () => {
  deleteCookie("authToken");
  deleteCookie("authTokenAvaliador");
  deleteCookie("userProfiles");
  deleteCookie("perfilSelecionado");
  deleteCookie("anoSelected");
};


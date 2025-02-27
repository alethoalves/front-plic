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
    //console.log(perfis)
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
    deleteCookie("userProfiles");
    deleteCookie("perfilSelecionado");
};


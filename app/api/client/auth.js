import { req } from "@/app/api/axios";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { getAuthHeadersClient } from "@/lib/headers.js";


export const signin = async (data) => {
    try {
      const response = await req.post("/auth/signin", data);
      const { token, perfis } = response.data;
      setCookie("authToken", token, {
        maxAge: 24 * 60 * 60, // 24h
        path: "/", // Opcional: define o caminho do cookie
        //httpOnly: true, // Opcional: define o cookie como acessível apenas via HTTP
        secure: process.env.NODE_ENV === "production", // Opcional: define o cookie como seguro apenas em produção
        sameSite: "Strict", // Opcional: define a política de SameSite para o cookie
      });
  
      setCookie("userProfiles", JSON.stringify(perfis), {
        maxAge: 24 * 60 * 60, // 24h
        path: "/", // Opcional: define o caminho do cookie
        //httpOnly: true, // Opcional: define o cookie como acessível apenas via HTTP
        secure: process.env.NODE_ENV === "production", // Opcional: define o cookie como seguro apenas em produção
        sameSite: "Strict", // Opcional: define a política de SameSite para o cookie
      });
  
      return perfis;
    } catch (error) {
      console.error("Error:", error);
      throw error; // Relança o erro para que o chamador possa tratá-lo
    }
  };


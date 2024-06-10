import { getCookie, deleteCookie } from "cookies-next";
import { cookies } from "next/headers"; //Funciona apenas do lado do servidor
import { req } from "./axios";

export const isLogged = async () => {
    try {
      const token = getCookie('authToken',{cookies})
      if (!token) { 
        return false;
      }
      // Consulta o servidor
      await req.get('/private/isLogged', {
        headers: {
          "Authorization": `Token ${token}`
        }
      });
      return true

    } catch (error) {
      return false
    }
  };

  
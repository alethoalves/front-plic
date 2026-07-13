import { getCookie } from "cookies-next";

export const getAuthHeadersServer = (token) => {
    return {
      "authorization": `Token ${token}`
    };
  }
export const getAuthToken = () => {
    const token = getCookie('authToken');
    if (!token) return false;
    return token;
  };
  export const getAuthTokenAvaliador = () => {
    const token = getCookie('authTokenAvaliador');
    if (!token) return false;
    return token;
  };
export  const getAuthHeadersClient = () => {
    const token = getAuthToken();
    if (!token) return false;
    return {"authorization": `Token ${token}`};
  };

  export  const getAuthHeadersClientAvaliador = () => {
    const token = getAuthTokenAvaliador();
    if (!token) return false;
    return {"authorization": `Token ${token}`};
  };

  // Decodifica o payload do authToken no client (sem verificar assinatura —
  // só leitura do claim "id", igual já era feito localmente em
  // TabelaInscricao.jsx). Usar apenas para obter o userId do usuário logado.
  export const getCurrentUserId = () => {
    try {
      const token = getAuthToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id ?? null;
    } catch {
      return null;
    }
  };
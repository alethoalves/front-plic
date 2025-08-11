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
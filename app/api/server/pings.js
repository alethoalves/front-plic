import { req } from "@/app/api/axios";
import { getAuthHeadersServer } from "@/lib/headers";

export const pingGestor = async (token,tenant) => {
  try {
    const response = await req.get(`/private/${tenant}/ping/gestor`, {
      headers: getAuthHeadersServer(token)
    });
    return response.data.pong
  } catch (error) {
    return false
  }
};

export const pingOrientador = async (token,tenant) => {
  try {
    const response = await req.get(`/private/${tenant}/ping/orientador`, {
      headers: getAuthHeadersServer(token)
    });
    return response.data.pong
  } catch (error) {
    return false
  }
};

export const pingAluno = async (token,tenant) => {
  try {
    const response = await req.get(`/private/${tenant}/ping/aluno`, {
      headers: getAuthHeadersServer(token)
    });
    return response.data.pong
  } catch (error) {
    return false
  }
};
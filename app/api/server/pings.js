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

export const pingAvaliador = async (token) => {
  try {
    const response = await req.get(`/private/plic/ping/avaliador`, {
      headers: getAuthHeadersServer(token)
    });
    return response.data.pong
  } catch (error) {
    return false
  }
};


export const pingAdminEvento = async (token,eventoSlug) => {
  try {
    const response = await req.get(`/private/evenplic/${eventoSlug}/ping/admin`, {
      headers: getAuthHeadersServer(token)
    });
    return response.data.pong
  } catch (error) {
    return false
  }
};

export const pingRoot = async (token,eventoSlug) => {
  try {
    const response = await req.get(`/private/plic/ping/root`, {
      headers: getAuthHeadersServer(token)
    });
    return response.data.pong
  } catch (error) {
    return false
  }
};

export const pingUser = async (token,eventoSlug) => {
  try {
    const response = await req.get(`/private/plic/ping/user`, {
      headers: getAuthHeadersServer(token)
    });
    return response.data.pong
  } catch (error) {
    return false
  }
};
import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';

/**************************
AVALIADOR
**************************/
export const cadastrarAvaliador = async (
  tenantSlug, token) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/avaliador/cadastro/${token}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar cadastro:", error);
    throw error;
  }
};

export const getAvaliacoesPendentes = async (
  tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/avaliador/getAvaliacoesPendentes`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar avaliações pendentes:", error);
    throw error;
  }
};

export const getProjetosAguardandoAvaliacao = async (tenantSlug, areasIds = []) => {
  try {
      const headers = getAuthHeadersClient();
      if (!headers) {
          return false;
      }

      // Verifica se há áreas passadas e constrói a URL com query params, se necessário
      let url = `/private/${tenantSlug}/avaliador/getProjetosAguardandoAvaliacao`;
      if (areasIds.length > 0) {
          const query = areasIds.join(','); // Transforma o array de IDs em uma string separada por vírgulas
          url += `?areas=${query}`; // Adiciona os query params à URL
      }

      const response = await req.get(url, { headers });
      return response.data.submissoes;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};
export const getProjetoParaAvaliar = async (tenantSlug,inscricaoProjetoId ) => {
  try {
      const headers = getAuthHeadersClient();
      if (!headers) {
          return false;
      }

      let url = `/private/${tenantSlug}/avaliador/getProjetoParaAvaliar/${inscricaoProjetoId}`;
      
      const response = await req.get(url, { headers });
      return response.data.inscricaoProjeto;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};
export const getProjetosEmAvaliacao = async (tenantSlug) => {
  try {

    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/avaliador/getProjetosEmAvaliacao`,
      { headers }
    );
    return response.data.submissoes;
      
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const getFichaAvaliacao = async (tenantSlug,objetoAvaliativo,editalId ) => {
  try {

    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/avaliador/getFichaAvaliacao/${objetoAvaliativo}/${editalId}`,
      { headers }
    );
    return response.data.fichaAvaliacao;
      
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const associarAvaliadorInscricaoProjeto = async (tenant, idInscricaoProjeto) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenant}/avaliador/${idInscricaoProjeto}/associarAvaliadorInscricaoProjeto`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const desassociarAvaliadorInscricaoProjeto = async (tenant, idInscricaoProjeto) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenant}/avaliador/${idInscricaoProjeto}/desassociarAvaliadorInscricaoProjeto`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const GestorDesassociarAvaliadorInscricaoProjeto = async (tenant, idInscricaoProjeto,avaliadorId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenant}/avaliador/${idInscricaoProjeto}/${avaliadorId}/gestorDesassociarAvaliadorInscricaoProjeto`,
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const processarFichaAvaliacao = async (tenant, body) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/private/${tenant}/avaliador/processarFichaAvaliacao`,
      body,
      { headers }
    );
    return response.data;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const atribuicaoDeProjetosPeloGestor = async (tenant, body) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(
      `/private/${tenant}/avaliador/atribuicaoDeProjetosPeloGestor`,
      body,
      { headers }
    );
    return response.data;
  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

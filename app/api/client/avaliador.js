import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "./../axios.js";
import { getCookie } from 'cookies-next';


export const enviarConvitesAvaliadores = async (tenantSlug, payload) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.post(
      `/private/${tenantSlug}/enviar-convite`,
      payload,
      { headers }
    );
    return data;                           // { status, resumo }
  } catch (error) {
    console.error("Erro ao enviar convites:", error);
    throw error;
  }
};

export const enviarNotificacaoAvaliador = async (tenantSlug, payload) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.post(
      `/private/${tenantSlug}/avaliador/notificar-avaliadores`,
      payload,
      { headers }
    );
    return data;                           // { status, resumo }
  } catch (error) {
    console.error("Erro ao enviar convites:", error);
    throw error;
  }
};

// busca o registro ConviteAvaliadorAno pelo token único
export const consultarConviteByToken = async (token) => {
  try {
    const response = await req.get(`/public/convite/${token}`);
    return response.data.data;              // { status: 'success', data: { …convite } }
  } catch (error) {
    console.error("Erro ao consultar convite:", error);
    throw error;
  }
};

// busca o registro AvaliadorAno (avaliador interno) pelo token único
export const consultarAvaliadorByToken = async (token) => {
  try {
    const response = await req.get(`/public/convite/avaliador/${token}`);
    return response.data.data;              // { status: 'success', data: { …avaliador } }
  } catch (error) {
    console.error("Erro ao consultar avaliador:", error);
    throw error;
  }
};

export const recusarConvitePorToken = async (token) => {
  try {
    const response = await req.get(`/public/recusar-convite/avaliador/${token}`);
    return response.data.data;              // { status: 'success', data: { …avaliador } }
  } catch (error) {
    console.error("Erro ao recusar convite:", error);
    throw error;
  }
};

export const toggleStatusAvaliadorAno = async (payload) => {
  try {
    const { data } = await req.post(
      `/avaliador/toggle-status`,
      payload,
      
    );
    
    if (data.status === 'success') {
      return data;
    } else {
      throw new Error(data.message || 'Erro ao alterar status');
    }
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    throw error;
  }
};

// link geral de avaliador: verifica CPF+data de nascimento e diz pro front pra onde ir
export const verificarElegibilidadeAvaliador = async (tenantSlug, ano, { cpf, dtNascimento }) => {
  try {
    const { data } = await req.post(
      `/public/${tenantSlug}/avaliador/${ano}/verificar-elegibilidade`,
      { cpf, dtNascimento }
    );
    return data;                           // { status, elegibilidade, motivoRecusa? }
  } catch (error) {
    console.error("Erro ao verificar elegibilidade de avaliador:", error);
    throw error;
  }
};

// registra o pedido de análise do Lattes (cria o usuário se ainda não existir)
export const solicitarAnaliseLattes = async (tenantSlug, ano, payload) => {
  try {
    const { data } = await req.post(
      `/public/${tenantSlug}/avaliador/${ano}/solicitar-lattes`,
      payload
    );
    return data;
  } catch (error) {
    console.error("Erro ao solicitar análise de Lattes:", error);
    throw error;
  }
};

// vincula direto o usuário autenticado como avaliador do tenant/ano (caminho rápido, doutorado já confirmado)
export const vincularAvaliadorDireto = async (tenantSlug, ano) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.post(
      `/private/${tenantSlug}/avaliador/vincular-direto`,
      { ano },
      { headers }
    );
    return data;                           // { status, message, ano }
  } catch (error) {
    console.error("Erro ao vincular avaliador direto:", error);
    throw error;
  }
};

// lista as solicitações de análise de Lattes de um tenant/ano, para o gestor decidir
export const getSolicitacoesLattes = async (tenantSlug, ano) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.get(
      `/private/${tenantSlug}/avaliador/solicitacoes-lattes?ano=${ano}`,
      { headers }
    );
    return data.solicitacoes;
  } catch (error) {
    console.error("Erro ao listar solicitações de Lattes:", error);
    throw error;
  }
};

// gestor aprova ou recusa uma solicitação de análise de Lattes
export const decidirSolicitacaoLattes = async (tenantSlug, id, { aprovado, motivoRecusa, anoTitulacao }) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.post(
      `/private/${tenantSlug}/avaliador/solicitacoes-lattes/${id}/decidir`,
      { aprovado, motivoRecusa, anoTitulacao },
      { headers }
    );
    return data;                           // { status, mensagem }
  } catch (error) {
    console.error("Erro ao decidir solicitação de Lattes:", error);
    throw error;
  }
};

// regera a mensagem pronta (aprovado/recusado) de uma solicitação já decidida, sem mudar nada
export const reenviarMensagemSolicitacaoLattes = async (tenantSlug, id) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.post(
      `/private/${tenantSlug}/avaliador/solicitacoes-lattes/${id}/reenviar-mensagem`,
      {},
      { headers }
    );
    return data;                           // { status, mensagem, celular }
  } catch (error) {
    console.error("Erro ao reenviar mensagem de solicitação de Lattes:", error);
    throw error;
  }
};

// vincula o usuário já autenticado (login/cadastro real por CPF) ao convite pelo token
export const vincularConviteAvaliador = async (tenantSlug, token) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const { data } = await req.post(
      `/private/${tenantSlug}/avaliador/convite/${token}/vincular`,
      {},
      { headers }
    );
    return data;                           // { status, message, ano, userId }
  } catch (error) {
    console.error('Erro ao vincular avaliador ao convite:', error);
    throw error;
  }
};

export const getAvaliadoresComProjetosPendentes = async (tenant, ano) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      throw new Error('Não foi possível obter os headers de autenticação');
    }

    const response = await req.get(
      `/private/${tenant}/${ano}/lista-avaliadores-com-avaliacoes-pendentes`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao buscar avaliadores com projetos pendentes:", error);
    throw error;
  }
};

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

export const getProjetosAguardandoAvaliacao = async (tenantSlug, areasIds = [], ano = null) => {
  try {
      const headers = getAuthHeadersClient();
      if (!headers) {
          return false;
      }

      // Verifica se há áreas e/ou ano passados e constrói a URL com query params, se necessário
      const params = new URLSearchParams();
      if (areasIds.length > 0) {
          params.set('areas', areasIds.join(',')); // Transforma o array de IDs em uma string separada por vírgulas
      }
      if (ano) {
          params.set('ano', ano);
      }
      const query = params.toString();
      const url = `/private/${tenantSlug}/avaliador/getProjetosAguardandoAvaliacao${query ? `?${query}` : ''}`;

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
export const getProjetosEmAvaliacao = async (tenantSlug, ano = null) => {
  try {

    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const url = `/private/${tenantSlug}/avaliador/getProjetosEmAvaliacao${ano ? `?ano=${ano}` : ''}`;
    const response = await req.get(url, { headers });
    return response.data.submissoes;

  } catch (error) {
      console.error("Erro ao atualizar campo:", error);
      throw error;
  }
};

export const getEstatisticasAvaliador = async (tenantSlug, ano = null) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const url = `/private/${tenantSlug}/avaliador/getEstatisticasAvaliador${ano ? `?ano=${ano}` : ''}`;
    const response = await req.get(url, { headers });
    return response.data.estatisticas;
  } catch (error) {
      console.error("Erro ao buscar estatísticas do avaliador:", error);
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

export const getFichasAvaliacaoProjeto = async (tenantSlug ) => {
  try {

    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/avaliador/getFichasAvaliacaoProjeto`,
      { headers }
    );
    return response.data.fichas;
      
  } catch (error) {
      console.error("Erro ao buscar fichas:", error);
      throw error;
  }
};
export const getFichaAvaliacaoDetalheGestor = async (tenantSlug, idFicha) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      `/private/${tenantSlug}/gestor/fichaAvaliacao/${idFicha}`,
      { headers }
    );
    return response.data.ficha;
  } catch (error) {
    console.error("Erro ao buscar detalhe da ficha:", error);
    throw error;
  }
};
export const deleteFichaAvaliacao = async (tenantSlug,fichaId ) => {
  try {

    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/fichaAvaliacao/${fichaId}`,
      { headers }
    );
    return response.data;

  } catch (error) {
      console.error("Erro ao buscar fichas:", error);
      throw error;
  }
};

export const arquivarFichaAvaliacao = async (tenantSlug, fichaId, arquivada) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.put(
      `/private/${tenantSlug}/fichaAvaliacao/${fichaId}/arquivar`,
      { arquivada },
      { headers }
    );
    return response.data;

  } catch (error) {
      console.error("Erro ao arquivar ficha:", error);
      throw error;
  }
};

export const avaliadorRefazerAvaliacao = async (tenantSlug, fichaId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.delete(
      `/private/${tenantSlug}/avaliador/fichaAvaliacao/${fichaId}`,
      { headers }
    );
    return response.data;

  } catch (error) {
      console.error("Erro ao editar avaliação:", error);
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

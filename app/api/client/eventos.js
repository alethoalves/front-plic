import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";
import { getCookie } from 'cookies-next';
/**************************
 * FLUXO DE INSCRICAO/SUBMISSAO 
 **************************/
export const cpfVerificationForInscricao = async (cpf) => {
  try {
    
    const response = await req.get(
      `/evenplic/cpfVerification/${cpf}`,
    );
    return response.data.user;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getUltimaAvaliacaoDepurada = async (eventoSlug,submissaoId) => {
  try {
    
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/ultima-avaliacao/${submissaoId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getSubmissoesByCPFAndEvento = async (cpf,eventoSlug) => {
  try {
    
    const response = await req.get(
      `/evenplic/getSubmissoesByCPFAndEvento/${cpf}/${eventoSlug}`,
    );
    return response.data.submissoes;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const getFiltros = async (eventoSlug) => {
  try {
    
    const response = await req.get(
      `/evenplic/getFiltros/${eventoSlug}`,
    );
    return response.data.filtros;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getPublicacoes = async (eventoSlug) => {
  try {
    
    const response = await req.get(
      `/evenplic/getPublicacoes/${eventoSlug}`,
    );
    return response.data.publicacoes;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getPublicacao = async (idSubmissao) => {
  try {
    
    const response = await req.get(
      `/evenplic/getPublicacao/${idSubmissao}`,
    );
    return response.data.publicacao;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const deleteSubmissaoByUser = async (submissaoId, cpf) => {
  try {
    const response = await req.delete(
      `/evenplic/deleteSubmissao/${submissaoId}/${cpf}`
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao excluir submissão:", error);
    throw error;
  }
};
export const criarInscricaoEvento = async (body) => {
  try {
    // Para instituição parceira não há headers (não tem conta no PLIC); para
    // um tenant real, o backend agora exige o header de autenticação (ver
    // verificarAutenticacaoTenant no back) — enviamos se já estiver logado.
    const headers = getAuthHeadersClient();
    const response = await req.post(
        `/evenplic/criarInscricaoEvento`,
        body,
        headers ? { headers } : undefined,
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao criar formulário:", error);
    throw error;
  }
};

export const getTenantsByEventoSlug = async (slug) => {
  try {

    const response = await req.get(
      `/evenplic/${slug}/getTenantsByEventoSlug`,
    );
    return response.data.tenants;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getPlanosOuProjetos = async (cpf,slugEvento, slugTenant) => {
  try {
    // Este endpoint é sempre chamado no fluxo de tenant real (nunca para
    // instituição parceira) — o backend exige autenticação.
    const headers = getAuthHeadersClient();
    const response = await req.get(
      `/evenplic/getTenantsByEventoSlug/${cpf}/${slugEvento}/${slugTenant}`,
      headers ? { headers } : undefined,
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const getPendenciasApresentacao = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.get(
      `/evenplic/${tenantSlug}/user/pendencias-apresentacao`,
      { headers }
    );
    return response.data.pendencias;
  } catch (error) {
    console.error("Erro ao buscar pendências de apresentação:", error);
    throw error;
  }
};

export const getEventosParaJustificarAusencia = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.get(
      `/evenplic/${tenantSlug}/user/eventos-para-justificar-ausencia`,
      { headers }
    );
    return response.data.eventos;
  } catch (error) {
    console.error("Erro ao buscar eventos para justificar ausência:", error);
    throw error;
  }
};

export const getPlanosParaJustificarAusencia = async (tenantSlug, idEvento) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.get(
      `/evenplic/${tenantSlug}/user/eventos-para-justificar-ausencia/${idEvento}/planos`,
      { headers }
    );
    return response.data; // { evento, planos }
  } catch (error) {
    console.error("Erro ao buscar planos para justificar ausência:", error);
    throw error;
  }
};

export const justificarApresentacaoPosEvento = async (tenantSlug, idEvento, idPlanoDeTrabalho, justificativa, comprovanteFile) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const formData = new FormData();
    formData.append("justificativa", justificativa);
    if (comprovanteFile) {
      formData.append("file", comprovanteFile);
    }

    const response = await req.post(
      `/evenplic/${tenantSlug}/evento/${idEvento}/planoDeTrabalho/${idPlanoDeTrabalho}/justificar-apresentacao`,
      formData,
      { headers: { ...headers, "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao justificar apresentação:", error);
    throw error;
  }
};

export const validarJustificativaManualmente = async (eventoSlug, justificativaId, motivo) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.put(
      `/evenplic/evento/${eventoSlug}/justificativa-apresentacao/${justificativaId}/validar-manualmente`,
      { motivo },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao validar justificativa manualmente:", error);
    throw error;
  }
};
export const getRegistrosAtividadePorPlano = async (planoId, eventoSlug) => {
  try {
    
    const response = await req.get(
      `/evenplic/getRegistrosAtividadePorPlano/${planoId}/${eventoSlug}`,
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getEventoBySlugForInscricao = async (eventoSlug) => {
  try {
    
    const response = await req.get(
      `/evenplic/getEventoBySlugForInscricao/${eventoSlug}`,
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};


/**************************
 * Eventos
 **************************/
export const getEventoProgramacao = async (eventoId) => {
  try {
    
    const response = await req.get(`/evenplic/programacao/${eventoId}`);
    
    return response.data.programacao;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getEventoRootBySlug = async (slug) => {
  try {
    
    const response = await req.get(
      `/evenplic/eventoRootSlug/${slug}`,
      
    );
    return response.data.eventoRoot;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const getEventosByTenant = async (tenantSlug) => {
    try {
      const headers = getAuthHeadersClient();
      if (!headers) {
        return false;
      }
      const response = await req.get(
        `/evenplic/${tenantSlug}/eventos`,
        { headers }
      );
      return response.data.eventos;
    } catch (error) {
      console.error("Erro ao chamar a API:", error);
      throw error;
    }
  };
export const getEventoBySlug = async (slug) => {
  try {
    const response = await req.get(
      `/evenplic/eventoSlug/${slug}/edicao`,
      
    );
    return response.data.evento;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const getAllEvents = async () => {
  try {
    
    const response = await req.get(
      `/evenplic/allevents`,
      
    );
    return response.data.eventos;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
export const startSubmissaoEvento = async (tenantSlug,idEvento,idPlanoDeTrabalho,idFormulario,idSubsessaoApresentacao,justificativaAusencia) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.post(

      `/evenplic/${tenantSlug}/startSubmissaoEvento/${idEvento}/${idPlanoDeTrabalho}/${idFormulario}?idSubsessaoApresentacao=${idSubsessaoApresentacao}`,
      justificativaAusencia ? { justificativaAusencia } : {},
      { headers }
    );
    return response.data.submissao;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const getSubmissoesEvento = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) {
      return false;
    }
    const response = await req.get(
      
      `/evenplic/${tenantSlug}/submissoes`,

      { headers }
    );
    return response.data.submissoes;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};

export const deleteSubmissao = async (tenantSlug, idSubmissao) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.delete(`/evenplic/${tenantSlug}/submissao/${idSubmissao}`, {headers});
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar edital:', error);
    throw error;
  }
};

export const createEdicaoEvento = async (tenantSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.post(
      `/evenplic/${tenantSlug}/evento`,
      data,
      { headers }
    );

    return response.data.evento;
  } catch (error) {
    console.error("Erro ao criar edição de evento:", error);
    throw error;
  }
};

export const getEventosDashboard = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    

    // Monta a URL da requisição, incluindo as query params dinâmicas
    const response = await req.get(
      `/evenplic/${tenantSlug}/eventos/dashboard`,
      { headers }
    );

    // Retorna os dados de inscrições da resposta da API
    return response.data.eventos;
  } catch (error) {
    console.error("Erro ao buscar dashboard de inscrições:", error);
    throw error;
  }
};

export const getEventoDashboard = async (eventoSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    // Monta a URL da requisição, incluindo as query params dinâmicas
    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/dashboard`,
      { headers }
    );

    // Retorna os dados de inscrições da resposta da API
    return response.data.evento;
  } catch (error) {
    console.error("Erro ao buscar dashboard de inscrições:", error);
    throw error;
  }
};


export const getEventoConfiguracoes = async (eventoSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/configuracoes`,
      { headers }
    );

    return response.data.evento;
  } catch (error) {
    console.error("Erro ao buscar configurações do evento:", error);
    throw error;
  }
};

export const updateEventoConfiguracoes = async (eventoSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.put(
      `/evenplic/evento/${eventoSlug}/configuracoes`,
      data,
      { headers }
    );

    return response.data.evento;
  } catch (error) {
    console.error("Erro ao atualizar configurações do evento:", error);
    throw error;
  }
};

export const getConfiguracoesEdicaoAnterior = async (eventoSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/configuracoes/edicao-anterior`,
      { headers }
    );

    return response.data.edicaoAnterior;
  } catch (error) {
    console.error("Erro ao buscar configurações da edição anterior:", error);
    throw error;
  }
};

export const criarInstituicaoParceira = async (eventoSlug, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.post(
      `/evenplic/evento/${eventoSlug}/instituicoes-parceiras`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao criar instituição parceira:", error);
    throw error;
  }
};

export const atualizarApresentacaoObrigatoria = async (eventoSlug, tenantId, apresentacaoObrigatoria) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.put(
      `/evenplic/evento/${eventoSlug}/tenants/${tenantId}/apresentacao-obrigatoria`,
      { apresentacaoObrigatoria },
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar apresentação obrigatória:", error);
    throw error;
  }
};

export const atualizarInstituicaoParceira = async (eventoSlug, id, data) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.put(
      `/evenplic/evento/${eventoSlug}/instituicoes-parceiras/${id}`,
      data,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar instituição parceira:", error);
    throw error;
  }
};

export const excluirInstituicaoParceira = async (eventoSlug, id) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.delete(
      `/evenplic/evento/${eventoSlug}/instituicoes-parceiras/${id}`,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao excluir instituição parceira:", error);
    throw error;
  }
};

export const getInstituicoesParceirasEdicaoAnterior = async (eventoSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.get(
      `/evenplic/evento/${eventoSlug}/instituicoes-parceiras/edicao-anterior`,
      { headers }
    );

    return response.data.edicaoAnterior;
  } catch (error) {
    console.error("Erro ao buscar instituições parceiras da edição anterior:", error);
    throw error;
  }
};

export const importarInstituicoesParceirasDaEdicaoAnterior = async (eventoSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.post(
      `/evenplic/evento/${eventoSlug}/instituicoes-parceiras/importar-edicao-anterior`,
      {},
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao importar instituições parceiras da edição anterior:", error);
    throw error;
  }
};

export const uploadImagemEvento = async (eventoSlug, formData) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;

    const response = await req.post(
      `/evenplic/evento/${eventoSlug}/configuracoes/upload`,
      formData,
      { headers: { ...headers, "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem do evento:", error);
    throw error;
  }
};

export const getEventosAnoCorrente = async (slug) => {
  try {
    const response = await req.get(
      `/evenplic/eventosAnoCorrente`,
      
    );
    return response.data.eventos;
  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    throw error;
  }
};
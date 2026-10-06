import { getAuthHeadersClient } from "@/lib/headers.js";
import { req } from "../axios.js";

/**************************
 * SOLICITAÇÕES DE ALTERAÇÃO DE PARTICIPAÇÃO
 * (orientador solicita, gestor decide)
 **************************/

// Evento disparado após qualquer mudança nas solicitações, para o contador
// do menu do gestor e outras telas se atualizarem sem polling.
export const EVENTO_ALTERACOES_PARTICIPACAO = "alteracoes-participacao:changed";
export const notificarAlteracoesParticipacao = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_ALTERACOES_PARTICIPACAO));
  }
};

// Prévia, envio e decisão rodam a operação real dentro de uma transação
// (simulada ou definitiva) — podem passar dos 25 s padrão do axios quando o
// banco está longe da API.
const TIMEOUT_OPERACAO = 90000;

const headersOuErro = () => {
  const headers = getAuthHeadersClient();
  if (!headers) throw new Error("Sessão expirada. Entre novamente.");
  return headers;
};

/* ───────────── Orientador ───────────── */

// Recurso habilitado por tenant (desabilitado por padrão)
export const getRecursoSolicitacoesOrientador = async (tenantSlug) => {
  const response = await req.get(`/private/${tenantSlug}/orientador/alteracoes-participacao/habilitado`, {
    headers: headersOuErro(),
  });
  return Boolean(response.data.habilitado);
};

export const getPainelOrientandos = async (tenantSlug, ano) => {
  const response = await req.get(
    `/private/${tenantSlug}/orientador/alteracoes-participacao/painel`,
    { headers: headersOuErro(), params: ano ? { ano } : {} }
  );
  return response.data.editais;
};

export const previaSolicitacaoAlteracao = async (tenantSlug, dados) => {
  const response = await req.post(
    `/private/${tenantSlug}/orientador/alteracoes-participacao/previa`,
    dados,
    { headers: headersOuErro(), timeout: TIMEOUT_OPERACAO }
  );
  return response.data.previa;
};

export const criarSolicitacaoAlteracao = async (tenantSlug, dados) => {
  const response = await req.post(
    `/private/${tenantSlug}/orientador/alteracoes-participacao`,
    dados,
    { headers: headersOuErro(), timeout: TIMEOUT_OPERACAO }
  );
  return response.data;
};

export const cancelarSolicitacaoAlteracao = async (tenantSlug, id) => {
  const response = await req.post(
    `/private/${tenantSlug}/orientador/alteracoes-participacao/${id}/cancelar`,
    {},
    { headers: headersOuErro() }
  );
  return response.data;
};

export const getHistoricoSolicitacoesOrientador = async (tenantSlug, ano) => {
  const response = await req.get(
    `/private/${tenantSlug}/orientador/alteracoes-participacao`,
    { headers: headersOuErro(), params: ano ? { ano } : {} }
  );
  return response.data.solicitacoes;
};

/* ───────────── Gestor ───────────── */

export const getSolicitacoesAlteracaoGestor = async (tenantSlug, ano, filtros = {}) => {
  const url = ano
    ? `/private/${tenantSlug}/${ano}/gestor/alteracoes-participacao`
    : `/private/${tenantSlug}/gestor/alteracoes-participacao`;
  const response = await req.get(url, { headers: headersOuErro(), params: filtros });
  return response.data;
};

export const getContagemSolicitacoesAlteracao = async (tenantSlug, ano) => {
  const response = await req.get(
    `/private/${tenantSlug}/${ano}/gestor/alteracoes-participacao/contagem`,
    { headers: headersOuErro() }
  );
  return response.data.pendentes;
};

export const getPreviaSolicitacaoGestor = async (tenantSlug, id) => {
  const response = await req.get(
    `/private/${tenantSlug}/gestor/alteracoes-participacao/${id}/previa`,
    { headers: headersOuErro(), timeout: TIMEOUT_OPERACAO }
  );
  return response.data.previa;
};

export const decidirSolicitacaoAlteracao = async (tenantSlug, id, decisao) => {
  const response = await req.post(
    `/private/${tenantSlug}/gestor/alteracoes-participacao/${id}/decidir`,
    decisao,
    { headers: headersOuErro(), timeout: TIMEOUT_OPERACAO }
  );
  return response.data;
};

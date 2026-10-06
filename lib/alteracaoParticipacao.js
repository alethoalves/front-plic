// Rótulos e helpers das solicitações de alteração de participação
// (tela "Meus orientandos" do orientador e fila do gestor).
import {
  RiArrowLeftRightLine,
  RiHandCoinLine,
  RiUserForbidLine,
  RiUserSharedLine,
} from "@remixicon/react";

export const ICONE_TIPO = {
  TRANSFERENCIA_BOLSA: RiArrowLeftRightLine,
  DEVOLUCAO_BOLSA: RiHandCoinLine,
  CANCELAMENTO: RiUserForbidLine,
  SUBSTITUICAO: RiUserSharedLine,
};

export const ROTULO_TIPO = {
  SUBSTITUICAO: "Substituição de aluno",
  TRANSFERENCIA_BOLSA: "Transferência de bolsa",
  CANCELAMENTO: "Cancelamento de participação",
  DEVOLUCAO_BOLSA: "Devolução de bolsa",
};

// Rótulo de uma solicitação, distinguindo as operações sobre a vaga na lista
// de espera (payload.vagaNaFila), que reaproveitam os tipos de bolsa.
export const rotuloSolicitacao = (s) => {
  if (s?.payload?.vagaNaFila) {
    if (s.tipo === "TRANSFERENCIA_BOLSA") return "Transferência de vaga na lista de espera";
    if (s.tipo === "DEVOLUCAO_BOLSA") return "Desistência da lista de espera";
  }
  return ROTULO_TIPO[s?.tipo] || s?.tipo;
};

export const ROTULO_STATUS = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  RECUSADA: "Recusada",
  CANCELADA: "Cancelada",
  PREJUDICADA: "Prejudicada",
};

// Classe CSS (definida em components/alteracoesParticipacao/*.module.scss)
export const TOM_STATUS = {
  PENDENTE: "warning",
  APROVADA: "success",
  RECUSADA: "error",
  CANCELADA: "neutral",
  PREJUDICADA: "neutral",
};

export const ROTULO_CLASSE = {
  BOLSISTA: "Bolsista",
  LISTA_ESPERA: "Lista de espera",
  AGUARDANDO_RESULTADO: "Aguardando resultado",
  VOLUNTARIO: "Voluntário",
  ENCERRADO: "Encerrado",
};

export const ROTULO_STATUS_VINCULO = {
  EM_ANALISE: "Em análise",
  APROVADO: "Aprovado",
  PENDENTE: "Pendente de documentos",
  ATIVO: "Ativo",
  CV_PENDENTE: "Currículo pendente",
  PRESTACAO_PENDENTE: "Prestação pendente",
  SUSPENSO: "Suspenso",
};

export const ROTULO_STATUS_PARTICIPACAO = {
  EM_ANALISE: "Em análise",
  APROVADA: "Aprovada",
  PENDENTE: "Pendente",
  ATIVA: "Ativa",
  RECUSADA: "Cancelada",
  SUBSTITUIDA: "Substituída",
  CANCELADA: "Cancelada",
  INATIVA: "Inativa",
};

export const ROTULO_STATUS_DOCUMENTO = {
  PENDENTE: "Pendente",
  ENVIADO: "Enviado",
  ACEITO: "Aceito",
  RECUSADO: "Recusado",
  AGUARDANDO_VALIDACAO: "Aguardando validação",
  CANCELADO: "Cancelado",
};

// Origem na lista de espera (sem cota) só pode ir para voluntário sem
// solicitação de bolsa; bolsa (com cota) pode ir para voluntário ou fila.
export const origemEhVagaFila = (origem) => origem?.classe === "LISTA_ESPERA";
export const podeReceberDe = (destino, origem) =>
  origemEhVagaFila(origem) ? Boolean(destino?.podeReceberVagaFila) : Boolean(destino?.podeReceberBolsa);
export const motivoNaoRecebeDe = (destino, origem) =>
  origemEhVagaFila(origem) ? destino?.motivoNaoRecebeVaga : destino?.motivoNaoRecebe;

// Situação de um aluno no "antes" da solicitação (fotografia do envio, ou da
// execução nas ações diretas do gestor): mostra de quem é a bolsa/vaga.
export const estadoAntesDe = (s, participacaoId) =>
  (s?.snapshot?.antes || s?.resultado?.antes || []).find((p) => p.participacaoId === participacaoId) || null;

// { texto, tom } para a etiqueta de situação: tom = bolsa | fila | voluntario | neutro
export const situacaoDoAluno = (estado) => {
  if (!estado) return null;
  const v = estado.vinculo;
  if (estado.classe === "BOLSISTA") return { texto: `Bolsa ${v?.instituicaoPagadora || ""}`.trim(), tom: "bolsa" };
  if (estado.classe === "LISTA_ESPERA")
    return { texto: `Lista de espera${v?.ordemRecebimentoBolsa ? ` · ordem ${v.ordemRecebimentoBolsa}` : ""}`, tom: "fila" };
  if (estado.classe === "VOLUNTARIO") return { texto: "Voluntário", tom: "voluntario" };
  if (estado.classe === "AGUARDANDO_RESULTADO") return { texto: "Solicitação em análise", tom: "neutro" };
  return { texto: "Encerrado", tom: "neutro" };
};

export const hojeISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Aceita "AAAA-MM-DD" ou "DD/MM/AAAA" e devolve "DD/MM/AAAA".
export const formatarDataCurta = (valor) => {
  if (!valor) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return valor;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (iso && valor.length === 10) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
};

export const formatarDataHora = (valor) => {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

// "12345678901" → "123.456.789-01" (outros formatos são mostrados como vieram).
export const formatarCpf = (cpf) => {
  if (!cpf) return null;
  const digitos = String(cpf).replace(/\D/g, "");
  return digitos.length === 11
    ? digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : String(cpf);
};

export const mensagemErro = (error, padrao = "Não foi possível concluir a operação.") =>
  error?.response?.data?.message || error?.message || padrao;

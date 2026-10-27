export const TIPOS_DOCUMENTO = {
  TERMO: "Termo",
  FORMULARIO: "Formulário",
  DECLARACAO: "Declaração",
  EXTERNO: "Arquivo externo",
};

export const ACOES_APOS_ASSINATURAS = {
  ATIVAR_PARTICIPACAO: "Ativar a participação do aluno",
  ATIVAR_VINCULO_BOLSA: "Ativar o vínculo de bolsa",
  JUSTIFICAR_AUSENCIA_SUBMISSAO: "Registrar a justificativa de ausência",
};

export const STATUS_REGISTRO = {
  PENDENTE: "Pendentes",
  ENVIADO: "Enviados",
  AGUARDANDO_VALIDACAO: "Aguardando validação",
  ACEITO: "Aceitos",
  RECUSADO: "Recusados",
  CANCELADO: "Cancelados",
};

// Variáveis substituídas pela API ao exibir o termo (documentosController,
// substituirVariaveis). Qualquer outro texto entre colchetes vira
// "[DADO NÃO ENCONTRADO]" para quem assina.
export const VARIAVEIS_PARTICIPACAO = [
  { nome: "NOME_ALUNO", descricao: "Nome do aluno" },
  { nome: "NOME_PLANO", descricao: "Título do plano de trabalho" },
  { nome: "INICIO_VIGENCIA_EDITAL", descricao: "Início da vigência do edital" },
  { nome: "FIM_VIGENCIA_EDITAL", descricao: "Fim da vigência do edital" },
];

export const VARIAVEIS_PROJETO = [
  { nome: "NOME_PROJETO", descricao: "Título do projeto" },
  { nome: "INICIO_VIGENCIA_EDITAL", descricao: "Início da vigência do edital" },
  { nome: "FIM_VIGENCIA_EDITAL", descricao: "Fim da vigência do edital" },
];

import { z } from "zod";

// Função para validar e converter a data no formato DD/MM/AAAA
const validateDateString = (dateString) => {
  const [day, month, year] = dateString.split("/").map(Number);

  if (
    !day ||
    !month ||
    !year ||
    day > 31 ||
    day < 1 ||
    month > 12 ||
    month < 1 ||
    year < 1900 ||
    year > new Date().getFullYear()
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return !isNaN(date.getTime());
};

export const atividadeSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),

  // Adicionado o campo "aberta", pois no formulário você faz:
  // <Controller name="aberta" ... /> com um Dropdown que retorna boolean
  aberta: z.boolean({
    invalid_type_error: "Selecione se a atividade está aberta",
  }),

  obrigatoria: z.boolean({
    invalid_type_error: "Selecione se a atividade é obrigatória",
  }),

  dataInicio: z
    .string("Data de início é obrigatória")
    .refine(validateDateString, {
      message: "Data de início inválida, use o formato DD/MM/AAAA",
    })
   ,

  dataFinal: z
    .string("Data final é obrigatória")
    .refine(validateDateString, {
      message: "Data final inválida, use o formato DD/MM/AAAA",
    })
   ,

  permitirEntregaForaPrazo: z.boolean({
    invalid_type_error: "Selecione se é permitido envio fora do prazo",
  }),

  formularioId: z
    .number({ invalid_type_error: "Selecione um formulário" })
    .min(1, "Selecione um formulário válido"),

  // ← Aqui você deve incluir o array de IDs de editais
  // que vem do MultiSelect. Ele sempre será um array de números (mesmo vazio),
  // então podemos exigir no mínimo 1 edital selecionado.
  editaisSelecionados: z
    .array(z.number(), {
      invalid_type_error: "Selecione ao menos um edital",
    })
    .min(1, "Selecione ao menos um edital"),
});

// Se você precisar de um esquema parcial em algum endpoint de edição, pode usar .partial():
export const partialAtividadeSchema = atividadeSchema.partial();

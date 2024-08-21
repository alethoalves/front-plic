import { z } from 'zod';

// Função para validar e converter a data no formato DD/MM/AAAA
const validateDateString = (dateString) => {
  const [day, month, year] = dateString.split('/').map(Number);

  if (
    !day || !month || !year ||
    day > 31 || day < 1 ||
    month > 12 || month < 1 ||
    year < 1900 || year > new Date().getFullYear()
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return !isNaN(date.getTime());
};

export const atividadeSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  obrigatoria: z.boolean(),
  dataInicio: z.string().refine(validateDateString, {
    message: "Data de início inválida, use o formato DD/MM/AAAA",
  }),
  dataFinal: z.string().refine(validateDateString, {
    message: "Data final inválida, use o formato DD/MM/AAAA",
  }),
  permitirEntregaForaPrazo: z.boolean(),
  formularioId: z.number({message:"Selecione um formulário"})
});

export const partialAtividadeSchema = atividadeSchema.partial();

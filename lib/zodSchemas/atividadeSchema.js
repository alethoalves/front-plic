import { z } from 'zod';

export const atividadeSchema = z.object({
    titulo: z.string().min(1, "Título é obrigatório"),
    descricao: z.string().min(1, "Descrição é obrigatória"),
    obrigatoria: z.boolean(),
    aberta: z.boolean(),
    formularioId: z.number()
  })

import { z } from 'zod';

export const formEdital = z.object({
  ano: z
    .string()
    .min(1, { message: 'Campo obrigatório!' }),
  titulo: z
    .string()
    .min(1, 'Campo obrigatório!'),
  })

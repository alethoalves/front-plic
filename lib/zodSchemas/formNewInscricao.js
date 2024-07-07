import { z } from 'zod';

export const formNewInscricao = z.object({
  editalId: z
    .number()
    .int()
    .min(1, { message: 'Campo obrigatório!' })
    .transform(val => val.toString()),
  status: z
    .string()
    .min(1, 'Campo obrigatório!'),
  })

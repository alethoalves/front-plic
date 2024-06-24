import { z } from 'zod';

export const formNewFormulario = z.object({
  titulo: z
    .string()
    .min(1, 'Campo obrigatório!'),
  tipo: z
    .string()
    .min(1, 'Campo obrigatório!'),
  })

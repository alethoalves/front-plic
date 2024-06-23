import { z } from 'zod';

export const buscador = z.object({
  value: z
    .string()
  })

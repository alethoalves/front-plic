import { z } from 'zod';

export const planoDeTrabalhoSchema = z.object({
   
    titulo: z
    .string()
    .min(1, 'Campo obrigatório!'),
    areaId: z
    .number()
    .min(1, 'Campo obrigatório!'),
});



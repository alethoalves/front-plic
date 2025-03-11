import { z } from 'zod';

export const cargoSchema = z.object({
  cargo: z.enum(['gestor', 'avaliador'],{ message: 'Selecione uma opção' }), // Adicionado 'avaliador' como opção
  nivel: z.union([z.literal("1"), z.literal("2"), z.literal(null)]).optional({ message: 'Selecione uma opção' }), // Nível opcional com valores 1 ou 2
  areas: z.array(z.string()).optional(),
});
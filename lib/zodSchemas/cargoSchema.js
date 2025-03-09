import { z } from 'zod';

export const cargoSchema = z.object({
  cargo: z.enum(['gestor', 'avaliador']), // Adicionado 'avaliador' como opção
  nivel: z.union([z.literal('1'), z.literal('2')]).optional(), // Nível opcional com valores 1 ou 2
});
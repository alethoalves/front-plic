import { z } from 'zod';

export const cargoSchema = z.object({
  cargo: z.enum(['gestor', 'avaliador'],{ message: 'Selecione uma opção' }), // Adicionado 'avaliador' como opção
  nivel: z.union([z.literal("1"), z.literal("2"), z.literal("0"), z.literal(null)]).optional({ message: 'Selecione uma opção' }), // Nível opcional com valores 1 ou 2
  areas: z.array(z.string()).optional(),
  email: z.string()
  .min(1, "O email é obrigatório")
  .email("Por favor, insira um email válido")
  .refine(email => {
    // Validação adicional se necessário (por exemplo, domínio específico)
    return true;
  }, {
    message: "Email inválido"
  }),
});
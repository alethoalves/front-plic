import { z } from 'zod';
import cpfValidator from '../cpfValidator';

export const formNewParticipacao = z.object({
  tipo: z
    .string()
    .min(1, 'Campo obrigatório!'),
    
  })

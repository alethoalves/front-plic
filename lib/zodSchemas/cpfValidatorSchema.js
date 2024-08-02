import { z } from 'zod';
import cpfValidator from '../cpfValidator';

export const cpfValidatorSchema = z.object({
  
  cpf: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido!' })
    .refine((value) => cpfValidator(value), { message: 'CPF inválido!' }),
  
  })



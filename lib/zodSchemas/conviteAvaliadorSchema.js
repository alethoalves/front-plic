import { z } from 'zod';
import cpfValidator from '../cpfValidator';

export const conviteAvaliadorSchema = z.object({
  
  cpf: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido!' })
    .refine((value) => cpfValidator(value), { message: 'CPF inválido!' }),
    dtNascimento:z
    .string().trim().min(1, 'Campo obrigatório!'),
    email: z
    .string( 'Campo obrigatório!').trim()
    .email({ message: 'Informe um email válido!' })
  })



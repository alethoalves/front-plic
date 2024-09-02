import { z } from 'zod';
import cpfValidator from '../cpfValidator';

export const signupSchema = z.object({
  
  email: z
    .string().trim()
    .email({ message: 'Informe um email válido!' })
    .optional(),
  dtNascimento:z
    .string().trim().optional(),
  celular: z
    .string().trim(),
    nome: z
    .string().trim()
    .optional(),
  cpf: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido!' }),
  senha: z
    .string().trim()
    .optional(),
  confirmacaoSenha: z
    .string().trim()
    .optional(),
  });

export const signinSchema = z.object({
  cpf: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido!' })
    .refine((value) => cpfValidator(value), { message: 'CPF inválido!' }),
  senha: z
    .string().trim()
    .min(3, { message: 'Mínimo 3 caracteres!' })
    .optional(),
  
});

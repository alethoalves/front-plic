import { z } from 'zod';
import cpfValidator from '../cpfValidator';

export const signupSchema = z.object({
  nome: z
    .string().trim()
    .min(2, 'Mínimo 2 caracteres!')
    .max(80, 'Limite de caracteres excedido!'),
  email: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .email({ message: 'Informe um email válido!' }),
  celular: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, { message: 'Celular inválido!' }),
  cpf: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido!' }),
  senha: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .min(3, { message: 'Mínimo 3 caracteres!' }),
  confirmacaoSenha: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .min(3, { message: 'Mínimo 3 caracteres!' }),
  }).refine(data => data.senha === data.confirmacaoSenha, {
    message: "As senhas devem coincidir",
    path: ["confirmacaoSenha"],
  });

export const signinSchema = z.object({
  cpf: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido!' })
    .refine((value) => cpfValidator(value), { message: 'CPF inválido!' }),
  senha: z
    .string().trim()
    .min(3, { message: 'Mínimo 3 caracteres!' }),
  slug: z
    .string().trim()
    .min(1, { message: 'Slug obrigatório!' }),

});

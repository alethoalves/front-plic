import { z } from 'zod';
import cpfValidator from '../cpfValidator';

export const elegibilidadeAvaliadorSchema = z.object({
  cpf: z
    .string().trim()
    .min(1, 'Campo obrigatório!')
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido!' })
    .refine((value) => cpfValidator(value), { message: 'CPF inválido!' }),
  dtNascimento: z
    .string().trim()
    .min(1, 'Campo obrigatório!'),
});

const linkLattesField = z
  .string().trim()
  .regex(/^https?:\/\/lattes\.cnpq\.br\/\d+\/?$/, {
    message: 'Informe um link do Lattes válido (ex.: http://lattes.cnpq.br/9422683454020933).',
  });

const areaIdsField = z
  .array(z.number())
  .min(1, { message: 'Selecione ao menos uma área de interesse.' });

export const solicitacaoLattesSoLattesSchema = z.object({
  linkLattes: linkLattesField,
  areaIds: areaIdsField,
});

export const solicitacaoLattesCadastroSchema = z
  .object({
    linkLattes: linkLattesField,
    areaIds: areaIdsField,
    email: z
      .string().trim()
      .min(1, 'Campo obrigatório!')
      .email({ message: 'Informe um email válido!' }),
    celular: z.string().trim().min(1, 'Campo obrigatório!'),
    senha: z.string().trim().min(4, { message: 'Mínimo 4 caracteres!' }),
    confirmacaoSenha: z.string().trim().min(4, { message: 'Mínimo 4 caracteres!' }),
  })
  .refine((data) => data.senha === data.confirmacaoSenha, {
    message: 'Senhas devem ser iguais!',
    path: ['confirmacaoSenha'],
  });

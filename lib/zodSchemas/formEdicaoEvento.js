import { z } from 'zod';

export const formEdicaoEvento = z
  .object({
    modo: z.enum(['existente', 'nova'], { message: 'Modo inválido!' }),
    eventoRootId: z.string().optional(),
    nomeEventoRoot: z.string().optional(),
    nomeEvento: z
      .string({ message: 'Nome do evento é obrigatório!' })
      .trim()
      .min(3, { message: 'Mínimo 3 caracteres!' }),
    edicaoEvento: z
      .string({ message: 'Edição do evento deve ser um número!' })
      .min(1, { message: 'Campo obrigatório!' }),
  })
  .superRefine((data, ctx) => {
    if (data.modo === 'existente' && !data.eventoRootId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o evento/série.',
        path: ['eventoRootId'],
      });
    }
    if (data.modo === 'nova' && (!data.nomeEventoRoot || data.nomeEventoRoot.trim().length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o nome da nova série de evento (mínimo 3 caracteres).',
        path: ['nomeEventoRoot'],
      });
    }
  });

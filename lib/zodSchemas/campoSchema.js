import { z } from 'zod';

export const campoSchema = z.object({
    label: z.string().min(1, { message: 'O título é obrigatório.' }),
    descricao: z.string().optional(),
    tipo: z.enum(
        ['text', 'textLong', 'blockNote', 'number', 'date', 'select', 'multiselect', 'checkbox', 'arquivo', 'flag', 'link'],
        { message: 'Selecione um tipo de campo.' }
    ),
    opcoes: z.any().optional(),
    ordem: z.any().optional(),
    tipoFile: z.string().optional(),
    maxChar: z.union([z.string(), z.number()]).optional(),
    obrigatorio: z.string().optional().default('true'),
    userTenantField: z.string().optional(),
}).refine((data) => data.tipo !== 'arquivo' || data.tipoFile, {
    message: 'Tipo de arquivo é obrigatório.',
    path: ['tipoFile'],
});

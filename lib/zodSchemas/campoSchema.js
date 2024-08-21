import { z } from 'zod';

export const campoSchema = z.object({
    label: z.string().min(1, { message: 'Campo obrigatório!' }),
    descricao: z.string().optional(),
    tipo: z.enum(['text', 'textLong', 'select','flag', 'arquivo', 'link'], { message: 'Campo obrigatório!' }),
    opcoes: z.any().optional(),
    ordem: z.any().optional(),
    tipoFile: z.string().optional(),
    maxChar: z.string({ message: 'Quantidade máxima de caracteres deve ser número!' }),
    obrigatorio: z.string(),
}).refine((data) => data.tipo !== 'arquivo' || data.tipoFile, {
    message: 'Tipo de arquivo é obrigatório.',
    path: ['tipoFile'], // Especifica que o erro será marcado no campo 'tipoFile'
});



import { z } from 'zod';

export const campoSchema = z.object({
    label: z.string().min(1, { message: 'Campo obrigatório!' }),
    descricao: z.string().optional(),
    tipo: z.enum(['text', 'textLong', 'select', 'arquivo', 'link']),
    opcoes: z.any().optional(),
    maxChar: z
    .string({ message: 'quantidade máxima de caracteres deve ser número!' }), // Aceita quota como string
    
    obrigatorio: z
    .string(),
    
});



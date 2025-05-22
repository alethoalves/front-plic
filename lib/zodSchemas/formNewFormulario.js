import { z } from 'zod';

export const formNewFormulario = z.object({
    titulo: z
      .string()
      .min(1, { message: 'Campo obrigatório!' }),
    descricao: z
      .string()
      .min(1, { message: 'Campo obrigatório!' })
      .max(300, {message:'Máximo 300 caracteres'}),
    tipo: z
      .enum(['orientador', 'aluno','projeto','planoDeTrabalho','atividade','avaliacao'],{message:"Campo obrigatório!"}),
    
  })

import { z } from 'zod';

export const formNewFormulario = z.object({
    titulo: z
      .string()
      .min(1, { message: 'Campo obrigatório!' }),
    descricao: z
      .string()
      .min(1, { message: 'Campo obrigatório!' })
      .max(100, {message:'Máximo 100 caracteres'}),
    tipo: z
      .enum(['orientador', 'aluno','projeto','planoDeTrabalho','atividade','avaliacao'],{message:"Campo obrigatório!"}),
    onSubmitStatus: z
      .enum(['concluido', 'aguardandoAvaliacao'],{message:"Campo obrigatório!"})
  })

import { z } from 'zod';

export const formConfiguracoesEvento = z.object({
  nomeEvento: z.string().trim().min(3, { message: 'Mínimo 3 caracteres!' }).optional().or(z.literal('')),
  slug: z
    .string()
    .trim()
    .min(3, { message: 'Mínimo 3 caracteres!' })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message: 'Use apenas letras minúsculas, números e hífen (ex: meu-evento-2026).',
    })
    .optional()
    .or(z.literal('')),
  local: z.string().optional(),
  // Aceita tanto ponto quanto vírgula como separador decimal (padrão
  // brasileiro ao copiar coordenadas, ex: "-15,845..."), convertido pra
  // ponto antes de validar o intervalo.
  latitude: z
    .string()
    .optional()
    .refine(
      (v) => !v || (/^-?\d+([.,]\d+)?$/.test(v.trim()) && Math.abs(Number(v.trim().replace(',', '.'))) <= 90),
      { message: 'Latitude inválida (use um valor entre -90 e 90).' }
    ),
  longitude: z
    .string()
    .optional()
    .refine(
      (v) => !v || (/^-?\d+([.,]\d+)?$/.test(v.trim()) && Math.abs(Number(v.trim().replace(',', '.'))) <= 180),
      { message: 'Longitude inválida (use um valor entre -180 e 180).' }
    ),
  raioCheckinMetros: z.string().optional(),
  telefone: z.string().optional(),
  linkGrupo: z.string().optional(),
  assinatura: z.string().optional(),
  conteudoDefaultConvite: z.string().optional(),
  isbn: z.string().optional(),
  pathBanner: z.any().optional(),
  pathBannerMobile: z.any().optional(),
  pathLogo: z.any().optional(),
  bgColor: z.string().optional(),
  primaryColor: z.string().optional(),
  inicio: z.string().optional(),
  fim: z.string().optional(),
  permitirSubmissoes: z.string().optional(),
  liberarFichaAvaliacao: z.string().optional(),
  depurarComentarioComIA: z.string().optional(),
  metodoCalculoNota: z.string().optional(),
  notaMinimaMencaoHonrosa: z.string().optional(),
  notaMinimaPremio: z.string().optional(),
});

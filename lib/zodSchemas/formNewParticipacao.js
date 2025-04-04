import { z } from 'zod';
import cpfValidator from '../cpfValidator';
// Função para validar e converter a data no formato DD/MM/AAAA
const validateDateString = (dateString) => {
  const [day, month, year] = dateString.split('/').map(Number);

  if (
    !day || !month || !year ||
    day > 31 || day < 1 ||
    month > 12 || month < 1 ||
    year < 1900 || year > new Date().getFullYear()
  ) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return !isNaN(date.getTime());
};

export const formNewParticipacao = z.object({
  tipo: z
    .string()
    .min(1, 'Campo obrigatório!'),
    solicitarBolsa: z
    .string() // Recebe uma string do frontend
    .transform((value) => value === "true") // Converte a string para booleano
    .optional(), // Permite que o campo seja opcional
  })

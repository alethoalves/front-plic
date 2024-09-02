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

export const formInativarParticipacao = z.object({
    fim: z.string({message:'Campo obrigatório'}).min(1, 'Campo obrigatório!').refine(validateDateString, {
      message: "Data de fim inválida, use o formato DD/MM/AAAA",
    }),
  })
import { format, utcToZonedTime } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const formatDateTime = (dateString) => {
  const timeZone = 'America/Sao_Paulo'; // Define o fuso horário de Brasília
  const zonedDate = utcToZonedTime(new Date(dateString), timeZone);
  return format(zonedDate, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
};

export default formatDateTime;
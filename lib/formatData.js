import { formatInTimeZone } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

const formatDateTime = (dateString) =>
  formatInTimeZone(dateString, 'UTC', 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });

export default formatDateTime;
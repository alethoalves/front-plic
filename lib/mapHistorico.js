// lib/mapHistorico.js
import formatDateTime from '@/lib/formatData';
import { formatStatusText } from '@/lib/tagUtils';

export const mapHistorico = (data = []) => {
  //console.log('Dados recebidos em mapHistorico:', data); // 👈 Log dos dados brutos

  return [...data]
    .sort((a, b) => b.id - a.id)
    .map((h, idx) => {
      //console.log('Item atual (antes da formatação):', h); // 👈 Log de cada item
     // console.log('Valor de h.inicio:', h.inicio); // 👈 Log específico do campo "inicio"

      const formattedDate = formatDateTime(h.inicio);
      //console.log('Data formatada:', formattedDate); // 👈 Log do resultado da formatação

      return {
        id: h.id,
        isLatest: idx === 0,
        status: formatStatusText(h.status),
        date: formattedDate,
        observacao: h.observacao,
        rawStatus: h.status
      };
    });
};
// lib/mapHistorico.js
import formatDateTime from '@/lib/formatData';
import { formatStatusText } from '@/lib/tagUtils';

export const mapHistorico = (data = []) => {

  return [...data]
    .sort((a, b) => b.id - a.id)
    .map((h, idx) => {

      const formattedDate = formatDateTime(h.inicio);

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
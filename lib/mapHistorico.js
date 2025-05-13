// lib/mapHistorico.js
import formatDateTime from '@/lib/formatData';
import { formatStatusText } from '@/lib/tagUtils';

export const mapHistorico = (data = []) =>
  [...data]
    .sort((a, b) => b.id - a.id)
    .map((h, idx) => ({
      isLatest: idx === 0,                // 👈 primeiro item
      status: formatStatusText(h.status),
      date: formatDateTime(h.inicio),
      observacao: h.observacao,
      rawStatus: h.status                 // uso opcional
    }));

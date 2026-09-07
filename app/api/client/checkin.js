import { req } from "@/app/api/axios";

// Fluxo público de check-in presencial do aluno — não usa headers de sessão
// de gestor/avaliador, só o token de propósito único devolvido por
// consultarCheckin (enviado como Bearer nos passos seguintes).

export const consultarCheckin = async (eventoSlug, cpf) => {
  const response = await req.post(`/evenplic/evento/${eventoSlug}/checkin/consultar`, { cpf });
  return response.data;
};

export const validarLocalizacaoCheckin = async (eventoSlug, token, { submissaoId, latitude, longitude }) => {
  const response = await req.post(
    `/evenplic/evento/${eventoSlug}/checkin/validar-localizacao`,
    { submissaoId, latitude, longitude },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const finalizarCheckin = async (eventoSlug, token, { submissaoId, latitude, longitude }) => {
  const response = await req.post(
    `/evenplic/evento/${eventoSlug}/checkin/finalizar`,
    { submissaoId, latitude, longitude },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getStatusCheckin = async (eventoSlug, checkinToken) => {
  const response = await req.get(`/evenplic/evento/${eventoSlug}/checkin/status/${checkinToken}`);
  return response.data;
};

// Inicia o check-in de outra submissão do mesmo aluno a partir da tela de
// status — identifica pelo checkinToken de uma submissão já concluída, sem
// precisar escanear o QR Code/redigitar o CPF de novo.
export const iniciarCheckinOutraSubmissao = async (eventoSlug, { checkinToken, submissaoId }) => {
  const response = await req.post(`/evenplic/evento/${eventoSlug}/checkin/outra-submissao`, {
    checkinToken,
    submissaoId,
  });
  return response.data;
};

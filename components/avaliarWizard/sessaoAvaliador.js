// Helpers puramente client-side do wizard mobile do avaliador
// (avaliar). Nada aqui chama API — só localStorage, pra reduzir
// fricção entre ciclos (lembrar as últimas áreas escolhidas) e alimentar o
// contador de sessão do dia (toque de gamificação profissional).

const chaveAreas = (eventoId) => `avaliar:areas:${eventoId}`;
const hojeISO = () => new Date().toISOString().slice(0, 10);
const chaveContador = (eventoId) => `avaliar:contador:${eventoId}:${hojeISO()}`;

export const getUltimasAreas = (eventoId) => {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(chaveAreas(eventoId));
    return bruto ? JSON.parse(bruto) : [];
  } catch {
    return [];
  }
};

export const salvarUltimasAreas = (eventoId, areaIds) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chaveAreas(eventoId), JSON.stringify(areaIds));
  } catch {
    // localStorage indisponível (modo privado, etc.) — sem problema, é só otimização de UX
  }
};

export const getContadorSessao = (eventoId) => {
  if (typeof window === "undefined") return 0;
  try {
    const bruto = window.localStorage.getItem(chaveContador(eventoId));
    return bruto ? parseInt(bruto, 10) : 0;
  } catch {
    return 0;
  }
};

export const incrementarContadorSessao = (eventoId) => {
  if (typeof window === "undefined") return 0;
  try {
    const atual = getContadorSessao(eventoId) + 1;
    window.localStorage.setItem(chaveContador(eventoId), String(atual));
    return atual;
  } catch {
    return 0;
  }
};

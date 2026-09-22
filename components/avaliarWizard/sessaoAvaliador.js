// Helpers puramente client-side do wizard mobile do avaliador
// (avaliar). Nada aqui chama API — só localStorage, pra reduzir fricção
// entre ciclos (lembrar as últimas áreas escolhidas).

const chaveAreas = (eventoId) => `avaliar:areas:${eventoId}`;

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

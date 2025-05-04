
const calcularTempoDesdeAtribuicao = (createdAt) => {
  if (!createdAt) return { display: "Data desconhecida", ms: 0 };

  const dataAtribuicao = new Date(createdAt);
  const agora = new Date();
  const diferencaMs = agora - dataAtribuicao;

  const umaHoraMs = 1000 * 60 * 60;

  let display;

  if (diferencaMs < umaHoraMs) {
    const minutos = Math.floor(diferencaMs / (1000 * 60));
    display = `${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  } else if (diferencaMs < umaHoraMs * 24) {
    const horas = Math.floor(diferencaMs / umaHoraMs);
    display = `${horas} ${horas === 1 ? "hora" : "horas"}`;
  } else {
    const dias = Math.floor(diferencaMs / (umaHoraMs * 24));
    display = `${dias} ${dias === 1 ? "dia" : "dias"}`;
  }

  return { display, ms: diferencaMs };
};


export default calcularTempoDesdeAtribuicao;

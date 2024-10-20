export const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar hora
 export const formatarHora = (dataIso) => {
    const data = new Date(dataIso);
    const horas = data.getUTCHours().toString().padStart(2, "0");
    const minutos = data.getUTCMinutes().toString().padStart(2, "0");
    return `${horas}h${minutos}`;
  };

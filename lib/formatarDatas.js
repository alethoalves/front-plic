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

  export const formatDateToISO = (date) => {
    const [day, month, year] = date.split("/");
    return `${year}-${month}-${day}`;
  };

  // Converte data no formato DD/MM/AAAA para Date, para permitir comparação cronológica
  export const parseDateBR = (dateStr) => {
    if (!dateStr) return new Date(0);
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

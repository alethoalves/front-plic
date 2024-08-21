// Função para converter ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ) para DD/MM/AAAA
export const formatDateForDisplay = (isoString) => {
    if (!isoString) return "";
  
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Mês começa do zero, então adiciona 1
    const year = date.getFullYear();
  
    return `${day}/${month}/${year}`;
  };
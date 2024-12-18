
const generateLattesText = (url) => {
  try {
    // Extrai o nome e a data da URL
    const parts = url
      .split("/") // Divide a URL por "/"
      .pop() // Obtém a última parte da URL (o nome do arquivo)
      .replace(".xml", "") // Remove a extensão .xml
      .split("_"); // Divide pelo "_" para obter as partes

    const nome = parts.slice(0, -2).join(" "); // Une as partes do nome
    const data = parts[parts.length - 2]; // Obtém a data
    const hora = parts[parts.length - 1]; // Obtém a hora

    // Formata a data e a hora
    const formattedDate = `${data.slice(0, 2)}/${data.slice(2, 4)}/${data.slice(4)}`;
    const formattedTime = `${hora.slice(0, 2)}:${hora.slice(2, 4)}:${hora.slice(4)}`;

    // Retorna o texto formatado
    return `CV LATTES de ${nome.replace(/_/g, " ")} (atualizado na plataforma Lattes em ${formattedDate} às ${formattedTime})`;
  } catch (error) {
    console.error("Erro ao gerar o texto do Lattes:", error);
    return "Visualizar CV Lattes";
  }
};

export default generateLattesText;

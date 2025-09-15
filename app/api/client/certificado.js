import { getAuthHeadersClient, getAuthHeadersClientAvaliador, getAuthToken } from "@/lib/headers.js";
import { req } from "./../axios.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/************************** 
 * Certificado
**************************/

export const uploadAndSaveCertificateImage = async (eventoSlug, idCertificado, formData) => {
  try {
    const token = getAuthToken(); // Obtenha o token diretamente
    if (!token) {
      throw new Error("Token de autenticação não encontrado.");
    }

    const headers = {
      Authorization: `Token ${token}`,
      "Content-Type": "multipart/form-data", // Inclua explicitamente o Content-Type
    };


    const response = await req.put(
      `/evenplic/${eventoSlug}/uploadAndSaveCertificateImage/${idCertificado}`,
      formData,
      { headers } // Envie os cabeçalhos
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao fazer upload:", error.response?.data || error.message);
    throw new Error("Erro ao fazer upload. Tente novamente.");
  }
};

export const getLayoutCertificados = async (eventoSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/evenplic/${eventoSlug}/certificados`, {
      headers,
    });
    return response.data.certificados;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Cargos não encontrados:", error);
      return null;
    }
    console.error("Erro ao obter os cargos:", error);
    throw error;
  }
}; 

export const generateAndDownloadAvaliadorCertificatePDF = async (eventoSlug) => {
  try {
    // Obtenha os cabeçalhos de autenticação
    const headers = getAuthHeadersClientAvaliador();
    if (!headers) {
      throw new Error("Headers de autenticação não encontrados.");
    }

    // Chame a API para obter o HTML do certificado
    const response = await req.get(`evenplic/evento/${eventoSlug}/generateAvaliadorCertificate`, {
      headers,
    });

    const { status, html } = response.data;

    if (status !== "success" || !html) {
      throw new Error("Erro ao obter o HTML do certificado.");
    }

    // Cria um elemento temporário para renderizar o HTML
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.width = "1123px"; // Largura aproximada de uma folha A4 (landscape)
    container.style.height = "794px"; // Altura aproximada de uma folha A4 (landscape)
    container.style.position = "relative";
    document.body.appendChild(container);

    // Aguarde para garantir que a imagem foi carregada
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Renderiza o HTML como canvas
    const canvas = await html2canvas(container, { scale: 2 }); // Aumente o `scale` para melhorar a qualidade
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Remove o elemento do DOM
    document.body.removeChild(container);

    // Cria um PDF com jsPDF
    const pdf = new jsPDF("landscape", "px", [canvasWidth, canvasHeight]);
    const imgData = canvas.toDataURL("image/png");

    // Adiciona a imagem ao PDF no tamanho exato
    pdf.addImage(imgData, "PNG", 0, 0, canvasWidth, canvasHeight);

    // Inicia o download do PDF
    pdf.save(`certificado_${eventoSlug}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar ou baixar o certificado PDF:", error);
    throw new Error(error.response.data.message||"Erro ao gerar ou baixar o certificado. Tente novamente.");
  }
};

export const getUserSubmissions = async (eventoId) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/evenplic/${eventoId}/getUserSubmissions`, {
      headers,
    });
    return response.data.submissoes;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Cargos não encontrados:", error);
      return null;
    }
    console.error("Erro ao obter os cargos:", error);
    throw error;
  }
}; 

export const generateAndDownloadCertificatePDF = async (eventoId, tipo, submissaoId) => {
  try {
    // Obtenha os cabeçalhos de autenticação
    const headers = getAuthHeadersClient();
    if (!headers) {
      throw new Error("Headers de autenticação não encontrados.");
    }

    // Chame a API para obter o HTML do certificado
    const response = await req.get(`/evenplic/evento/${eventoId}/generateCertificate/${tipo}/${submissaoId}`, {
      headers,
    });

    const { status, html } = response.data;

    if (status !== "success" || !html) {
      throw new Error("Erro ao obter o HTML do certificado.");
    }

    // Cria um elemento temporário para renderizar o HTML
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.width = "1123px"; // Largura aproximada de uma folha A4 (landscape)
    container.style.height = "794px"; // Altura aproximada de uma folha A4 (landscape)
    container.style.position = "relative";
    document.body.appendChild(container);

    // Aguarde para garantir que a imagem foi carregada
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Renderiza o HTML como canvas
    const canvas = await html2canvas(container, { scale: 2 }); // Aumente o `scale` para melhorar a qualidade
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Remove o elemento do DOM
    document.body.removeChild(container);

    // Cria um PDF com jsPDF
    const pdf = new jsPDF("landscape", "px", [canvasWidth, canvasHeight]);
    const imgData = canvas.toDataURL("image/png");

    // Adiciona a imagem ao PDF no tamanho exato
    pdf.addImage(imgData, "PNG", 0, 0, canvasWidth, canvasHeight);

    // Inicia o download do PDF
    pdf.save(`certificado_${eventoId}.pdf`);
  } catch (error) {
    console.error("Erro ao gerar ou baixar o certificado PDF:", error);
    throw new Error("Erro ao gerar ou baixar o certificado. Tente novamente.");
  }
};

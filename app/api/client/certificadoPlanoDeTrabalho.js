import { getAuthHeadersClient, getAuthHeadersClientAvaliador, getAuthToken } from "@/lib/headers.js";
import { req } from "./../axios.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/************************** 
 * Certificados Planos de Trabalho
**************************/

export const uploadAndSaveCertificateImagePlano = async (tenantSlug, idCertificado, formData) => {
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
      `/private/${tenantSlug}/layouts/${idCertificado}/upload`,
      formData,
      { headers } // Envie os cabeçalhos
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao fazer upload:", error.response?.data || error.message);
    throw new Error("Erro ao fazer upload. Tente novamente.");
  }
};

export const getLayoutCertificados = async (tenantSlug) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) return false;
    const response = await req.get(`/private/${tenantSlug}/layouts`, {
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
// api/client/certificado.js
export const getCertificados = async (eventoId, tipoBusca, valor) => {
  try {
    

    // Construir a URL com query parameters
    const queryParam = tipoBusca === "cpf" ? `cpf=${valor}` : `codigo=${valor}`;
    const url = `/evenplic/evento/${eventoId}/getCertificados?${queryParam}`;

    const response = await req.get(url, );

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error("Certificados não encontrados:", error);
      return { status: "error", message: "Nenhum certificado encontrado" };
    }
    console.error("Erro ao obter certificados:", error);
    throw error;
  }
};
export const generateAndDownloadCertificatePlanoPDF = async (tenantSlug, planoId) => {
  try {
    const headers = getAuthHeadersClient();
   

    // Construir a URL com parâmetros opcionais
    let url = `/private/${tenantSlug}/planos/${planoId}/certificado/CONCLUSAO`;
    
    

    const response = await req.get(url, {
      headers: headers || {} // Envia headers se disponível, senão envia vazio
    });

    const { status, html } = response.data;

    if (status !== "success" || !html) {
      throw new Error("Erro ao obter o HTML do certificado.");
    }

    // Resto do código permanece igual...
    const container = document.createElement("div");
    container.innerHTML = html;
    container.style.width = "1123px";
    container.style.height = "794px";
    container.style.position = "relative";
    document.body.appendChild(container);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(container, { scale: 2 });
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    document.body.removeChild(container);

    const pdf = new jsPDF("landscape", "px", [canvasWidth, canvasHeight]);
    const imgData = canvas.toDataURL("image/png");

    pdf.addImage(imgData, "PNG", 0, 0, canvasWidth, canvasHeight);
    pdf.save(`certificado_conclusao.pdf`);
    return response
  } catch (error) {
    console.error("Erro ao gerar ou baixar o certificado PDF:", error);
    throw error;
  }
};

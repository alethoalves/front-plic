import { getAuthHeadersClient, getAuthHeadersClientAvaliador, getAuthToken } from "@/lib/headers.js";
import { req } from "./../axios.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**************************
 * Certificado
**************************/

// Placeholders disponíveis por tipo de certificado — espelha
// api-plic/src/services/certificadoTexto.js (CAMPOS_POR_TIPO/CAMPOS_COMUNS).
// Front e back já mantêm rótulos por tipo duplicados hoje (ex.: os switch de
// label em certificadoController.js e nas próprias páginas), então isso
// segue a mesma convenção em vez de introduzir um endpoint só pra isso.
export const CAMPOS_POR_TIPO = {
  EXPOSITOR: [
    { key: "tituloResumo", label: "Título do resumo" },
    { key: "autores", label: "Autores" },
    { key: "coautores", label: "Coautores" },
    { key: "orientadores", label: "Orientadores" },
    { key: "colaboradores", label: "Colaboradores" },
    { key: "area", label: "Área" },
    { key: "grandeArea", label: "Grande área" },
    { key: "categoria", label: "Categoria" },
  ],
  PREMIADO: [
    { key: "tituloResumo", label: "Título do resumo" },
    { key: "autores", label: "Autores" },
    { key: "coautores", label: "Coautores" },
    { key: "orientadores", label: "Orientadores" },
    { key: "colaboradores", label: "Colaboradores" },
    { key: "area", label: "Área" },
    { key: "grandeArea", label: "Grande área" },
    { key: "categoria", label: "Categoria" },
  ],
  INDICADO: [
    { key: "tituloResumo", label: "Título do resumo" },
    { key: "autores", label: "Autores" },
    { key: "coautores", label: "Coautores" },
    { key: "orientadores", label: "Orientadores" },
    { key: "colaboradores", label: "Colaboradores" },
    { key: "area", label: "Área" },
    { key: "grandeArea", label: "Grande área" },
    { key: "categoria", label: "Categoria" },
  ],
  MENCAO: [
    { key: "tituloResumo", label: "Título do resumo" },
    { key: "autores", label: "Autores" },
    { key: "coautores", label: "Coautores" },
    { key: "orientadores", label: "Orientadores" },
    { key: "colaboradores", label: "Colaboradores" },
    { key: "area", label: "Área" },
    { key: "grandeArea", label: "Grande área" },
    { key: "categoria", label: "Categoria" },
  ],
  AVALIADOR: [
    { key: "avaliador", label: "Nome do avaliador" },
    { key: "qntAvaliacoes", label: "Quantidade de avaliações" },
  ],
};

export const CAMPOS_COMUNS = [
  { key: "nomeEvento", label: "Nome do evento" },
  { key: "periodo", label: "Período do evento" },
];

// Valores de exemplo pra prévia — o admin edita o texto fora do contexto de
// uma submissão/avaliador real, então não há dado de verdade pra mostrar.
// Cada valor já inclui a frase ao redor exatamente como o backend monta em
// generateCertificate/getAvaliadorCertificateData (ex.: "area" já vem como
// "na área de ...", não só o nome da área).
const CAMPOS_AMOSTRA = {
  tituloResumo: "TÍTULO DE EXEMPLO DO TRABALHO",
  autores: "FULANO DE TAL",
  coautores: " com coautoria de CICLANO DE TAL,",
  orientadores: " sob orientação de BELTRANO ORIENTADOR,",
  colaboradores: " e com colaboração de SICRANO,",
  area: "na área de CIÊNCIAS EXEMPLO",
  grandeArea: "na grande área de EXEMPLO",
  categoria: "na categoria EXEMPLO",
  avaliador: "FULANO AVALIADOR",
  qntAvaliacoes: "5",
};

// timeZone: 'UTC' pelo mesmo motivo do backend (certificadoTexto.js) —
// inicio/fim são gravados à meia-noite UTC.
const formatarDataPreview = (data) =>
  new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });

// Resolve o texto (ainda com placeholders) pra prévia: campos específicos do
// tipo usam dado de exemplo, campos comuns (nomeEvento/periodo) usam o
// evento real já que esses sempre existem.
export const resolverTextoPreview = (texto, tipo, evento) => {
  let resolvido = texto || "";

  for (const campo of CAMPOS_POR_TIPO[tipo] || []) {
    resolvido = resolvido
      .split(`<<[${campo.key}]>>`)
      .join(CAMPOS_AMOSTRA[campo.key] ?? `[${campo.label}]`);
  }

  const periodo =
    evento?.inicio && evento?.fim
      ? `${formatarDataPreview(evento.inicio)} a ${formatarDataPreview(evento.fim)}`
      : `${evento?.edicaoEvento ?? "[Período do evento]"}`;

  resolvido = resolvido
    .split("<<[nomeEvento]>>")
    .join(evento?.nomeEvento ?? "[Nome do evento]");
  resolvido = resolvido.split("<<[periodo]>>").join(periodo);

  return resolvido;
};

export const updateTextoCertificado = async (eventoSlug, idCertificado, texto) => {
  try {
    const headers = getAuthHeadersClient();
    if (!headers) throw new Error("Token de autenticação não encontrado.");

    const response = await req.put(
      `/evenplic/${eventoSlug}/certificados/${idCertificado}/texto`,
      { texto },
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Erro ao atualizar texto do certificado:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Erro ao atualizar texto. Tente novamente.");
  }
};

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
      console.error("Cargos não encontrados:", error.message);
      return null;
    }
    console.error("Erro ao obter os cargos:", error.message);
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
    console.error("Erro ao gerar ou baixar o certificado PDF:", error.message);
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
      console.error("Cargos não encontrados:", error.message);
      return null;
    }
    console.error("Erro ao obter os cargos:", error.message);
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
      console.error("Certificados não encontrados:", error.message);
      return { status: "error", message: "Nenhum certificado encontrado" };
    }
    console.error("Erro ao obter certificados:", error.message);
    throw error;
  }
};
export const generateAndDownloadCertificatePDF = async (eventoId, tipo, submissaoId, codigo = null) => {
  try {
    const headers = getAuthHeadersClient();
   

    // Construir a URL com parâmetros opcionais
    let url = `/evenplic/evento/${eventoId}/generateCertificate/${tipo}/${submissaoId}`;
    
    if (codigo) {
      url += `?codigo=${codigo}`;
    }

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
    pdf.save(`certificado_${eventoId}.pdf`);
    
  } catch (error) {
    console.error("Erro ao gerar ou baixar o certificado PDF:", error.message);
    throw new Error("Erro ao gerar ou baixar o certificado. Tente novamente.");
  }
};

export const validarCertificado = async (codigo) => {
  try {
    const response = await req.get(`/autenticacao`, {
      params: { codigo }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn("Não encontrado:", error.response?.data?.message);
      return {
        status: "error",
        message: error.response?.data?.message || "Não encontrado"
      };
    }
    console.error("Erro na validação:", error.message);
    throw error;
  }
};

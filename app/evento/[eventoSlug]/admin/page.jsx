"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Link from "next/link";
import {
  RiArrowLeftCircleFill,
  RiArrowRightCircleFill,
  RiBatteryLowLine,
  RiCalendarLine,
  RiFileExcelLine,
  RiFileWordLine,
  RiGroupLine,
  RiPresentationFill,
} from "@remixicon/react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import NoData from "@/components/NoData";
import { getEventoDashboard } from "@/app/api/client/eventos";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getSubmissaoByEvento } from "@/app/api/client/relatorios";
import { getSubmissoesComAvaliacoes } from "@/app/api/client/submissao";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [evento, setEvento] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSubmissoes, setIsDownloadingSubmissoes] = useState(false);
  const [isDownloadingAvaliacoes, setIsDownloadingAvaliacoes] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const router = useRouter();

  // Função para buscar os dados do evento
  const fetchEvento = async (eventoSlug) => {
    setLoading(true);
    try {
      const response = await getEventoDashboard(eventoSlug);
      setEvento(response);
    } catch (error) {
      console.error("Erro ao buscar dados do evento:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvento(params.eventoSlug);
  }, [params.eventoSlug]);

  // Função para sanitizar texto (prevenção XSS)
  const sanitizeText = (text) => {
    if (typeof text !== "string") return text;
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  // Função para gerar relatório de submissões em Excel - Versão Atualizada
  const gerarRelatorioSubmissoes = async (tenantSigla = null) => {
    setIsDownloadingSubmissoes(true);
    try {
      const submissaoData = await getSubmissaoByEvento(
        params.eventoSlug,
        evento.evento.id,
        tenantSigla,
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Submissões do Evento");

      // Definir colunas atualizadas
      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Poster", key: "poster", width: 10 },
        { header: "Título", key: "titulo", width: 30 },
        { header: "Área", key: "area", width: 20 },
        { header: "Grande Área", key: "grandeArea", width: 20 },
        { header: "Categoria", key: "categoria", width: 20 },
        { header: "Sigla Tenant", key: "siglaTenant", width: 15 },
        { header: "Nota Final", key: "notaFinal", width: 15 },
        { header: "Sessão", key: "sessao", width: 25 },
        { header: "Tipo Sessão", key: "tipoSessao", width: 20 },
        { header: "Data/Hora", key: "dataHora", width: 25 },
        { header: "Autores", key: "autores", width: 30 },
        { header: "Coautores", key: "coautores", width: 30 },
        { header: "Orientadores", key: "orientadores", width: 30 },
        { header: "Coorientadores", key: "coorientadores", width: 30 },
        { header: "Colaboradores", key: "colaboradores", width: 30 },
        { header: "Prêmio", key: "premio", width: 10 },
        { header: "Menção Honrosa", key: "mencaoHonrosa", width: 15 },
        { header: "Indicação Prêmio", key: "indicacaoPremio", width: 15 },
        { header: "Palavras-chave", key: "palavrasChave", width: 30 },
        {
          header: "Resumo Simplificado",
          key: "resumoSimplificado",
          width: 50,
          style: { wrapText: true },
        }, // Nova coluna
      ];

      // Adicionar dados com a nova estrutura
      submissaoData.forEach((submissao) => {
        const resumo = submissao.Resumo || {};
        const palavrasChave =
          resumo.PalavraChave?.map((p) => p.palavra).join("; ") ||
          "Sem palavras-chave";
        const area = resumo.area || {};
        const participacoes = resumo.participacoes || [];

        // Organizar participantes por cargo
        const participantesPorCargo = {
          AUTOR: [],
          COAUTOR: [],
          ORIENTADOR: [],
          COORIENTADOR: [],
          COLABORADOR: [],
        };

        participacoes.forEach((part) => {
          const nome = part.user?.nome || "Nome não disponível";
          if (part.cargo && participantesPorCargo[part.cargo]) {
            participantesPorCargo[part.cargo].push(nome);
          }
        });

        // Formatar data/hora da subsessão
        let dataHora = "";
        if (submissao.subsessao?.inicio) {
          const inicio = new Date(submissao.subsessao.inicio);
          dataHora = `${formatarData(inicio)} ${formatarHora(inicio)}`;
        }

        // Obter o resumo simplificado (já vem formatado da API)
        const resumoSimplificado =
          resumo.conteudoFormatado || "Sem resumo disponível";

        worksheet.addRow({
          id: submissao.id,
          poster: submissao.square[0]?.numero || "-",
          titulo: sanitizeText(resumo.titulo || "Sem título"),
          area: sanitizeText(area.area || "Sem área"),
          grandeArea: sanitizeText(
            area.grandeArea?.grandeArea || "Sem grande área",
          ),
          categoria: sanitizeText(submissao.categoria || "Sem categoria"),
          siglaTenant: sanitizeText(submissao.tenant?.sigla || "Sem sigla"),
          notaFinal: submissao.notaFinal?.toFixed(2) || "N/A",
          sessao:
            submissao.subsessao?.sessaoApresentacao?.titulo || "Sem sessão",
          tipoSessao:
            submissao.subsessao?.sessaoApresentacao?.tipo || "Sem tipo",
          dataHora: dataHora,
          autores: participantesPorCargo.AUTOR.join("; "),
          coautores: participantesPorCargo.COAUTOR.join("; "),
          orientadores: participantesPorCargo.ORIENTADOR.join("; "),
          coorientadores: participantesPorCargo.COORIENTADOR.join("; "),
          colaboradores: participantesPorCargo.COLABORADOR.join("; "),
          premio: submissao.premio ? "Sim" : "Não",
          mencaoHonrosa: submissao.mencaoHonrosa ? "Sim" : "Não",
          indicacaoPremio: submissao.indicacaoPremio ? "Sim" : "Não",
          palavrasChave: palavrasChave,
          resumoSimplificado: resumoSimplificado, // Adiciona o resumo simplificado
        });
      });

      // Auto-filtro ajustado para as novas colunas
      worksheet.autoFilter = {
        from: "A1",
        to: `T${submissaoData.length + 1}`, // Mudei de R para S para incluir a nova coluna
      };

      // Estilizar cabeçalho
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD3D3D3" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Gerar arquivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `submissoes_${evento.evento.slug}${
          tenantSigla ? `_${tenantSigla}` : ""
        }.xlsx`,
      );
    } catch (error) {
      console.error("Erro ao gerar relatório de submissões:", error);
    } finally {
      setIsDownloadingSubmissoes(false);
    }
  };

  // Função para gerar Word com informações do evento

  const gerarWordEvento = async () => {
    setIsDownloading(true);
    try {
      const submissaoData = await getSubmissaoByEvento(
        params.eventoSlug,
        evento.evento.id,
        selectedTenant?.tenant,
      );
      console.log(submissaoData);
      // Função auxiliar para limpar texto para o Word (sem converter para entidades HTML)
      const cleanText = (text) => {
        if (typeof text !== "string") return String(text || "");
        return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ""); // Remove caracteres de controle inválidos
      };

      const doc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: "normal",
              name: "Normal",
              run: { size: 24, font: "Arial" },
              paragraph: { spacing: { line: 276, after: 200 } },
            },
          ],
        },
        sections: [
          {
            children: [
              new Paragraph({
                text: `Anais do Evento - ${evento.evento.nomeEvento}`,
                heading: HeadingLevel.HEADING_1,
                alignment: "center",
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Total de trabalhos: ", bold: true }),
                  new TextRun({ text: `${submissaoData.length}` }),
                ],
                spacing: { after: 200 },
              }),
              ...(selectedTenant
                ? [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Instituição: ", bold: true }),
                        new TextRun({ text: selectedTenant.tenant }),
                      ],
                      spacing: { after: 200 },
                    }),
                  ]
                : []),

              ...submissaoData.flatMap((submissao, index) => {
                const resumo = submissao.Resumo || {};
                const area = resumo.area || {};
                const participacoes = resumo.participacoes || [];
                const palavrasChave =
                  resumo.PalavraChave?.map((p) => p.palavra).join(", ") ||
                  "Sem palavras-chave";
                const secoesConteudo = resumo.conteudo || [];

                const participantesPorCargo = {
                  AUTOR: [],
                  COAUTOR: [],
                  ORIENTADOR: [],
                  COORIENTADOR: [],
                  COLABORADOR: [],
                };

                participacoes.forEach((part) => {
                  const nome = part.user?.nome || "Nome não disponível";
                  if (part.cargo && participantesPorCargo[part.cargo]) {
                    participantesPorCargo[part.cargo].push(nome);
                  }
                });

                // Mapeamento das seções do resumo (Introdução, Metodologia, etc.)
                const blocosConteudo = secoesConteudo.flatMap((secao) => [
                  new Paragraph({
                    children: [
                      new TextRun({ text: cleanText(secao.nome), bold: true }),
                    ],
                    spacing: { before: 200, after: 100 },
                  }),
                  new Paragraph({
                    text: cleanText(secao.conteudo),
                    alignment: "both",
                    spacing: { after: 200 },
                  }),
                ]);

                return [
                  new Paragraph({
                    text: cleanText(resumo.titulo || "Sem título"),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 600, after: 200 },
                  }),

                  ...Object.entries(participantesPorCargo)
                    .filter(([_, nomes]) => nomes.length > 0)
                    .map(([cargo, nomes]) => {
                      const labels = {
                        AUTOR: "Autores",
                        COAUTOR: "Coautores",
                        ORIENTADOR: "Orientador(es)",
                        COORIENTADOR: "Coorientador(es)",
                        COLABORADOR: "Colaborador(es)",
                      };
                      return new Paragraph({
                        children: [
                          new TextRun({
                            text: `${labels[cargo] || cargo}: `,
                            bold: true,
                          }),
                          new TextRun({
                            text: nomes.join(", "),
                            italics: true,
                          }),
                        ],
                        spacing: { after: 100 },
                      });
                    }),

                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Área: ${area.area || "Sem área"}`,
                        size: 20,
                      }),
                      new TextRun({
                        text: `\tGrande Área: ${area.grandeArea?.grandeArea || "Sem grande área"}`,
                        size: 20,
                      }),
                      new TextRun({
                        text: `\tCategoria: ${submissao.categoria || "Sem categoria"}`,
                        size: 20,
                      }),
                    ],
                    spacing: { after: 100 },
                  }),

                  new Paragraph({
                    children: [
                      new TextRun({ text: "Palavras-chave: ", bold: true }),
                      new TextRun({
                        text: cleanText(palavrasChave),
                        italics: true,
                      }),
                    ],
                    spacing: { after: 100 },
                  }),

                  // Se não houver seções detalhadas, tenta usar o conteudoFormatado
                  ...(blocosConteudo.length > 0
                    ? blocosConteudo
                    : [
                        new Paragraph({
                          text: cleanText(
                            resumo.conteudoFormatado || "Sem resumo disponível",
                          ),
                          alignment: "both",
                        }),
                      ]),

                  ...(submissao.premio || submissao.mencaoHonrosa
                    ? [
                        new Paragraph({
                          children: [
                            ...(submissao.premio
                              ? [
                                  new TextRun({
                                    text: "Premiado: Sim",
                                    size: 20,
                                  }),
                                  new TextRun({ text: "\t" }),
                                ]
                              : []),
                            ...(submissao.mencaoHonrosa
                              ? [
                                  new TextRun({
                                    text: "Menção Honrosa: Sim",
                                    size: 20,
                                  }),
                                ]
                              : []),
                          ],
                          spacing: { before: 200 },
                        }),
                      ]
                    : []),

                  ...(index < submissaoData.length - 1
                    ? [new Paragraph({ text: "", pageBreakBefore: true })]
                    : []),
                ];
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `anais_${evento.evento.slug}${selectedTenant ? `_${selectedTenant.tenant}` : ""}.docx`,
      );
    } catch (error) {
      console.error("Erro ao gerar documento Word:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Função para gerar Word com resumos e avaliações - VERSÃO CORRIGIDA

  const gerarHTMLParaDownload = async () => {
    setIsDownloadingAvaliacoes(true);
    try {
      const submissoes = await getSubmissoesComAvaliacoes(params.eventoSlug);

      if (!Array.isArray(submissoes)) {
        throw new Error("Dados retornados não são um array");
      }

      // Criar conteúdo HTML completo
      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resumos e Avaliações - ${evento.evento.nomeEvento}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #fff; 
            padding: 20px; 
            max-width: 1200px; 
            margin: 0 auto; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding-bottom: 20px; 
            border-bottom: 3px solid #007bff; 
        }
        .header h1 { 
            font-size: 28px; 
            margin-bottom: 10px; 
            color: #2c3e50; 
        }
        .header h2 { 
            font-size: 20px; 
            color: #7f8c8d; 
            margin-bottom: 15px; 
        }
        .header p { 
            margin: 5px 0; 
            color: #666; 
        }
        .trabalho { 
            margin-bottom: 50px; 
            padding: 25px; 
            border: 1px solid #e1e8ed; 
            border-radius: 10px; 
            background: #fafbfc; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .titulo-trabalho { 
            font-size: 20px; 
            color: #2c3e50; 
            margin-bottom: 15px; 
            padding-bottom: 10px; 
            border-bottom: 2px solid #3498db; 
        }
        .info-basica { 
            background: #ecf0f1; 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 15px; 
            font-size: 14px; 
        }
        .info-basica span { 
            margin-right: 20px; 
        }
        .participantes { 
            margin: 15px 0; 
        }
        .cargo { 
            margin: 8px 0; 
        }
        .cargo strong { 
            color: #2c3e50; 
            min-width: 120px; 
            display: inline-block; 
        }
        .area-info { 
            background: #d5edff; 
            padding: 12px; 
            border-radius: 5px; 
            margin: 15px 0; 
            border-left: 4px solid #3498db; 
        }
        .secao { 
            margin: 25px 0; 
        }
        .secao-titulo { 
            font-size: 18px; 
            color: #2980b9; 
            margin-bottom: 15px; 
            padding-bottom: 5px; 
            border-bottom: 1px solid #bdc3c7; 
        }
        .conteudo-resumo { 
            text-align: justify; 
            line-height: 1.8; 
            white-space: pre-line; 
            background: white; 
            padding: 15px; 
            border-radius: 5px; 
            border: 1px solid #e1e8ed; 
        }
        .avaliacao { 
            background: white; 
            border: 1px solid #e1e8ed; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 15px 0; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
        }
        .avaliacao-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 15px; 
            padding-bottom: 10px; 
            border-bottom: 1px solid #ecf0f1; 
        }
        .avaliacao-info { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 10px; 
            margin-bottom: 15px; 
            font-size: 14px; 
        }
        .criterios { 
            margin-top: 15px; 
        }
        .criterio { 
            display: flex; 
            justify-content: space-between; 
            margin: 5px 0; 
            padding: 5px 0; 
            border-bottom: 1px dotted #ecf0f1; 
        }
        .observacao { 
            background: #fffde7; 
            padding: 15px; 
            border-radius: 5px; 
            border-left: 4px solid #ffd600; 
            margin: 10px 0; 
            white-space: pre-line; 
        }
        .observacao-ia { 
            background: #e8f5e8; 
            padding: 15px; 
            border-radius: 5px; 
            border-left: 4px solid #4caf50; 
            margin: 10px 0; 
            white-space: pre-line; 
        }
        .sem-dados { 
            text-align: center; 
            color: #7f8c8d; 
            font-style: italic; 
            padding: 30px; 
            background: #ecf0f1; 
            border-radius: 5px; 
        }
        .acoes { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: white; 
            padding: 15px; 
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
            z-index: 1000; 
        }
        .btn { 
            padding: 10px 20px; 
            margin: 5px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px; 
            transition: background 0.3s; 
        }
        .btn-print { 
            background: #007bff; 
            color: white; 
        }
        .btn-print:hover { 
            background: #0056b3; 
        }
        .btn-pdf { 
            background: #28a745; 
            color: white; 
        }
        .btn-pdf:hover { 
            background: #1e7e34; 
        }
        .btn-close { 
            background: #dc3545; 
            color: white; 
        }
        .btn-close:hover { 
            background: #c82333; 
        }
        @media print {
            .acoes { display: none; }
            body { padding: 0; }
            .trabalho { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="acoes">
        <button class="btn btn-print" onclick="window.print()">🖨️ Imprimir</button>
        <button class="btn btn-close" onclick="window.close()">❌ Fechar</button>
    </div>

    <div class="header">
        <h1>Resumos e Avaliações</h1>
        <h2>${evento.evento.nomeEvento}</h2>
        <p><strong>Total de trabalhos:</strong> ${submissoes.length}</p>
        ${
          selectedTenant
            ? `<p><strong>Instituição:</strong> ${selectedTenant.tenant}</p>`
            : ""
        }
        <p><strong>Data de geração:</strong> ${new Date().toLocaleDateString(
          "pt-BR",
        )} ${new Date().toLocaleTimeString("pt-BR")}</p>
    </div>

    ${
      submissoes.length > 0
        ? submissoes
            .map((submissao, index) => {
              const resumo = submissao.Resumo || {};
              const participacoes = resumo.participacoes || [];
              const avaliacoes = submissao.Avaliacao || [];

              const participantesPorCargo = {
                AUTOR: [],
                COAUTOR: [],
                ORIENTADOR: [],
                COORIENTADOR: [],
                COLABORADOR: [],
              };

              participacoes.forEach((part) => {
                const nome = part.user?.nome || "Nome não disponível";
                if (part.cargo && participantesPorCargo[part.cargo]) {
                  participantesPorCargo[part.cargo].push(nome);
                }
              });

              return `
        <div class="trabalho">
            <h2 class="titulo-trabalho">${index + 1}. ${sanitizeText(
              resumo.titulo || "Sem título",
            )}</h2>
            
            <div class="info-basica">
                <span><strong>ID:</strong> ${submissao.id}</span>
                <span><strong>Categoria:</strong> ${
                  submissao.categoria || "N/A"
                }</span>
                <span><strong>Status:</strong> ${
                  submissao.status || "N/A"
                }</span>
                <span><strong>Nota Final:</strong> ${
                  submissao.notaFinal ? submissao.notaFinal.toFixed(2) : "N/A"
                }</span>
            </div>

            <div class="participantes">
                ${Object.entries(participantesPorCargo)
                  .filter(([_, nomes]) => nomes.length > 0)
                  .map(([cargo, nomes]) => {
                    const cargoLabel =
                      {
                        AUTOR: "Autores",
                        COAUTOR: "Coautores",
                        ORIENTADOR: "Orientador(es)",
                        COORIENTADOR: "Coorientador(es)",
                        COLABORADOR: "Colaborador(es)",
                      }[cargo] || cargo;

                    return `<div class="cargo"><strong>${cargoLabel}:</strong> ${nomes.join(
                      ", ",
                    )}</div>`;
                  })
                  .join("")}
            </div>

            <div class="area-info">
                <p><strong>Área:</strong> ${resumo.area?.area || "Sem área"}</p>
                <p><strong>Grande Área:</strong> ${
                  resumo.area?.grandeArea?.grandeArea || "Sem grande área"
                }</p>
                <p><strong>Palavras-chave:</strong> <em>${
                  resumo.PalavraChave?.map((p) => p.palavra).join(", ") ||
                  "Sem palavras-chave"
                }</em></p>
            </div>

            <div class="secao">
                <h3 class="secao-titulo">RESUMO</h3>
                ${
                  resumo.conteudo && Array.isArray(resumo.conteudo)
                    ? resumo.conteudo
                        .map(
                          (secao) => `
                      <div style="margin: 20px 0;">
                          <h4 style="color: #2c3e50; margin-bottom: 10px; font-size: 16px;">${secao.nome.toUpperCase()}</h4>
                          <div class="conteudo-resumo">${sanitizeText(
                            secao.conteudo,
                          )}</div>
                      </div>
                    `,
                        )
                        .join("")
                    : '<div class="sem-dados">Resumo não disponível</div>'
                }
            </div>

            <div class="secao">
                <h3 class="secao-titulo">AVALIAÇÕES (${avaliacoes.length})</h3>
                ${
                  avaliacoes.length > 0
                    ? avaliacoes
                        .map((avaliacao, avIndex) => {
                          const dataAvaliacao = avaliacao.createdAt
                            ? new Date(avaliacao.createdAt).toLocaleDateString(
                                "pt-BR",
                              )
                            : "Data não disponível";

                          return `
                        <div class="avaliacao">
                            <div class="avaliacao-header">
                                <strong>Avaliação ${avIndex + 1}</strong>
                                <span>${dataAvaliacao}</span>
                            </div>
                            
                            <div class="avaliacao-info">
                                <div><strong>Nota Total:</strong> ${
                                  avaliacao.notaTotal != null
                                    ? avaliacao.notaTotal
                                    : "N/A"
                                }</div>
                                <div><strong>Indicação Prêmio:</strong> ${
                                  avaliacao.indicacaoPremio
                                    ? "✅ Sim"
                                    : "❌ Não"
                                }</div>
                                <div><strong>Menção Honrosa:</strong> ${
                                  avaliacao.mencaoHonrosa ? "✅ Sim" : "❌ Não"
                                }</div>
                                <div><strong>Premiado:</strong> ${
                                  avaliacao.premio ? "✅ Sim" : "❌ Não"
                                }</div>
                            </div>

                            ${
                              avaliacao.observacao &&
                              avaliacao.observacao.trim() !== ""
                                ? `
                              <div class="observacao">
                                  <strong>Observação:</strong><br>
                                  ${sanitizeText(avaliacao.observacao)}
                              </div>
                            `
                                : ""
                            }

                            ${
                              avaliacao.observacaoDepuradaIA &&
                              avaliacao.observacaoDepuradaIA.trim() !== ""
                                ? `
                              <div class="observacao-ia">
                                  <strong>Observação Depurada (IA):</strong><br>
                                  ${sanitizeText(
                                    avaliacao.observacaoDepuradaIA,
                                  )}
                              </div>
                            `
                                : ""
                            }

                            ${
                              avaliacao.registros &&
                              avaliacao.registros.length > 0
                                ? `
                              <div class="criterios">
                                  <strong>Critérios Avaliados:</strong>
                                  ${avaliacao.registros
                                    .map(
                                      (registro) => `
                                    <div class="criterio">
                                        <span>${registro.titulo}</span>
                                        <strong>Nota: ${registro.nota}</strong>
                                    </div>
                                  `,
                                    )
                                    .join("")}
                              </div>
                            `
                                : ""
                            }
                        </div>
                      `;
                        })
                        .join("")
                    : '<div class="sem-dados">Nenhuma avaliação disponível</div>'
                }
            </div>
        </div>
      `;
            })
            .join("")
        : `
      <div class="sem-dados">
          <h3>Nenhum trabalho encontrado</h3>
          <p>Não há submissões com avaliações para este evento.</p>
      </div>
    `
    }

    <script>
        function gerarPDF() {
            window.print();
        }

        document.addEventListener('DOMContentLoaded', function() {
            const trabalhos = document.querySelectorAll('.trabalho');
            trabalhos.forEach((trabalho, index) => {
                if (index > 0) {
                    trabalho.style.pageBreakBefore = 'always';
                }
            });
        });
    </script>
</body>
</html>`;

      // Criar blob e fazer download
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `resumos_avaliacoes_${evento.evento.slug}${
        selectedTenant ? `_${selectedTenant.tenant}` : ""
      }.html`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Erro ao gerar HTML para download:", error);
      alert("Erro ao gerar o arquivo HTML: " + error.message);
    } finally {
      setIsDownloadingAvaliacoes(false);
    }
  };

  const openModal = (tenant = null) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTenant(null);
  };

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModal}>
      <div className={`${styles.icon} mb-2`}>
        <RiFileExcelLine />
      </div>
      <h4>Exportar Dados</h4>
      <p>
        {selectedTenant
          ? `Exportar dados da instituição ${selectedTenant.tenant}`
          : "Exportar dados gerais do evento"}
      </p>
      <Button
        onClick={gerarWordEvento}
        icon={RiFileWordLine}
        className="btn-secondary mt-2"
        type="button"
        disabled={isDownloading}
      >
        {isDownloading ? "Exportando..." : "Anais do Evento (.docx)"}
      </Button>
      <Button
        onClick={() => gerarRelatorioSubmissoes(selectedTenant?.tenant)}
        icon={RiFileExcelLine}
        className="btn-secondary mt-2"
        type="button"
        disabled={isDownloadingSubmissoes}
      >
        {isDownloadingSubmissoes ? "Exportando..." : "Submissões (.xlsx)"}
      </Button>
      <Button
        onClick={gerarHTMLParaDownload}
        icon={RiFileWordLine}
        className="btn-secondary mt-2"
        type="button"
        disabled={isDownloadingAvaliacoes}
      >
        {isDownloadingAvaliacoes
          ? "Gerando..."
          : "Resumos + Avaliações (.html)"}
      </Button>
    </Modal>
  );

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (!evento) {
    return <NoData description="Evento não encontrado" />;
  }

  return (
    <div className={styles.dashboard}>
      {renderModalContent()}

      <div className={`${styles.head}`}>
        <div className={styles.left}>
          <div className={styles.title}>
            <h5>{evento.evento.nomeEvento}</h5>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.totais}>
          {evento.info.tenantsTotais.map((tenant) => (
            <div
              className={`${styles.total} ${styles.light}`}
              key={tenant.tenant}
              onClick={() => openModal(tenant)}
            >
              <p>{tenant.quantidadeSubmissoesTotal}</p>
              <h6>{tenant.tenant}</h6>
            </div>
          ))}
          <div
            className={`${styles.total} ${styles.blue}`}
            onClick={() => openModal(null)}
          >
            <p>
              {evento
                ? evento.info?.tenantsTotais.reduce(
                    (total, tenant) => total + tenant.quantidadeSubmissoesTotal,
                    0,
                  )
                : 0}
            </p>
            <h6>Total Geral</h6>
          </div>
        </div>
        <div className={styles.sessoes}>
          {evento.info.sessaoInfo[0] &&
          evento.info.sessaoInfo[0].subsessoes[0] ? (
            evento.info.sessaoInfo.map((sessao) => {
              const sessaoLabel = sessao.titulo;
              const capacidadeTotal = sessao.capacidade;
              return sessao.subsessoes.map((subs) => (
                <div className={styles.sessao} key={subs.inicio}>
                  <h6>{sessaoLabel}</h6>
                  <div className={styles.subsessoes}>
                    <div className={styles.subsessao}>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiCalendarLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>
                            <strong>Início: </strong>
                            {formatarData(subs.inicio)} -{" "}
                            {formatarHora(subs.inicio)}
                          </p>
                          <p>
                            <strong>Fim: </strong>
                            {formatarData(subs.fim)} - {formatarHora(subs.fim)}
                          </p>
                        </div>
                      </div>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiBatteryLowLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>
                            <strong>Capacidade: </strong>
                            {subs.submissaoTotal} inscritos | capacidade:{" "}
                            {capacidadeTotal}
                          </p>
                        </div>
                      </div>
                      <div className={styles.description}>
                        <div className={styles.icon}>
                          <RiGroupLine />
                        </div>
                        <div className={styles.infoBoxDescription}>
                          <p>
                            <strong>Avaliadores: </strong>
                            {subs.convitesAceitos}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })
          ) : (
            <NoData description="Este evento ainda não tem sessões cadastradas." />
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;

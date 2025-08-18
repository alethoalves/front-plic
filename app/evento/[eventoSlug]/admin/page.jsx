"use client";

import styles from "./page.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [evento, setEvento] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSubmissoes, setIsDownloadingSubmissoes] = useState(false);
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
        tenantSigla
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Submissões do Evento");

      // Definir colunas atualizadas
      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
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
          titulo: sanitizeText(resumo.titulo || "Sem título"),
          area: sanitizeText(area.area || "Sem área"),
          grandeArea: sanitizeText(
            area.grandeArea?.grandeArea || "Sem grande área"
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
        }.xlsx`
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
        selectedTenant?.tenant
      );

      let htmlContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Anais do Evento - ${evento.evento.nomeEvento}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
            }
            h1 { 
              font-size: 18pt; 
              text-align: center;
              margin-bottom: 20px;
            }
            h2 { 
              font-size: 16pt; 
              margin-top: 30px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            h3 {
              font-size: 14pt;
              margin-top: 25px;
              color: #444;
            }
            .submissao {
              page-break-after: always;
              margin-bottom: 30px;
            }
            .autores {
              font-style: italic;
              margin-bottom: 10px;
            }
            .resumo {
              margin-top: 15px;
              text-align: justify;
            }
            .detalhes {
              margin-top: 10px;
              font-size: 0.9em;
              color: #555;
            }
            .detalhes span {
              margin-right: 15px;
            }
            .palavras-chave {
              margin-top: 10px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <h1>Anais do Evento - ${evento.evento.nomeEvento}</h1>
      `;

      // Adicionar informações gerais
      htmlContent += `
        <div class="detalhes">
          <p><strong>Total de trabalhos:</strong> ${submissaoData.length}</p>
          ${
            selectedTenant
              ? `<p><strong>Instituição:</strong> ${selectedTenant.tenant}</p>`
              : ""
          }
        </div>
      `;

      // Adicionar cada submissão
      submissaoData.forEach((submissao, index) => {
        const resumo = submissao.Resumo || {};
        const area = resumo.area || {};
        const participacoes = resumo.participacoes || [];
        const palavrasChave =
          resumo.PalavraChave?.map((p) => p.palavra).join(", ") ||
          "Sem palavras-chave";

        // Organizar participantes por todos os cargos possíveis
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

        htmlContent += `
          <div class="submissao">
            <h2>Trabalho ${index + 1}: ${sanitizeText(
          resumo.titulo || "Sem título"
        )}</h2>
            
            <div class="autores">
              ${
                participantesPorCargo.AUTOR.length > 0
                  ? `<p><strong>Autores:</strong> ${participantesPorCargo.AUTOR.join(
                      ", "
                    )}</p>`
                  : ""
              }
              ${
                participantesPorCargo.COAUTOR.length > 0
                  ? `<p><strong>Coautores:</strong> ${participantesPorCargo.COAUTOR.join(
                      ", "
                    )}</p>`
                  : ""
              }
              ${
                participantesPorCargo.ORIENTADOR.length > 0
                  ? `<p><strong>Orientador(es):</strong> ${participantesPorCargo.ORIENTADOR.join(
                      ", "
                    )}</p>`
                  : ""
              }
              ${
                participantesPorCargo.COORIENTADOR.length > 0
                  ? `<p><strong>Coorientador(es):</strong> ${participantesPorCargo.COORIENTADOR.join(
                      ", "
                    )}</p>`
                  : ""
              }
              ${
                participantesPorCargo.COLABORADOR.length > 0
                  ? `<p><strong>Colaborador(es):</strong> ${participantesPorCargo.COLABORADOR.join(
                      ", "
                    )}</p>`
                  : ""
              }
            </div>
            
            <div class="detalhes">
              <span><strong>Área:</strong> ${area.area || "Sem área"}</span>
              <span><strong>Grande Área:</strong> ${
                area.grandeArea?.grandeArea || "Sem grande área"
              }</span>
              <span><strong>Categoria:</strong> ${
                submissao.categoria || "Sem categoria"
              }</span>
            </div>
  
            <div class="palavras-chave">
              <strong>Palavras-chave:</strong> ${palavrasChave}
            </div>
            
            <h3>Resumo</h3>
            <div class="resumo">
              ${
                resumo.conteudoFormatado
                  ? resumo.conteudoFormatado.replace(/\n/g, "<br>")
                  : "Sem resumo disponível"
              }
            </div>
            
            <div class="detalhes">
              ${
                submissao.premio
                  ? "<span><strong>Premiado:</strong> Sim</span>"
                  : ""
              }
              ${
                submissao.mencaoHonrosa
                  ? "<span><strong>Menção Honrosa:</strong> Sim</span>"
                  : ""
              }
            </div>
          </div>
        `;
      });

      htmlContent += `</body></html>`;

      // Criar e baixar o arquivo
      const blob = new Blob([htmlContent], { type: "application/msword" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `anais_${evento.evento.slug}${
        selectedTenant ? `_${selectedTenant.tenant}` : ""
      }.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao gerar documento Word:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const openModal = (tenant = null) => {
    console.log("Tenant selecionado:", tenant);
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
        {isDownloading ? "Exportando..." : "Anais do Evento (.doc)"}{" "}
        {/* Mudei o texto aqui */}
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
                    0
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

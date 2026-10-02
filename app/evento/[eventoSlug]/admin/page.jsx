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
  RiBuildingLine,
  RiCalendarLine,
  RiExternalLinkLine,
  RiFileExcelLine,
  RiFileList3Line,
  RiFileWordLine,
  RiGroupLine,
  RiPresentationFill,
  RiSettings3Line,
} from "@remixicon/react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import NoData from "@/components/NoData";
import { getEventoDashboard } from "@/app/api/client/eventos";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getSubmissaoByEvento } from "@/app/api/client/relatorios";
import { getInstituicaoSigla, getInstituicaoNome } from "@/lib/instituicaoDisplay";
import { NovoLinkCompartilhamento, PainelCompartilhamentos } from "./CompartilhamentosResumos";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [evento, setEvento] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSubmissoes, setIsDownloadingSubmissoes] = useState(false);
  // Muda a cada link gerado no modal "Novo link", para o painel "Links compartilhados" recarregar
  const [linksAtualizadosEm, setLinksAtualizadosEm] = useState(0);

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
  const gerarRelatorioSubmissoes = async (filtro = null) => {
    setIsDownloadingSubmissoes(true);
    try {
      const submissaoData = await getSubmissaoByEvento(
        params.eventoSlug,
        evento.evento.id,
        filtro?.tenantSlug,
        filtro?.instituicaoParceiraId,
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
          siglaTenant: sanitizeText(getInstituicaoSigla(submissao)),
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
          filtro?.label ? `_${filtro.label}` : ""
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
    console.log(
      "Gerando documento Word para o evento:",
      evento.evento.nomeEvento,
    );
    try {
      const filtro = filtroInstituicaoAtual();
      const submissaoData = await getSubmissaoByEvento(
        params.eventoSlug,
        evento.evento.id,
        filtro?.tenantSlug,
        filtro?.instituicaoParceiraId,
      );

      // Remove tudo que pode quebrar o XML do docx
      const cleanText = (text) => {
        if (text === null || text === undefined) return "";
        return (
          String(text)
            .normalize("NFC")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            // Remove emojis e caracteres fora do BMP
            .replace(/[\u{10000}-\u{10FFFF}]/gu, "")
            // Remove surrogate pairs soltos
            .replace(/[\uD800-\uDFFF]/g, "")
            // Remove caracteres de controle inválidos em XML 1.0
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
            // Remove caracteres Unicode problemáticos
            .replace(/[\uFFFE\uFFFF]/g, "")
            .trim()
        );
      };

      const safeParagraph = (text, options = {}) => {
        const cleaned = cleanText(text);
        return new Paragraph({
          children: [new TextRun({ text: cleaned || " ", ...options })],
          ...options.paragraph,
        });
      };

      const textToParagraphs = (
        text,
        runOptions = {},
        paragraphOptions = {},
      ) => {
        const cleaned = cleanText(text);
        if (!cleaned) {
          return [
            new Paragraph({
              children: [new TextRun({ text: " " })],
              ...paragraphOptions,
            }),
          ];
        }
        return cleaned
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({ text: cleanText(line) || " ", ...runOptions }),
                ],
                alignment: "both",
                spacing: { after: 100 },
                ...paragraphOptions,
              }),
          );
      };

      const children = [];

      // Cabeçalho
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanText(`Anais do Evento - ${evento.evento.nomeEvento}`),
              bold: true,
              size: 32,
              font: "Arial",
            }),
          ],
          alignment: "center",
          spacing: { after: 400 },
        }),
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Total de trabalhos: ",
              bold: true,
              font: "Arial",
            }),
            new TextRun({ text: String(submissaoData.length), font: "Arial" }),
          ],
          spacing: { after: 200 },
        }),
      );

      if (selectedTenant) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Instituicao: ", bold: true, font: "Arial" }),
              new TextRun({
                text: cleanText(selectedTenant.tenant),
                font: "Arial",
              }),
            ],
            spacing: { after: 400 },
          }),
        );
      }

      for (let index = 0; index < submissaoData.length; index++) {
        try {
          const submissao = submissaoData[index];
          const resumo = submissao.Resumo || {};
          const area = resumo.area || {};
          const grandeArea = area.grandeArea || {};
          const participacoes = resumo.participacoes || [];
          const secoesConteudo = Array.isArray(resumo.conteudo)
            ? resumo.conteudo
            : [];

          const palavrasChave =
            Array.isArray(resumo.PalavraChave) && resumo.PalavraChave.length > 0
              ? resumo.PalavraChave.map((p) => cleanText(p.palavra))
                  .filter(Boolean)
                  .join(", ")
              : "Sem palavras-chave";

          const participantesPorCargo = {
            AUTOR: [],
            COAUTOR: [],
            ORIENTADOR: [],
            COORIENTADOR: [],
            COLABORADOR: [],
          };

          participacoes.forEach((part) => {
            const nome = cleanText(part.user?.nome) || "Nome nao disponivel";
            if (part.cargo && participantesPorCargo[part.cargo] !== undefined) {
              participantesPorCargo[part.cargo].push(nome);
            }
          });

          const labels = {
            AUTOR: "Autores",
            COAUTOR: "Coautores",
            ORIENTADOR: "Orientador(es)",
            COORIENTADOR: "Coorientador(es)",
            COLABORADOR: "Colaborador(es)",
          };

          // Título do trabalho
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanText(resumo.titulo) || "Sem titulo",
                  bold: true,
                  size: 26,
                  font: "Arial",
                }),
              ],
              spacing: { before: 600, after: 200 },
              border: {
                bottom: { style: "single", size: 6, color: "3498DB" },
              },
            }),
          );

          // Participantes
          Object.entries(participantesPorCargo)
            .filter(([_, nomes]) => nomes.length > 0)
            .forEach(([cargo, nomes]) => {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${labels[cargo] || cargo}: `,
                      bold: true,
                      font: "Arial",
                      size: 22,
                    }),
                    new TextRun({
                      text: nomes.join(", "),
                      italics: true,
                      font: "Arial",
                      size: 22,
                    }),
                  ],
                  spacing: { after: 80 },
                }),
              );
            });

          // Área e categoria
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Area: ${cleanText(area.area) || "Sem area"}   Grande Area: ${cleanText(grandeArea.grandeArea) || "Sem grande area"}   Categoria: ${cleanText(submissao.categoria) || "Sem categoria"}`,
                  size: 20,
                  font: "Arial",
                  color: "555555",
                }),
              ],
              spacing: { after: 80 },
            }),
          );

          // Palavras-chave
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Palavras-chave: ",
                  bold: true,
                  font: "Arial",
                  size: 20,
                }),
                new TextRun({
                  text: cleanText(palavrasChave),
                  italics: true,
                  font: "Arial",
                  size: 20,
                }),
              ],
              spacing: { after: 200 },
            }),
          );

          // Conteúdo
          if (
            secoesConteudo.length > 0 &&
            secoesConteudo.some((s) => s.conteudo && s.conteudo.trim() !== "")
          ) {
            secoesConteudo.forEach((secao) => {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cleanText(secao.nome) || " ",
                      bold: true,
                      font: "Arial",
                      size: 24,
                      color: "2980B9",
                    }),
                  ],
                  spacing: { before: 300, after: 120 },
                }),
              );
              textToParagraphs(secao.conteudo, {
                font: "Arial",
                size: 22,
              }).forEach((p) => children.push(p));
            });
          } else {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Resumo",
                    bold: true,
                    font: "Arial",
                    size: 24,
                    color: "2980B9",
                  }),
                ],
                spacing: { before: 300, after: 120 },
              }),
            );
            textToParagraphs(resumo.conteudoFormatado, {
              font: "Arial",
              size: 22,
            }).forEach((p) => children.push(p));
          }

          // Premiação
          if (submissao.premio || submissao.mencaoHonrosa) {
            const textos = [];
            if (submissao.premio) textos.push("Premiado: Sim");
            if (submissao.mencaoHonrosa) textos.push("Mencao Honrosa: Sim");
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: textos.join("   "),
                    bold: true,
                    font: "Arial",
                    size: 20,
                    color: "27AE60",
                  }),
                ],
                spacing: { before: 200, after: 100 },
              }),
            );
          }

          // Quebra de página
          if (index < submissaoData.length - 1) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: " " })],
                pageBreakBefore: true,
              }),
            );
          }
        } catch (err) {
          console.error(
            `Erro na submissao index ${index}, id ${submissaoData[index]?.id}:`,
            err,
          );
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[Erro ao processar submissao ${submissaoData[index]?.id || index}]`,
                  font: "Arial",
                  color: "FF0000",
                }),
              ],
            }),
          );
        }
      }

      const doc = new Document({
        creator: "Sistema de Eventos",
        title: cleanText(evento.evento.nomeEvento),
        sections: [
          {
            properties: {},
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `anais_${cleanText(evento.evento.slug)}${selectedTenant ? `_${cleanText(selectedTenant.tenant)}` : ""}.docx`,
      );
    } catch (error) {
      console.error("Erro ao gerar documento Word:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const openModal = (tenant = null) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  // Deriva o filtro a mandar pra API a partir do `selectedTenant` atual —
  // um tenant real filtra por slug, uma instituição parceira filtra pelo
  // `id` dela (não tem Tenant/slug). `label` é usado em nome de arquivo e
  // textos do modal, que já leem `selectedTenant.tenant` hoje.
  const filtroInstituicaoAtual = () => {
    if (!selectedTenant) return null;
    return selectedTenant.instituicaoParceiraId
      ? { instituicaoParceiraId: selectedTenant.instituicaoParceiraId, label: selectedTenant.tenant }
      : { tenantSlug: selectedTenant.tenant, label: selectedTenant.tenant };
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
        onClick={() => gerarRelatorioSubmissoes(filtroInstituicaoAtual())}
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

  const totalGeral =
    evento.info.tenantsTotais.reduce(
      (total, tenant) => total + tenant.quantidadeSubmissoesTotal,
      0,
    ) +
    (evento.info.parceirasTotais || []).reduce(
      (total, parceira) => total + parceira.quantidadeSubmissoesTotal,
      0,
    );

  return (
    <div className={styles.dashboard}>
      {renderModalContent()}

      <div className={`${styles.head}`}>
        <div className={styles.left}>
          <div className={styles.title}>
            <h5>{evento.evento.nomeEvento}</h5>
          </div>
        </div>
        <div className={styles.headActions}>
          {evento.evento.eventoRootSlug && (
            <a
              href={`/evento/${evento.evento.eventoRootSlug}/edicao/${evento.evento.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button btn-secondary"
            >
              <RiExternalLinkLine className="btn-icon" />
              <p className="p5">Ver página do evento</p>
            </a>
          )}
          <Button
            linkTo={`/evento/${params.eventoSlug}/admin/configuracoes?aba=sessoes`}
            icon={RiPresentationFill}
            className="btn-secondary"
          >
            Criar sessões
          </Button>
          <Button
            linkTo={`/evento/${params.eventoSlug}/admin/configuracoes`}
            icon={RiSettings3Line}
            className="btn-secondary"
          >
            Configurações
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h6>Submissões por instituição</h6>
            <p>Clique em uma instituição para exportar os dados dela.</p>
          </div>

          <div className={styles.statHero} onClick={() => openModal(null)}>
            <RiFileList3Line />
            <div>
              <p>Total geral de submissões</p>
              <h4>{totalGeral}</h4>
            </div>
          </div>

          <div className={styles.totaisGrid}>
            {evento.info.tenantsTotais.map((tenant) => (
              <div
                className={styles.statTile}
                key={tenant.tenant}
                onClick={() => openModal(tenant)}
              >
                <RiBuildingLine />
                <div>
                  <h5>{tenant.quantidadeSubmissoesTotal}</h5>
                  <p>{tenant.tenant}</p>
                </div>
              </div>
            ))}
            {/* Instituições parceiras (sem Tenant) — filtram export pelo id da
                parceira em vez do slug de um Tenant */}
            {(evento.info.parceirasTotais || []).map((parceira) => (
              <div
                className={styles.statTile}
                key={parceira.id}
                onClick={() =>
                  openModal({
                    tenant: parceira.instituicao,
                    instituicaoParceiraId: parceira.id,
                    quantidadeSubmissoesTotal: parceira.quantidadeSubmissoesTotal,
                  })
                }
              >
                <RiBuildingLine />
                <div>
                  <h5>{parceira.quantidadeSubmissoesTotal}</h5>
                  <p>{parceira.instituicao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h6>Links compartilhados</h6>
            <p>
              Links públicos de Resumos + Avaliações. Expiram em 60 dias e
              podem ser revogados a qualquer momento.
            </p>
            <NovoLinkCompartilhamento
              eventoSlug={params.eventoSlug}
              instituicoes={[
                ...evento.info.tenantsTotais.map((t) => ({
                  label: t.tenant.toUpperCase(),
                  tenantSlug: t.tenant,
                })),
                ...(evento.info.parceirasTotais || []).map((p) => ({
                  label: `${p.instituicao} (parceira)`,
                  instituicaoParceiraId: p.id,
                })),
              ]}
              onGerado={() => setLinksAtualizadosEm(Date.now())}
            />
          </div>
          <PainelCompartilhamentos
            eventoSlug={params.eventoSlug}
            atualizarEm={linksAtualizadosEm}
          />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h6>Sessões e subsessões</h6>
          </div>

          <div className={styles.sessoes}>
            {evento.info.sessaoInfo[0] &&
            evento.info.sessaoInfo[0].subsessoes[0] ? (
              evento.info.sessaoInfo.map((sessao) => {
                const capacidadeTotal = sessao.capacidade;
                const subsessoesOrdenadas = [...sessao.subsessoes].sort(
                  (a, b) => new Date(a.inicio) - new Date(b.inicio),
                );
                return (
                  <div className={styles.sessao} key={sessao.sessaoId}>
                    <h6>{sessao.titulo}</h6>
                    <div className={styles.subsessoes}>
                      {subsessoesOrdenadas.map((subs) => (
                        <div className={styles.subsessao} key={subs.inicio}>
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
                                {formatarData(subs.fim)} -{" "}
                                {formatarHora(subs.fim)}
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
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <NoData description="Este evento ainda não tem sessões cadastradas." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Page;

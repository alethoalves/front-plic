"use client";

// HOOKS
import { useState, useEffect } from "react";

// ESTILOS E ÍCONES
import styles from "@/components/dashboards/Eventos.module.scss";
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

// FUNÇÕES
import Link from "next/link";
import NoData from "../NoData";
import { getEventosDashboard } from "@/app/api/client/eventos";
import { getSubmissaoByEvento } from "@/app/api/client/relatorios";
import { formatarData, formatarHora } from "@/lib/formatarDatas";
import Modal from "../Modal";
import Button from "../Button";
import ExcelJS from "exceljs"; // Para exportação do Excel
import { saveAs } from "file-saver"; // Para salvar o arquivo Excel

const Inscricoes = ({ tenantSlug }) => {
  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [eventos, setEventos] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [
    isDownloadingArtigoSemIdentificacao,
    setIsDownloadingArtigoSemIdentificacao,
  ] = useState(false);

  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [isDownloadingSubmissoes, setIsDownloadingSubmissoes] = useState(false);

  const [tenant, setTenant] = useState("");
  const [submissoes, setSubmissoes] = useState([]);
  // Função para buscar os eventos da API
  const fetchEventos = async (tenantSlug) => {
    setLoading(true);
    try {
      const data = await getEventosDashboard(tenantSlug);
      setEventos(data);
    } catch (error) {
      setError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos(tenantSlug);
  }, [tenantSlug]);

  // Função para passar para o próximo evento
  const handleNextEvent = () => {
    if (currentEventIndex < eventos.length - 1) {
      setCurrentEventIndex(currentEventIndex + 1);
    }
  };

  // Função para voltar ao evento anterior
  const handlePreviousEvent = () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(currentEventIndex - 1);
    }
  };
  const sanitizeText = (text) => {
    if (typeof text !== "string") return text;
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  const gerarDocDosResumos = async (tenantSigla) => {
    setIsDownloading(true);
    try {
      const evento = eventos[currentEventIndex].data.evento;
      const submissaoData = await getSubmissaoByEvento(
        evento.slug,
        evento.id,
        tenantSigla
      );

      // Criação do conteúdo HTML
      let htmlContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Submissões do Evento</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { font-size: 14pt; text-align: center; margin-bottom: 20px; }
            h2 { font-size: 12pt; margin-top: 15px; color: #333; }
            p { font-size: 10pt; margin: 5px 0; }
            .container { width: 80%; margin: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Submissões do Evento</h1>
      `;

      submissaoData.forEach((sub, index) => {
        const planoDeTrabalho = sub.planoDeTrabalho || {};
        const participacoesPlano = planoDeTrabalho.participacoes || [];
        const participacoesInscricao =
          planoDeTrabalho.inscricao?.participacoes || [];
        const area = planoDeTrabalho.area || {};
        const registroAtividades = planoDeTrabalho.registroAtividades || [];

        const alunos = participacoesPlano
          .filter((p) => p.tipo === "aluno")
          .map((p) => sanitizeText(p.user?.nome || "Nome não disponível"))
          .join(", ");

        const orientadores = participacoesInscricao
          .filter((p) => p.tipo === "orientador" || p.tipo === "coorientador")
          .map(
            (p) =>
              `${sanitizeText(p.user?.nome || "Nome não disponível")} (${
                p.tipo
              })`
          )
          .join(", ");

        const editalTitulo =
          planoDeTrabalho.inscricao?.edital?.titulo || "Edital não disponível";
        const tenantSigla =
          planoDeTrabalho.inscricao?.edital?.tenant?.sigla ||
          "Tenant não disponível";

        htmlContent += `
          <div class="section">
            <h2>${
              sanitizeText(planoDeTrabalho.titulo) || "Título não disponível"
            }</h2>
            <p><strong>Alunos:</strong> ${alunos}</p>
            <p><strong>Orientadores/Coorientadores:</strong> ${
              orientadores || "Nenhum"
            }</p>
            <p><strong>Área:</strong> ${
              sanitizeText(area.area) || "Área não disponível"
            }</p>
            <p><strong>Edital:</strong> ${sanitizeText(editalTitulo)}</p>
            <p><strong>Instituição:</strong> ${sanitizeText(tenantSigla)}</p>
        `;

        // Ordenar as respostas pela propriedade `ordem`
        const respostasOrdenadas = [
          ...(registroAtividades[0]?.respostas || []),
        ].sort((a, b) => (a.campo?.ordem || 0) - (b.campo?.ordem || 0));

        // Adicionar respostas ordenadas ao HTML
        if (respostasOrdenadas.length > 0) {
          respostasOrdenadas.forEach((resposta) => {
            htmlContent += `
              <h3>${sanitizeText(resposta.campo?.label || "Seção")}</h3>
              <p>${sanitizeText(
                resposta.value || "Conteúdo não disponível"
              )}</p>
            `;
          });
        } else {
          htmlContent += `<p><em>Sem registro de atividades.</em></p>`;
        }

        htmlContent += `</div>`;

        // Adiciona o caractere de quebra de página entre submissões
        if (index < submissaoData.length - 1) {
          htmlContent += `<p style="page-break-before: always;">\f</p>`;
        }
      });

      htmlContent += `</div></body></html>`;

      // Criar o Blob e baixar como arquivo .doc
      const blob = new Blob([htmlContent], { type: "application/msword" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "submissoes_evento.doc";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao gerar o documento .doc:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const gerarDocDosResumosSemIdentificacao = async (tenantSigla) => {
    setIsDownloadingArtigoSemIdentificacao(true);
    try {
      const evento = eventos[currentEventIndex].data.evento;
      const submissaoData = await getSubmissaoByEvento(
        evento.slug,
        evento.id,
        tenantSigla
      );
      submissaoData.sort((a, b) => a.id - b.id);

      console.log(
        submissaoData.filter((submissao) => submissao.indicacaoPremio)
      );
      // Criação do conteúdo HTML
      let htmlContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Submissões do Evento</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { font-size: 14pt; text-align: center; margin-bottom: 20px; }
            h2 { font-size: 12pt; margin-top: 15px; color: #333; }
            p { font-size: 10pt; margin: 5px 0; }
            .container { width: 80%; margin: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Submissões do Evento</h1>
      `;

      submissaoData
        .filter((submissao) => submissao.indicacaoPremio)
        .forEach((sub, index) => {
          const planoDeTrabalho = sub.planoDeTrabalho || {};
          const participacoesPlano = planoDeTrabalho.participacoes || [];
          const participacoesInscricao =
            planoDeTrabalho.inscricao?.participacoes || [];
          const area = planoDeTrabalho.area || {};
          const registroAtividades = planoDeTrabalho.registroAtividades || [];
          const idSubmissao = sub.id;

          const editalTitulo =
            planoDeTrabalho.inscricao?.edital?.titulo ||
            "Edital não disponível";
          const tenantSigla =
            planoDeTrabalho.inscricao?.edital?.tenant?.sigla ||
            "Tenant não disponível";

          htmlContent += `
          <div class="section">
          <h1>${`ID - ${idSubmissao}`}</h1>
            <h2>${
              sanitizeText(planoDeTrabalho.titulo) || "Título não disponível"
            }</h2>
            
            <p><strong>Área:</strong> ${
              sanitizeText(area.area) || "Área não disponível"
            }</p>
            <p><strong>Edital:</strong> ${sanitizeText(editalTitulo)}</p>
            <p><strong>Instituição:</strong> ${sanitizeText(tenantSigla)}</p>
        `;

          // Ordenar as respostas pela propriedade `ordem`
          const respostasOrdenadas = [
            ...(registroAtividades[0]?.respostas || []),
          ].sort((a, b) => (a.campo?.ordem || 0) - (b.campo?.ordem || 0));

          // Adicionar respostas ordenadas ao HTML
          if (respostasOrdenadas.length > 0) {
            respostasOrdenadas.forEach((resposta) => {
              if (resposta.campo.label === "Colaboradores") return;
              htmlContent += `
              <h3>${sanitizeText(resposta.campo?.label || "Seção")}</h3>
              <p>${sanitizeText(
                resposta.value || "Conteúdo não disponível"
              )}</p>
            `;
            });
          } else {
            htmlContent += `<p><em>Sem registro de atividades.</em></p>`;
          }

          htmlContent += `</div>`;

          // Adiciona o caractere de quebra de página entre submissões
          if (index < submissaoData.length - 1) {
            htmlContent += `<p style="page-break-before: always;">\f</p>`;
          }
        });

      htmlContent += `</div></body></html>`;

      // Criar o Blob e baixar como arquivo .doc
      const blob = new Blob([htmlContent], { type: "application/msword" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "submissoes_evento.doc";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao gerar o documento .doc:", error);
    } finally {
      setIsDownloadingArtigoSemIdentificacao(false);
    }
  };
  // Calcula o total geral das submissões de todos os tenants
  const totalSubmissoesGeral = eventos
    ? eventos[currentEventIndex].info.tenantsTotais.reduce(
        (total, tenant) => total + tenant.quantidadeSubmissoesTotal,
        0
      )
    : 0;
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
  };
  const openModalAndSetData = (tenant) => {
    console.log(tenant);
    setTenant(tenant);
    setIsModalOpen(true);
  };
  const gerarDadosDasSubmissoes = async (tenantSigla) => {
    setIsDownloadingSubmissoes(true);
    try {
      const evento = eventos[currentEventIndex].data.evento;
      const submissaoData = await getSubmissaoByEvento(
        evento.slug,
        evento.id,
        tenantSigla
      );

      const submissoesArray = submissaoData.map((sub) => {
        const planoDeTrabalho = sub.planoDeTrabalho || {};
        const area = planoDeTrabalho.area || {};
        const editalTitulo =
          planoDeTrabalho.inscricao?.edital?.titulo || "Edital não disponível";
        const tenantSigla =
          planoDeTrabalho.inscricao?.edital?.tenant?.sigla ||
          "Sigla não disponível";

        return {
          SIGLA: tenantSigla,
          TITULO_EDITAL: editalTitulo,
          GRANDE_AREA:
            area.grandeArea?.grandeArea || "Grande Área não disponível",
          AREA: area.area || "Área não disponível",
          TITULO_PLANO: planoDeTrabalho.titulo || "Título não disponível",
          PREMIO: sub.premio ? "Sim" : "Não",
          MENCAO_HONROSA: sub.mencaoHonrosa ? "Sim" : "Não",
          INDICACAO_PREMIO: sub.indicacaoPremio ? "Sim" : "Não",
          ID: sub.id,
        };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório de Submissões");

      worksheet.columns = [
        { header: "Sigla", key: "SIGLA", width: 15 },
        { header: "Título do Edital", key: "TITULO_EDITAL", width: 25 },
        { header: "Grande Área", key: "GRANDE_AREA", width: 20 },
        { header: "Área", key: "AREA", width: 20 },
        { header: "Título do Plano", key: "TITULO_PLANO", width: 30 },
        { header: "Prêmio", key: "PREMIO", width: 10 },
        { header: "Menção Honrosa", key: "MENCAO_HONROSA", width: 15 },
        { header: "Indicação Prêmio", key: "INDICACAO_PREMIO", width: 15 },
        { header: "ID", key: "ID", width: 10 },
      ];

      submissoesArray.forEach((submissao) => {
        worksheet.addRow(submissao);
      });

      worksheet.autoFilter = {
        from: "A1",
        to: "I1",
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "relatorio_submissoes.xlsx");
    } catch (error) {
      console.error("Erro ao gerar o Excel:", error);
    } finally {
      setIsDownloadingSubmissoes(false);
    }
  };
  // Função para gerar o Excel
  const gerarDadosDasParticipacoes = async (tenantSigla) => {
    setIsDownloadingExcel(true);
    try {
      const evento = eventos[currentEventIndex].data.evento;
      const submissaoData = await getSubmissaoByEvento(
        evento.slug,
        evento.id,
        tenantSigla
      );

      const participacoesArray = submissaoData.flatMap((sub) => {
        const planoDeTrabalho = sub.planoDeTrabalho || {};
        const area = planoDeTrabalho.area || {};
        const editalTitulo =
          planoDeTrabalho.inscricao?.edital?.titulo || "Edital não disponível";
        const tenantSigla =
          planoDeTrabalho.inscricao?.edital?.tenant?.sigla ||
          "Sigla não disponível";

        const participacoesInscricao =
          planoDeTrabalho.inscricao?.participacoes || [];

        return participacoesInscricao.map((participacao) => ({
          Nome: participacao.user?.nome || "Nome não disponível",
          CPF: participacao.user?.cpf || "CPF não disponível",
          TIPO: participacao.tipo || "Tipo não disponível",
          STATUS: participacao.status || "Status não disponível",
          SIGLA: tenantSigla,
          TITULO_EDITAL: editalTitulo,
          GRANDE_AREA:
            area.grandeArea?.grandeArea || "Grande Área não disponível",
          AREA: area.area || "Área não disponível",
          TITULO_PLANO: planoDeTrabalho.titulo || "Título não disponível",
          PREMIO: sub.premio ? "Sim" : "Não",
          MENCAO_HONROSA: sub.mencaoHonrosa ? "Sim" : "Não",
          INDICACAO_PREMIO: sub.indicacaoPremio ? "Sim" : "Não",
          ID: sub.id,
        }));
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório de Participações");

      worksheet.columns = [
        { header: "Nome", key: "Nome", width: 25 },
        { header: "CPF", key: "CPF", width: 15 },
        { header: "Tipo", key: "TIPO", width: 15 },
        { header: "Status", key: "STATUS", width: 15 },
        { header: "Sigla", key: "SIGLA", width: 15 },
        { header: "Título do Edital", key: "TITULO_EDITAL", width: 25 },
        { header: "Grande Área", key: "GRANDE_AREA", width: 20 },
        { header: "Área", key: "AREA", width: 20 },
        { header: "Título do Plano", key: "TITULO_PLANO", width: 30 },
        { header: "Prêmio", key: "PREMIO", width: 10 },
        { header: "Menção Honrosa", key: "MENCAO_HONROSA", width: 15 },
        { header: "Indicação Prêmio", key: "INDICACAO_PREMIO", width: 15 },
        { header: "ID", key: "ID", width: 10 },
      ];

      participacoesArray.forEach((participacao) => {
        worksheet.addRow(participacao);
      });

      worksheet.autoFilter = {
        from: "A1",
        to: "M1",
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, "relatorio_participacoes.xlsx");
    } catch (error) {
      console.error("Erro ao gerar o Excel:", error);
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiFileExcelLine />
      </div>
      <h4>Relatórios</h4>
      {!tenant && <p>Faça o download dos dados gerais do evento</p>}
      {tenant && (
        <p>
          {`Faça o download dos dados referentes à instituição ${tenant.tenant.toUpperCase()}`}{" "}
        </p>
      )}
      <Button
        onClick={() => gerarDocDosResumos(tenant ? tenant.tenant : null)} // Função para exportar os dados para Excel
        icon={RiFileWordLine}
        className="btn-secondary mt-2"
        type="button"
        disabled={isDownloading} // Desabilita o botão enquanto o download está em andamento
      >
        {isDownloading ? "Exportando..." : "Resumos/Artigos"}
      </Button>
      <Button
        onClick={() =>
          gerarDocDosResumosSemIdentificacao(tenant ? tenant.tenant : null)
        } // Função para exportar os dados para Excel
        icon={RiFileWordLine}
        className="btn-secondary mt-2"
        type="button"
        disabled={isDownloadingArtigoSemIdentificacao} // Desabilita o botão enquanto o download está em andamento
      >
        {isDownloadingArtigoSemIdentificacao
          ? "Exportando..."
          : "Indicados ao prêmio"}
      </Button>
      <Button
        onClick={() =>
          gerarDadosDasParticipacoes(tenant ? tenant.tenant : null)
        }
        icon={RiFileExcelLine}
        className="btn-secondary mt-2"
        type="button"
        disabled={isDownloadingExcel}
      >
        {isDownloadingExcel ? "Exportando..." : "Participações"}
      </Button>
      <Button
        onClick={() => gerarDadosDasSubmissoes(tenant ? tenant.tenant : null)}
        icon={RiFileExcelLine}
        className="btn-secondary mt-2"
        type="button"
        disabled={isDownloadingSubmissoes}
      >
        {isDownloadingSubmissoes ? "Exportando..." : "Submissões"}
      </Button>
    </Modal>
  );
  return (
    <div className={`${styles.dashboard}`}>
      {renderModalContent()}

      <div className={styles.head}>
        <div className={styles.left}>
          <div className={styles.icon}>
            <RiPresentationFill />
          </div>
          <div className={styles.title}>
            <h5>Eventos</h5>
          </div>
        </div>
        {eventos?.length > 1 && (
          <div className={styles.actions}>
            <div
              className={`${styles.btn} ${
                currentEventIndex === 0 ? styles.disabled : ""
              }`}
              onClick={handlePreviousEvent}
            >
              <RiArrowLeftCircleFill />
            </div>
            <div
              className={`${styles.btn} ${
                currentEventIndex === eventos.length - 1 ? styles.disabled : ""
              }`}
              onClick={handleNextEvent}
            >
              <RiArrowRightCircleFill />
            </div>
          </div>
        )}
      </div>

      {eventos ? (
        eventos.length > 0 ? (
          <div className={styles.content}>
            <Link
              href={`/evento/${eventos[currentEventIndex].data.evento.slug}/admin`}
            >
              <h5>{eventos[currentEventIndex].data.evento.nomeEvento}</h5>
            </Link>

            <div className={styles.totais}>
              {eventos[currentEventIndex].info.tenantsTotais.map((tenant) => (
                <div
                  className={`${styles.total} ${styles.light}`}
                  key={tenant.tenant}
                  onClick={() => openModalAndSetData(tenant)}
                >
                  <p>{tenant.quantidadeSubmissoesTotal}</p>
                  <h6>{tenant.tenant}</h6>
                </div>
              ))}
              <div
                className={`${styles.total} ${styles.blue}`}
                onClick={() => openModalAndSetData(null)}
              >
                <p>{totalSubmissoesGeral}</p>
                <h6>Total Geral</h6>
              </div>
            </div>
            <div className={styles.sessoes}>
              {eventos[currentEventIndex].info.sessaoInfo[0] &&
              eventos[currentEventIndex].info.sessaoInfo[0].subsessoes[0] ? (
                eventos[currentEventIndex].info.sessaoInfo.map((sessao) => {
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
                      </div>
                    </div>
                  ));
                })
              ) : (
                <NoData description="Este evento ainda não tem sessões cadastradas." />
              )}
            </div>
          </div>
        ) : (
          <NoData description="Nenhum evento encontrado" />
        )
      ) : (
        <NoData description="Nenhum evento encontrado" />
      )}
    </div>
  );
};

export default Inscricoes;

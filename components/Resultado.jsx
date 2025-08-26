"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  ativarOuPendenteParticipacao,
  getParticipacoesByTenant,
} from "@/app/api/client/participacao";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { FilterService } from "primereact/api";
import styles from "./Resultado.module.scss";
import { Card } from "primereact/card";
import Modal from "./Modal";
import ParticipacaoGestorController from "./participacao/ParticipacaoGestorController";
import { statusOptions } from "@/lib/statusOptions";
import {
  notaRowFilterTemplate,
  statusClassificacaoFilterTemplate,
} from "@/lib/tableTemplates";
import { renderStatusTagWithJustificativa } from "@/lib/tagUtils";
import { ativarVinculo } from "@/app/api/client/bolsa";
import {
  criarRegistrosDocumento,
  getDocumentoTemplates,
} from "@/app/api/client/documentos";
import { Dropdown } from "primereact/dropdown";
const getInitialFilters = () => ({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  "inscricao.edital.titulo": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  "user.nome": {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  "planoDeTrabalho.statusClassificacao": {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  statusParticipacao: {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  orientadores: {
    value: null,
    matchMode: FilterMatchMode.CONTAINS,
  },
  notaTotal: {
    value: [null, null],
    matchMode: "intervalo",
  },
  statusVinculo: {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
  fontePagadora: {
    value: null,
    matchMode: FilterMatchMode.IN,
  },
});
// ==============================================
// FILTROS PERSONALIZADOS
// ==============================================

/**
 * Registra filtro personalizado para intervalo de notas
 */
FilterService.register("intervalo", (value, filters) => {
  const [min, max] = filters || [null, null];

  if (min === null && max === null) return true; // Sem filtro
  if (min !== null && value < min) return false; // Valor abaixo do mínimo
  if (max !== null && value > max) return false; // Valor acima do máximo
  return true; // Passou no filtro
});

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

const Resultado = ({}) => {
  // ==============================================
  // ESTADOS E REFS
  // ==============================================
  const params = useParams();
  const { tenant, ano } = params;
  const toast = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ← Adicione esta linha
  const [selectedRowData, setSelectedRowData] = useState(null); // Novo estado

  // Estados para dados e carregamento
  const [exporting, setExporting] = useState(false);
  const [participacoes, setParticipacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editaisOptions, setEditaisOptions] = useState([]);
  const [classificacaoStatusOptions, setClassificacaoStatusOptions] = useState(
    []
  );
  const [solicitacaoStatusOptions, setSolicitacaoStatusOptions] = useState([]);
  const [vinculoStatusOptions, setVinculoStatusOptions] = useState([]);
  const [participacaoStatusOptions, setParticipacaoStatusOptions] = useState(
    []
  );
  // Novos estados para documentos
  const [documentoTemplates, setDocumentoTemplates] = useState([]);
  const [selectedDocumentoTemplate, setSelectedDocumentoTemplate] =
    useState(null);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [showDocumentoDialog, setShowDocumentoDialog] = useState(false);

  // Estados para filtros
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState(getInitialFilters());
  const [selectedParticipacoes, setSelectedParticipacoes] = useState([]);
  const [loadingAtivacao, setLoadingAtivacao] = useState(false);
  // Estados para modal de justificativas
  const [showJustificativas, setShowJustificativas] = useState(false);
  const [justificativasAtuais, setJustificativasAtuais] = useState("");

  const exportToExcel = async () => {
    try {
      setExporting(true);

      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Participações");

      // Primeiro, vamos processar a ordem de recebimento de bolsa por edital
      const processarOrdemRecebimento = (participacoes) => {
        // Agrupar participantes por edital
        const participantesPorEdital = {};

        participacoes.forEach((part) => {
          const editalTitulo = part.inscricao?.edital?.titulo || "Sem Edital";
          if (!participantesPorEdital[editalTitulo]) {
            participantesPorEdital[editalTitulo] = [];
          }
          participantesPorEdital[editalTitulo].push(part);
        });

        const resultado = {};

        // Processar cada edital separadamente
        Object.keys(participantesPorEdital).forEach((editalTitulo) => {
          const participantesEdital = participantesPorEdital[editalTitulo];

          // Filtrar apenas participantes com status APROVADO neste edital
          const aprovados = participantesEdital.filter((part) => {
            const vinculo = part.VinculoSolicitacaoBolsa?.[0];
            return vinculo?.status === "APROVADO";
          });

          // Obter todas as ordens de recebimento únicas para este edital
          const ordensUnicas = [
            ...new Set(
              aprovados
                .map(
                  (part) =>
                    part.VinculoSolicitacaoBolsa?.[0]?.solicitacaoBolsa
                      ?.ordemRecebimentoBolsa
                )
                .filter(Boolean)
            ),
          ].sort((a, b) => a - b);

          // Obter o maior número de ordem para este edital
          const maxOrdem =
            ordensUnicas.length > 0 ? Math.max(...ordensUnicas) : 0;

          let contadorGlobal = 1;

          // Processar cada ordem de recebimento para este edital
          for (let ordem = 1; ordem <= maxOrdem; ordem++) {
            // Filtrar participantes com esta ordem específica neste edital
            const participantesOrdem = aprovados.filter(
              (part) =>
                part.VinculoSolicitacaoBolsa?.[0]?.solicitacaoBolsa
                  ?.ordemRecebimentoBolsa === ordem
            );

            // Ordenar por nota total (maior para menor)
            const ordenados = [...participantesOrdem].sort((a, b) => {
              const notaA = a.notaTotal || 0;
              const notaB = b.notaTotal || 0;
              return notaB - notaA; // Ordem decrescente
            });

            // Atribuir números sequenciais para este edital
            ordenados.forEach((part) => {
              resultado[part.id] = contadorGlobal++;
            });
          }
        });

        return resultado;
      };

      // Processar a ordem de recebimento
      const ordemRecebimentoMap = processarOrdemRecebimento(participacoes);

      // Definindo as colunas
      worksheet.columns = [
        { header: "Edital", key: "edital", width: 30 },
        { header: "Plano de Trabalho", key: "planoTrabalho", width: 30 },
        { header: "Orientador", key: "orientador", width: 25 },
        { header: "Aluno", key: "aluno", width: 25 },
        { header: "Status Plano", key: "statusPlano", width: 20 },
        { header: "Justificativa Plano", key: "justificativaPlano", width: 30 },
        { header: "Status Aluno", key: "statusAluno", width: 20 },
        { header: "Justificativa Aluno", key: "justificativaAluno", width: 30 },
        {
          header: "Status Solicitação de Bolsa",
          key: "statusSolicitacaoBolsa",
          width: 25,
        },
        {
          header: "Motivo Recusa Vinculação",
          key: "motivoRecusaVinculacao",
          width: 30,
        },
        {
          header: "Qnt Sol Bolsa Por Orientador", // NOME ALTERADO AQUI
          key: "ordemRecebimentoInput",
          width: 25,
        },
        {
          header: "Ordem de recebimento de bolsa",
          key: "ordemRecebimentoFinal",
          width: 25,
        },
        { header: "Fonte Pagadora", key: "fontePagadora", width: 25 },
        {
          header: "Nota Total",
          key: "notaTotal",
          width: 15,
          style: { numFmt: "0.0000" },
        },
      ];

      // Adicionando os dados
      const dataToExport = participacoes.map((part) => {
        const isPlanoDesclassificado =
          part.planoDeTrabalho?.statusClassificacao !== "CLASSIFICADO";
        const isAlunoRecusado = part.statusParticipacao === "RECUSADA";
        const vinculo = part.VinculoSolicitacaoBolsa?.[0];
        const statusVinculacao = vinculo?.status;
        const isVinculacaoRecusada = statusVinculacao === "RECUSADO";
        const isVinculacaoAprovada =
          statusVinculacao === "APROVADO" || statusVinculacao === "PENDENTE";

        // Lógica para justificativas
        const justificativaPlano = isPlanoDesclassificado
          ? part.planoDeTrabalho?.justificativa || ""
          : "";

        const justificativaAluno = isAlunoRecusado
          ? part.justificativa || ""
          : "";

        const motivoRecusaVinculacao = isVinculacaoRecusada
          ? vinculo?.motivoRecusa || ""
          : "";

        // Ordem de recebimento de input (original)
        const ordemRecebimentoInput = vinculo?.solicitacaoBolsa
          ?.ordemRecebimentoBolsa
          ? vinculo.solicitacaoBolsa.ordemRecebimentoBolsa.toString()
          : "";

        // Nova ordem de recebimento final (calculada)
        let ordemRecebimentoFinal = "";
        if (
          isVinculacaoAprovada &&
          !isPlanoDesclassificado &&
          !isAlunoRecusado
        ) {
          ordemRecebimentoFinal =
            ordemRecebimentoMap[part.id]?.toString() || "";
        } else {
          ordemRecebimentoFinal = "-";
        }

        // Lógica para status solicitação de bolsa
        let statusSolicitacaoBolsa = "";
        if (isPlanoDesclassificado || isAlunoRecusado) {
          statusSolicitacaoBolsa = "-";
        } else {
          statusSolicitacaoBolsa = statusVinculacao || "-";
        }

        // Lógica para fonte pagadora
        let fontePagadora = "Voluntária";
        if (isPlanoDesclassificado || isAlunoRecusado) {
          fontePagadora = "-";
        } else {
          if (isVinculacaoAprovada) {
            if (vinculo.solicitacaoBolsa?.bolsa?.cota) {
              fontePagadora = `Remunerada - ${
                vinculo.solicitacaoBolsa.bolsa.cota?.instituicaoPagadora ||
                "N/A"
              }`;
            } else {
              fontePagadora = "Voluntária em Lista de Espera";
            }
          } else if (isVinculacaoRecusada) {
            fontePagadora = "Voluntária - solicitação de bolsa recusada";
          }
        }

        return {
          edital: part.inscricao?.edital?.titulo || "",
          planoTrabalho: part.planoDeTrabalho?.titulo || "",
          orientador: part.orientadores || "N/A",
          aluno: part.user?.nome || "",
          statusPlano: part.planoDeTrabalho?.statusClassificacao || "",
          justificativaPlano: justificativaPlano,
          statusAluno: isPlanoDesclassificado
            ? "-"
            : part.statusParticipacao || "",
          justificativaAluno: justificativaAluno,
          statusSolicitacaoBolsa: statusSolicitacaoBolsa,
          motivoRecusaVinculacao: motivoRecusaVinculacao,
          ordemRecebimentoInput: ordemRecebimentoInput,
          ordemRecebimentoFinal: ordemRecebimentoFinal,
          fontePagadora: fontePagadora,
          notaTotal: part.notaTotal || null,
        };
      });

      worksheet.addRows(dataToExport);

      // Adicionando a tabela (Excel Table)
      worksheet.addTable({
        name: "ParticipacoesTable",
        ref: "A1",
        headerRow: true,
        totalsRow: false,
        style: {
          theme: "TableStyleMedium2",
          showRowStripes: true,
        },
        columns: [
          { name: "Edital", filterButton: true },
          { name: "Plano de Trabalho", filterButton: true },
          { name: "Orientador", filterButton: true },
          { name: "Aluno", filterButton: true },
          { name: "Status Plano", filterButton: true },
          { name: "Justificativa Plano", filterButton: true },
          { name: "Status Aluno", filterButton: true },
          { name: "Justificativa Aluno", filterButton: true },
          { name: "Status Solicitação de Bolsa", filterButton: true },
          { name: "Motivo Recusa Vinculação", filterButton: true },
          { name: "Qnt Sol Bolsa Por Orientador", filterButton: true },
          { name: "Ordem de recebimento de bolsa", filterButton: true },
          { name: "Fonte Pagadora", filterButton: true },
          { name: "Nota Total", filterButton: true },
        ],
        rows: dataToExport.map((item) => [
          item.edital,
          item.planoTrabalho,
          item.orientador,
          item.aluno,
          item.statusPlano,
          item.justificativaPlano,
          item.statusAluno,
          item.justificativaAluno,
          item.statusSolicitacaoBolsa,
          item.motivoRecusaVinculacao,
          item.ordemRecebimentoInput,
          item.ordemRecebimentoFinal,
          item.fontePagadora,
          item.notaTotal,
        ]),
      });

      // Formatação do cabeçalho
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Gerando o arquivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `participacoes_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      showToast("success", "Sucesso", "Arquivo Excel gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      showToast("error", "Erro", "Falha ao exportar para Excel");
    } finally {
      setExporting(false);
    }
  };
  const paginatorLeft = (
    <Button
      type="button"
      icon={exporting ? "pi pi-spinner pi-spin" : "pi pi-download"}
      text
      onClick={exportToExcel}
      disabled={exporting}
      tooltip="Exportar para Excel"
      tooltipOptions={{ position: "bottom" }}
    />
  );
  // ==============================================
  // EFEITOS
  // ==============================================
  const onSelectionChange = (e) => {
    setSelectedParticipacoes(e.value);
  };
  const handleAtivarParticipacoes = async () => {
    if (selectedParticipacoes.length === 0) {
      showToast(
        "warn",
        "Aviso",
        "Selecione pelo menos uma participação para ativar"
      );
      return;
    }

    try {
      setLoadingAtivacao(true);

      // Executa todas as requisições em paralelo
      const results = await Promise.all(
        selectedParticipacoes.map(async (participacao) => {
          try {
            const resultado = await ativarOuPendenteParticipacao(
              tenant,
              participacao.id,
              null,
              "2024-08-01"
            );

            return { success: true, id: participacao.id };
          } catch (error) {
            console.error(
              `Erro ao ativar participação ${participacao.id}:`,
              error
            );
            return { success: false, id: participacao.id, error };
          }
        })
      );

      // Verifica os resultados
      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      if (errorCount === 0) {
        showToast(
          "success",
          "Sucesso",
          `${successCount} participações ativadas com sucesso!`
        );
      } else if (successCount === 0) {
        showToast(
          "error",
          "Erro",
          "Falha ao ativar as participações selecionadas"
        );
      } else {
        showToast(
          "warn",
          "Parcial",
          `${successCount} participações ativadas, ${errorCount} falhas`
        );
      }

      // Atualiza os dados
      await getParticipacoes();
      setSelectedParticipacoes([]);
    } catch (error) {
      console.error("Erro ao ativar participações:", error);
      showToast(
        "error",
        "Erro",
        "Ocorreu um erro ao tentar ativar as participações"
      );
    } finally {
      setLoadingAtivacao(false);
    }
  };
  const [loadingAtivacaoVinculo, setLoadingAtivacaoVinculo] = useState(false);
  // Função para ativar os vínculos das participações selecionadas
  const handleAtivarVinculos = async () => {
    if (selectedParticipacoes.length === 0) {
      showToast(
        "warn",
        "Aviso",
        "Selecione pelo menos uma participação para ativar o vínculo"
      );
      return;
    }

    try {
      setLoadingAtivacaoVinculo(true);

      // Filtra participações que têm vínculo
      const participacoesComVinculo = selectedParticipacoes.filter(
        (p) => p.VinculoSolicitacaoBolsa?.length > 0
      );

      if (participacoesComVinculo.length === 0) {
        showToast(
          "warn",
          "Aviso",
          "Nenhuma das participações selecionadas possui vínculo para ativar"
        );
        return;
      }

      // Executa todas as requisições em paralelo
      const results = await Promise.all(
        participacoesComVinculo.map(async (participacao) => {
          try {
            const vinculoId = participacao.VinculoSolicitacaoBolsa[0]?.id;
            if (!vinculoId) {
              return {
                success: false,
                id: participacao.id,
                error: "ID do vínculo não encontrado",
              };
            }

            const resultado = await ativarVinculo(tenant, vinculoId);
            return { success: true, id: participacao.id };
          } catch (error) {
            console.error(
              `Erro ao ativar vínculo da participação ${participacao.id}:`,
              error
            );
            return { success: false, id: participacao.id, error };
          }
        })
      );

      // Verifica os resultados
      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      if (errorCount === 0) {
        showToast(
          "success",
          "Sucesso",
          `${successCount} vínculos ativados com sucesso!`
        );
      } else if (successCount === 0) {
        showToast("error", "Erro", "Falha ao ativar os vínculos selecionados");
      } else {
        showToast(
          "warn",
          "Parcial",
          `${successCount} vínculos ativados, ${errorCount} falhas`
        );
      }

      // Atualiza os dados
      await getParticipacoes();
      setSelectedParticipacoes([]);
    } catch (error) {
      console.error("Erro ao ativar vínculos:", error);
      showToast(
        "error",
        "Erro",
        "Ocorreu um erro ao tentar ativar os vínculos"
      );
    } finally {
      setLoadingAtivacaoVinculo(false);
    }
  };
  const [fontesPagadorasOptions, setFontesPagadorasOptions] = useState([]);

  const getParticipacoes = async () => {
    const response = await getParticipacoesByTenant(tenant, "aluno", ano);
    console.log(response);
    // Processa os dados recebidos
    const comColunasVirtuais = response.map((p) => {
      const plano = p.planoDeTrabalho;
      const notaTotal = plano
        ? (
            (plano.notaAluno || 0) +
            (plano.notaOrientador || 0) +
            (plano.notaPlano || 0) +
            (plano.notaProjeto || 0)
          ).toFixed(4)
        : null;

      const vinculo = p.VinculoSolicitacaoBolsa?.[0];

      return {
        ...p,
        notaTotal: notaTotal ? parseFloat(notaTotal) : null,
        orientadores:
          p.inscricao.participacoes
            ?.map((part) => part.user?.nome)
            .filter(Boolean)
            .join(", ") || "N/A",
        // Colunas virtuais para filtros
        statusVinculo: vinculo?.status || "Voluntária",
        fontePagadora:
          vinculo?.solicitacaoBolsa?.bolsa?.cota?.instituicaoPagadora ||
          "Voluntária",
      };
    });

    /**
     * Prepara as opções para os filtros do DataTable
     */
    const prepareFilterOptions = (data) => {
      // Edital
      const editaisUnicos = [
        ...new Set(data.map((p) => p.inscricao?.edital?.titulo)),
      ].filter(Boolean);
      setEditaisOptions(
        editaisUnicos.map((edital) => ({ label: edital, value: edital }))
      );
      setClassificacaoStatusOptions(statusOptions.classificacao);

      setParticipacaoStatusOptions(statusOptions.participacao);

      setSolicitacaoStatusOptions(statusOptions.solicitacao);

      // Opções para status de vínculo
      const vinculoStatusUnicos = [
        ...new Set(
          data.flatMap((p) =>
            p.VinculoSolicitacaoBolsa?.length > 0
              ? [p.VinculoSolicitacaoBolsa[0]?.status]
              : ["Voluntária"]
          )
        ),
      ].filter(Boolean);

      setVinculoStatusOptions(
        vinculoStatusUnicos.map((status) => ({
          label: status,
          value: status,
        }))
      );

      // Opções para fonte pagadora
      const fontesPagadorasUnicas = [
        ...new Set(
          data.flatMap((p) =>
            p.VinculoSolicitacaoBolsa?.length > 0
              ? [
                  p.VinculoSolicitacaoBolsa[0]?.solicitacaoBolsa?.bolsa?.cota
                    ?.instituicaoPagadora,
                ]
              : ["Voluntária"]
          )
        ),
      ].filter(Boolean);

      setFontesPagadorasOptions(
        fontesPagadorasUnicas.map((fonte) => ({
          label: fonte,
          value: fonte,
        }))
      );
    };

    setParticipacoes(comColunasVirtuais);
    console.log(comColunasVirtuais);
    // Prepara opções para filtros
    prepareFilterOptions(comColunasVirtuais);
  };
  useEffect(() => {
    const fetchParticipacoes = async () => {
      try {
        setLoading(true);
        await getParticipacoes();
      } catch (error) {
        console.error("Erro ao buscar participações:", error);
        showToast("error", "Erro", "Falha ao carregar dados das participações");
      } finally {
        setLoading(false);
      }
    };

    const fetchDocumentoTemplates = async () => {
      try {
        const templates = await getDocumentoTemplates(tenant);
        setDocumentoTemplates(templates);
      } catch (error) {
        console.error("Erro ao buscar templates de documento:", error);
        showToast(
          "warn",
          "Aviso",
          "Não foi possível carregar os templates de documento"
        );
      }
    };

    fetchParticipacoes();
    fetchDocumentoTemplates();
  }, [tenant, ano]);
  // ==============================================
  // NOVAS FUNÇÕES PARA DOCUMENTOS
  // ==============================================

  const handleCriarRegistrosDocumento = async () => {
    if (selectedParticipacoes.length === 0) {
      showToast("warn", "Aviso", "Selecione pelo menos uma participação");
      return;
    }

    if (!selectedDocumentoTemplate) {
      showToast("warn", "Aviso", "Selecione um template de documento");
      return;
    }

    try {
      setLoadingDocumentos(true);

      const participacaoIds = selectedParticipacoes.map((p) => p.id);

      const resultado = await criarRegistrosDocumento(
        tenant,
        selectedDocumentoTemplate.id,
        participacaoIds
      );

      showToast(
        "success",
        "Sucesso",
        resultado.message || "Registros de documento criados com sucesso!"
      );

      // Limpar seleções
      setSelectedParticipacoes([]);
      setSelectedDocumentoTemplate(null);
      setShowDocumentoDialog(false);
    } catch (error) {
      console.error("Erro ao criar registros de documento:", error);
      showToast(
        "error",
        "Erro",
        error.response?.data?.message || "Falha ao criar registros de documento"
      );
    } finally {
      setLoadingDocumentos(false);
    }
  };

  const openDocumentoDialog = () => {
    if (selectedParticipacoes.length === 0) {
      showToast("warn", "Aviso", "Selecione pelo menos uma participação");
      return;
    }
    setShowDocumentoDialog(true);
  };

  // ==============================================
  // MANIPULAÇÃO DE FILTROS
  // ==============================================

  /**
   * Limpa todos os filtros aplicados
   */
  const clearFilters = () => {
    setFilters(getInitialFilters());
    setGlobalFilterValue("");
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // ==============================================
  // UTILITÁRIOS
  // ==============================================

  const showToast = (severity, summary, detail) => {
    toast.current.show({ severity, summary, detail, life: 3000 });
  };

  // ==============================================
  // RENDERIZAÇÃO DO HEADER
  // ==============================================

  const renderHeader = () => {
    return (
      <div className="flex justify-content-between align-items-center">
        <Button
          icon="pi pi-filter-slash"
          label="Limpar Filtros"
          onClick={clearFilters}
          className="p-button-outlined p-button-secondary"
        />

        {selectedParticipacoes.length > 0 && (
          <div className="flex gap-2">
            <Button
              icon="pi pi-file"
              label="Criar Documentos"
              onClick={openDocumentoDialog}
              className="p-button-info"
              tooltip="Criar registros de documento para as participações selecionadas"
              tooltipOptions={{ position: "bottom" }}
            />
            {false && (
              <>
                <Button
                  icon="pi pi-check-circle"
                  label="Ativar"
                  onClick={handleAtivarParticipacoes}
                  loading={loadingAtivacao}
                  className="p-button-success"
                />
                <Button
                  icon="pi pi-link"
                  label="Ativar Vínculo"
                  onClick={handleAtivarVinculos}
                  loading={loadingAtivacaoVinculo}
                  className="p-button-help"
                  tooltip="Ativar vínculo de bolsa das participações selecionadas"
                  tooltipOptions={{ position: "bottom" }}
                />
              </>
            )}
          </div>
        )}

        <IconField iconPosition="left" className="ml-2">
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Buscar..."
          />
        </IconField>
      </div>
    );
  };

  // ==============================================
  // DIALOG PARA CRIAR DOCUMENTOS
  // ==============================================

  const renderDocumentoDialog = () => {
    return (
      <Dialog
        header="Criar Registros de Documento"
        visible={showDocumentoDialog}
        style={{ width: "50vw" }}
        onHide={() => setShowDocumentoDialog(false)}
        footer={
          <div>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              onClick={() => setShowDocumentoDialog(false)}
              className="p-button-text"
            />
            <Button
              label="Criar Documentos"
              icon="pi pi-check"
              onClick={handleCriarRegistrosDocumento}
              loading={loadingDocumentos}
              disabled={!selectedDocumentoTemplate}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="documentoTemplate">Template de Documento</label>
            <Dropdown
              id="documentoTemplate"
              value={selectedDocumentoTemplate}
              options={documentoTemplates}
              onChange={(e) => setSelectedDocumentoTemplate(e.value)}
              optionLabel="titulo"
              placeholder="Selecione um template"
              filter
              filterBy="titulo"
              showClear
              className="w-full"
            />
          </div>

          <div className="field">
            <label>Participações Selecionadas</label>
            <div className="p-2 border-1 surface-border border-round">
              <ul className="m-0 p-0 list-none">
                {selectedParticipacoes.map((participacao) => (
                  <li key={participacao.id} className="p-1">
                    {participacao.user?.nome} -{" "}
                    {participacao.planoDeTrabalho?.titulo}
                  </li>
                ))}
              </ul>
              <small className="text-color-secondary">
                Total: {selectedParticipacoes.length} participação(ões)
              </small>
            </div>
          </div>

          {selectedDocumentoTemplate && (
            <div className="field">
              <label>Informações do Template</label>
              <div className="p-2 border-1 surface-border border-round">
                <p>
                  <strong>Tipo:</strong>{" "}
                  {selectedDocumentoTemplate.tipoDocumento}
                </p>
                <p>
                  <strong>Exige Assinatura:</strong>{" "}
                  {selectedDocumentoTemplate.exigirAssinaturaOrientador
                    ? "Sim"
                    : "Não"}
                </p>
                <p>
                  <strong>Exige Autenticação:</strong>{" "}
                  {selectedDocumentoTemplate.exigirAutenticacao ? "Sim" : "Não"}
                </p>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    );
  };

  const header = renderHeader();

  // ==============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ==============================================
  const [displayJustificativaDialog, setDisplayJustificativaDialog] =
    useState(false);
  const [justificativaAtual, setJustificativaAtual] = useState("");
  const showJustificativaDialog = (justificativa) => {
    setJustificativaAtual(justificativa);
    setDisplayJustificativaDialog(true);
  };
  return (
    <div className={styles.resultado}>
      <Toast ref={toast} />

      <Card>
        <h5 className="pl-2 pr-2 pt-2">Resultado Final por Aluno</h5>
        {loading ? (
          <div className="p-2">
            <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
          </div>
        ) : (
          <DataTable
            value={participacoes}
            scrollable
            stripedRows
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            emptyMessage="Nenhum dado disponível"
            filters={filters}
            globalFilterFields={["user.nome", "inscricao.proponente.nome"]}
            header={header}
            filterDisplay="row"
            onRowClick={(e) => {
              if (!e.originalEvent.target.closest(".p-checkbox")) {
                setSelectedRowData(e.data);
                setIsModalOpen(true);
              }
            }}
            rowClassName={styles.clickableRow}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
            paginatorLeft={paginatorLeft}
            selection={selectedParticipacoes}
            onSelectionChange={onSelectionChange}
            dataKey="id"
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column
              field="inscricao.edital.titulo"
              header="Edital"
              sortable
              filter
              filterField="inscricao.edital.titulo"
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, editaisOptions)
              }
              showFilterMenu={false}
            />
            <Column
              field="planoDeTrabalho.titulo"
              header="Plano de Trabalho"
              showFilterMenu={false}
              sortable
              style={{ width: "280px", maxWidth: "280px" }}
              bodyStyle={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
            <Column
              header="Orientador"
              field="orientadores"
              filter
              sortable
              filterPlaceholder="Buscar por nome"
              style={{ width: "280px", maxWidth: "280px" }}
              bodyStyle={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />

            <Column
              field="user.nome"
              header="Aluno"
              filter
              filterPlaceholder="Buscar por nome"
              sortable
              style={{ width: "280px", maxWidth: "280px" }}
              bodyStyle={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
            <Column
              field="planoDeTrabalho.statusClassificacao"
              header="Status Plano"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  classificacaoStatusOptions
                )
              }
              showFilterMenu={false}
              filterField="planoDeTrabalho.statusClassificacao"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.planoDeTrabalho?.statusClassificacao,
                  rowData.planoDeTrabalho?.justificativa,
                  {
                    onShowJustificativa: showJustificativaDialog,
                  }
                )
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="statusParticipacao"
              header="Status Aluno"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  participacaoStatusOptions
                )
              }
              showFilterMenu={false}
              filterField="statusParticipacao"
              body={(rowData) =>
                renderStatusTagWithJustificativa(
                  rowData.statusParticipacao,
                  rowData.justificativa,
                  {
                    onShowJustificativa: showJustificativaDialog,
                  }
                )
              }
              style={{ width: "12rem" }}
            />
            <Column
              field="statusVinculo"
              header="Status vinculação de bolsa"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(options, vinculoStatusOptions)
              }
              showFilterMenu={false}
              body={(rowData) => {
                const vinculo = rowData.VinculoSolicitacaoBolsa?.[0];
                return vinculo
                  ? renderStatusTagWithJustificativa(
                      vinculo.status,
                      vinculo.motivoRecusa,
                      { onShowJustificativa: showJustificativaDialog }
                    )
                  : "Voluntária";
              }}
              style={{ width: "12rem" }}
            />

            <Column
              field="fontePagadora"
              header="Fonte pagadora"
              sortable
              filter
              filterElement={(options) =>
                statusClassificacaoFilterTemplate(
                  options,
                  fontesPagadorasOptions
                )
              }
              showFilterMenu={false}
              body={(rowData) => {
                const vinculo = rowData.VinculoSolicitacaoBolsa?.[0];
                return (
                  vinculo?.solicitacaoBolsa?.bolsa?.cota?.instituicaoPagadora ||
                  "Voluntária"
                );
              }}
              style={{ width: "12rem" }}
            />
            <Column
              field="notaTotal"
              header="Nota Total"
              showFilterMenu={false}
              sortable
              filter
              filterField="notaTotal"
              filterElement={notaRowFilterTemplate}
              filterMatchMode="intervalo"
              dataType="numeric"
              body={(rowData) =>
                rowData.notaTotal !== null
                  ? rowData.notaTotal?.toFixed(4)
                  : "N/A"
              }
              style={{ textAlign: "center", width: "8rem" }}
            />
          </DataTable>
        )}
      </Card>
      <Dialog
        header="Justificativas"
        visible={showJustificativas}
        style={{ width: "50vw" }}
        onHide={() => setShowJustificativas(false)}
      >
        <div style={{ whiteSpace: "pre-line", marginBottom: "12px" }}>
          {justificativasAtuais}
        </div>
      </Dialog>
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          getParticipacoes();
        }}
        itemName="Detalhes"
      >
        {selectedRowData && (
          <ParticipacaoGestorController
            tenant={params.tenant}
            participacaoId={selectedRowData?.id}
            onClose={() => setIsModalOpen(false)}
            onSuccess={
              () => {}
              //getParticipacoes
            }
          />
        )}
      </Modal>
      <Dialog
        header="Justificativa"
        visible={displayJustificativaDialog}
        style={{ width: "50vw" }}
        onHide={() => setDisplayJustificativaDialog(false)}
        footer={
          <Button
            label="Fechar"
            icon="pi pi-times"
            onClick={() => setDisplayJustificativaDialog(false)}
            className="p-button-text"
          />
        }
      >
        <div className="p-fluid">{justificativaAtual}</div>
      </Dialog>
      {renderDocumentoDialog()}
    </div>
  );
};

export default Resultado;

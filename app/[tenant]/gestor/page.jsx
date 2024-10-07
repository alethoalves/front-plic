"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import UnderConstruction from "@/components/UnderConstruction";
import {
  RiBarChart2Fill,
  RiBatteryLowLine,
  RiCalendarLine,
  RiEye2Line,
  RiEyeLine,
  RiFileExcelLine,
  RiFilter2Fill,
  RiLineChartLine,
  RiListCheck2,
  RiMapPinLine,
} from "@remixicon/react";
import Select2 from "@/components/Select2";

import Button from "@/components/Button";
import { useState, useEffect } from "react";
import ExcelJS from "exceljs"; // Para exportação do Excel
import { saveAs } from "file-saver"; // Para salvar o arquivo Excel
import Inscricoes from "@/components/dashboards/Inscricoes";
import Participacoes from "@/components/dashboards/Participacoes";
import Atividades from "@/components/dashboards/Atividades";
import Eventos from "@/components/dashboards/Eventos";
import { relatorioInscricoes } from "@/app/api/client/relatorios";

const Page = ({ params }) => {
  const [alunos, setAlunos] = useState([]);

  // Função para buscar dados dos alunos da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const participacoes = await relatorioInscricoes(params.tenant);
        setAlunos(participacoes.alunos || []);
      } catch (error) {
        console.error("Erro ao obter os dados:", error);
      }
    };

    fetchData();
  }, [params.tenant]);

  // Função para exportar os dados para Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Relatório de Participações");

    // Definir as colunas do Excel
    worksheet.columns = [
      { header: "ID Inscrição", key: "inscricao_id", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Tipo", key: "tipo", width: 15 },
      { header: "Início", key: "inicio", width: 15 },
      { header: "Fim", key: "fim", width: 15 },
      { header: "Edital", key: "edital", width: 25 },
      { header: "Ano do Edital", key: "edital_ano", width: 15 },
      { header: "Aluno", key: "aluno", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "CPF", key: "cpf", width: 20 },
      { header: "Plano", key: "plano", width: 40 },
      { header: "Área", key: "area", width: 20 },
      { header: "Grande Área", key: "grandeArea", width: 25 },
      {
        header: "Atividades Concluídas",
        key: "total_atividades_concluidas",
        width: 20,
      },
      {
        header: "Atividades Pendentes",
        key: "total_atividades_pendentes",
        width: 20,
      },
      { header: "Inscrição em Eventos", key: "inscricao_eventos", width: 20 },
    ];

    // Adicionar as linhas com os dados dos alunos
    alunos.forEach((aluno) => {
      worksheet.addRow({
        inscricao_id: aluno.inscricao_id,
        status: aluno.status,
        tipo: aluno.tipo,
        inicio: aluno.inicio,
        fim: aluno.fim || "N/A",
        edital: aluno.edital,
        edital_ano: aluno.edital_ano,
        aluno: aluno.aluno,
        email: aluno.email || "N/A",
        cpf: aluno.cpf,
        plano: aluno.plano,
        area: aluno.area || "N/A",
        grandeArea: aluno.grandeArea || "N/A",
        total_atividades_concluidas: aluno.total_atividades_concluidas,
        total_atividades_pendentes: aluno.total_atividades_pendentes,
        inscricao_eventos: aluno.inscricao_eventos,
      });
    });

    // Adicionar uma tabela com os dados
    worksheet.addTable({
      name: "RelatorioParticipacoes",
      ref: "A1", // Referência onde começa a tabela (canto superior esquerdo)
      headerRow: true,
      columns: worksheet.columns.map((col) => ({ name: col.header })),
      rows: alunos.map((aluno) => [
        aluno.inscricao_id,
        aluno.status,
        aluno.tipo,
        aluno.inicio,
        aluno.fim || "N/A",
        aluno.edital,
        aluno.edital_ano,
        aluno.aluno,
        aluno.email || "N/A",
        aluno.cpf,
        aluno.plano,
        aluno.area || "N/A",
        aluno.grandeArea || "N/A",
        aluno.total_atividades_concluidas,
        aluno.total_atividades_pendentes,
        aluno.inscricao_eventos,
      ]),
    });

    // Gerar arquivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Salvar o arquivo
    saveAs(blob, "relatorio_participacoes_alunos.xlsx");
  };

  return (
    <main className={styles.main}>
      <div className={styles.download}>
        <Button
          onClick={exportToExcel} // Função para exportar os dados para Excel
          icon={RiFileExcelLine}
          className="btn-green"
          type="button"
        >
          Exportar Excel
        </Button>
      </div>

      {/* Seção de gráficos e dados */}
      <div className={`${styles.dashboard} ${styles.dashboardA}`}>
        <Inscricoes tenantSlug={params.tenant} />
      </div>
      <div className={`${styles.dashboard} ${styles.dashboardB}`}>
        <Participacoes tenantSlug={params.tenant} />
      </div>
      <div className={`${styles.dashboard} ${styles.dashboardC}`}>
        <Atividades tenantSlug={params.tenant} />
      </div>
      <div className={`${styles.dashboard} ${styles.dashboardD}`}>
        <Eventos tenantSlug={params.tenant} />
      </div>
    </main>
  );
};

export default Page;

"use client";
import styles from "./page.module.scss";
import { RiFileExcelLine } from "@remixicon/react";

import Button from "@/components/Button";
import ExcelJS from "exceljs"; // Para exportação do Excel
import { saveAs } from "file-saver"; // Para salvar o arquivo Excel
import Inscricoes from "@/components/dashboards/Inscricoes";
import Participacoes from "@/components/dashboards/Participacoes";
import Atividades from "@/components/dashboards/Atividades";
import Eventos from "@/components/dashboards/Eventos";
import { relatorioInscricoes } from "@/app/api/client/relatorios";
import { useState } from "react";
import Editais from "@/components/dashboards/Editais";
import UnderConstruction from "@/components/UnderConstruction";
import { Card } from "primereact/card";

const Page = ({ params }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedAno, setSelectedAno] = useState(null); // Ano selecionado

  // Função para exportar os dados para Excel
  const exportToExcel = async () => {
    setIsDownloading(true); // Inicia o processo de download e desativa o botão

    try {
      // Buscar dados dos alunos da API apenas quando o botão for clicado
      const participacoes = await relatorioInscricoes(params.tenant);
      const alunos = participacoes || [];

      if (alunos.length === 0) {
        console.error("Nenhuma participação foi encontrada.");
        setIsDownloading(false);
        return; // Não continuar se não houver dados
      }

      // Criar workbook e worksheet para o Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Relatório de Participações");

      // Definir as colunas do Excel
      const columns = [
        { header: "ID Inscrição", key: "inscricao_id", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Início", key: "inicio", width: 15 },
        { header: "Fim", key: "fim", width: 15 },
        { header: "Tipo", key: "tipo", width: 15 },
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
        { header: "Orientadores", key: "orientadores", width: 40 },
        { header: "Eventos", key: "eventos", width: 40 },
      ];

      // Definir as colunas para a worksheet
      worksheet.columns = columns;

      // Adicionar os dados dos alunos
      alunos.forEach((aluno) => {
        worksheet.addRow({
          inscricao_id: aluno.inscricao_id,
          status: aluno.status,
          inicio: aluno.inicio,
          fim: aluno.fim || "N/A",
          tipo: aluno.tipo,
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
          orientadores:
            aluno.orientadores.length > 0
              ? aluno.orientadores.join(", ")
              : "N/A",
          eventos: aluno.eventos.length > 0 ? aluno.eventos.join(", ") : "N/A",
        });
      });

      // Ativar os filtros na primeira linha
      worksheet.autoFilter = {
        from: "A1", // Início dos filtros na primeira linha e coluna A
        to: `R1`, // Final dos filtros na linha 1 e última coluna R
      };

      // Gerar o arquivo Excel
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Salvar o arquivo
      saveAs(blob, "relatorio_participacoes_alunos.xlsx");
    } catch (error) {
      console.error("Erro ao obter os dados ou gerar o Excel:", error);
    } finally {
      setIsDownloading(false); // Finaliza o processo de download e reativa o botão
    }
  };

  return (
    <>
      <Card className="p-3 w-100">
        <UnderConstruction />
      </Card>
      {false && (
        <main className={styles.main}>
          {false && (
            <>
              <div className={`${styles.dashboard} ${styles.dashboardA}`}>
                <Editais />
              </div>
              <div className={`${styles.dashboard} ${styles.dashboardB}`}>
                <Participacoes tenantSlug={params.tenant} />
              </div>
            </>
          )}
          {/* Seção de gráficos e dados */}
          {false && (
            <>
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
            </>
          )}
        </main>
      )}
    </>
  );
};

export default Page;

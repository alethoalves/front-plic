"use client";

//HOOKS
import { useState, useEffect } from "react";

//ESTILOS E ÍCONES
import styles from "@/components/dashboards/Inscricoes.module.scss";
import {
  RiBarChart2Fill,
  RiDashboardLine,
  RiExternalLinkLine,
  RiFileExcelLine,
  RiFilter2Fill,
} from "@remixicon/react";

//COMPONENTES
import Select2 from "@/components/Select2";

//FUNÇÕES
import { inscricoesDashboard } from "@/app/api/client/inscricao";

// Importações necessárias para o gráfico
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Button from "../Button";

// Registrando os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false, // Permite que o gráfico tenha rolagem horizontal
  plugins: {
    legend: {
      position: "top",
      labels: {
        boxWidth: 10, // Reduz o tamanho do quadrado da legenda
        padding: 4, // Adiciona espaço entre as legendas e o gráfico
      },
    },
    title: {
      display: false,
      text: "Atividades Entregues e Pendentes",
    },
  },
  scales: {
    x: {
      ticks: {
        autoSkip: true, // Isso garante que todas as labels no eixo X sejam mostradas
      },
    },
  },
};

const Inscricoes = ({ tenantSlug }) => {
  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inscricoes, setInscricoes] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Novos estados para anos, títulos e dados do gráfico
  const [anosEdital, setAnosEdital] = useState([]);
  const [titulosEdital, setTitulosEdital] = useState([]);
  const [editalAno, setEditalAno] = useState("");
  const [editalTitulo, setEditalTitulo] = useState("");
  const [chartData, setChartData] = useState({
    labels: [], // Labels para o eixo X (nomes dos editais)
    datasets: [], // Dados dos gráficos
  });

  // Função para buscar as inscrições da API
  const fetchInscricoes = async (
    tenantSlug,
    statusInscricao,
    editalAno,
    editalTitulo
  ) => {
    setLoading(true);
    try {
      const inscricoes = await inscricoesDashboard(tenantSlug, {
        statusInscricao,
        editalAno,
        editalTitulo,
      });
      setAnosEdital(inscricoes.info.anoEditalUnico || []);
      setTitulosEdital(inscricoes.info.tituloEditalUnico || []);
      setInscricoes(inscricoes);

      // Atualizando os dados do gráfico com base nos totais por edital
      const totaisPorEdital = inscricoes.info.totaisPorEdital;

      // Filtrar os datasets que não possuem todos os valores iguais a zero
      const orientadoresData = Object.values(totaisPorEdital).map(
        (edital) => edital.totalOrientadoresAtivos
      );
      const coorientadoresData = Object.values(totaisPorEdital).map(
        (edital) => edital.totalCoorientadoresAtivos
      );
      const planosDeTrabalhoData = Object.values(totaisPorEdital).map(
        (edital) => edital.totalPlanosDeTrabalho
      );
      const alunosData = Object.values(totaisPorEdital).map(
        (edital) => edital.totalAlunosAtivos
      );

      const datasets = [];

      if (orientadoresData.some((val) => val > 0)) {
        datasets.push({
          label: "Orientadores",
          data: orientadoresData,
          backgroundColor: "rgba(11, 176, 123, 1)", // Verde
        });
      }

      if (coorientadoresData.some((val) => val > 0)) {
        datasets.push({
          label: "Coorientadores",
          data: coorientadoresData,
          backgroundColor: "rgba(11, 176, 123, 0.5)", // Verde Claro
        });
      }

      if (planosDeTrabalhoData.some((val) => val > 0)) {
        datasets.push({
          label: "Planos de Trabalho",
          data: planosDeTrabalhoData,
          backgroundColor: "rgb(217, 176, 67)", // Laranja
        });
      }

      if (alunosData.some((val) => val > 0)) {
        datasets.push({
          label: "Alunos",
          data: alunosData,
          backgroundColor: "rgb(240, 84, 84)", // Vermelho
        });
      }

      setChartData({
        labels: Object.keys(totaisPorEdital), // Usando os títulos dos editais como labels
        datasets,
      });
    } catch (error) {
      setError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInscricoes(tenantSlug);
  }, [tenantSlug]);

  // Chamando a API sempre que os filtros mudarem
  useEffect(() => {
    fetchInscricoes(tenantSlug, null, editalAno || null, editalTitulo || null); // Passa valores nulos se os filtros estiverem vazios
  }, [editalAno, editalTitulo]);

  // Função chamada quando os filtros são alterados
  const handleFilterChange = (filtro, valor) => {
    if (filtro === "ano") setEditalAno(valor || ""); // Ajusta para vazio se for removido
    if (filtro === "titulo") setEditalTitulo(valor || ""); // Ajusta para vazio se for removido
  };

  return (
    <div className={`${styles.dashboard} `}>
      <div className={styles.head}>
        <div className={styles.left}>
          <div className={styles.icon}>
            <RiDashboardLine />
          </div>
          <div className={styles.title}>
            <h5>Dados Gerais</h5>
          </div>
        </div>
        <div className={styles.actions}>
          <div
            className={`${styles.btn} ${showFilters ? styles.selected : ""}`}
            onClick={() => {
              setShowFilters(!showFilters);
            }}
          >
            <RiFilter2Fill />
          </div>
          <div
            className={`${styles.btn} ${showCharts ? styles.selected : ""}`}
            onClick={() => {
              setShowCharts(!showCharts);
            }}
          >
            <RiBarChart2Fill />
          </div>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filters}>
          <div className={styles.filter}>
            <Select2
              label="Selecione um ano"
              options={anosEdital.map((ano) => ({
                label: ano.toString(),
                value: ano,
              }))}
              extendedOpt={false}
              onChange={(value) => handleFilterChange("ano", value)}
            />
          </div>

          <div className={styles.filter}>
            <Select2
              label="Selecione um edital"
              options={titulosEdital.map((titulo) => ({
                label: titulo,
                value: titulo,
              }))}
              onChange={(value) => handleFilterChange("titulo", value)}
            />
          </div>
        </div>
      )}

      {inscricoes && (
        <div className={styles.content}>
          <div className={styles.totais}>
            <div className={`${styles.total} ${styles.light}`}>
              <p>{inscricoes?.info?.totalGeral?.totalOrientadoresAtivos}</p>
              <h6>Orientadores</h6>
            </div>
            {inscricoes?.info?.totalGeral?.totalCoorientadoresAtivos > 0 && (
              <div className={`${styles.total} ${styles.light}`}>
                <p>{inscricoes?.info?.totalGeral?.totalCoorientadoresAtivos}</p>
                <h6>Coorientadores</h6>
              </div>
            )}
            <div className={`${styles.total} ${styles.light}`}>
              <p>{inscricoes?.info?.totalGeral?.totalPlanosDeTrabalho}</p>
              <h6>Planos de Trabalho</h6>
            </div>
            <div className={`${styles.total} ${styles.light}`}>
              <p>{inscricoes?.info?.totalGeral?.totalAlunosAtivos}</p>
              <h6>Alunos</h6>
            </div>
          </div>

          {showCharts && (
            <>
              <div className={styles.barContainer}>
                <Bar data={chartData} options={options} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Inscricoes;

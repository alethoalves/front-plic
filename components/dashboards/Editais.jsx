"use client";

//HOOKS
import { useState, useEffect } from "react";

//ESTILOS E ÍCONES
import styles from "@/components/dashboards/Editais.module.scss";
import {
  RiBarChart2Fill,
  RiDashboardLine,
  RiExternalLinkLine,
  RiFile2Line,
  RiFileExcelLine,
  RiFilter2Fill,
  RiGraduationCapLine,
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
import { useParams } from "next/navigation";

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

const Editais = () => {
  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inscricoes, setInscricoes] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { tenant, ano } = useParams();
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
    tenant,
    statusInscricao,
    editalAno,
    editalTitulo
  ) => {
    setLoading(true);
    try {
      const inscricoes = await inscricoesDashboard(tenant, {
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
    fetchInscricoes(tenant);
  }, [tenant]);

  // Chamando a API sempre que os filtros mudarem
  useEffect(() => {
    fetchInscricoes(tenant, null, editalAno || null, editalTitulo || null); // Passa valores nulos se os filtros estiverem vazios
  }, [editalAno, editalTitulo, tenant]); //ALTEREI AQUI

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
            <RiFile2Line />
          </div>
          <div className={styles.title}>
            <h5>Editais</h5>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.editais}>
          <div className={styles.card}>
            <div className={styles.header}>Edital PIBIC</div>
            <div className={styles.content}>
              <ul>
                <li>
                  <div>
                    <h6>Projetos</h6>
                    <p>
                      Inscritos <strong>233</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Aguardando distribuição <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Distribuído <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Em avaliação <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Avaliado <strong>33</strong>
                    </p>
                    <hr></hr>
                    <p>
                      Selecionados <strong>233</strong>
                    </p>

                    <p>
                      Não selecionados <strong>0</strong>
                    </p>
                  </div>
                </li>
                <li>
                  <div>
                    <h6>Planos de Trabalho</h6>
                    <p>
                      Inscritos <strong>233</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Aguardando distribuição <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Distribuído <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Em avaliação <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Avaliado <strong>33</strong>
                    </p>
                    <hr></hr>
                    <p>
                      Selecionados <strong>233</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Pendente de documentação <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Em andamento <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Finalizados <strong>33</strong>
                    </p>
                    <p>
                      Não selecionados <strong>0</strong>
                    </p>
                  </div>
                </li>
                <li>
                  <div>
                    <h6>Participações</h6>
                    <p>
                      Orientadores <strong>233</strong>
                    </p>

                    <p style={{ textIndent: "15px" }}>
                      Selecionados <strong>233</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Não selecionados <strong>0</strong>
                    </p>
                    <hr></hr>
                    <p>
                      Alunos <strong>233</strong>
                    </p>

                    <p style={{ textIndent: "15px" }}>
                      Selecionados <strong>233</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Não selecionados <strong>0</strong>
                    </p>
                  </div>
                </li>

                <li>
                  <div>
                    <h6>Bolsas</h6>
                    <p>
                      Solicitadas <strong>233</strong>
                    </p>
                    <p style={{ textIndent: "15px" }}>
                      Concedidas <strong>233</strong>
                    </p>
                    <p style={{ textIndent: "30px" }}>
                      FAPDF <strong>233</strong>
                    </p>

                    <p style={{ textIndent: "30px" }}>
                      CNPq <strong>33</strong>
                    </p>

                    <p style={{ textIndent: "30px" }}>
                      UnB <strong>33</strong>
                    </p>

                    <p style={{ textIndent: "15px" }}>
                      Demanda não atendida <strong>233</strong>
                    </p>
                    <p style={{ textIndent: "30px" }}>
                      por critério editalício <strong>33</strong>
                    </p>
                    <p style={{ textIndent: "30px" }}>
                      por falta de financiamento <strong>33</strong>
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className={styles.footer}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editais;

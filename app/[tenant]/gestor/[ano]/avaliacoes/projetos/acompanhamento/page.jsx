"use client";
// HOOKS
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
import { RiEditLine } from "@remixicon/react";
// COMPONENTES
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import FormNewInscricao from "@/components/Formularios/FormNewInscricao";
// PRIMEREACT
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";

// FUNÇÕES
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";
import calcularMedia from "@/lib/calcularMedia";
import { Toast } from "primereact/toast";
import AvaliacoesProjetos from "@/components/avaliacoes/AvaliacoesProjetos";
import { getInscricaoProjetoByTenant } from "@/app/api/client/projeto";

const Page = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [itens, setItens] = useState([]);
  const [chartData, setChartData] = useState({});
  const [comboChartData, setComboChartData] = useState({});
  const [statusChartData, setStatusChartData] = useState({});
  const [projetos, setProjetos] = useState([]);
  const [inscricoesProjetos, setInscricoesProjetos] = useState([]);
  const toast = useRef();
  const processarInscricoes = async (tenant, setInscricoesProjetos) => {
    const inscricoesProjetos = await getInscricaoProjetoByTenant(
      tenant,
      "enviada"
    );

    const inscricoesComColunasVirtuais = inscricoesProjetos.map((inscricao) => {
      const quantidadeFichas = inscricao.FichaAvaliacao?.length || 0;
      const notaMedia =
        quantidadeFichas > 0
          ? (
              inscricao.FichaAvaliacao.reduce(
                (sum, ficha) => sum + (ficha.notaTotal || 0),
                0
              ) / quantidadeFichas
            ).toFixed(2)
          : "N/A";

      const avaliadores = inscricao.InscricaoProjetoAvaliador.map(
        (avaliador) => avaliador.avaliador.nome
      ).join(", ");

      const quantidadeAvaliadores =
        inscricao.InscricaoProjetoAvaliador?.length || 0;

      const notas = inscricao.FichaAvaliacao.map(
        (ficha) => ficha.notaTotal || 0
      );
      const diferencaNotas =
        notas.length > 0 ? Math.max(...notas) - Math.min(...notas) : "N/A";

      return {
        ...inscricao,
        quantidadeFichas,
        notaMedia,
        avaliadores,
        quantidadeAvaliadores,
        diferencaNotas,
      };
    });

    setInscricoesProjetos(inscricoesComColunasVirtuais || []);
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await processarInscricoes(params.tenant, setInscricoesProjetos);
        // Restante do seu código de fetch inicial...
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.tenant]);

  const prepareStatusChartData = useCallback(() => {
    if (itens.length === 0) return;

    // Contar os status dos projetos
    const statusCount = {
      AGUARDANDO_AVALIACAO: 0,
      EM_AVALIACAO: 0,
      AVALIADA: 0,
    };

    itens.forEach((item) => {
      const status =
        item.inscricaoProjeto?.statusAvaliacao ||
        item.statusAvaliacao ||
        "AGUARDANDO_AVALIACAO";

      if (statusCount.hasOwnProperty(status)) {
        statusCount[status]++;
      } else {
        // Caso haja um status não previsto
        statusCount["AGUARDANDO_AVALIACAO"]++;
      }
    });

    const backgroundColors = [
      "#FF6384", // AGUARDANDO_AVALIACAO - Vermelho
      "#36A2EB", // EM_AVALIACAO - Azul
      "#4BC0C0", // AVALIADA - Verde
    ];

    setStatusChartData({
      labels: ["Aguardando Avaliação", "Em Avaliação", "Avaliado"],
      datasets: [
        {
          data: Object.values(statusCount),
          backgroundColor: backgroundColors,
          hoverBackgroundColor: backgroundColors.map((color) => `${color}CC`),
        },
      ],
    });
  }, [itens]);

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Estados para o gráfico dinâmico
  const [chartStats, setChartStats] = useState({
    min: 0,
    max: 0,
    media: 0,
    desvioPadrao: 0,
    skewness: 0,
    outliers: 0,
  });
  const prepareComboChartData = useCallback(() => {
    if (itens.length === 0) return;

    // Definir intervalos (bins) para as notas totais (0-100 ou outro range adequado)
    const maxNota = Math.max(...itens.map((item) => item.notaTotal), 10);
    const binSize = maxNota <= 20 ? 2 : 5;
    const bins = [];
    for (let i = 0; i <= maxNota + binSize; i += binSize) {
      // Adiciona +binSize para incluir o último valor
      bins.push(i);
    }

    const binLabels = bins
      .slice(0, -1)
      .map((bin, i) => `${bin.toFixed(1)}-${bins[i + 1].toFixed(1)}`);

    // Contar quantos planos estão em cada intervalo de nota TOTAL
    const histogram = new Array(bins.length - 1).fill(0);
    itens.forEach((item) => {
      const notaTotal = item.notaTotal;
      for (let i = 0; i < bins.length - 1; i++) {
        if (notaTotal >= bins[i] && notaTotal < bins[i + 1]) {
          histogram[i]++;
          break;
        }
      }
      // Trata o caso do valor máximo
      if (notaTotal >= bins[bins.length - 1]) {
        histogram[histogram.length - 1]++;
      }
    });

    // Calcular estatísticas
    const notas = itens.map((item) => item.notaTotal);
    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
    const desvioPadrao = Math.sqrt(
      notas.reduce((sq, n) => sq + Math.pow(n - media, 2), 0) / notas.length
    );

    // Curva normal teórica (opcional)
    const normalCurve = bins.slice(0, -1).map((bin) => {
      const x = bin + binSize / 2;
      return (
        100 *
        binSize *
        (1 / (desvioPadrao * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((x - media) / desvioPadrao, 2))
      );
    });

    setComboChartData({
      labels: binLabels,
      datasets: [
        {
          label: "Distribuição Real",
          type: "bar",
          backgroundColor: "#42A5F5",
          data: histogram,
          yAxisID: "y",
        },
        {
          label: "Distribuição Normal Teórica",
          type: "line",
          borderColor: "#FF6384",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          data: normalCurve,
          yAxisID: "y1",
        },
        {
          label: "Média",
          type: "line",
          borderColor: "#00C853",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          data: new Array(bins.length - 1).fill(media),
          yAxisID: "y1",
        },
      ],
    });

    // Armazena as estatísticas para uso nos tooltips
    setChartStats({ media, desvioPadrao });
  }, [itens]);
  const comboChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
      title: {
        display: true,
        text: "Distribuição das Notas Totais dos Planos",
        font: { size: 16 },
      },
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.dataset.type === "bar") {
              label += `${context.raw} planos (${(
                (context.raw / itens.length) *
                100
              ).toFixed(1)}%)`;
            } else if (context.dataset.label === "Média") {
              label += `${context.raw.toFixed(2)}`;
            } else {
              label += `${context.raw.toFixed(2)} (teórica)`;
            }
            return label;
          },
          footer: (context) => {
            const stats = [
              `Média: ${chartStats.media.toFixed(2)}`,
              `Desvio Padrão: ${chartStats.desvioPadrao.toFixed(2)}`,
              `Total de Planos: ${itens.length}`,
            ];
            return stats;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Intervalos de Nota Total" },
      },
      y: {
        title: { display: true, text: "Quantidade de Planos" },
        beginAtZero: true,
      },
      y1: {
        position: "right",
        title: { display: true, text: "Densidade" },
        beginAtZero: true,
        grid: { drawOnChartArea: false },
      },
    },
  };
  useEffect(() => {
    prepareComboChartData();
    prepareStatusChartData(); // Adicione esta linha
  }, [itens, prepareComboChartData]);

  // Função para calcular a diferença entre notas máximas e mínimas
  const calcularDiferencaNotas = (fichas) => {
    if (!fichas || fichas.length === 0) return 0;
    const notas = fichas.map((f) => f.notaTotal);
    return Math.max(...notas) - Math.min(...notas);
  };

  // Função para calcular média das notas dos alunos
  const calcularMediaAlunos = (participacoes) => {
    const notas =
      participacoes
        ?.filter((p) => p.notaAluno !== null)
        ?.map((p) => p.notaAluno) || [];
    return notas.length > 0
      ? notas.reduce((a, b) => a + b, 0) / notas.length
      : 0;
  };
  const calcularMediaRA = (participacoes) => {
    const ras =
      participacoes
        ?.filter((p) => p.userTenant?.rendimentoAcademico !== null)
        ?.map((p) => p.userTenant?.rendimentoAcademico)
        ?.filter((ra) => ra !== undefined) || [];

    return ras.length > 0 ? ras.reduce((a, b) => a + b, 0) / ras.length : 0;
  };

  // ROTEAMENTO
  const router = useRouter();

  // Processar dados para o gráfico
  const processChartData = useCallback(() => {
    if (itens.length === 0) return;

    const editaisMap = itens.reduce((acc, item) => {
      const editalKey = `${item.inscricao?.edital?.titulo} - ${item.inscricao?.edital?.ano}`;

      if (!acc[editalKey]) {
        acc[editalKey] = {
          projetos: new Set(),
          planos: new Set(),
          orientadores: new Set(),
          alunos: new Set(),
          solicitacoesBolsa: 0,
        };
      }

      // Projetos únicos
      if (item.projetoId) {
        acc[editalKey].projetos.add(item.projetoId);
      }

      // Planos únicos
      acc[editalKey].planos.add(item.id);

      // Orientadores
      if (item.inscricao?.participacoes) {
        item.inscricao.participacoes.forEach((p) => {
          acc[editalKey].orientadores.add(p.user?.nome);
        });
      }

      // Alunos e solicitações de bolsa
      if (item.participacoes) {
        item.participacoes.forEach((p) => {
          acc[editalKey].alunos.add(p.user?.nome);
          if (p.solicitarBolsa) {
            acc[editalKey].solicitacoesBolsa += 1;
          }
        });
      }

      return acc;
    }, {});

    const labels = Object.keys(editaisMap);
    const datasets = [
      {
        label: "Projetos",
        backgroundColor: "#42A5F5",
        data: labels.map((edital) => editaisMap[edital].projetos.size),
      },
      {
        label: "Planos de Trabalho",
        backgroundColor: "#66BB6A",
        data: labels.map((edital) => editaisMap[edital].planos.size),
      },
      {
        label: "Orientadores",
        backgroundColor: "#FFA726",
        data: labels.map((edital) => editaisMap[edital].orientadores.size),
      },
      {
        label: "Alunos",
        backgroundColor: "#26C6DA",
        data: labels.map((edital) => editaisMap[edital].alunos.size),
      },
      {
        label: "Solicitações de Bolsa",
        backgroundColor: "#EC407A",
        data: labels.map((edital) => editaisMap[edital].solicitacoesBolsa),
      },
    ];

    setChartData({
      labels: labels,
      datasets: datasets,
    });
  }, [itens]);

  // BUSCA DE DADOS INICIAIS
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const itens = await getAllPlanoDeTrabalhosByTenant(
        params.tenant,
        params.ano || null
      );
      console.log(itens);
      const itensComCamposVirtuais = itens.map((item) => {
        const notaProjeto =
          calcularMedia(item.inscricaoProjeto?.FichaAvaliacao || []) || 0;
        const notaPlano = calcularMedia(item.FichaAvaliacao || []) || 0;
        const notaOrientador = item.notaOrientador || 0;
        const mediaAlunos = item.notaAluno || 0;
        const mediaRA = calcularMediaRA(item.participacoes) || 0;
        const notaTotal =
          notaProjeto + notaPlano + notaOrientador + mediaAlunos;

        return {
          ...item,
          qtdFichas:
            item.projeto?.InscricaoProjeto[0]?.FichaAvaliacao?.length || 0,
          mediaNotas: notaProjeto,
          avaliadores:
            item.projeto?.InscricaoProjeto[0]?.InscricaoProjetoAvaliador?.map(
              (a) => a.avaliador?.nome
            )
              .filter(Boolean)
              .join("; ") || "Nenhum avaliador",
          qtdFichasPlano: item.FichaAvaliacao?.length || 0,
          mediaNotasPlano: notaPlano,
          alunoParticipacoes:
            item.participacoes
              ?.map((p) => `${p.user?.nome} (${p.status})`)
              ?.join("; ") || "Nenhum aluno vinculado",
          qtdSolicitacoesBolsa:
            item.participacoes?.filter((p) => p.solicitarBolsa === true)
              .length || 0,
          notaProjeto: notaProjeto, // Convertendo para float com 2 casas decimais
          diferencaNotasProjeto: parseFloat(
            calcularDiferencaNotas(
              item.projeto?.InscricaoProjeto[0]?.FichaAvaliacao
            ).toFixed(4)
          ),
          notaPlano: parseFloat(notaPlano.toFixed(4)),
          notaOrientador: parseFloat(notaOrientador.toFixed(4)),
          mediaNotasAlunos: parseFloat(mediaAlunos.toFixed(4)),
          mediaRA: parseFloat(mediaRA.toFixed(4)),
          notaTotal: parseFloat(notaTotal.toFixed(4)),
        };
      });
      console.log(itensComCamposVirtuais);
      setItens(itensComCamposVirtuais || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [params.tenant]);
  // Substitua todas as chamadas diretas de toFixed() por:

  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, fetchInitialData]);

  useEffect(() => {
    processChartData();
  }, [itens, processChartData]);

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
  };

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>Nova Inscrição</h4>
      <p>Preencha os dados abaixo para iniciar o processo de inscrição.</p>
      <FormNewInscricao data={{ editais }} tenant={params.tenant} />
    </Modal>
  );

  return (
    <>
      {renderModalContent()}

      <main className={styles.main}>
        <Header className="mb-3" titulo="Acompanhar avaliação" />
        <Card className="mb-4 p-2">
          <h5 className="mb-2">Distribuição das Notas Totais</h5>
          {Object.keys(comboChartData).length > 0 ? (
            <div>
              <Chart
                type="bar"
                data={comboChartData}
                options={comboChartOptions}
                style={{ height: "400px" }}
              />
              <div className="flex justify-content-center gap-4 mt-3">
                <span className="font-bold">
                  Média: {chartStats.media.toFixed(2)}
                </span>
                <span className="font-bold">
                  Desvio Padrão: {chartStats.desvioPadrao.toFixed(2)}
                </span>
                <span className="font-bold">Total: {itens.length} planos</span>
              </div>
            </div>
          ) : (
            <p>Carregando gráfico...</p>
          )}
        </Card>
        <Card className="mb-4 p-2">
          <h5 className="mb-2">Status de Avaliação dos Projetos e Planos</h5>
          {Object.keys(statusChartData).length > 0 ? (
            <>
              <div style={{ height: "300px" }}>
                <Chart
                  type="pie"
                  data={statusChartData}
                  options={statusChartOptions}
                />
              </div>
              <div className="flex justify-content-center gap-4 mt-3">
                {statusChartData.labels.map((label, index) => (
                  <span key={index} className="font-bold">
                    {label}: {statusChartData.datasets[0].data[index]}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p>Carregando gráfico...</p>
          )}
        </Card>
        <Card className="mb-4 p-2">
          <h5 className="mb-2">Avaliações de Projetos</h5>
          <AvaliacoesProjetos
            params={params}
            setProjetosSelecionados={setProjetos}
            processarInscricoes={processarInscricoes}
            inscricoesProjetos={inscricoesProjetos}
            setInscricoesProjetos={setInscricoesProjetos}
          />
        </Card>
      </main>
      <Toast ref={toast} />
    </>
  );
};

export default Page;

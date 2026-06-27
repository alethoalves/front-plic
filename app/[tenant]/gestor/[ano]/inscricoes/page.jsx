"use client";
// HOOKS
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
import { RiEditLine, RiSettings5Fill, RiSettings5Line } from "@remixicon/react";
// COMPONENTES
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Actions from "@/components/Actions";
import FormNewInscricao from "@/components/Formularios/FormNewInscricao";
// PRIMEREACT
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { ProgressBar } from "primereact/progressbar";
import { Chart } from "primereact/chart";

// FUNÇÕES
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";
import calcularMedia from "@/lib/calcularMedia";
import TabelaPlanoDeTrabalho from "@/components/tabelas/TabelaPlanoDeTrabalho";
import NoData from "@/components/NoData";
import PeriodoInscricao from "@/components/PeriodoInscricao";
import { Dialog } from "primereact/dialog";
import RestricaoInscricao from "@/components/RestricaoInscricao";
import PermissoesInscricao from "@/components/PermissoesInscricao";
import Formularios from "@/components/Formularios";
import Button from "@/components/Button";
import NovaInscricao from "@/components/NovaInscricao";
import TabelaInscricao from "@/components/tabelas/TabelaInscricao";

const Page = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const [editais, setEditais] = useState([]);
  const [itens, setItens] = useState([]);
  const [chartData, setChartData] = useState({});
  const [chartMultiAxisData, setChartMultiAxisData] = useState({});
  const [showPeriodoInscricaoDialog, setShowPeriodoInscricaoDialog] =
    useState(false);

  const dataTableRef = useRef(null);
  const multiAxisOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Evolução das Inscrições por Edital (por dia)",
        font: { size: 14, weight: "bold" },
      },
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          footer: (items) => {
            const total = items.reduce((sum, item) => sum + item.parsed.y, 0);
            return `Total: ${total}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        title: { display: true, text: "Inscrições" },
      },
    },
  };

  const itensEnviados = useMemo(
    () => itens.filter((item) => item.inscricao?.status === "enviada"),
    [itens]
  );

  const prepareMultiAxisData = useCallback(() => {
    if (!itensEnviados.length) return;

    const editaisSet = new Set();
    const dataPorEdital = {};
    const todasDatas = new Set();

    itensEnviados.forEach((item) => {
      const edital = item.inscricao.edital.titulo;
      editaisSet.add(edital);

      const dt = new Date(item.inscricao.createdAt);
      const data = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;

      todasDatas.add(data);

      if (!dataPorEdital[edital]) dataPorEdital[edital] = {};
      if (!dataPorEdital[edital][data]) dataPorEdital[edital][data] = 0;

      dataPorEdital[edital][data] += 1;
    });

    const labels = Array.from(todasDatas).sort((a, b) => {
      const [dA, mA] = a.split("/").map(Number);
      const [dB, mB] = b.split("/").map(Number);
      return mA - mB || dA - dB;
    });

    const cores = [
      { border: "#4F46E5", bg: "#4F46E5CC" },
      { border: "#0EA5E9", bg: "#0EA5E9CC" },
      { border: "#F59E0B", bg: "#F59E0BCC" },
      { border: "#10B981", bg: "#10B981CC" },
      { border: "#EC4899", bg: "#EC4899CC" },
    ];

    const datasets = Array.from(editaisSet).map((edital, index) => ({
      label: edital,
      data: labels.map((label) => dataPorEdital[edital][label] || 0),
      borderColor: cores[index % cores.length].border,
      backgroundColor: cores[index % cores.length].bg,
      borderWidth: 1,
      borderRadius: 3,
    }));

    setChartMultiAxisData({ labels, datasets });
  }, [itensEnviados]);

  // Chame a função no useEffect
  useEffect(() => {
    prepareMultiAxisData();
  }, [itensEnviados, prepareMultiAxisData]);

  // Opções do gráfico
  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Estatísticas por Edital",
      },
    },
  };

  // ROTEAMENTO
  const router = useRouter();

  // Processar dados para o gráfico
  const processChartData = useCallback(() => {
    if (itensEnviados.length === 0) return;

    const editaisMap = itensEnviados.reduce((acc, item) => {
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
      if (item.inscricaoProjeto?.projeto?.id) {
        acc[editalKey].projetos.add(item.inscricaoProjeto.projeto.id);
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
  }, [itensEnviados]);

  // BUSCA DE DADOS INICIAIS
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const itens = await getAllPlanoDeTrabalhosByTenant(
        params.tenant,
        params.ano || null
      );

      const itensComCamposVirtuais = itens.map((item) => ({
        ...item,
        qtdFichas: item.projeto?.InscricaoProjeto?.FichaAvaliacao?.length || 0,
        mediaNotas: calcularMedia(
          item.projeto?.InscricaoProjeto?.FichaAvaliacao || []
        ),
        avaliadores:
          item.projeto?.InscricaoProjeto?.InscricaoProjetoAvaliador?.map(
            (a) => a.avaliador?.nome
          )
            .filter(Boolean)
            .join("; ") || "Nenhum avaliador",
        qtdFichasPlano: item.FichaAvaliacao?.length || 0,
        mediaNotasPlano: calcularMedia(item.FichaAvaliacao || []),
        alunoParticipacoes:
          item.participacoes
            ?.map((p) => `${p.user?.nome} (${p.status})`)
            ?.join("; ") || "Nenhum aluno vinculado",
        qtdSolicitacoesBolsa:
          item.participacoes?.filter((p) => p.solicitarBolsa === true).length ||
          0,
      }));

      setItens(itensComCamposVirtuais || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [params.tenant]);

  useEffect(() => {
    fetchInitialData();
  }, [params.tenant, fetchInitialData]);

  useEffect(() => {
    processChartData();
  }, [itensEnviados, processChartData]);

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
      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        size="medium"
      >
        {(() => {
          switch (activeModal) {
            case "prazo":
              return <PeriodoInscricao params={params} />;
            case "inscricao":
              return <NovaInscricao params={params} />;
            case "restricoes":
              return <RestricaoInscricao params={params} />;
            case "permissoes":
              return <PermissoesInscricao params={params} />;
            case "formularios":
              return <Formularios params={params} />;
            default:
              return null;
          }
        })()}
      </Modal>
      <main className={styles.main}>
        <Card className="mb-4 p-2">
          <div className={styles.configuracoes}>
            <div className={styles.icon}>
              <RiSettings5Line />
            </div>
            <ul>
              <li onClick={() => setActiveModal("permissoes")}>
                <p>Permissões</p>
              </li>
              <li onClick={() => setActiveModal("prazo")}>
                <p>Prazos</p>
              </li>

              <li onClick={() => setActiveModal("restricoes")}>
                <p>Restrições</p>
              </li>
              <li onClick={() => setActiveModal("formularios")}>
                <p>Formulários</p>
              </li>
            </ul>
          </div>
        </Card>

        <Card className="mb-4 p-2">
          <h5 className="mb-2">Evolução das Inscrições</h5>

          {Object.keys(chartMultiAxisData) &&
            Object.keys(chartMultiAxisData).length > 0 && (
              <Chart
                type="bar"
                data={chartMultiAxisData}
                options={multiAxisOptions}
                style={{ height: "450px" }}
              />
            )}
          {loading && <p>Carregando dados do gráfico...</p>}
          {!loading && Object.keys(chartMultiAxisData).length === 0 && (
            <NoData description="Nenhum dado encontrado" />
          )}
        </Card>
        {/* Gráfico de Barras */}
        <Card className="mb-4 p-2 ">
          <h5 className="mb-2">Dados por Edital</h5>
          <div className={`${styles.dashboard} mb-2`}>
            <div className={styles.card_style1}>
              <div className={styles.left}>
                <h5>
                  {
                    new Set(
                      itensEnviados
                        .map((item) => item.inscricaoProjeto?.projeto?.id)
                        .filter(Boolean)
                    ).size
                  }
                </h5>
              </div>
              <div className={styles.right}>
                <h6>Projetos</h6>
              </div>
            </div>

            <div className={styles.card_style1}>
              <div className={styles.left}>
                <h5>{new Set(itensEnviados.map((item) => item.id)).size}</h5>
              </div>
              <div className={styles.right}>
                <h6>Planos de Trabalho</h6>
              </div>
            </div>

            <div className={styles.card_style1}>
              <div className={styles.left}>
                <h5>
                  {
                    new Set(
                      itensEnviados.flatMap(
                        (item) =>
                          item.inscricao?.participacoes
                            ?.map((p) => p.user?.nome)
                            ?.filter(Boolean) || []
                      )
                    ).size
                  }
                </h5>
              </div>
              <div className={styles.right}>
                <h6>Orientadores</h6>
              </div>
            </div>

            <div className={styles.card_style1}>
              <div className={styles.left}>
                <h5>
                  {
                    new Set(
                      itensEnviados.flatMap(
                        (item) =>
                          item.participacoes
                            ?.map((p) => p.user?.nome)
                            ?.filter(Boolean) || []
                      )
                    ).size
                  }
                </h5>
              </div>
              <div className={styles.right}>
                <h6>Alunos</h6>
              </div>
            </div>

            <div className={styles.card_style1}>
              <div className={styles.left}>
                <h5>
                  {itensEnviados.reduce((total, item) => {
                    return total + (item.qtdSolicitacoesBolsa || 0);
                  }, 0)}
                </h5>
              </div>
              <div className={styles.right}>
                <h6>Solicitações de Bolsas</h6>
              </div>
            </div>
          </div>

          {Object.keys(chartData) && Object.keys(chartData).length > 0 && (
            <Chart
              type="bar"
              data={chartData}
              options={chartOptions}
              style={{ height: "400px" }}
            />
          )}
          {loading && <p>Carregando dados do gráfico...</p>}
        </Card>

        <Card className="custom-card mb-2">
          {loading ? (
            <div className="pr-2 pl-2 pb-2 pt-2">
              <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
            </div>
          ) : (
            <>
              {false && <TabelaPlanoDeTrabalho params={params} />}
              <TabelaInscricao params={params} />
            </>
          )}
        </Card>
      </main>
    </>
  );
};

export default Page;

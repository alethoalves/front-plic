"use client";
// HOOKS
import { useEffect, useState, useCallback, useRef } from "react";
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

const Page = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const [editais, setEditais] = useState([]);
  const [itens, setItens] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [chartData, setChartData] = useState({});
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [chartMultiAxisData, setChartMultiAxisData] = useState({});
  const [showPeriodoInscricaoDialog, setShowPeriodoInscricaoDialog] =
    useState(false);

  const dataTableRef = useRef(null);
  // Configure as opções do gráfico Multi Axis
  const multiAxisOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    stacked: false,
    maintainAspectRatio: false,
    aspectRatio: 0.6,

    plugins: {
      title: {
        display: true,
        text: "Evolução das Inscrições por Edital (minutos)",
      },
      legend: { position: "top" },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: { drawOnChartArea: false },
      },
    },
  };

  // Função para preparar os dados do gráfico Multi Axis
  const prepareMultiAxisData = useCallback(() => {
    if (!itens.length) return;

    const editaisSet = new Set();
    const dataPorEdital = {};
    const todasDatas = new Set();

    itens.forEach((item) => {
      const edital = item.inscricao.edital.titulo;
      editaisSet.add(edital);

      const data = new Date(item.inscricao.createdAt).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short", // aqui é alterado (short, medium, long), comentar essa linha deixa apenas o dia
      });
      todasDatas.add(data);

      if (!dataPorEdital[edital]) dataPorEdital[edital] = {};
      if (!dataPorEdital[edital][data]) dataPorEdital[edital][data] = 0;

      dataPorEdital[edital][data] += 1;
    });

    const labels = Array.from(todasDatas).sort(
      (a, b) =>
        new Date(a.split("/").reverse().join("-")) -
        new Date(b.split("/").reverse().join("-"))
    );
    const cores = ["#FF6384", "#36A2EB", "#FFCE56", "#8BC34A", "#9C27B0"];

    const datasets = Array.from(editaisSet).map((edital, index) => ({
      label: edital,
      data: labels.map((label) => dataPorEdital[edital][label] || 0),
      borderColor: cores[index % cores.length],
      backgroundColor: `${cores[index % cores.length]}66`,
      tension: 0.4,
      yAxisID: index % 2 === 0 ? "y" : "y1", // alternando os eixos y
    }));

    setChartMultiAxisData({ labels, datasets });
  }, [itens]);

  // Chame a função no useEffect
  useEffect(() => {
    prepareMultiAxisData();
  }, [itens, prepareMultiAxisData]);

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

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "inscricao.edital.ano": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "inscricao.edital.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    inscricaoId: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "inscricao.status": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "inscricao.orientadorParticipacoes": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    projetoId: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "projeto.InscricaoProjeto.statusAvaliacao": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "projeto.InscricaoProjeto.projeto.area.area": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "projeto.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    "projeto.envolveAnimais": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "projeto.envolveHumanos": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    qtdSolicitacoesBolsa: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    mediaNotas: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.BETWEEN }],
    },
    avaliadores: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
    },
    id: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "area.area": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    titulo: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    alunoParticipacoes: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }],
    },
  });

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
  }, [itens]);

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
  }, [itens, processChartData]);

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-wrap justify-content-between align-items-center">
        <InputText
          className="w-100"
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Pesquisar..."
        />
      </div>
    );
  };

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
            case "inscricoes":
              return <PeriodoInscricao params={params} />;
            case "restricoes":
              return <RestricaoInscricao params={params} />;
            case "permissoes":
              return <PermissoesInscricao params={params} />;
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
              <li onClick={() => setActiveModal("inscricoes")}>
                <p>Inscrições</p>
              </li>
              <li onClick={() => setActiveModal("restricoes")}>
                <p>Restrições</p>
              </li>
            </ul>
          </div>
        </Card>
        <Card className="mb-4 p-2">
          <h5 className="mb-2">Evolução das Inscrições</h5>

          {Object.keys(chartMultiAxisData) &&
            Object.keys(chartMultiAxisData).length > 0 && (
              <Chart
                type="line"
                data={chartMultiAxisData}
                options={multiAxisOptions}
                style={{ height: "400px" }}
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
                      itens
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
                <h5>{new Set(itens.map((item) => item.id)).size}</h5>
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
                      itens.flatMap(
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
                      itens.flatMap(
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
                  {itens.reduce((total, item) => {
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
              <TabelaPlanoDeTrabalho params={params} />
            </>
          )}
        </Card>
      </main>
    </>
  );
};

export default Page;

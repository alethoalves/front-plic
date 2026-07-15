"use client";
// HOOKS
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
import {
  RiEditLine,
  RiCalendarEventLine,
  RiSpeedUpLine,
  RiFileListLine,
  RiUserFollowLine,
  RiUserStarLine,
} from "@remixicon/react";
// COMPONENTES
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import FormNewInscricao from "@/components/Formularios/FormNewInscricao";
// PRIMEREACT
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Tag } from "primereact/tag";

// FUNÇÕES
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";
import { getCargos } from "@/app/api/client/cargo";
import preverConclusaoAvaliacoes from "@/lib/preverConclusaoAvaliacoes";
import { formatarData } from "@/lib/formatarDatas";
import { Toast } from "primereact/toast";
import { getCookie, setCookie } from "cookies-next";
import TabelaPlanoDeTrabalhoAcompanhamento from "@/components/tabelas/TabelaPlanoDeTrabalhoAcompanhamento";

const Page = ({ params }) => {
  // ESTADOS
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [itens, setItens] = useState([]);
  const [chartData, setChartData] = useState({});
  const [comboChartData, setComboChartData] = useState({});
  const [avaliadores, setAvaliadores] = useState(null);
  const [loadingAvaliadores, setLoadingAvaliadores] = useState(true);
  const toast = useRef();

  // Mesmo filtro usado em app/[tenant]/gestor/[ano]/inscricoes/page.jsx: só conta
  // planos de inscrições efetivamente enviadas (exclui rascunhos), pra bater com
  // o número mostrado lá.
  const itensEnviados = useMemo(
    () => itens.filter((item) => item.inscricao?.status === "enviada"),
    [itens],
  );

  // Só planos com o Projeto pai já concluído (AVALIADA) entram no histograma
  // de notas — não basta ter ficha (avaliação pode estar parcial, com só
  // parte dos avaliadores tendo enviado) nem existir nota (o gestor pode
  // atribuir nota manual antes de fechar o status). Sem esse filtro, notas
  // parciais/incompletas se misturam com notas finais reais e o gráfico
  // mostra distribuição de dados que ainda vão mudar.
  const itensAvaliados = useMemo(
    () =>
      itensEnviados.filter((item) => {
        const status =
          item.inscricaoProjeto?.statusAvaliacao ||
          item.statusAvaliacao ||
          "AGUARDANDO_AVALIACAO";
        return status === "AVALIADA";
      }),
    [itensEnviados],
  );

  // Um Projeto pode ter vários Planos de Trabalho vinculados (mesma
  // inscricaoProjeto). Dedupe por id do projeto (mesma chave usada em
  // gestor/[ano]/inscricoes/page.jsx pro card "Projetos") — o backend só
  // faz `select` em inscricaoProjeto, sem incluir `inscricaoProjeto.id`,
  // então a chave precisa vir de `inscricaoProjeto.projeto.id`.
  const projetosUnicos = useMemo(() => {
    const mapa = new Map();
    itensEnviados.forEach((item) => {
      const inscricaoProjeto = item.inscricaoProjeto;
      const projetoId = inscricaoProjeto?.projeto?.id;
      if (!projetoId || mapa.has(projetoId)) return;
      mapa.set(projetoId, inscricaoProjeto);
    });
    return Array.from(mapa.values());
  }, [itensEnviados]);

  // O status de avaliação de um Plano de Trabalho nunca passa por
  // "EM_AVALIACAO" isoladamente: a avaliação de projeto e planos é enviada
  // junta (processarFichaAvaliacao no backend), e o campo próprio do Plano só
  // muda de null (Aguardando) pra AVALIADA, no mesmo instante em que o
  // Projeto pai é concluído. Por isso, pra saber a fase real de um Plano,
  // usamos o status do Projeto pai (mesma lógica do gráfico de pizza
  // anterior), caindo pro campo próprio só se o item não tiver projeto.
  const statusStats = useMemo(() => {
    const vazio = () => ({
      total: 0,
      AGUARDANDO_AVALIACAO: 0,
      EM_AVALIACAO: 0,
      AVALIADA: 0,
    });
    const projetos = vazio();
    const planos = vazio();

    projetosUnicos.forEach((inscricaoProjeto) => {
      const status = inscricaoProjeto.statusAvaliacao || "AGUARDANDO_AVALIACAO";
      projetos.total++;
      projetos[status] = (projetos[status] || 0) + 1;
    });

    itensEnviados.forEach((item) => {
      const status =
        item.inscricaoProjeto?.statusAvaliacao ||
        item.statusAvaliacao ||
        "AGUARDANDO_AVALIACAO";
      planos.total++;
      planos[status] = (planos[status] || 0) + 1;
    });

    return { projetos, planos };
  }, [projetosUnicos, itensEnviados]);

  // Previsão baseada só em Projetos: projeto e todos os planos vinculados
  // são avaliados no mesmo evento (mesma submissão), então o Plano termina
  // junto com o Projeto ao qual pertence — não faz sentido somar Projetos e
  // Planos como unidades independentes de ritmo/pendência.
  const previsaoConclusao = useMemo(() => {
    const datasConclusao = projetosUnicos
      .filter(
        (inscricaoProjeto) => inscricaoProjeto.statusAvaliacao === "AVALIADA",
      )
      .map((inscricaoProjeto) => {
        const fichas = inscricaoProjeto.FichaAvaliacao || [];
        if (fichas.length === 0) return null;
        return fichas.reduce(
          (maisRecente, ficha) =>
            new Date(ficha.createdAt) > new Date(maisRecente)
              ? ficha.createdAt
              : maisRecente,
          fichas[0].createdAt,
        );
      })
      .filter(Boolean);

    const pendentes =
      statusStats.projetos.AGUARDANDO_AVALIACAO +
      statusStats.projetos.EM_AVALIACAO;

    return preverConclusaoAvaliacoes(datasConclusao, pendentes);
  }, [projetosUnicos, statusStats]);

  // Data prevista de divulgação do resultado provisório e o "colchão" de
  // dias necessário depois de concluídas as avaliações — só interessam a
  // este gestor/tenant/ano, não precisam de backend: ficam em cookie.
  const cookieKeyDataDivulgacao = `previsaoDivulgacao_${params.tenant}_${params.ano}`;
  const cookieKeyDiasDivulgacao = `previsaoDiasDivulgacao_${params.tenant}_${params.ano}`;

  const [dataDivulgacaoPrevista, setDataDivulgacaoPrevista] = useState(null);
  const [diasNecessariosDivulgacao, setDiasNecessariosDivulgacao] = useState(5);

  useEffect(() => {
    const cookieData = getCookie(cookieKeyDataDivulgacao);
    if (cookieData) {
      const parsed = new Date(cookieData);
      if (!isNaN(parsed)) setDataDivulgacaoPrevista(parsed);
    }
    const cookieDias = getCookie(cookieKeyDiasDivulgacao);
    if (cookieDias !== undefined && cookieDias !== null && cookieDias !== "") {
      const parsedDias = parseInt(cookieDias, 10);
      if (!isNaN(parsedDias)) setDiasNecessariosDivulgacao(parsedDias);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tenant, params.ano]);

  const handleChangeDataDivulgacao = (novaData) => {
    setDataDivulgacaoPrevista(novaData);
    if (novaData) {
      setCookie(cookieKeyDataDivulgacao, novaData.toISOString(), {
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  };

  const handleChangeDiasDivulgacao = (novoValor) => {
    const valor = novoValor ?? 0;
    setDiasNecessariosDivulgacao(valor);
    setCookie(cookieKeyDiasDivulgacao, String(valor), {
      maxAge: 60 * 60 * 24 * 365,
    });
  };

  // Data em que o resultado provisório realisticamente ficaria pronto para
  // divulgar (previsão de conclusão das avaliações + dias de preparo) — não
  // depende da data-alvo que o gestor definiu, só do ritmo atual.
  const dataEstimadaDivulgacao = useMemo(() => {
    if (!previsaoConclusao.temDadosSuficientes) return null;
    const data = new Date(previsaoConclusao.dataPrevista);
    data.setDate(data.getDate() + (diasNecessariosDivulgacao || 0));
    return data;
  }, [previsaoConclusao, diasNecessariosDivulgacao]);

  // Compara a estimativa real com a data que o gestor pretende divulgar —
  // negativo = atraso, positivo = antecipação.
  const comparativoDivulgacao = useMemo(() => {
    if (!dataEstimadaDivulgacao || !dataDivulgacaoPrevista) return null;

    const diffDias = Math.round(
      (dataDivulgacaoPrevista - dataEstimadaDivulgacao) / (1000 * 60 * 60 * 24),
    );

    return { diffDias, emAtraso: diffDias < 0 };
  }, [dataEstimadaDivulgacao, dataDivulgacaoPrevista]);

  // Orientadores únicos (por cpf) do tenant/ano, a partir das participações
  // tipo "orientador" já filtradas pelo backend em inscricao.participacoes.
  const orientadoresPorCpf = useMemo(() => {
    const mapa = new Map();
    itensEnviados.forEach((item) => {
      item.inscricao?.participacoes?.forEach((p) => {
        if (p.user?.cpf && !mapa.has(p.user.cpf)) {
          mapa.set(p.user.cpf, p.user.nome);
        }
      });
    });
    return mapa;
  }, [itensEnviados]);

  const avaliadoresConfirmados = useMemo(
    () =>
      (avaliadores || []).filter(
        (a) => a.user?.avaliadorAnoStatus === "CONFIRMADO",
      ),
    [avaliadores],
  );

  // Soma das fichas de projeto que esse avaliador já enviou, somando todas
  // as atribuições dele (InscricaoProjetoAvaliador já vem filtrado por
  // avaliadorId no backend de getCargos).
  const contarProjetosAvaliados = (avaliador) =>
    (avaliador.user?.InscricaoProjetoAvaliador || []).reduce(
      (total, ipa) =>
        total + (ipa.inscricaoProjeto?.FichaAvaliacao?.length || 0),
      0,
    );

  // Orientadores que também são avaliadores confirmados no ano (cruzamento
  // por cpf, já que orientador e avaliador são o mesmo User) — separa o
  // pool de avaliadores em "orientadores" vs "ad hoc" (quem avalia sem
  // orientar nenhum Plano de Trabalho no ano).
  const engajamentoOrientadores = useMemo(() => {
    const orientadoresAvaliadores = avaliadoresConfirmados.filter((a) =>
      orientadoresPorCpf.has(a.user?.cpf),
    );

    return {
      totalOrientadores: orientadoresPorCpf.size,
      orientadoresAvaliadores,
      qtdAdHoc: avaliadoresConfirmados.length - orientadoresAvaliadores.length,
    };
  }, [avaliadoresConfirmados, orientadoresPorCpf]);

  // Média de projetos avaliados por avaliador confirmado (orientador ou
  // ad hoc), independente de quantos ainda não avaliaram nada.
  const mediaAvaliacoesPorAvaliador = useMemo(() => {
    if (avaliadoresConfirmados.length === 0) return 0;
    const total = avaliadoresConfirmados.reduce(
      (soma, avaliador) => soma + contarProjetosAvaliados(avaliador),
      0,
    );
    return total / avaliadoresConfirmados.length;
  }, [avaliadoresConfirmados]);

  // Média "ideal" = total de projetos que precisam de avaliação (não muda
  // conforme o trabalho avança) dividido pela quantidade de avaliadores
  // confirmados — quantos cada um deveria avaliar para dar conta de tudo,
  // se o total fosse dividido igualmente entre todos desde o início.
  const mediaIdealPorAvaliador = useMemo(() => {
    if (avaliadoresConfirmados.length === 0) return 0;
    return statusStats.projetos.total / avaliadoresConfirmados.length;
  }, [statusStats, avaliadoresConfirmados]);

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
    if (itensAvaliados.length === 0) return;

    // Definir intervalos (bins) para as notas totais (0-100 ou outro range adequado)
    const maxNota = Math.max(
      ...itensAvaliados.map((item) => item.notaTotal),
      10,
    );
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
    itensAvaliados.forEach((item) => {
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
    const notas = itensAvaliados.map((item) => item.notaTotal);
    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
    const desvioPadrao = Math.sqrt(
      notas.reduce((sq, n) => sq + Math.pow(n - media, 2), 0) / notas.length,
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
  }, [itensAvaliados]);
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
                (context.raw / itensAvaliados.length) *
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
              `Total de Planos: ${itensAvaliados.length}`,
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
  }, [itensAvaliados, prepareComboChartData]);

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
        params.ano || null,
      );
      const itensComCamposVirtuais = itens.map((item) => {
        // notaProjeto/notaPlano vêm das colunas persistidas no PlanoDeTrabalho
        // (mantidas em sincronia pelo backend tanto por processarFichaAvaliacao
        // quanto por atribuirNotaManual), não recalculadas a partir das fichas
        // aqui — o gestor pode atribuir nota manual sem nenhuma FichaAvaliacao
        // existir, e recalcular via calcularMedia perderia esse valor.
        const notaProjeto = item.notaProjeto || 0;
        const notaPlano = item.notaPlano || 0;
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
              (a) => a.avaliador?.nome,
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
              item.projeto?.InscricaoProjeto[0]?.FichaAvaliacao,
            ).toFixed(4),
          ),
          notaPlano: parseFloat(notaPlano.toFixed(4)),
          notaOrientador: parseFloat(notaOrientador.toFixed(4)),
          mediaNotasAlunos: parseFloat(mediaAlunos.toFixed(4)),
          mediaRA: parseFloat(mediaRA.toFixed(4)),
          notaTotal: parseFloat(notaTotal.toFixed(4)),
        };
      });
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

  // Avaliadores confirmados no ano — fonte separada de getAllPlanoDeTrabalhosByTenant,
  // usada pra seção de Participação e Engajamento de Orientadores.
  const fetchAvaliadores = useCallback(async () => {
    setLoadingAvaliadores(true);
    try {
      const cargos = await getCargos(params.tenant, {
        cargo: "avaliador",
        ano: params.ano,
      });
      setAvaliadores(cargos || []);
    } catch (error) {
      console.error("Erro ao buscar avaliadores:", error);
      setAvaliadores([]);
    } finally {
      setLoadingAvaliadores(false);
    }
  }, [params.tenant, params.ano]);

  useEffect(() => {
    fetchAvaliadores();
  }, [fetchAvaliadores]);

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
                <span className="font-bold">
                  Total: {itensAvaliados.length} planos avaliados
                </span>
              </div>
            </div>
          ) : (
            <p>
              {loading
                ? "Carregando gráfico..."
                : "Nenhum plano avaliado ainda."}
            </p>
          )}
        </Card>
        <Card className="mb-4 p-2">
          <h5 className="mb-2">Status de Avaliação dos Projetos e Planos</h5>
          {itensEnviados.length > 0 ? (
            <>
              <h6 className={styles.grupoLabel}>Projetos</h6>
              <div className={`${styles.dashboard} mb-2`}>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{statusStats.projetos.total}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Total</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{statusStats.projetos.AGUARDANDO_AVALIACAO}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Aguardando Avaliação</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{statusStats.projetos.EM_AVALIACAO}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Em Avaliação</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{statusStats.projetos.AVALIADA}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Avaliado</h6>
                  </div>
                </div>
              </div>

              <h6 className={`${styles.grupoLabel} mt-3`}>
                Planos de Trabalho
              </h6>
              <div className={`${styles.dashboard} mb-2`}>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{statusStats.planos.total}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Total</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{statusStats.planos.AGUARDANDO_AVALIACAO}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Aguardando Avaliação</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{statusStats.planos.EM_AVALIACAO}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Em Avaliação</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{statusStats.planos.AVALIADA}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Avaliado</h6>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p>
              {loading ? "Carregando dados..." : "Nenhum plano encontrado."}
            </p>
          )}
        </Card>

        <Card className="mb-4 p-2">
          <h5 className="mb-2">Previsão de Conclusão das Avaliações</h5>

          <div className={`${styles.statTilesRow} mb-2`}>
            <div className={styles.statColuna}>
              <div className={styles.statSplit}>
                <div className={styles.statSplitHeader}>
                  <RiUserStarLine />
                  <p>Média de avaliações por avaliador</p>
                </div>
                <div className={styles.statSplitBody}>
                  <div className={styles.statSplitMetade}>
                    <p>Média Ideal</p>
                    <h4>{Math.round(mediaIdealPorAvaliador)}</h4>
                    <p>projetos por avaliador</p>
                  </div>
                  <div className={styles.statSplitMetade}>
                    <p>Média Real</p>
                    <h4>{Math.round(mediaAvaliacoesPorAvaliador)}</h4>
                    <p>projetos por avaliador</p>
                  </div>
                </div>
              </div>

              {previsaoConclusao.temDadosSuficientes && (
                <div className={styles.statHero}>
                  <RiCalendarEventLine />
                  <div>
                    <p>Estimativa de divulgação do resultado provisório</p>
                    <h4
                      className={
                        comparativoDivulgacao?.emAtraso
                          ? styles.textoAtraso
                          : undefined
                      }
                    >
                      {formatarData(dataEstimadaDivulgacao)}
                    </h4>

                    <div className={styles.statHeroDivulgacao}>
                      <p>
                        <span>Conclusão das avaliações</span>
                        <strong>
                          {formatarData(previsaoConclusao.dataPrevista)}
                        </strong>
                      </p>
                      <p>
                        <span>Divulgação prevista</span>
                        <strong>
                          {dataDivulgacaoPrevista
                            ? formatarData(dataDivulgacaoPrevista)
                            : "Não definida"}
                        </strong>
                      </p>
                      <p>
                        <span>Dias de atraso</span>
                        <Tag
                          value={
                            !comparativoDivulgacao
                              ? "—"
                              : comparativoDivulgacao.emAtraso
                                ? `${Math.abs(comparativoDivulgacao.diffDias)} ${
                                    Math.abs(comparativoDivulgacao.diffDias) === 1
                                      ? "dia"
                                      : "dias"
                                  }`
                                : "0 dias"
                          }
                          severity={
                            !comparativoDivulgacao
                              ? undefined
                              : comparativoDivulgacao.emAtraso
                                ? "danger"
                                : "success"
                          }
                        />
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {previsaoConclusao.temDadosSuficientes && (
              <div className={styles.statTiles}>
                <div className={styles.statTile}>
                  <RiSpeedUpLine />
                  <div>
                    <h5>{previsaoConclusao.taxaPorDia}</h5>
                    <p>projetos avaliados por dia</p>
                  </div>
                </div>
                <div className={styles.statTile}>
                  <RiFileListLine />
                  <div>
                    <h5>{previsaoConclusao.pendentes}</h5>
                    <p>projetos pendentes</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!previsaoConclusao.temDadosSuficientes && (
            <p>
              Ainda não há avaliações de projeto concluídas suficientes para
              calcular uma previsão (é necessário pelo menos 2 dias distintos
              com projetos avaliados).
            </p>
          )}
          <p className={styles.statNota}>
            Baseado no ritmo de conclusão de Projetos — um Plano de Trabalho só
            é avaliado quando o projeto e todos os planos vinculados a ele são
            avaliados juntos, então os Planos terminam na mesma data do Projeto
            ao qual pertencem. Estimativa a partir do ritmo histórico, não uma
            garantia.
          </p>

          <h6 className={`${styles.grupoLabel} mb-1`}>
            Divulgação do Resultado Provisório
          </h6>
          <div className={styles.divulgacaoInputs}>
            <div className={styles.divulgacaoCampo}>
              <label htmlFor="dataDivulgacaoPrevista">
                Data prevista para divulgação
              </label>
              <Calendar
                inputId="dataDivulgacaoPrevista"
                value={dataDivulgacaoPrevista}
                onChange={(e) => handleChangeDataDivulgacao(e.value)}
                showIcon
                dateFormat="dd/mm/yy"
              />
            </div>
            <div className={styles.divulgacaoCampo}>
              <label htmlFor="diasNecessariosDivulgacao">
                Dias necessários após concluir as avaliações
              </label>
              <InputNumber
                inputId="diasNecessariosDivulgacao"
                value={diasNecessariosDivulgacao}
                onValueChange={(e) => handleChangeDiasDivulgacao(e.value)}
                min={0}
                mode="decimal"
                useGrouping={false}
              />
            </div>
          </div>
        </Card>
        <Card className="mb-4 p-2">
          <h5 className="mb-2">Participação e Engajamento de Orientadores</h5>
          {loadingAvaliadores ? (
            <p>Carregando dados de avaliadores...</p>
          ) : avaliadoresConfirmados.length === 0 ? (
            <p>Nenhum avaliador confirmado no ano selecionado.</p>
          ) : (
            <>
              <div className={`${styles.statTilesRow} mb-2`}>
                <div className={styles.statHero}>
                  <RiUserFollowLine />
                  <div>
                    <p>Disponibilizados como avaliadores</p>
                    <h4>
                      {engajamentoOrientadores.orientadoresAvaliadores.length}{" "}
                      de {engajamentoOrientadores.totalOrientadores}
                    </h4>
                    <p className={styles.statHeroSub}>
                      {engajamentoOrientadores.totalOrientadores > 0
                        ? (
                            (engajamentoOrientadores.orientadoresAvaliadores
                              .length /
                              engajamentoOrientadores.totalOrientadores) *
                            100
                          ).toFixed(0)
                        : 0}
                      % dos orientadores do ano confirmaram participação como
                      avaliador
                    </p>
                  </div>
                </div>
              </div>

              <h6 className={styles.grupoLabel}>Composição dos avaliadores</h6>
              <div className={styles.dashboard}>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>
                      {engajamentoOrientadores.orientadoresAvaliadores.length}
                    </h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Avaliadores-Orientadores</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{engajamentoOrientadores.qtdAdHoc}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Avaliadores Ad Hoc</h6>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        <h5 className="mb-2 mt-2">Planos de Trabalho</h5>
        <TabelaPlanoDeTrabalhoAcompanhamento params={params} />
      </main>
      <Toast ref={toast} />
    </>
  );
};

export default Page;

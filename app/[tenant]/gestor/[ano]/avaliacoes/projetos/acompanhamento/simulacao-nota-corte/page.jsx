"use client";
// HOOKS
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
// ESTILO E ÍCONES
import styles from "./page.module.scss";
import {
  RiArrowLeftLine,
  RiGraduationCapLine,
  RiHandHeartLine,
} from "@remixicon/react";
// COMPONENTES
import Header from "@/components/Header";
// PRIMEREACT
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputNumber } from "primereact/inputnumber";
import { Button as PrimeButton } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
// FUNÇÕES
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";

// Mesmas cores semânticas usadas em Tags de status no resto do app
// (styles/partials/_colors.scss: $success-dark / $error-normal).
const COR_APROVADOS = "#28bb49";
const COR_REPROVADOS = "#F03D3D";

// Um plano pode ter nota de corte diferente conforme a modalidade do aluno
// vinculado — cada edital define a própria régua (ex: 60 para bolsista, 50
// para voluntário), então a simulação roda separada por modalidade dentro
// de cada edital, não só por edital.
const MODALIDADES = [
  { key: "bolsista", label: "Bolsista" },
  { key: "voluntario", label: "Voluntário(a)" },
];

const Page = ({ params }) => {
  const router = useRouter();
  const toast = useRef(null);

  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState([]);

  // Nota de corte por edital + modalidade — { [editalTitulo]: { bolsista, voluntario } }.
  // Nada aqui é persistido, é só estado local da simulação.
  const [cortes, setCortes] = useState({});
  const [corteTodosBolsista, setCorteTodosBolsista] = useState(null);
  const [corteTodosVoluntario, setCorteTodosVoluntario] = useState(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await getAllPlanoDeTrabalhosByTenant(
        params.tenant,
        params.ano || null
      );
      const itensComCamposVirtuais = (dados || []).map((item) => {
        // notaAluno/notaOrientador/notaPlano/notaProjeto são os campos
        // persistidos no PlanoDeTrabalho (mesma fonte usada na tela de
        // Acompanhamento) — não recalculados a partir de fichas aqui.
        const notaProjeto = item.notaProjeto || 0;
        const notaPlano = item.notaPlano || 0;
        const notaOrientador = item.notaOrientador || 0;
        const notaAluno = item.notaAluno || 0;

        // Modalidade do plano = modalidade do(s) aluno(s) vinculado(s): se
        // qualquer participação de aluno pediu bolsa, o plano entra como
        // "Bolsista" na simulação — senão, "Voluntário(a)".
        const modalidade = (item.participacoes || []).some(
          (p) => p.solicitarBolsa === true
        )
          ? "bolsista"
          : "voluntario";

        return {
          ...item,
          notaTotal: parseFloat(
            (notaProjeto + notaPlano + notaOrientador + notaAluno).toFixed(4)
          ),
          modalidade,
        };
      });
      setItens(itensComCamposVirtuais);
    } catch (error) {
      console.error("Erro ao buscar planos de trabalho:", error);
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível carregar os planos de trabalho.",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [params.tenant, params.ano]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Mesmo critério da tela de Acompanhamento: só planos de inscrições
  // enviadas (exclui rascunhos) com o Projeto pai já concluído entram na
  // simulação — nota parcial/incompleta não deve virar "reprovado".
  const itensAvaliados = useMemo(
    () =>
      itens.filter((item) => {
        if (item.inscricao?.status !== "enviada") return false;
        const status =
          item.inscricaoProjeto?.statusAvaliacao ||
          item.statusAvaliacao ||
          "AGUARDANDO_AVALIACAO";
        return status === "AVALIADA";
      }),
    [itens]
  );

  const editais = useMemo(() => {
    const titulos = new Set(
      itensAvaliados.map((item) => item.inscricao?.edital?.titulo || "Sem edital")
    );
    return Array.from(titulos).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [itensAvaliados]);

  // Resultado da simulação, uma linha por edital × modalidade — recalcula a
  // cada mudança em `cortes`. Sem nota de corte definida, a linha fica com
  // corte:null e não entra nas contagens (evita "aprovar todo mundo" por
  // padrão).
  const resultadoPorEdital = useMemo(() => {
    const linhas = [];
    editais.forEach((titulo) => {
      const planosDoEdital = itensAvaliados.filter(
        (item) => (item.inscricao?.edital?.titulo || "Sem edital") === titulo
      );
      MODALIDADES.forEach(({ key, label }) => {
        const planosModalidade = planosDoEdital.filter(
          (item) => item.modalidade === key
        );
        const corteInformado = cortes[titulo]?.[key];
        const temCorte =
          corteInformado !== undefined &&
          corteInformado !== null &&
          corteInformado !== "";

        let aprovados = 0;
        let reprovados = 0;
        if (temCorte) {
          planosModalidade.forEach((item) => {
            if (item.notaTotal >= corteInformado) aprovados += 1;
            else reprovados += 1;
          });
        }

        linhas.push({
          editalTitulo: titulo,
          modalidade: key,
          modalidadeLabel: label,
          corte: temCorte ? corteInformado : null,
          total: planosModalidade.length,
          aprovados,
          reprovados,
          taxaAprovacao:
            temCorte && planosModalidade.length > 0
              ? (aprovados / planosModalidade.length) * 100
              : null,
        });
      });
    });
    return linhas;
  }, [editais, itensAvaliados, cortes]);

  const resumoGeral = useMemo(() => {
    const comCorte = resultadoPorEdital.filter((r) => r.corte !== null);
    const total = comCorte.reduce((soma, r) => soma + r.total, 0);
    const aprovados = comCorte.reduce((soma, r) => soma + r.aprovados, 0);
    const reprovados = comCorte.reduce((soma, r) => soma + r.reprovados, 0);

    const bolsistas = comCorte.filter((r) => r.modalidade === "bolsista");
    const voluntarios = comCorte.filter((r) => r.modalidade === "voluntario");

    return {
      linhasComCorte: comCorte.length,
      linhasSemCorte: resultadoPorEdital.length - comCorte.length,
      total,
      aprovados,
      reprovados,
      taxaAprovacao: total > 0 ? (aprovados / total) * 100 : 0,
      bolsasAprovadas: bolsistas.reduce((soma, r) => soma + r.aprovados, 0),
      bolsasReprovadas: bolsistas.reduce((soma, r) => soma + r.reprovados, 0),
      voluntariosAprovados: voluntarios.reduce((soma, r) => soma + r.aprovados, 0),
      voluntariosReprovados: voluntarios.reduce((soma, r) => soma + r.reprovados, 0),
    };
  }, [resultadoPorEdital]);

  const chartData = useMemo(() => {
    const comCorte = resultadoPorEdital.filter((r) => r.corte !== null);
    return {
      labels: comCorte.map((r) => `${r.editalTitulo} · ${r.modalidadeLabel}`),
      datasets: [
        {
          label: "Aprovados",
          backgroundColor: COR_APROVADOS,
          data: comCorte.map((r) => r.aprovados),
          borderRadius: 4,
          maxBarThickness: 48,
        },
        {
          label: "Reprovados",
          backgroundColor: COR_REPROVADOS,
          data: comCorte.map((r) => r.reprovados),
          borderRadius: 4,
          maxBarThickness: 48,
        },
      ],
    };
  }, [resultadoPorEdital]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.raw} plano(s)`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Edital · Modalidade" },
        ticks: { autoSkip: false, maxRotation: 60, minRotation: 30 },
      },
      y: {
        title: { display: true, text: "Quantidade de Planos" },
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  const handleCorteChange = (titulo, modalidade, valor) => {
    setCortes((prev) => ({
      ...prev,
      [titulo]: { ...prev[titulo], [modalidade]: valor },
    }));
  };

  const handleAplicarATodos = () => {
    if (corteTodosBolsista === null && corteTodosVoluntario === null) return;
    setCortes((prev) => {
      const novo = { ...prev };
      editais.forEach((titulo) => {
        novo[titulo] = {
          bolsista:
            corteTodosBolsista !== null
              ? corteTodosBolsista
              : (prev[titulo]?.bolsista ?? null),
          voluntario:
            corteTodosVoluntario !== null
              ? corteTodosVoluntario
              : (prev[titulo]?.voluntario ?? null),
        };
      });
      return novo;
    });
  };

  return (
    <>
      <main className={styles.main}>
        <div className={styles.topBar}>
          <button
            className={styles.voltar}
            type="button"
            onClick={() =>
              router.push(
                `/${params.tenant}/gestor/${params.ano}/avaliacoes/projetos/acompanhamento`
              )
            }
          >
            <RiArrowLeftLine size={18} /> Acompanhar avaliação
          </button>
        </div>

        <Header
          className="mb-3"
          titulo="Simular Nota de Corte"
          descricao="Defina a nota de corte de cada edital — separada para Bolsista e Voluntário(a), já que muitos editais usam régua diferente para cada modalidade — e veja quantos planos seriam aprovados ou reprovados. Nenhum dado é alterado, é só uma simulação."
        />

        <Card className="mb-4 p-2">
          <h5 className="mb-2">Notas de Corte por Edital e Modalidade</h5>

          <div className={styles.aplicarTodos}>
            <div>
              <label htmlFor="corteTodosBolsista">
                Aplicar a todos os editais — Bolsista
              </label>
              <InputNumber
                inputId="corteTodosBolsista"
                value={corteTodosBolsista}
                onValueChange={(e) => setCorteTodosBolsista(e.value ?? null)}
                mode="decimal"
                maxFractionDigits={2}
                placeholder="Ex: 60"
              />
            </div>
            <div>
              <label htmlFor="corteTodosVoluntario">
                Aplicar a todos os editais — Voluntário(a)
              </label>
              <InputNumber
                inputId="corteTodosVoluntario"
                value={corteTodosVoluntario}
                onValueChange={(e) => setCorteTodosVoluntario(e.value ?? null)}
                mode="decimal"
                maxFractionDigits={2}
                placeholder="Ex: 50"
              />
            </div>
            <PrimeButton
              label="Aplicar a todos"
              icon="pi pi-check"
              className="p-button-outlined"
              onClick={handleAplicarATodos}
              disabled={corteTodosBolsista === null && corteTodosVoluntario === null}
            />
          </div>

          <DataTable
            value={resultadoPorEdital}
            loading={loading}
            className="mt-3"
            emptyMessage="Nenhum plano avaliado neste ano ainda."
            rowGroupMode="subheader"
            groupRowsBy="editalTitulo"
            rowGroupHeaderTemplate={(row) => <strong>{row.editalTitulo}</strong>}
          >
            <Column
              field="modalidadeLabel"
              header="Modalidade"
              body={(row) => (
                <Tag
                  severity={row.modalidade === "bolsista" ? "info" : undefined}
                  value={row.modalidadeLabel}
                />
              )}
            />
            <Column
              header="Nota de Corte"
              body={(row) => (
                <InputNumber
                  value={cortes[row.editalTitulo]?.[row.modalidade] ?? null}
                  onValueChange={(e) =>
                    handleCorteChange(row.editalTitulo, row.modalidade, e.value ?? null)
                  }
                  mode="decimal"
                  maxFractionDigits={2}
                  placeholder="Definir"
                  inputStyle={{ width: "6rem" }}
                />
              )}
            />
            <Column
              field="total"
              header="Planos Avaliados"
              style={{ textAlign: "center" }}
            />
            <Column
              header="Aprovados"
              body={(row) => (row.corte !== null ? row.aprovados : "—")}
              style={{ textAlign: "center" }}
            />
            <Column
              header="Reprovados"
              body={(row) => (row.corte !== null ? row.reprovados : "—")}
              style={{ textAlign: "center" }}
            />
            <Column
              header="Taxa de Aprovação"
              body={(row) =>
                row.taxaAprovacao !== null
                  ? `${row.taxaAprovacao.toFixed(1)}%`
                  : "—"
              }
              style={{ textAlign: "center" }}
            />
          </DataTable>
        </Card>

        <Card className="mb-4 p-2">
          <h5 className="mb-2">Resumo Geral da Simulação</h5>
          {resumoGeral.linhasComCorte === 0 ? (
            <p>
              {loading
                ? "Carregando dados..."
                : "Defina a nota de corte de pelo menos uma modalidade acima para ver o resumo geral."}
            </p>
          ) : (
            <>
              {resumoGeral.linhasSemCorte > 0 && (
                <p className={styles.avisoPendente}>
                  {resumoGeral.linhasSemCorte} de {resultadoPorEdital.length}{" "}
                  combinações de edital/modalidade ainda sem nota de corte
                  definida — não entram no resumo abaixo.
                </p>
              )}
              <div className={`${styles.dashboard} mb-3`}>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{resumoGeral.total}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Planos simulados</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{resumoGeral.aprovados}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Aprovados</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{resumoGeral.reprovados}</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Reprovados</h6>
                  </div>
                </div>
                <div className={styles.card_style1}>
                  <div className={styles.left}>
                    <h5>{resumoGeral.taxaAprovacao.toFixed(1)}%</h5>
                  </div>
                  <div className={styles.right}>
                    <h6>Taxa de aprovação</h6>
                  </div>
                </div>
              </div>

              <h6 className={styles.grupoLabel}>Por modalidade</h6>
              <div className={styles.statTilesRow}>
                <div className={styles.statTile}>
                  <RiGraduationCapLine />
                  <div>
                    <h5>
                      {resumoGeral.bolsasAprovadas} aprovada(s) ·{" "}
                      {resumoGeral.bolsasReprovadas} reprovada(s)
                    </h5>
                    <p>
                      Bolsistas — as {resumoGeral.bolsasAprovadas}{" "}
                      aprovadas são as solicitações de bolsa que teriam que
                      ser atendidas
                    </p>
                  </div>
                </div>
                <div className={styles.statTile}>
                  <RiHandHeartLine />
                  <div>
                    <h5>
                      {resumoGeral.voluntariosAprovados} aprovado(s) ·{" "}
                      {resumoGeral.voluntariosReprovados} reprovado(s)
                    </h5>
                    <p>Voluntários(as)</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        {chartData.labels.length > 0 && (
          <Card className="mb-4 p-2">
            <h5 className="mb-2">Aprovados vs. Reprovados por Edital e Modalidade</h5>
            <Chart
              type="bar"
              data={chartData}
              options={chartOptions}
              style={{ height: "360px" }}
            />
          </Card>
        )}
      </main>
      <Toast ref={toast} />
    </>
  );
};

export default Page;

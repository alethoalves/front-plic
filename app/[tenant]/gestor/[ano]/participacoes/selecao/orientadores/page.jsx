"use client";
import React, { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast";
import { getParticipacoesByTenant } from "@/app/api/client/participacao";
import styles from "./page.module.scss";
import { getAllPlanoDeTrabalhosByTenant } from "@/app/api/client/planoDeTrabalho";
import UnderConstruction from "@/components/UnderConstruction";

// Funções de cálculo ajustadas
const calcularMedia = (avaliacoes) => {
  if (!avaliacoes || avaliacoes.length === 0) return 0;
  const notas = avaliacoes.map((a) => parseFloat(a.notaTotal) || []);
  const notasValidas = notas.filter((nota) => !isNaN(nota));
  return notasValidas.length > 0
    ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
    : 0;
};

const calcularDiferencaNotas = (fichas) => {
  if (!fichas || fichas.length === 0) return 0;
  const notas = fichas
    .map((f) => parseFloat(f.notaTotal))
    .filter((nota) => !isNaN(nota));
  return notas.length > 0 ? Math.max(...notas) - Math.min(...notas) : 0;
};

const calcularMediaAlunos = (participacoes) => {
  const notas =
    participacoes
      ?.filter(
        (p) => p.tipo === "aluno" && p.notaAluno !== null && !isNaN(p.notaAluno)
      )
      ?.map((p) => parseFloat(p.notaAluno)) || [];
  return notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
};

const calcularMediaRA = (participacoes) => {
  const ras =
    participacoes
      ?.filter(
        (p) => p.tipo === "aluno" && p.userTenant?.rendimentoAcademico !== null
      )
      ?.map((p) => parseFloat(p.userTenant?.rendimentoAcademico))
      ?.filter((ra) => !isNaN(ra)) || [];
  return ras.length > 0 ? ras.reduce((a, b) => a + b, 0) / ras.length : 0;
};

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dadosTabela, setDadosTabela] = useState([]);
  const [colunasEditais, setColunasEditais] = useState([]);
  const [expandedRows, setExpandedRows] = useState(null);
  const [planosCompletos, setPlanosCompletos] = useState([]);
  const toast = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Busca as participações dos orientadores
        const participacoes = await getParticipacoesByTenant(
          params.tenant,
          "orientador",
          params.ano
        );

        // Busca todos os planos de trabalho
        const todosPlanos = await getAllPlanoDeTrabalhosByTenant(
          params.tenant,
          params.ano || null
        );

        setPlanosCompletos(todosPlanos);

        const mapa = new Map();
        const editaisSet = new Set();

        participacoes.forEach((item) => {
          const orientadorId = item.userId;
          const nome = item.user?.nome || "N/A";
          const inscricoes = item.inscricao ? [item.inscricao] : [];
          const editalTitulo = item.inscricao?.edital?.titulo;

          if (editalTitulo) editaisSet.add(editalTitulo);

          if (!mapa.has(orientadorId)) {
            mapa.set(orientadorId, {
              id: orientadorId,
              nome,
              totalPlanos: new Set(),
              planosDetalhados: [],
            });
          }

          const orientador = mapa.get(orientadorId);

          // Inicializa o Set para o edital se não existir
          if (editalTitulo && !orientador[`planos_${editalTitulo}`]) {
            orientador[`planos_${editalTitulo}`] = new Set();
          }

          // Filtrar planos que pertencem a este orientador
          const planosOrientador = todosPlanos.filter((plano) => {
            return inscricoes.some(
              (inscricao) => inscricao.id === plano.inscricaoId
            );
          });

          planosOrientador.forEach((p) => {
            const notaProjeto = calcularMedia(
              p.projeto?.InscricaoProjeto?.FichaAvaliacao || []
            );
            const notaPlano = calcularMedia(p.FichaAvaliacao || []);
            const notaOrientador = parseFloat(p.inscricao?.notaOrientador) || 0;
            const mediaAlunos = calcularMediaAlunos(p.participacoes || []);
            const mediaRA = calcularMediaRA(p.participacoes || []);
            const notaTotal =
              notaProjeto + notaPlano + notaOrientador + mediaAlunos;

            // Adiciona ao total geral
            orientador.totalPlanos.add(p.id);

            // Adiciona ao total por edital (se existir edital)
            if (editalTitulo) {
              orientador[`planos_${editalTitulo}`].add(p.id);
            }

            orientador.planosDetalhados.push({
              ...p,
              inscricao: p.inscricao,
              projeto: p.projeto,
              participacoes: p.participacoes,
              classificado: p.classificado || false,
              justificativa: p.justificativa || "",
              notaProjeto: parseFloat(notaProjeto.toFixed(4)),
              diferencaNotasProjeto: parseFloat(
                calcularDiferencaNotas(
                  p.projeto?.InscricaoProjeto?.FichaAvaliacao || []
                ).toFixed(4)
              ),
              notaPlano: parseFloat(notaPlano.toFixed(4)),
              notaOrientador: parseFloat(notaOrientador.toFixed(4)),
              mediaNotasAlunos: parseFloat(mediaAlunos.toFixed(4)),
              mediaRA: parseFloat(mediaRA.toFixed(4)),
              notaTotal: parseFloat(notaTotal.toFixed(4)),
              qtdFichas: (p.projeto?.InscricaoProjeto?.FichaAvaliacao || [])
                .length,
              qtdFichasPlano: (p.FichaAvaliacao || []).length,
              alunoParticipacoes:
                (p.participacoes || [])
                  .map(
                    (part) =>
                      `${part.user?.nome || "N/A"} (${part.status || "N/A"})`
                  )
                  .join("; ") || "Nenhum aluno vinculado",
              avaliadores:
                (p.projeto?.InscricaoProjeto?.InscricaoProjetoAvaliador || [])
                  .map((a) => a.avaliador?.nome)
                  .filter(Boolean)
                  .join("; ") || "Nenhum avaliador",
            });
          });
        });

        const editais = Array.from(editaisSet).sort();
        setColunasEditais(editais);

        const dados = Array.from(mapa.values()).map((item) => {
          const result = {
            ...item,
            totalPlanos: item.totalPlanos.size,
            planos: item.planosDetalhados,
          };

          editais.forEach((edital) => {
            result[`planos_${edital}`] = item[`planos_${edital}`]?.size || 0;
          });

          return result;
        });

        setDadosTabela(dados);
      } catch (err) {
        console.error("Erro:", err);
        setError("Erro ao carregar os dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.tenant, params.ano]);

  const headerGroup = (
    <ColumnGroup>
      <Row>
        <Column header="" rowSpan={2} style={{ width: "3rem" }} />
        <Column header="Nome" rowSpan={2} />
        <Column header="Totais Gerais" colSpan={1} />
        {colunasEditais.map((edital) => (
          <Column key={edital} header={edital} colSpan={1} />
        ))}
      </Row>
      <Row>
        <Column header="Planos" field="totalPlanos" sortable />
        {colunasEditais.map((edital) => (
          <Column
            key={`planos_${edital}_h`}
            header="Planos"
            field={`planos_${edital}`}
            sortable
          />
        ))}
      </Row>
    </ColumnGroup>
  );

  const renderStatusClassificacao = (rowData) => {
    return (
      <div>
        {rowData.classificado ? (
          <span className={styles.classificado}>Classificado</span>
        ) : (
          <div>
            <span className={styles.desclassificado}>Desclassificado</span>
            {rowData.justificativa && (
              <div className={styles.justificativa}>
                <small>Justificativa:{rowData.justificativa}</small>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const rowExpansionTemplate = (data) => {
    return (
      <div className="p-3">
        <h5>Planos de Trabalho de {data.nome}</h5>
        <DataTable
          value={data.planosDetalhados}
          emptyMessage="Nenhum plano encontrado"
        >
          <Column
            field="id"
            header="ID_Plano"
            sortable
            filter
            filterPlaceholder="Filtrar por id"
            style={{ width: "8rem" }}
          />
          <Column
            field="inscricao.edital.titulo"
            header="Edital"
            sortable
            filter
            filterPlaceholder="Filtrar por edital"
          />
          <Column
            header="Status Classificação"
            body={renderStatusClassificacao}
            sortable
            style={{ width: "12rem" }}
          />
          <Column
            field="notaTotal"
            header="Nota Total"
            sortable
            dataType="numeric"
            body={(rowData) => rowData.notaTotal?.toFixed(4)}
            style={{ textAlign: "center", width: "8rem" }}
          />
          <Column
            field="notaProjeto"
            header="Nota Projeto"
            sortable
            dataType="numeric"
            body={(rowData) => rowData.notaProjeto?.toFixed(4)}
            style={{ textAlign: "center", width: "8rem" }}
          />
          <Column
            field="diferencaNotasProjeto"
            header="Dif. Notas Projeto"
            sortable
            dataType="numeric"
            body={(rowData) => rowData.diferencaNotasProjeto?.toFixed(4)}
            style={{ textAlign: "center", width: "8rem" }}
          />
          <Column
            field="notaPlano"
            header="Nota Plano"
            sortable
            dataType="numeric"
            body={(rowData) => rowData.notaPlano?.toFixed(4)}
            style={{ textAlign: "center", width: "8rem" }}
          />
          <Column
            field="notaOrientador"
            header="Nota Orientador"
            sortable
            dataType="numeric"
            body={(rowData) => rowData.notaOrientador?.toFixed(4)}
            style={{ textAlign: "center", width: "8rem" }}
          />
          <Column
            field="mediaNotasAlunos"
            header="Média Alunos"
            sortable
            dataType="numeric"
            body={(rowData) => rowData.mediaNotasAlunos?.toFixed(4)}
            style={{ textAlign: "center", width: "8rem" }}
          />
          <Column
            field="mediaRA"
            header="Média RA"
            sortable
            dataType="numeric"
            body={(rowData) => rowData.mediaRA?.toFixed(4)}
            style={{ textAlign: "center", width: "8rem" }}
          />
        </DataTable>
      </div>
    );
  };

  return (
    <main>
      <Toast ref={toast} />
      {loading ? (
        <div className="p-2">
          <ProgressBar mode="indeterminate" style={{ height: "6px" }} />
        </div>
      ) : error ? (
        <Message severity="error" text={error} />
      ) : (
        <>
          <Card className="p-3">
            <UnderConstruction />
          </Card>
          {false && (
            <Card>
              <DataTable
                value={dadosTabela}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={rowExpansionTemplate}
                dataKey="id"
                paginator
                rows={10}
                emptyMessage="Nenhum orientador encontrado."
                headerColumnGroup={headerGroup}
                sortMode="single"
                tableStyle={{ minWidth: "80rem" }}
              >
                <Column expander style={{ width: "3rem" }} />
                <Column field="nome" header="Nome" />
                <Column field="totalPlanos" header="Planos" sortable />
                {colunasEditais.map((edital) => (
                  <Column key={`planos_${edital}`} field={`planos_${edital}`} />
                ))}
              </DataTable>
            </Card>
          )}
        </>
      )}
    </main>
  );
};

export default Page;

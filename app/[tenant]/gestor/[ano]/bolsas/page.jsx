"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { ProgressSpinner } from "primereact/progressspinner";
import { MultiSelect } from "primereact/multiselect";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getParticipacoesByTenant } from "@/app/api/client/participacao";
import { Toast } from "primereact/toast";
import styles from "./page.module.scss";
import { getEditais } from "@/app/api/client/edital";
import { getSolicitacoesBolsa } from "@/app/api/client/bolsa";
import { ProgressBar } from "primereact/progressbar";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itens, setItens] = useState([]); // Dados completos
  const [filteredItens, setFilteredItens] = useState([]); // Dados filtrados
  const [selectedItems, setSelectedItems] = useState([]);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [statusFiltro, setStatusFiltro] = useState([]);
  const [tipoFiltro, setTipoFiltro] = useState([]);
  const [selectedAno, setSelectedAno] = useState(null); // Ano selecionado
  const [anos, setAnos] = useState([]); // Array de anos únicos
  const dataTableRef = useRef(null);
  const toast = useRef(null);

  // Filtros do DataTable
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
    "user.nome": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
    status: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    tipo: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }],
    },
    "planoDeTrabalho.titulo": {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }],
    },
  });

  // Buscar dados das participações e editais
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const editaisTenant = await getEditais(params.tenant);

        // Extrair anos únicos dos editais
        const anosUnicos = [
          ...new Set(editaisTenant.map((edital) => edital.ano)),
        ].sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo

        setAnos(anosUnicos); // Definir os anos únicos

        // Definir o ano mais recente como selecionado
        if (anosUnicos.length > 0) {
          setSelectedAno(anosUnicos[0]); // O primeiro ano é o mais recente
        }

        // Buscar participações do ano mais recente
        if (anosUnicos.length > 0) {
          const solicitacoes = await getSolicitacoesBolsa(
            params.tenant,
            anosUnicos[0] // Passar o ano mais recente como parâmetro
          );
          setItens(solicitacoes || []);
          setFilteredItens(solicitacoes || []);
        }
      } catch (error) {
        console.error("Erro ao buscar participações:", error);
        setError("Erro ao buscar participações.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  // Quando o ano selecionado mudar, buscar participações filtradas por ano
  useEffect(() => {
    const fetchParticipacoesByAno = async () => {
      if (selectedAno !== null) {
        setLoading(true);
        setError(null);
        try {
          const solicitacoes = await getSolicitacoesBolsa(
            params.tenant,
            selectedAno // Passar o ano selecionado como parâmetro
          );
          setItens(solicitacoes || []);
          setFilteredItens(solicitacoes || []);
        } catch (error) {
          console.error("Erro ao buscar participações:", error);
          setError("Erro ao buscar participações.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchParticipacoesByAno();
  }, [selectedAno, params.tenant]);

  // Função para obter os nomes dos orientadores
  const getOrientadores = (inscricao) => {
    if (!inscricao || !inscricao.participacoes) return "";

    // Filtra os participantes do tipo "orientador"
    const orientadores = inscricao.participacoes.filter(
      (participacao) => participacao.tipo === "orientador"
    );

    // Extrai os nomes dos orientadores
    const nomesOrientadores = orientadores.map(
      (orientador) => orientador.user.nome
    );

    // Retorna os nomes separados por vírgula
    return nomesOrientadores.join(", ");
  };

  // Função para calcular a média das notas do projeto
  const getMediaNotasProjeto = (planoDeTrabalho) => {
    if (
      !planoDeTrabalho ||
      !planoDeTrabalho.projeto ||
      !planoDeTrabalho.projeto.InscricaoProjeto ||
      planoDeTrabalho.projeto.InscricaoProjeto.length === 0
    ) {
      return "N/A"; // Retorna "N/A" se não houver notas
    }

    // Acessa as fichas de avaliação
    const fichasAvaliacao =
      planoDeTrabalho.projeto.InscricaoProjeto[0].FichaAvaliacao;

    if (!fichasAvaliacao || fichasAvaliacao.length === 0) {
      return "N/A"; // Retorna "N/A" se não houver fichas de avaliação
    }

    // Calcula a média das notas
    const totalNotas = fichasAvaliacao.reduce(
      (sum, ficha) => sum + ficha.notaTotal,
      0
    );
    const media = totalNotas / fichasAvaliacao.length;

    return media.toFixed(2); // Retorna a média com 2 casas decimais
  };

  // Cabeçalho da tabela
  const renderHeader = () => {
    return (
      <div className="">
        <h4 className="m-0 ">Bolsas</h4>
        <div className="">
          <label htmlFor="filtroStatus" className="mt-2 block">
            <p>Selecione o ano:</p>
          </label>
          <div className={styles.anos}>
            {anos.map((ano) => (
              <div
                key={ano}
                className={`${styles.ano} ${
                  selectedAno === ano ? styles.selected : ""
                }`}
                onClick={() => setSelectedAno(ano)} // Define o ano selecionado
              >
                {ano}
              </div>
            ))}
          </div>
          <label htmlFor="filtroStatus" className="mt-2 block">
            <p>Quotas de bolsas:</p>
          </label>
          <div className={styles.quotas}>
            <div className={styles.quota}>
              <h6>FAP-DF</h6>
              <div className={styles.quotaInfo}>
                <p>
                  Disponíveis: <strong>200</strong>
                </p>
                <p>
                  Alocadas com pendências: <strong>30</strong>
                </p>
                <p>
                  Alocadas sem pendências: <strong>30</strong>
                </p>
                <p>
                  Total: <strong>260</strong>
                </p>
              </div>
            </div>
            <div className={styles.quota}>
              <h6>CNPq</h6>
              <div className={styles.quotaInfo}>
                <p>
                  Disponíveis: <strong>200</strong>
                </p>
                <p>
                  Alocadas com pendências: <strong>30</strong>
                </p>
                <p>
                  Alocadas sem pendências: <strong>30</strong>
                </p>
                <p>
                  Total: <strong>260</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main>
      <Toast ref={toast} />
      {loading ? (
        <div className="flex justify-center items-center h-20">
          <ProgressBar />
        </div>
      ) : error ? (
        <Message severity="error" text={error} />
      ) : (
        <Card className="custom-card">
          <DataTable
            ref={dataTableRef}
            value={filteredItens}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            scrollable
            selectionMode={"checkbox"}
            selection={selectedItems}
            onSelectionChange={(e) => setSelectedItems(e.value)}
            dataKey="id"
            header={renderHeader()}
            filters={filters}
            filterDisplay="menu"
            globalFilterFields={[
              "inscricao.edital.ano",
              "inscricao.edital.titulo",
              "user.nome",
              "status",
              "tipo",
              "planoDeTrabalho.titulo",
            ]}
            emptyMessage="Nenhuma participação encontrada."
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column
              field="inscricao.edital.titulo"
              header="Edital"
              sortable
              filter
            />
            <Column
              header="Orientadores"
              body={(rowData) => getOrientadores(rowData.inscricao)}
            />
            <Column
              header="Nota Projeto"
              body={(rowData) => getMediaNotasProjeto(rowData.planoDeTrabalho)}
            />
            <Column
              field="planoDeTrabalho.titulo"
              header="Plano de Trabalho"
              sortable
              filter
              bodyStyle={{
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            />
            <Column field="user.nome" header="Aluno" sortable filter />
            <Column field="user.cpf" header="CPF" sortable filter />
            <Column field="status" header="Status" sortable filter />
          </DataTable>
        </Card>
      )}
    </main>
  );
};

export default Page;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiArrowGoBackLine } from "@remixicon/react";
import { Toast } from "primereact/toast";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button as PrimeButton } from "primereact/button";
import { FilterMatchMode } from "primereact/api";

import styles from "./TabelaRecursosGestor.module.scss";
import Skeleton from "@/components/Skeleton";
import NoData from "@/components/NoData";
import { Badge } from "@/components/Badge";
import ModalDelete from "@/components/ModalDelete";
import { listarPlanosComRecursoGestor, reverterAnaliseRecursoGestor } from "@/app/api/client/recurso";
import {
  notaRowFilterTemplate,
  editalRowFilterTemplate,
} from "@/lib/tableTemplates";

const STATUS_RECURSOS_OPCOES = [
  { label: "Analisados", value: "Analisados" },
  { label: "Pendentes", value: "Pendentes" },
];

const formatNota = (nota) => (typeof nota === "number" ? nota.toFixed(2) : "—");

// Fábrica dos filtros iniciais — usada tanto no useState quanto no reset do
// botão "Limpar Filtros", pra não duplicar o objeto em dois lugares (mesmo
// padrão de TabelaPlanoDeTrabalhoAcompanhamento.jsx).
const getInitialFilters = () => ({
  global: { value: "", matchMode: FilterMatchMode.CONTAINS },
  edital: { value: [], matchMode: FilterMatchMode.IN },
  orientadoresString: { value: "", matchMode: FilterMatchMode.CONTAINS },
  alunosString: { value: "", matchMode: FilterMatchMode.CONTAINS },
  projetoTitulo: { value: "", matchMode: FilterMatchMode.CONTAINS },
  areaProjeto: { value: [], matchMode: FilterMatchMode.IN },
  titulo: { value: "", matchMode: FilterMatchMode.CONTAINS },
  notaProjeto: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
  notaExtraRecursoProjeto: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
  notaPlano: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
  notaExtraRecursoPlano: { value: [undefined, undefined], matchMode: "intervalo_numerico" },
  statusRecursos: { value: [], matchMode: FilterMatchMode.IN },
});

const TabelaRecursosGestor = ({ tenant, ano }) => {
  const router = useRouter();
  const toast = useRef(null);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState(getInitialFilters());
  const [planoParaReverter, setPlanoParaReverter] = useState(null);
  const [revertendo, setRevertendo] = useState(false);
  const [errorReverter, setErrorReverter] = useState("");

  const fetchPlanos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarPlanosComRecursoGestor(tenant, ano);
      setPlanos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar planos com recurso:", error);
    } finally {
      setLoading(false);
    }
  }, [tenant, ano]);

  useEffect(() => {
    fetchPlanos();
  }, [fetchPlanos]);

  const itensProcessados = useMemo(
    () =>
      planos.map((plano) => ({
        ...plano,
        edital: plano.inscricao?.edital?.titulo ?? "—",
        orientadoresString:
          plano.inscricao?.participacoes?.map((p) => p.user?.nome).filter(Boolean).join(", ") || "—",
        alunosString:
          plano.participacoes?.map((p) => p.user?.nome).filter(Boolean).join(", ") || "—",
        projetoTitulo: plano.inscricaoProjeto?.projeto?.titulo ?? null,
        areaProjeto: plano.inscricaoProjeto?.projeto?.area?.area ?? null,
        // pendentes/todosAnalisados já vêm do backend, agregados por família
        // (projeto + planos irmãos) — nunca calculados só a partir da linha.
        statusRecursos: plano.todosAnalisados ? "Analisados" : "Pendentes",
      })),
    [planos]
  );

  const editaisDisponiveis = useMemo(() => {
    const unicos = [...new Set(itensProcessados.map((item) => item.edital))];
    return unicos.map((edital) => ({ label: edital, value: edital }));
  }, [itensProcessados]);

  const areasDisponiveis = useMemo(() => {
    const unicos = [...new Set(itensProcessados.map((item) => item.areaProjeto).filter(Boolean))];
    return unicos.map((area) => ({ label: area, value: area }));
  }, [itensProcessados]);

  const irParaAnalise = (planoId) => {
    router.push(`/${tenant}/gestor/${ano}/resultados-recursos/${planoId}/analise`);
  };

  // Reverte em bloco TODA a análise da família (projeto + planos irmãos, ou
  // só o próprio plano) — volta todos os recursos pra pendente de uma vez.
  const handleReverter = async () => {
    if (!planoParaReverter) return;
    setRevertendo(true);
    setErrorReverter("");
    try {
      const resultado = await reverterAnaliseRecursoGestor(tenant, planoParaReverter.id);
      setPlanoParaReverter(null);
      toast.current?.show({ severity: "success", summary: "Sucesso", detail: resultado.message, life: 4000 });
      fetchPlanos();
    } catch (error) {
      setErrorReverter(error.response?.data?.message || "Não foi possível reverter a análise.");
    } finally {
      setRevertendo(false);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, global: { ...prev.global, value } }));
    setGlobalFilterValue(value);
  };

  const clearFilters = () => {
    setFilters(getInitialFilters());
    setGlobalFilterValue("");
  };

  const renderHeader = () => (
    <div className="flex flex-wrap justify-content-between align-items-center gap-2">
      <PrimeButton
        icon="pi pi-filter-slash"
        label="Limpar Filtros"
        onClick={clearFilters}
        className="p-button-outlined p-button-secondary"
      />
      <InputText
        className="w-100"
        value={globalFilterValue}
        onChange={onGlobalFilterChange}
        placeholder="Pesquisar..."
      />
    </div>
  );

  if (loading) {
    return (
      <>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </>
    );
  }

  if (itensProcessados.length === 0) {
    return <NoData description="Nenhum plano de trabalho com recurso pendente ou analisado neste ano." />;
  }

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <ModalDelete
        isOpen={!!planoParaReverter}
        title="Reverter análise de recurso"
        onClose={() => {
          setPlanoParaReverter(null);
          setErrorReverter("");
        }}
        confirmationText={`Tem certeza que deseja reverter a análise de todos os recursos de "${planoParaReverter?.titulo ?? ""}"? Os ${planoParaReverter?.totalRecursos ?? 0} recurso(s) da família (projeto e planos respectivos) voltam a ficar pendentes, e as decisões já tomadas são apagadas.`}
        errorDelete={errorReverter}
        handleDelete={handleReverter}
        icon={RiArrowGoBackLine}
        txtBtn={revertendo ? "Revertendo..." : "Reverter"}
      />
      <DataTable
      value={itensProcessados}
      dataKey="id"
      paginator
      rows={20}
      rowsPerPageOptions={[20, 50, 100]}
      stripedRows
      scrollable
      header={renderHeader()}
      filters={filters}
      onFilter={(e) => setFilters(e.filters)}
      filterDisplay="row"
      globalFilterFields={["edital", "orientadoresString", "alunosString", "projetoTitulo", "areaProjeto", "titulo"]}
      emptyMessage="Nenhum plano encontrado."
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
    >
      <Column
        field="edital"
        header="Edital"
        sortable
        filter
        showFilterMenu={false}
        filterElement={(options) => editalRowFilterTemplate(options, editaisDisponiveis)}
        style={{ minWidth: "10rem", maxWidth: "16rem" }}
      />
      <Column
        field="orientadoresString"
        header="Orientador(es)"
        sortable
        filter
        filterPlaceholder="Filtrar"
        style={{ minWidth: "12rem", maxWidth: "20rem" }}
      />
      <Column
        field="alunosString"
        header="Aluno(s)"
        sortable
        filter
        filterPlaceholder="Filtrar"
        style={{ minWidth: "12rem", maxWidth: "20rem" }}
      />
      <Column
        field="projetoTitulo"
        header="Projeto"
        sortable
        filter
        filterPlaceholder="Filtrar"
        body={(row) =>
          row.projetoTitulo ? (
            <span className={styles.link} onClick={() => irParaAnalise(row.id)}>
              {row.projetoTitulo}
            </span>
          ) : (
            "—"
          )
        }
        style={{ minWidth: "12rem", maxWidth: "22rem" }}
      />
      <Column
        field="areaProjeto"
        header="Área do Projeto"
        sortable
        filter
        showFilterMenu={false}
        filterElement={(options) => editalRowFilterTemplate(options, areasDisponiveis)}
        body={(row) => (row.areaProjeto ? <Badge variant="info">{row.areaProjeto}</Badge> : "—")}
        style={{ minWidth: "10rem", maxWidth: "14rem" }}
      />
      <Column
        field="titulo"
        header="Plano"
        sortable
        filter
        filterPlaceholder="Filtrar"
        body={(row) => (
          <span className={styles.link} onClick={() => irParaAnalise(row.id)}>
            {row.titulo}
          </span>
        )}
        style={{ minWidth: "12rem", maxWidth: "22rem" }}
      />
      <Column
        field="notaProjeto"
        header="Nota Projeto"
        sortable
        filter
        showFilterMenu={false}
        filterElement={notaRowFilterTemplate}
        body={(row) => formatNota(row.notaProjeto)}
        style={{ minWidth: "9rem", maxWidth: "11rem" }}
      />
      <Column
        field="notaExtraRecursoProjeto"
        header="Nota Extra (Recurso Projeto)"
        headerClassName={styles.headerWrap}
        sortable
        filter
        showFilterMenu={false}
        filterElement={notaRowFilterTemplate}
        body={(row) => <span className={styles.notaExtra}>{formatNota(row.notaExtraRecursoProjeto)}</span>}
        style={{ minWidth: "9rem", maxWidth: "11rem" }}
      />
      <Column
        field="notaPlano"
        header="Nota Plano"
        sortable
        filter
        showFilterMenu={false}
        filterElement={notaRowFilterTemplate}
        body={(row) => formatNota(row.notaPlano)}
        style={{ minWidth: "9rem", maxWidth: "11rem" }}
      />
      <Column
        field="notaExtraRecursoPlano"
        header="Nota Extra (Recurso Plano)"
        headerClassName={styles.headerWrap}
        sortable
        filter
        showFilterMenu={false}
        filterElement={notaRowFilterTemplate}
        body={(row) => <span className={styles.notaExtra}>{formatNota(row.notaExtraRecursoPlano)}</span>}
        style={{ minWidth: "9rem", maxWidth: "11rem" }}
      />
      <Column
        field="statusRecursos"
        header="Recursos"
        sortable
        filter
        showFilterMenu={false}
        filterElement={(options) => editalRowFilterTemplate(options, STATUS_RECURSOS_OPCOES)}
        body={(row) =>
          row.todosAnalisados ? (
            <Badge variant="success">Analisados</Badge>
          ) : (
            <Badge variant="warning">{row.pendentes} pendente{row.pendentes > 1 ? "s" : ""}</Badge>
          )
        }
        style={{ minWidth: "10rem", maxWidth: "12rem" }}
      />
      <Column
        field="emAnaliseCom.nome"
        header="Em análise por"
        sortable
        body={(row) => row.emAnaliseCom?.nome || "—"}
        style={{ minWidth: "10rem", maxWidth: "12rem" }}
      />
      <Column
        header="Ações"
        body={(row) => {
          const nadaParaReverter = row.pendentes === row.totalRecursos;
          return (
            <button
              type="button"
              className={styles.acaoReverter}
              onClick={() => setPlanoParaReverter(row)}
              disabled={nadaParaReverter}
              title={
                nadaParaReverter
                  ? "Nenhum recurso analisado para reverter."
                  : "Reverter análise de todos os recursos (volta pra pendente)"
              }
            >
              <RiArrowGoBackLine />
            </button>
          );
        }}
        style={{ minWidth: "5rem", maxWidth: "6rem" }}
      />
      </DataTable>
    </>
  );
};

export default TabelaRecursosGestor;

"use client";
import { useMemo, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from "primereact/multiselect";
import { InputText } from "primereact/inputtext";
import { RiUser2Line, RiGraduationCapLine } from "@remixicon/react";
import styles from "./TabelaRespostasAtividade.module.scss";
import RespostaCell from "./RespostaCell";
import NoData from "../NoData";

// Tipos com um conjunto fechado de respostas possíveis — filtro por
// MultiSelect (mesmo padrão do filtro de status em TabelaRegistroAtividade).
// Os demais tipos usam filtro de texto livre (contém), exceto arquivo/blockNote,
// que não têm um valor textual útil para filtrar.
const TIPOS_DISCRETOS = ["select", "multiselect", "checkbox", "flag"];
const TIPOS_SEM_FILTRO = ["arquivo", "blockNote"];

const getFilterTokens = (tipo, value) => {
  if (value === undefined || value === null || value === "") return [];
  if (tipo === "checkbox" || tipo === "multiselect") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return value.split(",").map((v) => v.trim()).filter(Boolean);
    }
  }
  if (tipo === "flag") return [value === "true" ? "Sim" : "Não"];
  return [String(value)];
};

const TabelaRespostasAtividade = ({ formulario, planos }) => {
  const campos = useMemo(() => formulario?.campos || [], [formulario]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState({});

  // Só faz sentido listar planos que já responderam algo desta atividade —
  // planos sem nenhuma resposta poluiriam a tabela só com células vazias.
  const baseData = useMemo(() => {
    return planos
      .filter((plano) => plano.respostas && plano.respostas.length > 0)
      .map((plano) => ({
        ...plano,
        respostasPorCampo: Object.fromEntries(
          plano.respostas.map((r) => [r.campoId, r.value])
        ),
        searchText: `${plano.titulo} ${plano.orientadores} ${plano.alunos} ${plano.orientadoresNomeCompleto} ${plano.alunosNomeCompleto}`.toLowerCase(),
      }));
  }, [planos]);

  // Opções de filtro por coluna, calculadas a partir dos valores realmente
  // respondidos (evita listar opções de campo.opcoes que ninguém escolheu).
  const campoOptions = useMemo(() => {
    const map = {};
    campos.forEach((campo) => {
      if (!TIPOS_DISCRETOS.includes(campo.tipo)) return;
      const set = new Set();
      baseData.forEach((plano) => {
        getFilterTokens(campo.tipo, plano.respostasPorCampo[campo.id]).forEach(
          (t) => set.add(t)
        );
      });
      map[campo.id] = Array.from(set)
        .sort()
        .map((v) => ({ label: v, value: v }));
    });
    return map;
  }, [campos, baseData]);

  const handleColumnFilterChange = (campoId, value) => {
    setColumnFilters((prev) => ({ ...prev, [campoId]: value }));
  };

  const filteredData = useMemo(() => {
    let result = baseData;

    if (globalFilter) {
      const q = globalFilter.toLowerCase();
      result = result.filter((plano) => plano.searchText.includes(q));
    }

    campos.forEach((campo) => {
      const filtro = columnFilters[campo.id];
      if (!filtro || (Array.isArray(filtro) && filtro.length === 0)) return;

      result = result.filter((plano) => {
        const raw = plano.respostasPorCampo[campo.id];
        if (TIPOS_DISCRETOS.includes(campo.tipo)) {
          const tokens = getFilterTokens(campo.tipo, raw);
          return filtro.some((f) => tokens.includes(f));
        }
        if (!raw) return false;
        return String(raw).toLowerCase().includes(String(filtro).toLowerCase());
      });
    });

    return result;
  }, [baseData, globalFilter, columnFilters, campos]);

  const campoHeader = (campo) => (
    <div className={styles.columnHeader}>
      <div className={styles.columnHeaderTitle}>{campo.label}</div>
      {TIPOS_DISCRETOS.includes(campo.tipo) ? (
        <MultiSelect
          value={columnFilters[campo.id] || []}
          options={campoOptions[campo.id] || []}
          onChange={(e) => handleColumnFilterChange(campo.id, e.value)}
          placeholder="Filtrar"
          className={styles.columnFilter}
        />
      ) : !TIPOS_SEM_FILTRO.includes(campo.tipo) ? (
        <InputText
          value={columnFilters[campo.id] || ""}
          onChange={(e) => handleColumnFilterChange(campo.id, e.target.value)}
          placeholder="Filtrar"
          className={styles.columnFilter}
        />
      ) : null}
    </div>
  );

  if (!campos.length) {
    return <NoData description="Este formulário não possui campos" />;
  }

  return (
    <>
      <div className={styles.tableHeader}>
        <div className={styles.searchContainer}>
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar por nome, CPF..."
            className={styles.searchInput}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <DataTable
          className={styles.table}
          value={filteredData}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 20, 50]}
          scrollable
          dataKey="id"
          emptyMessage="Nenhum plano encontrado."
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} planos"
        >
          <Column
            field="titulo"
            header="Plano de Trabalho"
            frozen
            style={{ width: "300px", maxWidth: "300px", fontWeight: "bold" }}
            body={(rowData) => (
              <div className={styles.rowCel}>
                <h6>{rowData.titulo || `Plano #${rowData.id}`}</h6>
                <div className={styles.participacoes}>
                  <div className={styles.icon}>
                    <RiUser2Line />
                  </div>
                  <div className={styles.contentParticipacoes}>
                    <p>{rowData.orientadores}</p>
                  </div>
                </div>
                <div className={styles.participacoes}>
                  <div className={styles.icon}>
                    <RiGraduationCapLine />
                  </div>
                  <div className={styles.contentParticipacoes}>
                    <p>{rowData.alunos}</p>
                  </div>
                </div>
              </div>
            )}
          />

          {campos.map((campo) => (
            <Column
              key={`campo-${campo.id}`}
              header={() => campoHeader(campo)}
              headerClassName={styles.headerWrap}
              style={{ width: "260px", maxWidth: "260px" }}
              body={(rowData) => (
                <RespostaCell
                  campo={campo}
                  value={rowData.respostasPorCampo[campo.id]}
                />
              )}
            />
          ))}
        </DataTable>
      </div>
    </>
  );
};

export default TabelaRespostasAtividade;

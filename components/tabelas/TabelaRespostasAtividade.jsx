"use client";
import { useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { RiUser2Line, RiGraduationCapLine } from "@remixicon/react";
import styles from "./TabelaRespostasAtividade.module.scss";
import RespostaCell from "./RespostaCell";
import NoData from "../NoData";

const TabelaRespostasAtividade = ({ formulario, planos }) => {
  const campos = formulario?.campos || [];

  // Só faz sentido listar planos que já responderam algo desta atividade —
  // planos sem nenhuma resposta poluiriam a tabela só com células vazias.
  // Pré-computa o lookup campoId -> value por plano, evitando refazer o find
  // a cada célula renderizada pelo PrimeReact.
  const planosComLookup = useMemo(() => {
    return planos
      .filter((plano) => plano.respostas && plano.respostas.length > 0)
      .map((plano) => ({
        ...plano,
        respostasPorCampo: Object.fromEntries(
          plano.respostas.map((r) => [r.campoId, r.value])
        ),
      }));
  }, [planos]);

  if (!campos.length) {
    return <NoData description="Este formulário não possui campos" />;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <DataTable
        className={styles.table}
        value={planosComLookup}
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
            header={campo.label}
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
  );
};

export default TabelaRespostasAtividade;

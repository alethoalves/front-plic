import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import { FilterService } from "primereact/api";
import { formatStatusText, getSeverityByStatus } from "./tagUtils";

// Match mode genérico de intervalo numérico (min/máx), reaproveitado por qualquer
// coluna numérica (notas, contagens, ids...) que precise de filtro "de X até Y".
FilterService.register("intervalo_numerico", (value, filters) => {
  const [min, max] = filters ?? [undefined, undefined];
  if (min === undefined && max === undefined) return true;
  if (typeof min === "number" && (value === null || value === undefined || value < min)) return false;
  if (typeof max === "number" && (value === null || value === undefined || value > max)) return false;
  return true;
});

// Match mode pra colunas cujo valor de linha é um array de status (ex.: várias
// participações — histórico de substituição, orientador + coorientador...) —
// casa se QUALQUER item do array estiver entre os status selecionados no filtro.
FilterService.register("status_lista_in", (value, filters) => {
  if (!filters || filters.length === 0) return true;
  const valores = Array.isArray(value) ? value : [value].filter(Boolean);
  return valores.some((v) => filters.includes(v));
});

// Match mode combinado nome+status pra colunas cujo valor de linha é um array
// de { nome, status } (ex.: orientador/coorientador de um plano) — casa se
// ALGUM item do array bater com o nome digitado (contains, case-insensitive)
// E, se houver status selecionado, também estiver entre os selecionados.
FilterService.register("nome_status_in", (value, filters) => {
  const nomeFiltro = (filters?.nome || "").trim().toLowerCase();
  const statusFiltro = filters?.status || [];
  if (!nomeFiltro && statusFiltro.length === 0) return true;
  const itens = value || [];
  return itens.some((item) => {
    const nomeOk = !nomeFiltro || item.nome?.toLowerCase().includes(nomeFiltro);
    const statusOk = statusFiltro.length === 0 || statusFiltro.includes(item.status);
    return nomeOk && statusOk;
  });
});

// Filtro combinado (nome + status) pra colunas de pessoa com participação
// (orientador/coorientador) — dois controles no mesmo painel de filtro,
// aplicados em conjunto pelo match mode "nome_status_in" acima.
export const nomeStatusFilterTemplate = (options, statusDisponiveis) => {
  const filtro = options.value || { nome: "", status: [] };
  return (
    <div className="flex flex-column gap-2" style={{ minWidth: "16rem" }}>
      <InputText
        value={filtro.nome}
        onChange={(e) =>
          options.filterApplyCallback({ ...filtro, nome: e.target.value })
        }
        placeholder="Filtrar por nome"
        className="p-column-filter"
      />
      <MultiSelect
        value={filtro.status}
        options={statusDisponiveis}
        onChange={(e) =>
          options.filterApplyCallback({ ...filtro, status: e.value })
        }
        optionLabel="label"
        placeholder="Filtrar por status"
        className="p-column-filter"
        maxSelectedLabels={2}
      />
    </div>
  );
};

// Ordena um array de elementos <Column> (cada um com `key` == seu `field`) de
// acordo com uma ordem salva (lista de chaves). Colunas sem entrada na ordem
// salva vão pro fim, preservando a ordem original entre si (sort estável).
export const ordenarColunasPorChave = (colunas, ordemSalva) => {
  if (!ordemSalva || ordemSalva.length === 0) return colunas;
  const indice = new Map(ordemSalva.map((chave, i) => [chave, i]));
  return [...colunas].sort((a, b) => {
    const ia = indice.has(a.key) ? indice.get(a.key) : Infinity;
    const ib = indice.has(b.key) ? indice.get(b.key) : Infinity;
    return ia - ib;
  });
};

export const statusClassificacaoBodyTemplate = (rowData, styles, openJustificativaModal) => {
  return (
    
    <div
      className={rowData.statusClassificacao === "DESCLASSIFICADO" ? styles?.clickableStatus : ""}
      onClick={(e) => {
        e.stopPropagation();
        if (rowData.statusClassificacao === "DESCLASSIFICADO" && rowData.justificativa) {
          openJustificativaModal(rowData);
        }
      }}
    >
      <Tag
        rounded
        severity={getSeverityByStatus(
          rowData.statusClassificacao
        )}
      >
        {formatStatusText(rowData.statusClassificacao)}
      </Tag>
      
    </div>
  );
};

export const notaRowFilterTemplate = (options) => {
    const [min, max] = options.value || [undefined, undefined];
  
    return (
      <div className="flex gap-1" style={{ alignItems: "center", gap: "8px" }}>
        <InputNumber
          value={min}
          onChange={(e) => options.filterApplyCallback([e.value, max])}
          placeholder="Mín"
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          className="w-full"
          style={{ minWidth: "60px" }}
        />
        <p>a</p>
        <InputNumber
          value={max}
          onChange={(e) => options.filterApplyCallback([min, e.value])}
          placeholder="Máx"
          mode="decimal"
          minFractionDigits={2}
          maxFractionDigits={2}
          className="w-full"
          style={{ minWidth: "60px" }}
        />
      </div>
    );
  };
  
  export const inteiroRowFilterTemplate = (options) => {
    const [min, max] = options.value || [undefined, undefined];

    return (
      <div className="flex gap-1" style={{ alignItems: "center", gap: "8px" }}>
        <InputNumber
          value={min}
          onChange={(e) => options.filterApplyCallback([e.value, max])}
          placeholder="Mín"
          mode="decimal"
          maxFractionDigits={0}
          className="w-full"
          style={{ minWidth: "60px" }}
        />
        <p>a</p>
        <InputNumber
          value={max}
          onChange={(e) => options.filterApplyCallback([min, e.value])}
          placeholder="Máx"
          mode="decimal"
          maxFractionDigits={0}
          className="w-full"
          style={{ minWidth: "60px" }}
        />
      </div>
    );
  };

  // Tema do PrimeReact usa white-space: nowrap nos itens do painel — com opções
  // de texto longo (ex. curso, forma de ingresso), o painel cresce pra caber a
  // linha inteira sem quebrar. itemTemplate + panelStyle força a quebra de linha
  // dentro de uma largura razoável (inofensivo pra labels curtos também).
  const itemTemplateQuebraLinha = (option) => (
    <span style={{ whiteSpace: "normal", wordBreak: "break-word", display: "block", lineHeight: 1.3 }}>
      {option.label}
    </span>
  );

  export const statusClassificacaoFilterTemplate = (options, statusClassificacaoDisponiveis) => {
    return (
      <MultiSelect
        value={options.value || []}
        options={statusClassificacaoDisponiveis}
        onChange={(e) => options.filterApplyCallback(e.value)}
        optionLabel="label"
        placeholder="Selecione"
        className="p-column-filter"
        maxSelectedLabels={2}
        style={{ minWidth: "14rem" }}
        panelStyle={{ maxWidth: "26rem" }}
        itemTemplate={itemTemplateQuebraLinha}
      />
    );
  };
  
  export const editalRowFilterTemplate = (options, editaisDisponiveis) => {
    return (
      <MultiSelect
        value={options.value || []}
        options={editaisDisponiveis}
        onChange={(e) => options.filterApplyCallback(e.value)}
        optionLabel="label"
        placeholder="Selecione"
        className="p-column-filter"
        maxSelectedLabels={3}
        style={{ minWidth: "14rem" }}
      />
    );
  };
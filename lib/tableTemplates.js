import { Tag } from "primereact/tag";
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
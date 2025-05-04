import { Tag } from "primereact/tag";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";
import { formatStatusText, getSeverityByStatus } from "./tagUtils";
 
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
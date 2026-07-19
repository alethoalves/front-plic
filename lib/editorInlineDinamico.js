"use client";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";

export const TURNO_OPTIONS = [
  { label: "Diurno", value: "DIURNO" },
  { label: "Matutino", value: "MATUTINO" },
  { label: "Vespertino", value: "VESPERTINO" },
  { label: "Noturno", value: "NOTURNO" },
  { label: "Virtual", value: "VIRTUAL" },
];

export const SIM_NAO_OPTIONS = [
  { label: "Sim", value: "true" },
  { label: "Não", value: "false" },
];

// Campo.tipo (formulário) -> tipo de editor inline. `null` = não editável
// (arquivo/link têm renderização própria de link; blockNote nem entra no picker).
export const tipoEditorParaCampoFormulario = (tipoCampo) => {
  switch (tipoCampo) {
    case "select":
      return "select";
    case "multiselect":
    case "checkbox":
      return "multiselect";
    case "number":
      return "number";
    case "flag":
      return "select"; // usa SIM_NAO_OPTIONS como opcoes
    case "text":
    case "textLong":
    case "date":
      return "text";
    default:
      return null;
  }
};

// Editor inline de uma célula, conforme `tipoEditor`. `opcoes` é sempre uma lista
// [{label, value}] pros tipos select/multiselect — a célula fora do modo de edição
// sempre mostra o `label`, então a pré-seleção busca a opção pelo label e o editor
// salva o `value` correspondente (que já vem no formato que o backend espera: label
// puro pra respostas de formulário, id numérico pra campos de UserTenant ligados a
// uma FK, "true"/"false" pros booleanos via SIM_NAO_OPTIONS).
// Tema do PrimeReact usa white-space: nowrap nos itens do painel — com opções
// de texto longo (ex. "Sistema de Cotas para Escolas Públicas/Candidatos..."),
// o painel cresce pra caber a linha inteira sem quebrar. itemTemplate +
// panelStyle força a quebra de linha dentro de uma largura razoável.
const itemTemplateQuebraLinha = (option) => (
  <span style={{ whiteSpace: "normal", wordBreak: "break-word", display: "block", lineHeight: 1.3 }}>
    {option.label}
  </span>
);
const panelStyleQuebraLinha = { maxWidth: "26rem" };

// Remove o ícone de seta do gatilho (a área clicável continua existindo e abre
// o painel normalmente) — o ícone tava conflitando com o clique de abrir/fechar
// dentro do editor de célula do DataTable.
const semIconeDeSeta = () => null;

export const renderEditorDinamico = (tipoEditor, opcoes, options) => {
  const valorAtual = options.value;

  if (tipoEditor === "select") {
    const opcaoAtual = opcoes.find((o) => o.label === valorAtual);
    return (
      <Dropdown
        value={opcaoAtual?.value ?? null}
        options={opcoes}
        optionLabel="label"
        optionValue="value"
        filter={opcoes.length > 6}
        placeholder="Selecione"
        onChange={(e) => options.editorCallback(e.value)}
        style={{ width: "100%" }}
        panelStyle={panelStyleQuebraLinha}
        itemTemplate={itemTemplateQuebraLinha}
        dropdownIcon={semIconeDeSeta}
      />
    );
  }

  if (tipoEditor === "multiselect") {
    const labelsAtuais =
      valorAtual && valorAtual !== "-" ? String(valorAtual).split(", ").filter(Boolean) : [];
    const valoresAtuais = labelsAtuais
      .map((label) => opcoes.find((o) => o.label === label)?.value)
      .filter((v) => v !== undefined);
    return (
      <MultiSelect
        value={valoresAtuais}
        options={opcoes}
        optionLabel="label"
        optionValue="value"
        filter={opcoes.length > 6}
        placeholder="Selecione"
        onChange={(e) => options.editorCallback(e.value)}
        style={{ width: "100%" }}
        panelStyle={panelStyleQuebraLinha}
        itemTemplate={itemTemplateQuebraLinha}
        dropdownIcon={semIconeDeSeta}
      />
    );
  }

  if (tipoEditor === "number") {
    const numero =
      valorAtual !== "-" && valorAtual !== null && valorAtual !== undefined && valorAtual !== ""
        ? Number(valorAtual)
        : null;
    return (
      <InputNumber
        value={numero !== null && isNaN(numero) ? null : numero}
        onValueChange={(e) => options.editorCallback(e.value)}
        mode="decimal"
        maxFractionDigits={4}
        style={{ width: "100%" }}
      />
    );
  }

  return (
    <InputText
      value={valorAtual === "-" || valorAtual === null || valorAtual === undefined ? "" : String(valorAtual)}
      onChange={(e) => options.editorCallback(e.target.value)}
      style={{ width: "100%" }}
      autoFocus
    />
  );
};

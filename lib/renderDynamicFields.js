import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import FileInputForDynamics from "@/components/FileInputForDynamics";
import SelectDynamic from "@/components/SelectDynamic";
import MultiSelectDynamic from "@/components/MultiSelectDynamic";
import { applyConditionalRules } from "@/lib/applyConditionalRules";
import { Controller } from "react-hook-form";
import dynamic from "next/dynamic";

const BlockNoteField = dynamic(
  () => import("@/components/Formularios/BlockNoteField"),
  { ssr: false }
);

/**
 * Verifica se um campo é alvo de alguma regra (é condicionalmente obrigatório)
 */
const isCampoAlvo = (campoId, campos) => {
  return campos.some(
    (campo) =>
      campo.regras &&
      campo.regras.some((regra) => regra.camposAlvo.includes(campoId))
  );
};

export const renderDynamicFields = (formulario, control, loading, register, errors, watch, handleFieldChangeWithRules) => {
    if (!formulario || !formulario.campos) return null;

    // Obtém os valores atuais do formulário através do watch
    const camposDinamicosValues = watch("camposDinamicos") || {};
    
    // Aplica as regras condicionais para determinar quais campos devem ser visíveis
    const visibleFieldIds = applyConditionalRules(formulario.campos, camposDinamicosValues);

    return formulario.campos
      .filter((campo) => visibleFieldIds.includes(campo.id))
      .sort((a, b) => (a.ordem || 999) - (b.ordem || 999))
      .map((campo, index) => {
        // Verifica se este campo é alvo de alguma regra
        const ehCampoAlvo = isCampoAlvo(campo.id, formulario.campos);
        
        // Se é campo alvo de regra, só é obrigatório visualmente quando visível
        // A validação no schema já foi ajustada para ser opcional
        const isVisible = visibleFieldIds.includes(campo.id);
        const obrigatorioVisual = campo.obrigatorio && (!ehCampoAlvo || isVisible);
        
      switch (campo.tipo) {
        case "textLong": // Campo de texto longo (textarea)
          return (
            <Textarea
              key={campo.id}
              className=""  
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              placeholder={campo.descricao || ""}
              disabled={loading}
              maxLength={campo.maxChar || 3000}
              rules={{
                required: obrigatorioVisual ? "Campo obrigatório!" : false,
                validate: obrigatorioVisual
                  ? (value) => (value && value.trim().length > 0) || "Campo obrigatório!"
                  : undefined,
              }}
            />
          );
        case "text": // Campo de texto curto (input)
          return (
            <Input
              key={campo.id}
              className="" 
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              inputType="text"
              placeholder={campo.descricao || ""}
              disabled={loading}
              rules={{
                required: obrigatorioVisual ? "Campo obrigatório!" : false,
                validate: obrigatorioVisual
                  ? (value) => (value && value.trim().length > 0) || "Campo obrigatório!"
                  : undefined,
                maxLength: {
                  value: campo.maxChar || 255,
                  message: `Máximo de ${campo.maxChar || 255} caracteres.`,
                },
              }}
            />
          );
        case "link": // Campo de URL
          return (
            <Input
              key={campo.id}
              className=""
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              inputType="url"
              placeholder={campo.descricao || "https://"}
              disabled={loading}
              rules={{
                required: obrigatorioVisual ? "Campo obrigatório!" : false,
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: "Informe uma URL válida (ex: https://exemplo.com)",
                },
              }}
            />
          );

        case "number": // Campo numérico
          return (
            <Input
              key={campo.id}
              className="" 
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              inputType="number"
              placeholder={campo.descricao || ""}
              disabled={loading}
              rules={{
                required: obrigatorioVisual ? "Campo obrigatório!" : false,
                validate: obrigatorioVisual
                  ? (value) => {
                      if (value === undefined || value === null || value === "") return "Campo obrigatório!";
                      const num = Number(value);
                      if (isNaN(num)) return "Deve ser um número válido!";
                      return true;
                    }
                  : undefined,
              }}
            />
          );
        case "date": // Campo de data
          return (
            <Input
              key={campo.id}
              className="" 
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              inputType="date"
              placeholder={campo.descricao || ""}
              disabled={loading}
              rules={{
                required: obrigatorioVisual ? "Campo obrigatório!" : false,
                validate: obrigatorioVisual
                  ? (value) => (value !== undefined && value !== null && value !== "") || "Campo obrigatório!"
                  : undefined,
              }}
            />
          );
        case "select": // Campo de seleção única
          return (
            <div key={campo.id} className="">
              <SelectDynamic
              key={campo.id}
              className="" 
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              placeholder={campo.descricao || "Selecione uma opção"}
              disabled={loading}
              options={campo.opcoes || []}
              campo={campo}
              onFieldChange={handleFieldChangeWithRules}
              rules={{
                required: obrigatorioVisual ? "Campo obrigatório!" : false,
                validate: obrigatorioVisual
                  ? (value) => (value !== undefined && value !== null && value !== "") || "Campo obrigatório!"
                  : undefined,
              }}
            />
            </div>
          );
        case "multiselect": // Campo de seleção múltipla
          return (
            <div key={campo.id} className="">
<MultiSelectDynamic
              key={campo.id}
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              placeholder={campo.descricao || "Selecione opções"}
              disabled={loading}
              options={campo.opcoes || []}
              campo={campo}
              onFieldChange={handleFieldChangeWithRules}
              rules={{
                required: obrigatorioVisual ? "Campo obrigatório!" : false,
                validate: obrigatorioVisual
                  ? (value) => (Array.isArray(value) && value.length > 0) || "Selecione pelo menos uma opção!"
                  : undefined,
              }}
            />
            </div>
            
          );
        case "arquivo": // Campo de arquivo
          // Declare o estado para armazenar o arquivo selecionado
          return (
            <FileInputForDynamics
              key={campo.id}
              loading={loading}
              watch={watch} 
              campo={campo}
              register={register}
              errors={errors}
              handleOnChange={(e) => {
                const file = e.target.files[0];
                // Outras lógicas que você precise executar...
              }}
            /> 
          );
        case "blockNote":
          return (
            <Controller
              key={campo.id}
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              rules={{
                validate: obrigatorioVisual
                  ? (val) => {
                      if (!val) return "Campo obrigatório!";
                      try {
                        const blocks = JSON.parse(val);
                        const extract = (arr) =>
                          arr.flatMap((b) => {
                            const text = Array.isArray(b.content)
                              ? b.content.filter((c) => c.type === "text").map((c) => c.text).join("")
                              : "";
                            const child = b.children ? extract(b.children) : "";
                            return [text, child].filter(Boolean);
                          }).join("\n");
                        return extract(blocks).trim().length > 0 || "Campo obrigatório!";
                      } catch { return "Campo obrigatório!"; }
                    }
                  : undefined,
              }}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <BlockNoteField
                  value={value}
                  onChange={onChange}
                  maxChar={campo.maxChar}
                  label={campo.label}
                  descricao={campo.descricao}
                  disabled={loading}
                  error={error?.message}
                />
              )}
            />
          );

        case "checkbox": // Grupo de caixas de seleção
          return (
            <Controller
              key={campo.id}
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              rules={{
                validate: obrigatorioVisual
                  ? (value) => {
                      const arr = Array.isArray(value) ? value : [];
                      return arr.length > 0 || "Selecione pelo menos uma opção!";
                    }
                  : undefined,
              }}
              render={({ field, fieldState }) => {
                const selected = Array.isArray(field.value) ? field.value : [];
                const toggle = (label) => {
                  const next = selected.includes(label)
                    ? selected.filter((v) => v !== label)
                    : [...selected, label];
                  field.onChange(next);
                  if (handleFieldChangeWithRules) handleFieldChangeWithRules(campo.id, next);
                };
                return (
                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 500, marginBottom: "0.5rem", color: "#334155" }}>
                      {campo.label}
                      {obrigatorioVisual && <span style={{ color: "#ef4444", marginLeft: "0.2rem" }}>*</span>}
                    </p>
                    {campo.descricao && (
                      <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>{campo.descricao}</p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {(campo.opcoes || []).map((opcao) => (
                        <label
                          key={opcao.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: "0.85rem",
                            color: "#334155",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(opcao.label)}
                            onChange={() => !loading && toggle(opcao.label)}
                            disabled={loading}
                            style={{ width: "1rem", height: "1rem", accentColor: "var(--primary-dark, #2563eb)", cursor: loading ? "not-allowed" : "pointer" }}
                          />
                          {opcao.label}
                        </label>
                      ))}
                    </div>
                    {fieldState.error?.message && (
                      <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.35rem" }}>
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                );
              }}
            />
          );

        case "flag": // Campo booleano (sim/não)
          return (
            <Controller
              key={campo.id}
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              rules={{
                validate: obrigatorioVisual
                  ? (value) => value === "true" || value === true || "Campo obrigatório!"
                  : undefined,
              }}
              render={({ field, fieldState }) => (
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "0.85rem",
                      color: "#334155",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={field.value === "true" || field.value === true}
                      onChange={(e) => {
                        const val = e.target.checked ? "true" : "false";
                        field.onChange(val);
                        if (handleFieldChangeWithRules) handleFieldChangeWithRules(campo.id, val);
                      }}
                      disabled={loading}
                      style={{ width: "1rem", height: "1rem", accentColor: "var(--primary-dark, #2563eb)", cursor: loading ? "not-allowed" : "pointer" }}
                    />
                    <span>
                      {campo.label}
                      {obrigatorioVisual && <span style={{ color: "#ef4444", marginLeft: "0.2rem" }}>*</span>}
                    </span>
                  </label>
                  {campo.descricao && (
                    <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem", marginLeft: "1.65rem" }}>{campo.descricao}</p>
                  )}
                  {fieldState.error?.message && (
                    <p style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.35rem" }}>
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          );

        default:
          return null;
      }
    });
  };
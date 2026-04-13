import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import FileInputForDynamics from "@/components/FileInputForDynamics";
import SelectDynamic from "@/components/SelectDynamic";
import MultiSelectDynamic from "@/components/MultiSelectDynamic";
import { applyConditionalRules } from "@/lib/applyConditionalRules";

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
        // Adicione mais casos conforme necessário
        default:
          return null;
      }
    });
  };
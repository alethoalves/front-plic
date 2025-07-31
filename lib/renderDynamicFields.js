import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import FileInputForDynamics from "@/components/FileInputForDynamics";

export const renderDynamicFields = (formulario, control, loading, register, errors, watch) => {
    if (!formulario || !formulario.campos) return null;

    return formulario.campos.map((campo, index) => {
      switch (campo.tipo) {
        case "textLong": // Campo de texto longo (textarea)
          return (
            <Textarea
              key={campo.id}
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              placeholder={campo.descricao || ""}
              disabled={loading}
              maxLength={campo.maxChar || 3000}
              rules={{
                required: campo.obrigatorio ? "Campo obrigatório!" : false,
              }}
            />
          );
        case "text": // Campo de texto curto (input)
          return (
            <Input
              key={campo.id}
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              inputType="text"
              placeholder={campo.descricao || ""}
              disabled={loading}
              rules={{
                required: campo.obrigatorio ? "Campo obrigatório!" : false,
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
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              inputType="number"
              placeholder={campo.descricao || ""}
              disabled={loading}
              rules={{
                required: campo.obrigatorio ? "Campo obrigatório!" : false,
              }}
            />
          );
        case "date": // Campo de data
          return (
            <Input
              key={campo.id}
              control={control}
              name={`camposDinamicos.campo_${campo.id}`}
              label={campo.label}
              inputType="date"
              placeholder={campo.descricao || ""}
              disabled={loading}
              rules={{
                required: campo.obrigatorio ? "Campo obrigatório!" : false,
              }}
            />
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
                console.log("Arquivo selecionado no componente pai:", file);
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
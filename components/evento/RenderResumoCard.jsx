import { useForm } from "react-hook-form";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import Input from "../Input";
import { RiText } from "@remixicon/react";
import Textarea from "../Textarea";

export const RenderResumoCard = ({
  eventoData,
  initialData,
  type,
  onSubmitSuccess,
}) => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      titulo: initialData?.titulo || "",
      // Inicializa campos com dados salvos ou vazios
      ...(eventoData?.moldeResumo?.partes?.reduce((acc, parte) => {
        acc[parte.label] =
          initialData?.partesResumo?.find((p) => p.nome === parte.label)
            ?.conteudo || "";
        return acc;
      }, {}) || {}),
    },
  });

  const onSubmit = (data) => {
    setLoading(true);

    const payload = {
      titulo: data.titulo,
      partesResumo: eventoData?.moldeResumo?.partes?.map((parte) => ({
        nome: parte.label,
        conteudo: data[parte.label],
        maxCaracteres: parte.max,
        obrigatorio: parte.required,
      })),
    };

    // Simulação de envio
    setTimeout(() => {
      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Resumo enviado com sucesso!",
        life: 3000,
      });
      setLoading(false);

      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      }
    }, 1500);
  };

  return (
    <>
      <Toast ref={toast} position="top-right" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="w-100 flex flex-column gap-2">
          <Input
            control={control}
            name="titulo"
            label="Título*"
            icon={RiText}
            inputType="text"
            placeholder="Digite o título do seu resumo"
            rules={{ required: "O título é obrigatório" }}
            readonly={type === "PLANO" || type === "PROJETO" ? true : false}
          />

          {/* Textareas para cada parte do resumo */}
          {eventoData?.moldeResumo?.partes?.map((parte) => (
            <Textarea
              key={parte.label}
              control={control}
              name={parte.label}
              label={`${parte.label}${parte.required ? "*" : ""}`}
              placeholder={`Digite a ${parte.label.toLowerCase()} do resumo`}
              maxLength={parte.max}
              rules={{
                required: parte.required
                  ? `A ${parte.label.toLowerCase()} é obrigatória`
                  : false,
                maxLength: {
                  value: parte.max,
                  message: `Máximo de ${parte.max} caracteres`,
                },
              }}
            />
          ))}

          <div className="flex justify-content-end gap-1">
            <Button
              label={loading ? "Enviando..." : "Enviar Resumo"}
              type="submit"
              loading={loading}
            />
          </div>
        </div>
      </form>
    </>
  );
};

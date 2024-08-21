"use client";

//HOOKS
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Select from "@/components/Select";

//FUNÇÕES
import { createEdital, updateEdital } from "@/app/api/client/edital";

const FormEditalSelectForm = ({
  tenantSlug,
  editalId,
  initialData,
  arraySelect,
  keyFormulario,
  onClose,
  onSuccess,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { control, handleSubmit, setValue, reset } = useForm({
    defaultValues: {
      value: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("value", initialData);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    console.log({ [keyFormulario]: data.value });
    try {
      await updateEdital(tenantSlug, editalId, {
        [keyFormulario]: data.value ? `${data.value}` : null,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setError(
        error.response?.data?.error?.message ??
          "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={`${styles.formulario}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className={`${styles.input}`}>
        <Select
          className="mb-2"
          control={control}
          name="value"
          label="Tipo de campo"
          options={[
            {
              label: `${
                initialData ? "Excluir formulário" : "Escolha uma opção"
              }`,
              value: "",
            },
            ...(arraySelect
              ? arraySelect.map((item) => ({
                  label: item.titulo,
                  value: item.id,
                }))
              : []),
          ]}
          disabled={loading}
        />
      </div>
      <div className={`${styles.btnSubmit}`}>
        <Button
          icon={RiSave2Line}
          className=" btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Salvar formulário"}
        </Button>
      </div>
      {error && (
        <div className={`notification notification-error`}>
          <p className="p5">{error}</p>
        </div>
      )}
    </form>
  );
};

export default FormEditalSelectForm;

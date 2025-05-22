//HOOKS
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formNewFormulario } from "@/lib/zodSchemas/formNewFormulario";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";

//FUNÇÕES
import {
  createFormulario,
  updateFormulario,
} from "@/app/api/client/formulario";

const FormNewFormulario = ({ tenantSlug, initialData, onClose, onSuccess }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { control, handleSubmit, setValue, reset } = useForm({
    resolver: zodResolver(formNewFormulario),
    defaultValues: {
      titulo: "",
      descricao: "",
      tipo: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("titulo", initialData.titulo);
      setValue("descricao", initialData.descricao);
      setValue("tipo", initialData.tipo);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      if (initialData) {
        await updateFormulario(tenantSlug, initialData.id, data);
      } else {
        await createFormulario(tenantSlug, data);
      }
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
        <Input
          className="mb-2"
          control={control}
          name="titulo"
          label="Título do formulário"
          inputType="text"
          placeholder="Digite aqui o título do formulário"
          disabled={loading}
        />
        <Input
          className="mb-2"
          control={control}
          name="descricao"
          label="Descrição do formulário"
          inputType="text"
          placeholder="Digite aqui o título do formulário"
          disabled={loading}
        />
        {!initialData && (
          <Select
            className="mb-2"
            control={control}
            name="tipo"
            label="Tipo de formulário"
            options={[
              { label: "Selecione uma opção", value: "" },
              { label: "orientador", value: "orientador" },
              { label: "aluno", value: "aluno" },
              { label: "projeto", value: "projeto" },
              { label: "plano de trabalho", value: "planoDeTrabalho" },
              { label: "atividade", value: "atividade" },
              { label: "avaliacao", value: "avaliacao" },
            ]}
            disabled={loading}
          />
        )}
      </div>
      <div className={`${styles.btnSubmit}`}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
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

export default FormNewFormulario;

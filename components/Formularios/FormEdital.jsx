"use client";

//HOOKS
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formEdital } from "@/lib/zodSchemas/formEdital";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import { createEdital, updateEdital } from "@/app/api/client/edital";

//FUNÇÕES

const FormEdital = ({ tenantSlug, initialData, onClose, onSuccess }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { control, handleSubmit, setValue, reset } = useForm({
    resolver: zodResolver(formEdital),
    defaultValues: {
      titulo: "",
      ano: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("titulo", initialData.titulo);
      setValue("ano", initialData.ano.toString());
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      let edital;
      if (initialData) {
        edital = await updateEdital(tenantSlug, initialData.id, data);
      } else {
        edital = await createEdital(tenantSlug, data);
      }
      onSuccess(edital);
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
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
          label="Título do edital"
          inputType="text"
          placeholder="Digite aqui o título do edital"
          disabled={loading}
        />
        <Input
          className="mb-2"
          control={control}
          name="ano"
          label="Ano do edital"
          inputType="number"
          placeholder="Digite aqui o ano do edital"
          disabled={loading}
        />
      </div>
      <div className={`${styles.btnSubmit}`}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Salvar edital"}
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

export default FormEdital;

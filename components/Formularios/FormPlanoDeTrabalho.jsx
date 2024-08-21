"use client";

//HOOKS
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";

//FUNÇÕES
import { createRegistroAtividade } from "@/app/api/client/registroAtividade";

import {
  createPlanoDeTrabalho,
  updatePlanoDeTrabalho,
} from "@/app/api/client/planoDeTrabalho";
import { planoDeTrabalhoSchema } from "@/lib/zodSchemas/planoDeTrabalhoSchema";

const FormPlanoDeTrabalho = ({
  tenantSlug,
  initialData,
  idInscricao,
  onClose,
  onSuccess,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { control, handleSubmit, setValue, reset } = useForm({
    resolver: zodResolver(planoDeTrabalhoSchema),
    defaultValues: {
      titulo: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("titulo", initialData.titulo);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);
  const incluirAtividadesNoPlanoDeTrabalho = async (
    tenantSlug,
    idPlanoDeTrabalho,
    atividades
  ) => {
    try {
      const promises = atividades.map(async (atividade) => {
        const registroAtividadeData = {
          status: "naoEntregue", // Ajustar conforme necessário
          planoDeTrabalhoId: idPlanoDeTrabalho, // ID do plano de trabalho do item
        };

        return await createRegistroAtividade(
          tenantSlug,
          atividade.id,
          registroAtividadeData
        );
      });

      const resultados = await Promise.all(promises);
      return resultados;
    } catch (error) {
      console.error(
        "Erro ao incluir atividades nos planos de trabalho:",
        error
      );
      throw error;
    }
  };
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      if (initialData) {
        await updatePlanoDeTrabalho(
          tenantSlug,
          idInscricao,
          initialData.id,
          data
        );
      } else {
        const newPlanoDeTrabalho = await createPlanoDeTrabalho(
          tenantSlug,
          idInscricao,
          data
        );
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
          label="Título do plano de trabalho"
          inputType="text"
          placeholder="Digite aqui o título do plano de trabalho"
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
          {loading ? "Carregando..." : "Salvar Plano de Trabalho"}
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

export default FormPlanoDeTrabalho;

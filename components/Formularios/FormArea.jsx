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
  updatePlanoDeTrabalhoPerfilUser,
} from "@/app/api/client/planoDeTrabalho";
import { planoDeTrabalhoSchema } from "@/lib/zodSchemas/planoDeTrabalhoSchema";
import { getAreas } from "@/app/api/client/area";
import SearchableSelect from "../SearchableSelect";
import { z } from "zod";

const FormPlanoDeTrabalho = ({
  perfil = "gestor",
  tenantSlug,
  initialData,
  idInscricao,
  onClose,
  onSuccess,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState("");
  const { control, handleSubmit, setValue, reset } = useForm({
    resolver: zodResolver(
      z.object({
        areaId: z.number().min(1, "Campo obrigatório!"),
      })
    ),
    defaultValues: {
      areaId: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getAreas(tenantSlug);
        setAreas(transformedArray(response));
      } catch (error) {
        setErrorDelete(
          error.response?.data?.message ?? "Erro na conexão com o servidor."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    if (initialData) {
      setValue("areaId", initialData.areaId);
    } else {
      reset();
    }
  }, [initialData, setValue, reset, tenantSlug]); //ALTEREI AQUI

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      if (perfil === "gestor") {
        await updatePlanoDeTrabalho(
          tenantSlug,
          idInscricao,
          initialData.id,
          data
        );
      }
      if (perfil === "aluno") {
        await updatePlanoDeTrabalhoPerfilUser(
          tenantSlug,
          idInscricao,
          initialData.id,
          data
        );
      }
      onSuccess();
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
  const transformedArray = (items) => {
    const data = items?.flatMap((item) => {
      // Criar um array inicial com a área principal
      const result = [{ value: item.id, label: item.area }];

      // Adicionar subáreas, se houver
      const subareaResults = item.subareas.map((subarea) => ({
        value: item.id,
        label: `${item.area} - ${subarea.subarea}`,
      }));

      // Concatenar o array da área principal com as subáreas
      return result.concat(subareaResults);
    });

    // Organizar por `value` crescente e depois por `label`
    return data.sort((a, b) => {
      // Primeiro, organizar por `value` crescente
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;

      // Se os `values` forem iguais, organizar por `label`
      return a.label.localeCompare(b.label);
    });
  };

  return (
    <form
      className={`${styles.formulario}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className={`${styles.input}`}>
        <SearchableSelect
          className="mb-2"
          control={control}
          name="areaId"
          label="Área de Conhecimento"
          options={areas || []} // Garante que o options seja um array
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
          {loading ? "Carregando..." : "Salvar e continuar"}
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

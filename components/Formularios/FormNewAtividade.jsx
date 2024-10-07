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

import { atividadeSchema } from "@/lib/zodSchemas/atividadeSchema";
import { createRegistroAtividade } from "@/app/api/client/registroAtividade";
import { createAtividade, updateAtividade } from "@/app/api/client/atividade";
import { getEdital } from "@/app/api/client/edital";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";

const FormNewAtividade = ({
  tenantSlug,
  editalId,
  initialData,
  formularios,
  onClose,
  onSuccess,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { control, handleSubmit, setValue, reset, watch } = useForm({
    resolver: zodResolver(atividadeSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      obrigatoria: true,
      aberta: true,
      formularioId: "",
      dataInicio: "",
      dataFinal: "",
      permitirEntregaForaPrazo: "",
    },
  });

  const formularioId = watch("formularioId");

  useEffect(() => {
    if (initialData) {
      setValue("titulo", initialData.titulo);
      setValue("descricao", initialData.descricao);
      setValue("obrigatoria", initialData.obrigatoria);
      setValue("dataInicio", formatDateForDisplay(initialData.dataInicio));
      setValue("dataFinal", formatDateForDisplay(initialData.dataFinal));
      setValue(
        "permitirEntregaForaPrazo",
        initialData.permitirEntregaForaPrazo
      );
      setValue("formularioId", initialData.formularioId);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  useEffect(() => {
    if (formularios && formularioId) {
      const selectedFormulario = formularios.find(
        (formulario) => formulario.id === formularioId
      );

      if (selectedFormulario) {
        const { titulo, descricao } =
          initialData && formularioId === initialData.formularioId
            ? initialData
            : selectedFormulario;

        setValue("titulo", titulo);
        setValue("descricao", descricao);
      }
    }
  }, [formularios, formularioId, setValue, initialData]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    console.log(data);
    let atividade;
    try {
      if (initialData) {
        atividade = await updateAtividade(
          tenantSlug,
          editalId,
          initialData.id,
          data
        );
      } else {
        atividade = await createAtividade(tenantSlug, editalId, data);
      }

      onSuccess();
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
        <Select
          className="mb-2"
          control={control}
          name="formularioId"
          label="Escolha o formulário de submissão da atividade"
          options={[
            {
              label: "Escolha uma opção",
              value: "",
            },
            ...(formularios
              ? formularios.map((item) => ({
                  label: item.titulo,
                  value: item.id,
                }))
              : []),
          ]}
          disabled={loading}
        />
        {formularioId && (
          <>
            <Input
              className="mb-2"
              control={control}
              name="titulo"
              label="Título da atividade"
              inputType="text"
              placeholder="Digite aqui o título da atividade"
              disabled={loading}
            />
            <Input
              className="mb-2"
              control={control}
              name="descricao"
              label="Descrição da atividade"
              inputType="text"
              placeholder="Digite aqui a descrição da atividade"
              disabled={loading}
            />
            <Select
              className="mb-2"
              control={control}
              name="obrigatoria"
              label="Atividade é obrigatória?"
              options={[
                { label: "Selecione uma opção", value: "" },
                { label: "Sim", value: true },
                { label: "Não", value: false },
              ]}
              disabled={loading}
            />
            <Input
              className="mb-2"
              control={control}
              name="dataInicio"
              label="Inicio da submissão da atividade"
              inputType="date"
              placeholder="DD/MM/AAAA"
              disabled={loading}
            />
            <Input
              className="mb-2"
              control={control}
              name="dataFinal"
              label="Fim da submissão da atividade"
              inputType="date"
              placeholder="DD/MM/AAAA"
              disabled={loading}
            />
            <Select
              control={control}
              className="mb-2"
              name="permitirEntregaForaPrazo"
              label="Permitir envio fora do prazo?"
              options={[
                { label: "Selecione uma opção", value: "" },
                { label: "Sim", value: true },
                { label: "Não", value: false },
              ]}
              disabled={loading}
            />
          </>
        )}
      </div>
      <div className={`${styles.btnSubmit}`}>
        {formularioId && (
          <Button
            icon={RiSave2Line}
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Carregando..." : "Salvar formulário"}
          </Button>
        )}
      </div>
      {error && (
        <div className={`notification notification-error`}>
          <p className="p5">{error}</p>
        </div>
      )}
    </form>
  );
};

export default FormNewAtividade;

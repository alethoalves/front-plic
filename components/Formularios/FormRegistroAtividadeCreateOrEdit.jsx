"use client";

//HOOKS
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";

//FUNÇÕES
import { getFormulario } from "@/app/api/client/formulario";
import { createDynamicSchema } from "@/lib/createDynamicSchema";
import { renderDynamicFields } from "@/lib/renderDynamicFields";
import { submissaoAtividade } from "@/app/api/client/registroAtividade";
import { Toast } from "primereact/toast";

const FormRegistroAtividadeCreateOrEdit = ({
  tenantSlug,
  initialData,
  onClose,
  onSuccess,
  onError,
  idFormularioEdital,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formularioEdital, setFormularioEdital] = useState(null);
  const [errorDelete, setErrorDelete] = useState();
  const toast = useRef();
  //DEFINE O SCHEMA DO PLANO DE TRABALHO
  // 1) dados vindos do backend
  const campos = formularioEdital?.campos ?? [];

  // 2) gera o schema para os campos dinâmicos
  const dynamicSchemaBase = createDynamicSchema(campos); // ← sua função

  // 3) se o array estiver vazio, torna-o opcional
  const dynamicSchema =
    campos.length === 0 ? dynamicSchemaBase.optional() : dynamicSchemaBase;

  const planoDeTrabalhoSchema = z.object({
    camposDinamicos: dynamicSchema, // Adiciona campos dinâmicos ao schema
  });

  //CONTROLA O FORMULARIO
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(planoDeTrabalhoSchema),
    defaultValues: {
      camposDinamicos: {},
    },
  });

  //RENDERIZACAO INICIAL
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log(initialData);
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
    } else {
      reset();
    }
  }, [initialData, reset]);

  //BUSCA OS DADOS DO FORMULARIO DE PLANO DE TRABALHO
  useEffect(() => {
    const fetchFormularioEdital = async () => {
      try {
        const formulario = await getFormulario(tenantSlug, idFormularioEdital);
        if (formulario) {
          setFormularioEdital(formulario);
        }
      } catch (error) {
        console.error("Erro ao buscar formulário do edital:", error);
      }
    };

    if (idFormularioEdital) {
      fetchFormularioEdital();
    }
  }, [tenantSlug, idFormularioEdital]);
  useEffect(() => {
    if (initialData && formularioEdital) {
      // Cria um objeto para os valores dos campos dinâmicos
      const dynamicValues = { camposDinamicos: {} };
      if (initialData.respostas && Array.isArray(initialData.respostas)) {
        initialData.respostas.forEach((resposta) => {
          // Usa a mesma chave definida nos inputs: "camposDinamicos.campo_{campoId}"
          dynamicValues[`camposDinamicos.campo_${resposta.campoId}`] =
            resposta.value;
        });
      }

      // Cria o objeto com todos os valores iniciais
      const formValues = {
        ...dynamicValues,
      };

      reset(formValues);
    }
  }, [initialData, formularioEdital, reset]);

  // Submete o formulário
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...data };
      console.log(payload);
      let registroAtividade;
      registroAtividade = await submissaoAtividade(
        tenantSlug,
        payload,
        initialData.id
      );

      if (!registroAtividade || !registroAtividade.id) {
        throw new Error("Erro ao salvar o plano de trabalho.");
      }

      if (onSuccess) {
        toast.current.show({
          severity: "success",
          summary: "Sucesso",
          detail: "Atividade salva com sucesso!",
          life: 5000,
        });
        onSuccess(registroAtividade);
      }
    } catch (error) {
      console.error(
        "Erro ao enviar o formulário:",
        error.response.data.message
      );
      setError(error.response.data.message || "Erro ao enviar o formulário.");

      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={`${styles.formulario}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <Toast ref={toast} />
      <div className={`${styles.conteudo}`}>
        <div className={`${styles.camposDinamicos}`}>
          {renderDynamicFields(
            formularioEdital,
            control,
            loading,
            register,
            errors,
            watch
          )}
        </div>
      </div>

      <div className={`${styles.btnSubmit} mt-2`}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Salvar"}
        </Button>
        {error && (
          <div className={`notification notification-error`}>
            <p className="p5">{error}</p>
          </div>
        )}
      </div>
    </form>
  );
};

export default FormRegistroAtividadeCreateOrEdit;

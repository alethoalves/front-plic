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
    setLoading(true);
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
      setLoading(false);
    }
  }, [initialData, formularioEdital, reset]);

  // Submete o formulário
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();

      // Adiciona campos não-dinâmicos primeiro
      if (initialData?.id) {
        formData.append("id", initialData.id);
      }

      // Processa campos dinâmicos
      if (data.camposDinamicos) {
        Object.entries(data.camposDinamicos).forEach(([key, value]) => {
          // Caso 1: É um File object (upload único)
          if (value instanceof File) {
            formData.append(`camposDinamicos.${key}`, value);
          }
          // Caso 2: É um FileList (input multiple)
          else if (value instanceof FileList) {
            Array.from(value).forEach((file, index) => {
              formData.append(`camposDinamicos.${key}`, file);
            });
          }
          // Caso 3: É um array de arquivos (outro formato possível)
          else if (Array.isArray(value) && value[0] instanceof File) {
            value.forEach((file) => {
              formData.append(`camposDinamicos.${key}`, file);
            });
          }
          // Caso 4: Valor normal (texto, número, etc.)
          else {
            formData.append(`camposDinamicos.${key}`, value);
          }
        });
      }

      const registroAtividade = await submissaoAtividade(
        tenantSlug,
        formData,
        initialData?.id
      );

      if (!registroAtividade?.id) {
        throw new Error("Erro ao salvar o registro de atividade.");
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
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Erro ao enviar o formulário.";
      console.error("Erro no envio:", errorMsg, error);
      setError(errorMsg);

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

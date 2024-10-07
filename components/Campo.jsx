import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//ESTILOS E ÍCONES
import styles from "./Campo.module.scss";
import {
  RiCloseLargeLine,
  RiCloseLine,
  RiEditLine,
  RiEyeLine,
  RiSave2Line,
} from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Textarea from "@/components/Textarea"; // Importa o componente Textarea

//FUNÇÕES
import { deleteFile, uploadFile } from "@/app/api/clientReq";
import { createCampo, updateCampo } from "@/app/api/client/campo";
import {
  createResposta,
  createRespostaByParticipante,
  updateResposta,
  updateRespostaByParticipante,
} from "@/app/api/client/resposta";

import Link from "next/link";

const Campo = ({
  perfil = "gestor",
  readOnly = false,
  tenantSlug,
  camposForm,
  schema,
  respostas,
  registroAtividadeId,
  onClose,
  onSuccess,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editar, setEditar] = useState(false);

  // Dynamically create the Zod schema based on the props
  const respostaSchema = useMemo(() => {
    let baseSchema = z.string();

    // Condicional para verificar se o campo é obrigatório ou não
    if (schema?.obrigatorio) {
      baseSchema = baseSchema.min(1, { message: "Campo obrigatório!" });
    } else {
      baseSchema = baseSchema.optional(); // Permitir valor vazio quando não for obrigatório
    }

    // Add other conditions based on schema.tipo, e.g., email, number, etc.
    switch (schema?.tipo) {
      case "email":
        baseSchema = baseSchema.email({ message: "Email inválido" });
        break;
      case "number":
        baseSchema = z
          .number({ message: "Número inválido" })
          .refine((val) => !isNaN(val), { message: "Número inválido" });
        break;
      case "arquivo":
        baseSchema = z.instanceof(File, { message: "Arquivo inválido" }).refine(
          (file) => {
            if (schema?.tipoFile === "video") {
              return ["video/mp4", "video/mov", "video/avi"].includes(
                file.type
              );
            } else if (schema?.tipoFile === "pdf") {
              return file.type === "application/pdf";
            } else if (schema?.tipoFile === "xml") {
              return ["application/xml", "application/zip"].includes(file.type);
            }
            return false; // Caso nenhum tipo de arquivo corresponda
          },
          (file) => {
            if (schema?.tipoFile === "video") {
              return {
                message: "Apenas arquivos .mp4 e .avi são permitidos",
              };
            } else if (schema?.tipoFile === "pdf") {
              return { message: "Apenas arquivos .pdf são permitidos" };
            } else if (schema?.tipoFile === "xml") {
              return { message: "Apenas arquivos .xml e .zip são permitidos" };
            }
            return { message: "Formato de arquivo inválido" };
          }
        );
        break;
      // Add other cases as needed
      default:
        break;
    }

    return z.object({
      value: baseSchema,
    });
  }, [schema]);

  const { control, handleSubmit, setValue, reset, watch } = useForm({
    resolver: zodResolver(respostaSchema),
    defaultValues: {
      value: "",
    },
  });

  const initialDataArray = respostas?.filter(
    (item) => item.campoId === schema?.id
  );
  let initialData = initialDataArray[0];

  useEffect(() => {
    if (initialData) {
      setValue("value", initialData.value);
    } else {
      reset();
    }
  }, [initialData, reset, setValue]);

  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      const response = await uploadFile(file, tenantSlug);
      return response.fileUrl;
    } catch (error) {
      console.error("Erro ao fazer upload do arquivo:", error);
      setError(
        error.response?.data?.error?.message ??
          "Erro ao fazer upload do arquivo."
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      let value = data.value;

      if (schema?.tipo === "arquivo") {
        value = await handleFileUpload(value);
      }

      if (initialData) {
        if (schema?.tipo === "arquivo") {
          await deleteFile(tenantSlug, initialData.value);
        }
        const updateData = { value };
        if (perfil === "gestor") {
          await updateResposta(
            tenantSlug,
            initialData.id,
            schema.id,
            updateData
          );
        } else {
          await updateRespostaByParticipante(
            tenantSlug,
            initialData.id,
            schema.id,
            updateData
          );
        }
      } else {
        const newData = {
          value,
          campoId: schema.id,
          registroAtividadeId,
        };
        if (perfil === "gestor") {
          await createResposta(tenantSlug, schema.id, newData);
        } else {
          await createRespostaByParticipante(tenantSlug, schema.id, newData);
        }
      }
      setEditar(false);
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      setError(
        error.response?.data?.message ??
          error.response?.data?.error ??
          "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {schema?.tipo === "arquivo" && (
        <p className={styles.labelFile}>{schema?.label}</p>
      )}
      <form
        className={styles.formulario}
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        <div className={styles.input}>
          {schema?.tipo === "select" ? (
            <Select
              className=""
              control={control}
              name="value"
              label={schema?.label}
              options={[
                { label: "Selecione uma opção", value: "" },
                ...schema?.opcoes?.map((item) => ({
                  label: item.label,
                  value: item.value,
                })),
              ]}
              disabled={loading || !editar}
            />
          ) : schema?.tipo === "textLong" ? (
            <Textarea
              className=""
              maxLength={schema?.maxChar}
              control={control}
              name="value"
              label={schema?.label}
              placeholder="Digite sua resposta"
              disabled={
                loading ||
                (!editar && initialData && schema?.tipo !== "arquivo")
              }
            />
          ) : (
            <>
              {schema?.tipo === "arquivo" && !editar && initialData && (
                <div className="mt-2">
                  <Link
                    prefetch={false}
                    href={initialData.value}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className={styles.linkFile}>
                      <RiEyeLine />

                      <p>Ver arquivo</p>
                    </div>
                  </Link>
                </div>
              )}
              {(editar || schema?.tipo !== "arquivo" || !initialData) && (
                <Input
                  className=""
                  control={control}
                  name="value"
                  label={schema?.label}
                  inputType={schema?.tipo === "arquivo" ? "file" : schema?.tipo}
                  placeholder="Digite aqui o título da pergunta"
                  disabled={
                    loading ||
                    (!editar && initialData && schema?.tipo !== "arquivo")
                  }
                />
              )}
            </>
          )}
        </div>

        {!readOnly && (
          <div className={styles.actions}>
            {(editar || !initialData) && (
              <Button
                icon={RiSave2Line}
                className="btn-primary"
                type="submit"
                onClick={() => setEditar(true)}
                disabled={loading}
              >
                Salvar
              </Button>
            )}
            {(!initialData && !editar) ||
              ((editar || !initialData) && schema?.tipo === "arquivo" && (
                <Button
                  icon={RiCloseLargeLine}
                  className="btn-error ml-1"
                  type="button"
                  onClick={() => setEditar(false)}
                  disabled={loading}
                >
                  Salvar
                </Button>
              ))}
            {!editar && initialData && (
              <Button
                icon={RiEditLine}
                className="btn-secondary"
                type="button"
                onClick={() => setEditar(true)}
                disabled={loading}
              >
                Editar
              </Button>
            )}
          </div>
        )}
      </form>
      {error && (
        <div className={`notification notification-error`}>
          <p className="p5">{error}</p>
        </div>
      )}
    </>
  );
};

export default Campo;

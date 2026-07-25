"use client";
import styles from "./page.module.scss";
import { RiIdCardLine, RiArrowLeftCircleLine, RiKeyLine, RiLoginBoxLine } from "@remixicon/react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema } from "@/lib/zodSchemas/authSchema";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { getEventoBySlug, getEventoRootBySlug } from "@/app/api/client/eventos";
import { Toast } from "primereact/toast";
import { signinAvaliadorEvento } from "@/app/api/client/auth";
import { useRouter } from "next/navigation";
import { EventoBanner } from "@/components/evento/EventoBanner";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [showCodAvaliador, setShowCodAvaliador] = useState(false);
  const [submittedCpf, setSubmittedCpf] = useState("");
  const toast = useRef(null);

  const { control, handleSubmit, reset, watch, setValue } = useForm({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      cpf: "",
      codAvaliador: "",
    },
  });

  const cpfValue = watch("cpf");
  const router = useRouter();
  const handleCpfChange = (e) => {
    if (submittedCpf !== "" && e.target.value !== submittedCpf) {
      setShowCodAvaliador(false);
      setValue("codAvaliador", "");
    }
    setValue("cpf", e.target.value);
  };

  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 3000,
    });
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await signinAvaliadorEvento({
        ...data,
        slugEdicaoEvento: params.edicao,
      });

      if (
        response.codAvaliador === true ||
        response.message?.includes("código de avaliador")
      ) {
        setShowCodAvaliador(true);
        setSubmittedCpf(data.cpf);
        return;
      }

      if (response.token) {
        setShowCodAvaliador(false);
        // Redirecionar para:

        router.push(
          `/evento/${params.eventoSlug}/edicao/${params.edicao}/avaliador`
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  let eventoRoot;
  let evento;
  try {
    eventoRoot = getEventoRootBySlug(params.eventoSlug);
    evento = getEventoBySlug(params.edicao);
  } catch (error) {
    return <h6 className="p-4">Evento não encontrado</h6>;
  }

  return (
    <>
      <Toast ref={toast} position="top-center" />

      <div className={styles.mainDiv}>
        <EventoBanner evento={evento} />

        <div className={`${styles.eventoCard} ${styles.loginCard}`}>
          <div className={styles.loginHead}>
            <RiLoginBoxLine />
            <h1 className="h-editorial-sm">Espaço do avaliador</h1>
          </div>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <Input
              className="mb-2"
              control={control}
              name="cpf"
              label="Digite seu CPF"
              icon={RiIdCardLine}
              inputType="text"
              placeholder="Digite seu CPF"
              disabled={loading}
              onChange={handleCpfChange}
            />

            {showCodAvaliador && (
              <Input
                className="mb-2"
                control={control}
                name="codAvaliador"
                label="Digite o token"
                icon={RiKeyLine}
                inputType="text"
                placeholder="Digite o token de avaliador"
                disabled={loading}
              />
            )}

            <Button
              className="btn-primary mt-2"
              type="submit"
              disabled={loading}
              loading={loading}
            >
              {showCodAvaliador ? "Verificar código" : "Acessar"}
            </Button>

            {showCodAvaliador && (
              <div
                className={styles.btnBack}
                onClick={() => {
                  setShowCodAvaliador(false);
                  setSubmittedCpf("");
                  reset({ cpf: "", codAvaliador: "" });
                }}
              >
                <RiArrowLeftCircleLine />
                <p>Voltar</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default Page;

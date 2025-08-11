"use client";
import Image from "next/image";
import styles from "./page.module.scss";
import {
  RiIdCardLine,
  RiArrowLeftCircleLine,
  RiKeyLine,
} from "@remixicon/react";
import { Fragment, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema } from "@/lib/zodSchemas/authSchema";
import Input from "@/components/Input";
import { getEventoBySlug, getEventoRootBySlug } from "@/app/api/client/eventos";
import { Toast } from "primereact/toast";
import { signinAvaliadorEvento } from "@/app/api/client/auth";
import BuscadorBack from "@/components/BuscadorBack";
import { useRouter } from "next/navigation";

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

      console.log("Resposta completa:", response);

      if (
        response.codAvaliador === true ||
        response.message?.includes("código de avaliador")
      ) {
        setShowCodAvaliador(true);
        setSubmittedCpf(data.cpf);
        return;
      }

      if (response.token) {
        console.log("Login success:", response.token);
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

      <header className={styles.banner}>
        <Image
          src={`/image/${params.eventoSlug}/bgImg.png`}
          alt="Background"
          fill
          quality={100}
          className={styles.bgImage}
        />
      </header>

      <div className={styles.mainDiv}>
        <main className={styles.main}>
          <div className={styles.bannerOverlay}>
            <Image
              src={`/image/${params.eventoSlug}/${params.edicao}/pathBanner.png`}
              alt="Evento Banner"
              width={1200}
              height={400}
              priority
              className={styles.overlayImage}
            />
          </div>

          <div className={styles.content}>
            <h6 className={styles.title}>Espaço do Avaliador</h6>
            <div className={styles.card}>
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div className={styles.form}>
                  <div className={styles.formInput}>
                    <Input
                      control={control}
                      name="cpf"
                      label="Digite seu CPF"
                      icon={RiIdCardLine}
                      inputType="text"
                      placeholder="Digite seu CPF"
                      //autoFocus
                      disabled={loading}
                      onChange={handleCpfChange}
                    />
                  </div>

                  {showCodAvaliador && (
                    <div className={`${styles.formInput} mt-2`}>
                      <Input
                        control={control}
                        name="codAvaliador"
                        label="Digite o token"
                        icon={RiKeyLine}
                        inputType="text"
                        placeholder="Digite o token de avaliador"
                        disabled={loading}
                        //autoFocus
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className={`${styles.customButton} ${
                      loading ? styles.loading : ""
                    }`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className={styles.spinner}></span>
                    ) : showCodAvaliador ? (
                      "Verificar código"
                    ) : (
                      "Acessar"
                    )}
                  </button>

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
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Page;

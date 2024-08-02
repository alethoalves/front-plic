"use client";
//Hooks
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signinSchema } from "@/lib/zodSchemas/authSchema";
//Estilizações
import { RiIdCardLine, RiLock2Line } from "@remixicon/react";
import styles from "./Signin.module.scss";
import Image from "next/image";
//Componentes
import { Notification } from "@/components/Notification";
import Button from "@/components/Button";
import Input from "@/components/Input";
//Chamadas api
import { signin } from "@/app/api/client/auth";

const Auth = ({ slug, pathLogo }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const perfis = await signin(data);
      const existeGestor = perfis.some(
        (item) => item.tenant === slug && item.cargo === "gestor"
      );
      if (!existeGestor)
        setErrorMessage("Você não tem perfil de gestor nesta instituição.");
      if (existeGestor) {
        router.push(`/${slug}/gestor`);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        error.response.data.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      cpf: "",
      senha: "",
    },
  });
  return (
    <div className={styles.auth}>
      <div className={styles.logo}>
        <Image
          priority
          fill
          src={`/image/${pathLogo}`}
          alt="logo"
          sizes="300 500 700"
        />
      </div>
      <div className={styles.header}>
        <h4>Iniciação Científica</h4>
      </div>
      {errorMessage && (
        <Notification className="notification-error">
          {errorMessage}
        </Notification>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className={styles.form}>
          <div className={styles.formInput}>
            <Input
              control={control}
              className="cpf-input"
              name="cpf"
              label="CPF"
              icon={RiIdCardLine}
              inputType="text" // text, password
              placeholder="Digite seu CPF"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className={styles.formInput}>
            <Input
              control={control}
              name="senha"
              label="Senha"
              icon={RiLock2Line}
              inputType="password" // text, password
              placeholder="Digite sua senha"
              disabled={loading}
            />
          </div>
        </div>
        <div className="actions">
          <div className="actions-item-2">
            <Button
              className="btn-primary"
              type="submit" // submit, reset, button
              disabled={loading}
            >
              {loading ? "Carregando..." : "Entrar"}
            </Button>
          </div>
        </div>
      </form>
      <div className={styles.logoPlic}>
        <Image
          priority
          sizes="300 500 700"
          fill
          src={`/image/plicFundoTransparente.png`}
          alt="logo"
        />
      </div>
    </div>
  );
};

export default Auth;

"use client";
//Hooks
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signinSchema, signupSchema } from "@/lib/zodSchemas/authSchema";
//Estilizações
import {
  RiArrowLeftCircleLine,
  RiAtLine,
  RiCalendarEventFill,
  RiCalendarEventLine,
  RiIdCardLine,
  RiLock2Line,
  RiPhoneLine,
  RiUserLine,
} from "@remixicon/react";
import styles from "./Signin.module.scss";
import Image from "next/image";
//Componentes
import { Notification } from "@/components/Notification";
import Button from "@/components/Button";
import Input from "@/components/Input";
//Chamadas api
import { signin } from "@/app/api/client/auth";

const Auth = ({ slug, pathLogo, isAvaliador = false }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tela, setTela] = useState(0);

  const router = useRouter();

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await signin({ ...data, step: tela });
      console.log(response.perfis);
      if (response.perfis) {
        const existeGestor = response.perfis?.some(
          (item) => item.tenant === slug && item.cargo === "gestor"
        );
        const existeOrientador = response.perfis?.some(
          (item) => item.tenant === slug && item.cargo === "orientador"
        );
        const existeAluno = response.perfis?.some(
          (item) => item.tenant === slug && item.cargo === "aluno"
        );
        const existeAvaliador = response.perfis?.some(
          (item) => item.tenant === "plic" && item.cargo === "avaliador"
        );
        if (
          !existeGestor &&
          !existeOrientador &&
          !existeAluno &&
          !existeAvaliador
        ) {
          setErrorMessage(
            `Você não tem perfil ${
              isAvaliador ? "de avaliador" : "nesta instituição"
            } .`
          );
          reset();
          setTela(0);
        }
        if (existeGestor) {
          router.push(`/${slug}/gestor`);
        }
        if (existeOrientador) {
          router.push(`/${slug}/orientador`);
        }
        if (existeAluno) {
          router.push(`/${slug}/aluno`);
        }
        if (existeAvaliador) {
          router.push(`/avaliador/home`);
        }
      } else {
        if (response.nextStep === tela) {
          setErrorMessage("Preencha todos os campos");
        } else {
          setTela(response.nextStep);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      cpf: "",
      nome: "",
      senha: "",
      dtNascimento: "",
      celular: "",
      senha: "",
      confirmacaoSenha: "",
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
              readonly={tela > 0 && true}
            />
          </div>
          {tela === 3 && (
            <div className={styles.formInput}>
              <Input
                control={control}
                name="nome"
                label="Nome completo"
                icon={RiIdCardLine}
                inputType="text" // text, password
                placeholder="Digite seu nome completo"
                disabled={loading}
              />
            </div>
          )}
          {tela >= 3 && (
            <div className={styles.formInput}>
              <Input
                control={control}
                name="dtNascimento"
                label="Data de nascimento"
                icon={RiCalendarEventLine}
                inputType="date" // text, password
                placeholder="Digite sua data de nascimento"
                disabled={loading}
              />
            </div>
          )}
          {(tela === 3 || tela === 5) && (
            <div className={`${styles.formInput} phone-input`}>
              <Input
                control={control}
                name="celular"
                label="Celular"
                icon={RiPhoneLine}
                inputType="phone" // text, password
                placeholder="Informe seu celular"
                disabled={loading}
              />
            </div>
          )}
          {(tela === 3 || tela === 5) && (
            <div className={styles.formInput}>
              <Input
                control={control}
                name="email"
                label="Email"
                icon={RiAtLine}
                inputType="email" // text, password
                placeholder="Digite seu email"
                disabled={loading}
              />
            </div>
          )}

          {tela > 1 && (
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
          )}
          {tela >= 3 && (
            <div className={styles.formInput}>
              <Input
                control={control}
                name="confirmacaoSenha"
                label="Confirme sua senha"
                icon={RiLock2Line}
                inputType="password" // text, password
                placeholder="Digite novamente sua senha"
                disabled={loading}
              />
            </div>
          )}

          <Button
            className="btn-primary"
            type="submit" // submit, reset, button
            disabled={loading}
          >
            {loading
              ? "Carregando..."
              : tela === 0
              ? "Verificar CPF"
              : tela === 1
              ? "Tela 1"
              : tela === 2
              ? "Entrar"
              : tela === 3
              ? "Cadastrar"
              : tela === 4
              ? "Recuperar senha"
              : tela === 5
              ? "Completar cadastro"
              : "--"}
          </Button>

          {tela === 2 && (
            <Button
              className="btn-secondary mt-1"
              type="button" // submit, reset, button
              onClick={() => {
                console.log("Enviar email");
                setTela(4);
              }}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Esqueci minha senha"}
            </Button>
          )}
          {tela > 1 && (
            <div
              className={styles.btnBack}
              onClick={() => {
                setTela(0);
                setErrorMessage("");
                reset();
              }}
            >
              <RiArrowLeftCircleLine />
              <p>Voltar</p>
            </div>
          )}
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

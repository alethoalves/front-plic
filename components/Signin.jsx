"use client";
// Hooks
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signinSchema, signupSchema } from "@/lib/zodSchemas/authSchema";
import { setCookie } from "cookies-next";

// Estilizações
import {
  RiArrowLeftCircleLine,
  RiAtLine,
  RiCalendarEventLine,
  RiIdCardLine,
  RiKeyLine,
  RiLock2Line,
  RiPhoneLine,
} from "@remixicon/react";
import styles from "./Signin.module.scss";
import Image from "next/image";

// Componentes
import { Notification } from "@/components/Notification";
import Button from "@/components/Button";
import Input from "@/components/Input";

// Chamadas API
import { signin } from "@/app/api/client/auth";
import BuscadorBack from "./BuscadorBack";
import { verificarCodAvaliador } from "@/app/api/client/conviteEvento";
import Link from "next/link";
import { cadastrarAvaliador } from "@/app/api/client/avaliador";

const Auth = ({
  slug,
  pathLogo,
  isAvaliador = false,
  isStudio = false,
  isRoot = false,
}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tela, setTela] = useState(0);
  const [login, setLogin] = useState(true);
  const [perfilOrientador, setPerfilOrientador] = useState(false);
  const [perfilAluno, setPerfilAluno] = useState(false);
  const [perfilAvaliador, setPerfilAvaliador] = useState(false);
  const [perfilGestor, setPerfilGestor] = useState(false);
  const [showInputToken, setShowInputToken] = useState(false);
  const [escolherPerfil, setEscolherPerfil] = useState(false);
  const [perfisDisponiveis, setPerfisDisponiveis] = useState({
    orientador: false,
    aluno: false,
    avaliador: false,
    gestor: false,
  });
  const router = useRouter();

  const handlePerfilSelecionado = (perfil) => {
    setCookie("perfilSelecionado", perfil, { maxAge: 60 * 60 * 24 * 7 }); // Expira em 7 dias
    console.log("Perfil salvo nos cookies:", perfil);

    // Redirecionamento baseado no perfil escolhido
    if (perfil === "orientador") {
      router.push(`/${slug}/user`);
    } else if (perfil === "aluno") {
      router.push(`/${slug}/user`);
    } else if (perfil === "avaliador") {
      !perfilAvaliador
        ? setShowInputToken(true)
        : router.push(`/${slug}/avaliador`);
    } else if (perfil === "gestor") {
      router.push(`/${slug}/gestor`);
    } else {
      router.push("/"); // Redireciona para a home caso o perfil não seja reconhecido
    }
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await signin({ ...data, step: tela });

      if (response.perfis) {
        const user = response.perfis?.some(
          (item) => item.tenant === "plic" && item.cargo === "user"
        );
        const aluno = response.perfis?.some(
          (item) => item.tenant === slug && item.cargo === "aluno"
        );
        const orientador = response.perfis?.some(
          (item) => item.tenant === slug && item.cargo === "orientador"
        );
        const avaliador = response.perfis?.some(
          (item) => item.tenant === slug && item.cargo === "avaliador"
        );
        const avaliadorPlic = response.perfis?.some(
          (item) => item.tenant === "plic" && item.cargo === "avaliador"
        );
        const gestor = response.perfis?.some(
          (item) => item.tenant === slug && item.cargo === "gestor"
        );

        if (isAvaliador && !avaliadorPlic) {
          setErrorMessage(
            "Você não tem perfil de avaliador. Acesse digitando o código do evento."
          );
          reset();
          setTela(0);
        }
        if (isAvaliador && avaliadorPlic) {
          router.push(`/avaliador/home`);
        }

        if (!user) {
          setErrorMessage(
            `Você não tem perfil nesta instituição. É necessário se inscrever em algum edital.`
          );
          reset();
          setTela(0);
          setLogin(false);
          return;
        }
        setPerfilAluno(aluno ? true : false);
        setPerfilOrientador(orientador ? true : false);
        setPerfilAvaliador(avaliador ? true : false);
        setPerfilGestor(gestor ? true : false);
        setEscolherPerfil(true);
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
      confirmacaoSenha: "",
    },
  });
  const handleAvaliadorToEvento = async (value) => {
    try {
      setLoading(true);
      // Chama a função de verificação, passando o value
      const response = await verificarCodAvaliador(value);

      // Exibe o resultado no console ou faça outra ação com ele
      console.log("Resultado da verificação:", response);
      setErrorMessage(
        "Entre novamente para verificar se seu acesso foi concedido."
      );
    } catch (error) {
      console.error("Erro ao verificar avaliador:", error);
      setErrorMessage("Erro na validação do código");
    } finally {
      setLoading(false);
    }
  };
  const handleAvaliadorToTenant = async (token) => {
    try {
      setLoading(true);
      // Chama a API passando o tenant (slug) e o token digitado
      const response = await cadastrarAvaliador(slug, token);
      console.log("Resultado da verificação:", response);

      if (response.status === "success") {
        // Se a resposta for sucesso, redireciona para a área do avaliador
        router.push(`/${slug}/avaliador`);
      } else {
        // Caso o token seja inválido, exibe a mensagem de erro
        setErrorMessage(response.message || "Token inválido.");
      }
    } catch (error) {
      console.error("Erro ao verificar avaliador:", error);
      setErrorMessage("Erro na validação do código");
    } finally {
      setLoading(false);
    }
  };
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

      {!isAvaliador && !isRoot && (
        <div className={styles.header}>
          <h4>Iniciação Científica</h4>
        </div>
      )}

      {errorMessage && (
        <>
          <Notification className="notification-error">
            {errorMessage}
          </Notification>
          {isAvaliador &&
            !showInputToken &&
            errorMessage.startsWith("Você não tem perfil de avaliador") && (
              <BuscadorBack
                btnTitle={loading ? "Validando..." : "Entrar com código"}
                placeholder="Digite o código"
                onSearch={handleAvaliadorToEvento}
                icon={RiKeyLine}
              />
            )}
        </>
      )}
      {showInputToken && (
        <BuscadorBack
          btnTitle={loading ? "Validando..." : "Informe o token"}
          placeholder="Digite o token"
          onSearch={handleAvaliadorToTenant}
          icon={RiKeyLine}
        />
      )}
      {!isAvaliador && escolherPerfil && !showInputToken && (
        <>
          <h6>Escolha o perfil que deseja acessar</h6>
          <div className={styles.perfis}>
            <div
              className={styles.perfil}
              onClick={() => handlePerfilSelecionado("orientador")}
            >
              <p>Orientador</p>
            </div>
            <div
              className={styles.perfil}
              onClick={() => handlePerfilSelecionado("aluno")}
            >
              <p>Aluno</p>
            </div>

            <div
              className={styles.perfil}
              onClick={() => handlePerfilSelecionado("avaliador")}
            >
              <p>Avaliador</p>
            </div>

            {perfilGestor && (
              <div
                className={styles.perfil}
                onClick={() => handlePerfilSelecionado("gestor")}
              >
                <p>Gestor</p>
              </div>
            )}
          </div>
        </>
      )}

      {!escolherPerfil && !showInputToken && (
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
      )}

      {!isRoot && (
        <div className={styles.logoPlic}>
          <Image
            priority
            sizes="300 500 700"
            fill
            src={`/image/plicFundoTransparente.png`}
            alt="logo"
          />
        </div>
      )}
    </div>
  );
};

export default Auth;

"use client";
// Hooks
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signinSchema, signupSchema } from "@/lib/zodSchemas/authSchema";
import { getCookie, setCookie } from "cookies-next";

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
import { cadastrarAvaliador, vincularConviteAvaliador, vincularAvaliadorDireto } from "@/app/api/client/avaliador";
import { getEditais } from "@/app/api/client/edital";
import { getUserTenant, getUserAreas } from "@/app/api/client/userTenant";
import LotacaoSelector from "./Formularios/LotacaoSelector";
import AreaSelector from "./Formularios/AreaSelector";

const Auth = ({
  slug,
  pathLogo,
  isAvaliador = false,
  isStudio = false,
  isRoot = false,
  tokenConvite = null,
  avaliadorOnboardingAno = null,
  cpfInicial = "",
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
  const [precisaLotacao, setPrecisaLotacao] = useState(false);
  const [precisaArea, setPrecisaArea] = useState(false);
  const [onboardingContext, setOnboardingContext] = useState(null); // { userId, ano }
  const router = useRouter();

  // checa o que ainda falta pro avaliador completar o perfil (lotação, depois
  // área) e mostra a próxima etapa pendente; quando não falta mais nada, entra.
  const avancarOnboardingAvaliador = async (userId, ano) => {
    try {
      const userTenant = await getUserTenant(slug, userId, ano);
      if (!userTenant || !userTenant.lotacaoId) {
        setOnboardingContext({ userId, ano });
        setPrecisaLotacao(true);
        setPrecisaArea(false);
        return;
      }

      const areaIds = await getUserAreas(slug, userId);
      if (!areaIds || areaIds.length === 0) {
        setOnboardingContext({ userId, ano });
        setPrecisaLotacao(false);
        setPrecisaArea(true);
        return;
      }

      router.push(`/${slug}/avaliador`);
    } catch (error) {
      console.error("Erro ao verificar perfil do avaliador:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro ao concluir o vínculo com a instituição."
      );
    }
  };

  const finalizarVinculoAvaliador = async () => {
    try {
      const vinculo = tokenConvite
        ? await vincularConviteAvaliador(slug, tokenConvite)
        : await vincularAvaliadorDireto(slug, avaliadorOnboardingAno);
      if (!vinculo || vinculo.status !== "success") {
        setErrorMessage(vinculo?.message ?? "Não foi possível vincular o avaliador.");
        return;
      }
      const { userId, ano } = vinculo;
      await avancarOnboardingAvaliador(userId, ano);
    } catch (error) {
      console.error("Erro ao vincular avaliador:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro ao concluir o vínculo com a instituição."
      );
    }
  };

  const handlePerfilSelecionado = async (perfil) => {
    setCookie("perfilSelecionado", perfil, { maxAge: 60 * 60 * 24 * 7 }); // Expira em 7 dias

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
      let ano = getCookie("anoSelected");

      const editaisData = await getEditais(slug);
      if (!editaisData.length > 0) {
        router.push(`/${slug}/configuracoes/gestor/editais`);
      } else {
        const anoValidado = editaisData.some(
          (edital) => edital.ano === parseInt(ano)
        );

        if (anoValidado) {
          router.push(`/${slug}/gestor/${ano}`);
        } else {
          const editaisOrdenados = [...editaisData].sort(
            (a, b) => b.ano - a.ano
          );
          const anoMaisRecente = editaisOrdenados[0].ano;
          setCookie("anoSelected", anoMaisRecente, {
            maxAge: 60 * 60 * 24 * 365,
          });
          router.push(`/${slug}/gestor/${anoMaisRecente}`);
        }
      }
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
        if (tokenConvite || avaliadorOnboardingAno) {
          await finalizarVinculoAvaliador();
          return;
        }

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
      cpf: cpfInicial,
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

      {(tokenConvite || avaliadorOnboardingAno) && precisaLotacao && onboardingContext && (
        <LotacaoSelector
          tenant={slug}
          userId={onboardingContext.userId}
          ano={onboardingContext.ano}
          onSaved={() => avancarOnboardingAvaliador(onboardingContext.userId, onboardingContext.ano)}
        />
      )}

      {(tokenConvite || avaliadorOnboardingAno) && precisaArea && onboardingContext && (
        <AreaSelector
          tenant={slug}
          userId={onboardingContext.userId}
          onSaved={() => avancarOnboardingAvaliador(onboardingContext.userId, onboardingContext.ano)}
        />
      )}

      {!((tokenConvite || avaliadorOnboardingAno) && (precisaLotacao || precisaArea)) && !escolherPerfil && !showInputToken && (
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

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema } from "@/lib/zodSchemas/authSchema";
import { signin } from "@/app/api/client/auth";
import Input from "../Input";
import { Button } from "primereact/button";
import {
  RiAtLine,
  RiCalendarEventLine,
  RiLock2Line,
  RiPhoneLine,
} from "@remixicon/react";

// authController.js espera sempre o CPF no formato "XXX.XXX.XXX-XX" (é o que
// fica salvo em User.cpf pelo cadastro normal) — o CPF já digitado no passo
// anterior do wizard pode estar sem máscara, então formatamos aqui.
const formatarCpfMascarado = (valor) => {
  const digitos = (valor || "").replace(/\D/g, "").slice(0, 11);
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// Login simplificado para quando o CPF já foi informado num passo anterior
// do próprio fluxo (wizard de inscrição em evento) — evita reproduzir a tela
// de login genérica (<Signin/>, com logo/marca própria e um novo campo de
// CPF pra "verificar"). Reaproveita exatamente a mesma rota/contrato de
// auth (POST /auth/signin via o client signin()), só que com uma UI própria,
// mínima, que já pula direto pra a etapa certa (login/cadastro/primeiro
// acesso/recuperar senha) com base no retorno do step 0.
const LoginCpfConhecido = ({ cpf, onSuccess }) => {
  const [tela, setTela] = useState(null); // 2 login | 3 cadastro | 4 recuperar senha | 5 primeiro acesso
  const [verificandoCpf, setVerificandoCpf] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const cpfMascarado = formatarCpfMascarado(cpf);

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      cpf: cpfMascarado,
      celular: "",
      senha: "",
      dtNascimento: "",
      confirmacaoSenha: "",
    },
  });

  const verificarCpf = async () => {
    setVerificandoCpf(true);
    setErrorMessage("");
    try {
      const response = await signin({ cpf: cpfMascarado, step: 0 });
      setTela(response.nextStep);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ??
          "Erro ao verificar o CPF. Tente novamente.",
      );
    } finally {
      setVerificandoCpf(false);
    }
  };

  useEffect(() => {
    verificarCpf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpfMascarado]);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await signin({ ...data, cpf: cpfMascarado, step: tela });
      if (response.perfis) {
        onSuccess();
        return;
      }
      setErrorMessage("Não foi possível continuar. Tente novamente.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ?? "Erro na conexão com o servidor.",
      );
    } finally {
      setLoading(false);
    }
  };

  const irParaTela = (novaTela) => {
    setErrorMessage("");
    reset();
    setTela(novaTela);
  };

  if (verificandoCpf) {
    return <p>Verificando CPF...</p>;
  }

  if (!tela) {
    return (
      <>
        <div className="notification notification-error">
          <p className="p5">{errorMessage}</p>
        </div>
        <Button
          label="Tentar novamente"
          severity="secondary"
          type="button"
          className="mt-2"
          onClick={verificarCpf}
        />
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-column gap-2">
        {(tela === 3 || tela === 4 || tela === 5) && (
          <Input
            control={control}
            name="dtNascimento"
            label="Data de nascimento"
            icon={RiCalendarEventLine}
            inputType="date"
            placeholder="DD/MM/AAAA"
            disabled={loading}
          />
        )}
        {(tela === 3 || tela === 5) && (
          <Input
            control={control}
            name="celular"
            label="Celular"
            icon={RiPhoneLine}
            inputType="phone"
            placeholder="Informe seu celular"
            disabled={loading}
          />
        )}
        {(tela === 3 || tela === 5) && (
          <Input
            control={control}
            name="email"
            label="Email"
            icon={RiAtLine}
            inputType="email"
            placeholder="Digite seu email"
            disabled={loading}
          />
        )}
        <Input
          control={control}
          name="senha"
          label={tela === 4 ? "Nova senha" : "Senha"}
          icon={RiLock2Line}
          inputType="password"
          placeholder="Digite sua senha"
          disabled={loading}
        />
        {(tela === 3 || tela === 4 || tela === 5) && (
          <Input
            control={control}
            name="confirmacaoSenha"
            label="Confirme sua senha"
            icon={RiLock2Line}
            inputType="password"
            placeholder="Digite novamente sua senha"
            disabled={loading}
          />
        )}
      </div>

      {errorMessage && (
        <div className="notification notification-error mt-2">
          <p className="p5">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-column gap-1 pt-3">
        <Button
          label={
            loading
              ? "Enviando..."
              : tela === 2
                ? "Entrar"
                : tela === 3
                  ? "Cadastrar"
                  : tela === 4
                    ? "Redefinir senha"
                    : "Completar cadastro"
          }
          type="submit"
          disabled={loading}
        />
        {tela === 2 && (
          <Button
            label="Esqueci minha senha"
            severity="secondary"
            text
            type="button"
            onClick={() => irParaTela(4)}
            disabled={loading}
          />
        )}
        {tela === 4 && (
          <Button
            label="Voltar para o login"
            severity="secondary"
            text
            type="button"
            onClick={() => irParaTela(2)}
            disabled={loading}
          />
        )}
      </div>
    </form>
  );
};

export default LoginCpfConhecido;

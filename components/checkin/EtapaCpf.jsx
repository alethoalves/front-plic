"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RiIdCardLine, RiLoginBoxLine } from "@remixicon/react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import cpfValidator from "@/lib/cpfValidator";
import styles from "./checkin.module.scss";

const cpfSchema = z.object({
  cpf: z
    .string()
    .trim()
    .min(1, "Campo obrigatório!")
    .refine((value) => cpfValidator(value), { message: "CPF inválido!" }),
});

// Primeira tela do check-in: o aluno chega aqui pelo QR Code do evento e
// digita o CPF pra o sistema achar as submissões dele.
const EtapaCpf = ({ onConsultar, loading, erro }) => {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(cpfSchema),
    defaultValues: { cpf: "" },
  });

  return (
    <div className={styles.card}>
      <div className="flex align-items-center gap-1 mb-2">
        <RiLoginBoxLine style={{ width: 22, height: 22, color: "var(--primary-dark)" }} />
        <h1 className="h-editorial-sm">Check-in do pôster</h1>
      </div>
      <p className="mb-3">
        Digite seu CPF para localizar sua submissão e iniciar o check-in.
      </p>

      <form onSubmit={handleSubmit((data) => onConsultar(data.cpf))}>
        <Input
          className="mb-2 cpf-input"
          control={control}
          name="cpf"
          label="Seu CPF"
          icon={RiIdCardLine}
          inputType="text"
          placeholder="Digite seu CPF"
          disabled={loading}
          autoFocus
        />

        {erro && <p className={styles.erro}>{erro}</p>}

        <Button className="btn-primary mt-2 w-100" type="submit" disabled={loading} loading={loading}>
          Continuar
        </Button>
      </form>
    </div>
  );
};

export default EtapaCpf;

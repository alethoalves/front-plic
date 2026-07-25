"use client";
import { RiIdCardLine } from "@remixicon/react";
import { useForm } from "react-hook-form";
import Input from "../Input";
import { RenderSubmissoesCard } from "./RenderSubmissoesCard";

export const MinhasInscricoesConteudo = ({ params }) => {
  const { control, watch } = useForm({
    defaultValues: {
      cpf: "",
    },
  });

  const cpfValue = watch("cpf");

  return (
    <>
      <Input
        control={control}
        name="cpf"
        label="Digite seu CPF"
        icon={RiIdCardLine}
        inputType="text"
        placeholder="Digite seu CPF"
      />

      {cpfValue && cpfValue.length >= 11 && (
        <div className="mt-3">
          <RenderSubmissoesCard
            params={params}
            cpf={cpfValue}
            eventoSlug={params.edicao}
          />
        </div>
      )}
    </>
  );
};

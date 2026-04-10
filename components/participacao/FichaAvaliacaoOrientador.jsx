"use client";
import Button from "@/components/Button";

import {
  RiAddLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiFileExcelLine,
  RiSave2Line,
} from "@remixicon/react";
import styles from "./FichaAvaliacaoOrientador.module.scss";
import NoData from "../NoData";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@/components/Input";
import SelectDynamic from "@/components/SelectDynamic";

// Componente para renderizar campos de um item
const RenderCampo = ({ campo, control, loading, errors, register, watch }) => {
  if (campo.type === "text" || !campo.type) {
    return (
      <Input
        key={`${campo.label}-text`}
        control={control}
        name={`campo-${campo.label}`}
        label={campo.label}
        inputType="text"
        placeholder={campo.label}
        disabled={loading}
        rules={{
          required: "Campo obrigatório!",
        }}
      />
    );
  }

  if (campo.type === "number") {
    return (
      <Input
        key={`${campo.label}-number`}
        control={control}
        name={`campo-${campo.label}`}
        label={campo.label}
        inputType="number"
        placeholder={campo.label}
        disabled={loading}
        rules={{
          required: "Campo obrigatório!",
        }}
      />
    );
  }

  if (campo.qualis || campo.options) {
    return (
      <SelectDynamic
        key={`${campo.label}-select`}
        control={control}
        name={`campo-${campo.label}`}
        label={campo.label}
        options={campo.options || []}
        placeholder="Selecione uma opção"
        disabled={loading}
        rules={{
          required: "Campo obrigatório!",
        }}
      />
    );
  }

  return null;
};

// Componente para renderizar itens aninhados recursivamente
const RenderGrupoItem = ({
  item,
  control,
  loading,
  errors,
  register,
  watch,
  level = 0,
}) => {
  const padding = `${level * 16}px`;

  return (
    <div
      key={item.label}
      style={{ paddingLeft: padding }}
      className={styles.grupoItem}
    >
      <h6 className={styles[`level-${level}`]}>{item.label}</h6>

      {/* Renderiza campos do item */}
      {item.campos && item.campos.length > 0 && (
        <div className={styles.campos}>
          {item.campos.map((campo) => (
            <RenderCampo
              key={campo.label}
              campo={campo}
              control={control}
              loading={loading}
              errors={errors}
              register={register}
              watch={watch}
            />
          ))}
        </div>
      )}

      {/* Renderiza grupos aninhados */}
      {item.grupos && item.grupos.length > 0 && (
        <div className={styles.grupos}>
          {item.grupos.map((subItem) => (
            <RenderGrupoItem
              key={subItem.label}
              item={subItem}
              control={control}
              loading={loading}
              errors={errors}
              register={register}
              watch={watch}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FichaAvaliacaoOrientador = ({
  participacaoInfo,
  setParticipacaoInfo,
  tenant,
  inscricaoSelected,
  setInscricao,
  closeModalAndResetData,
  handleValidateParticipacao,
  tipoParticipacao,
  schemaFichaAvaliacaoOrientador = { schemas: [] },
}) => {
  console.log(
    "FichaAvaliacaoOrientador props - schemaFichaAvaliacaoOrientador:",
    schemaFichaAvaliacaoOrientador,
  );

  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  // Extrai o primeiro item do schema
  const fichaData =
    schemaFichaAvaliacaoOrientador?.schemas &&
    schemaFichaAvaliacaoOrientador.schemas.length > 0
      ? schemaFichaAvaliacaoOrientador.schemas[0]
      : null;

  // Schema simples para validação
  const fichaSchema = useMemo(() => {
    return z.object({
      // Adicione validações conforme necessário
    });
  }, []);

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(fichaSchema),
    defaultValues: {},
  });

  const handleFormSubmit = async (data) => {
    setLoadingForm(true);
    setErrorForm("");
    try {
      console.log("Dados da ficha de avaliação:", data);
      alert("Ficha salva com sucesso (fake)!");
    } catch (error) {
      console.error("Erro ao enviar a ficha:", error);
      setErrorForm(error.message || "Erro ao enviar a ficha.");
    } finally {
      setLoadingForm(false);
    }
  };
  return (
    <div className={styles.orientador}>
      <h5>Ficha de Avaliação do Orientador</h5>
      <div className={styles.label}>
        <h6>Nome</h6>
        <p>{participacaoInfo?.user?.nome}</p>
      </div>

      {fichaData ? (
        <div className={styles.label}>
          <h6>{fichaData.label}</h6>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className={`${styles.fichaConteudo} mt-2`}>
              {fichaData.grupos && fichaData.grupos.length > 0 ? (
                fichaData.grupos.map((grupo) => (
                  <RenderGrupoItem
                    key={grupo.label}
                    item={grupo}
                    control={control}
                    loading={loadingForm}
                    errors={errors}
                    register={register}
                    watch={watch}
                    level={0}
                  />
                ))
              ) : (
                <NoData description="Nenhum grupo de avaliação encontrado." />
              )}
            </div>
            <div className={`${styles.btnSubmit} mt-2`}>
              <Button
                icon={RiSave2Line}
                className="btn-primary"
                type="submit"
                disabled={loadingForm}
              >
                {loadingForm ? "Carregando..." : "Salvar"}
              </Button>
              {errorForm && (
                <div className={`notification notification-error`}>
                  <p className="p5">{errorForm}</p>
                </div>
              )}
            </div>
          </form>
        </div>
      ) : (
        <NoData description="Nenhuma ficha de avaliação disponível." />
      )}
    </div>
  );
};

export default FichaAvaliacaoOrientador;

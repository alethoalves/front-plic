"use client";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { atividadeSchema } from "@/lib/zodSchemas/atividadeSchema";
import {
  createAtividade,
  updateAtividade,
  deleteAtividade,
} from "@/app/api/client/atividade";

import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line } from "@remixicon/react";
import Button from "@/components/Button";
import Input from "@/components/Input";

// PrimeReact
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";

const FormNewAtividade = ({
  tenantSlug,
  ano,
  todosEditais,
  formularios,
  atividadeExistente,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(atividadeSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      obrigatoria: true,
      dataInicio: "",
      dataFinal: "",
      permitirEntregaForaPrazo: false,
      formularioId: 0,
      editaisSelecionados: [],
    },
  });

  const formularioId = watch("formularioId");

  // Preenche dados se for edição em lote
  useEffect(() => {
    if (atividadeExistente) {
      reset({
        titulo: atividadeExistente.titulo,
        descricao: atividadeExistente.descricao,
        obrigatoria: atividadeExistente.obrigatoria,
        dataInicio: formatDateForDisplay(atividadeExistente.dataInicio),
        dataFinal: formatDateForDisplay(atividadeExistente.dataFinal),
        permitirEntregaForaPrazo: atividadeExistente.permitirEntregaForaPrazo,
        formularioId: atividadeExistente.formularioId,
        editaisSelecionados: [atividadeExistente.edital.id], // Agora é um array com um único edital
      });
    }
  }, [atividadeExistente, reset]);

  const onSubmit = async (values) => {
    setLoading(true);
    setError("");

    try {
      if (!atividadeExistente) {
        // Criação de uma única atividade
        const editalId = values.editaisSelecionados[0]; // Pega o primeiro (e único) edital selecionado
        await createAtividade(tenantSlug, editalId, {
          titulo: values.titulo,
          descricao: values.descricao,
          obrigatoria: values.obrigatoria,
          dataInicio: values.dataInicio,
          dataFinal: values.dataFinal,
          permitirEntregaForaPrazo: values.permitirEntregaForaPrazo,
          formularioId: values.formularioId,
        });
      } else {
        // Edição de uma atividade existente
        await updateAtividade(
          tenantSlug,
          atividadeExistente.edital.id,
          atividadeExistente.id,
          {
            titulo: values.titulo,
            descricao: values.descricao,
            obrigatoria: values.obrigatoria,
            dataInicio: values.dataInicio,
            dataFinal: values.dataFinal,
            permitirEntregaForaPrazo: values.permitirEntregaForaPrazo,
            formularioId: values.formularioId,
          }
        );
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ??
          err.message ??
          "Ocorreu um erro inesperado ao salvar a atividade."
      );
    } finally {
      setLoading(false);
    }
  };

  // Opções para PrimeReact MultiSelect
  const editalOptions = todosEditais.map((e) => ({
    label: e.titulo,
    value: e.id,
  }));

  // Opções para PrimeReact Dropdown de formulários
  const formularioOptions = formularios.map((f) => ({
    label: f.titulo,
    value: f.id,
  }));

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.input}>
        {/* ===================== MultiSelect de Editais ===================== */}
        <label className="block mb-1 font-medium">
          <h6>Editais*</h6>
        </label>
        <Controller
          control={control}
          name="editaisSelecionados"
          render={({ field }) => (
            <MultiSelect
              disabled={atividadeExistente ? true : false}
              value={field.value}
              options={editalOptions}
              onChange={(e) => field.onChange(e.value || [])} // Garante array
              placeholder="Selecione editais"
              className="w-100 mb-2"
              //filter
              display="chip"
            />
          )}
        />
        {errors.editaisSelecionados && (
          <p className="text-red-600 text-sm mb-2">
            Selecione ao menos um edital.
          </p>
        )}

        {/* ===================== Dropdown de Formulário ===================== */}
        <label className="block mb-1 font-medium">
          <h6>Formulário da atividade*</h6>
        </label>
        <Controller
          control={control}
          name="formularioId"
          render={({ field }) => (
            <Dropdown
              {...field}
              options={[
                { label: "Selecione um formulário", value: 0 },
                ...formularioOptions,
              ]}
              className="w-100 mb-2"
              placeholder="Formulário"
              disabled={atividadeExistente ? true : false}
            />
          )}
        />
        {errors.formularioId && (
          <p className="text-red-600 text-sm mb-2">
            {errors.formularioId.message}
          </p>
        )}

        {formularioId !== 0 && (
          <>
            <label className="block mb-1 font-medium">
              <h6>Título da atividade*</h6>
            </label>
            <Input
              className="mb-2"
              control={control}
              name="titulo"
              //label="Título da atividade"
              inputType="text"
              placeholder="Digite o título"
              disabled={loading}
            />
            {errors.titulo && (
              <p className="text-red-600 text-sm mb-2">
                {errors.titulo.message}
              </p>
            )}
            <label className="block mb-1 font-medium">
              <h6>Descrição da atividade*</h6>
            </label>
            <Input
              className="mb-2"
              control={control}
              name="descricao"
              //label="Descrição da atividade"
              inputType="text"
              placeholder="Digite a descrição"
              disabled={loading}
            />
            {errors.descricao && (
              <p className="text-red-600 text-sm mb-2">
                {errors.descricao.message}
              </p>
            )}
            <label className="block mb-1 font-medium">
              <h6>Atividade é obrigatória*</h6>
            </label>
            <Controller
              control={control}
              name="obrigatoria"
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={[
                    { label: "Selecione", value: null },
                    { label: "Sim", value: true },
                    { label: "Não", value: false },
                  ]}
                  placeholder="Atividade é obrigatória?"
                  className="w-full mb-2"
                />
              )}
            />
            {errors.obrigatoria && (
              <p className="text-red-600 text-sm mb-2">
                {errors.obrigatoria.message}
              </p>
            )}

            {errors.aberta && (
              <p className="text-red-600 text-sm mb-2">
                {errors.aberta.message}
              </p>
            )}
            <label className="block mb-1 font-medium">
              <h6>Data de início*</h6>
            </label>
            <Input
              className="mb-2"
              control={control}
              name="dataInicio"
              //label="Data de Início"
              inputType="date"
              placeholder="DD/MM/AAAA"
              disabled={loading}
            />
            {errors.dataInicio && (
              <p className="text-red-600 text-sm mb-2">
                {errors.dataInicio.message}
              </p>
            )}
            <label className="block mb-1 font-medium">
              <h6>Data final*</h6>
            </label>
            <Input
              className="mb-2"
              control={control}
              name="dataFinal"
              //label="Data de Final"
              inputType="date"
              placeholder="DD/MM/AAAA"
              disabled={loading}
            />
            {errors.dataFinal && (
              <p className="text-red-600 text-sm mb-2">
                {errors.dataFinal.message}
              </p>
            )}
            <label className="block mb-1 font-medium">
              <h6>Permitir entrega fora do prazo?*</h6>
            </label>
            <Controller
              control={control}
              name="permitirEntregaForaPrazo"
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={[
                    { label: "Selecione", value: null },
                    { label: "Sim", value: true },
                    { label: "Não", value: false },
                  ]}
                  placeholder="Permitir envio fora do prazo?"
                  className="w-full mb-2"
                />
              )}
            />
            {errors.permitirEntregaForaPrazo && (
              <p className="text-red-600 text-sm mb-2">
                {errors.permitirEntregaForaPrazo.message}
              </p>
            )}
          </>
        )}
      </div>
      {error && (
        <div className="notification notification-error mt-1">
          <p className="p5">{error}</p>
        </div>
      )}
      <div className={`${styles.btnSubmit} `}>
        {formularioId !== 0 && (
          <Button
            icon={RiSave2Line}
            className="btn-primary "
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Salvando..."
              : atividadeExistente
              ? "Salvar alterações"
              : "Criar Atividades"}
          </Button>
        )}
        <Button
          className="btn-secondary"
          type="button"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default FormNewAtividade;

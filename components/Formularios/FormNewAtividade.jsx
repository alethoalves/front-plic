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

const FormNewAtividade = ({
  tenantSlug,
  ano,
  todosEditais,
  formularios,
  grupoExistente,
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
      aberta: true,
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
    if (grupoExistente) {
      // Converter datas para formato de input (YYYY-MM-DD)
      const dataInicio = new Date(grupoExistente.dataInicio)
        .toISOString()
        .split("T")[0];
      const dataFinal = new Date(grupoExistente.dataFinal)
        .toISOString()
        .split("T")[0];

      reset({
        titulo: grupoExistente.titulo,
        descricao: grupoExistente.descricao,
        obrigatoria: grupoExistente.obrigatoria,
        aberta: grupoExistente.aberta,
        dataInicio,
        dataFinal,
        permitirEntregaForaPrazo: grupoExistente.permitirEntregaForaPrazo,
        formularioId: grupoExistente.formularioId,
        editaisSelecionados: grupoExistente.vinculacoes.map((v) => v.editalId),
      });
    }
  }, [grupoExistente, reset]);

  const onSubmit = async (values) => {
    console.log("🚀 [FormNewAtividade] onSubmit chamado com values:", values);
    const editais = values.editaisSelecionados;
    console.log("🚀 editaisSelecionados extraído:", editais);

    setLoading(true);
    setError("");

    const {
      titulo,
      descricao,
      obrigatoria,
      aberta,
      dataInicio,
      dataFinal,
      permitirEntregaForaPrazo,
      formularioId: formId,
      editaisSelecionados,
    } = values;

    try {
      if (!grupoExistente) {
        // Criar N atividades, uma para cada edital selecionado
        if (!Array.isArray(editaisSelecionados)) {
          console.error(
            "⚠️ editaisSelecionados NÃO é um array:",
            editaisSelecionados
          );
          throw new Error(
            "editaisSelecionados deve ser um array mesmo ao criar"
          );
        }

        console.log(
          "🔄 Criando atividades em lote para cada edital:",
          editaisSelecionados
        );
        await Promise.all(
          editaisSelecionados.map((editalId) => {
            console.log(
              "   → Chamando createAtividade para editalId:",
              editalId
            );
            return createAtividade(tenantSlug, editalId, {
              titulo,
              descricao,
              obrigatoria,
              aberta,
              dataInicio,
              dataFinal,
              permitirEntregaForaPrazo,
              formularioId: formId,
            });
          })
        );
      } else {
        // Edição em lote
        console.log(
          "📝 Edição em lote de atividades — grupoExistente:",
          grupoExistente
        );

        const idsAtuais = grupoExistente.vinculacoes.map((v) => v.editalId);
        console.log("   idsAtuais (vínculos existentes):", idsAtuais);

        const mapaAtividexEdital = {};
        grupoExistente.vinculacoes.forEach((v) => {
          mapaAtividexEdital[v.editalId] = v.atividadeId;
        });
        console.log("   mapaAtividexEdital:", mapaAtividexEdital);

        // 1) Interseção → update
        const intersecao = idsAtuais.filter((id) =>
          editaisSelecionados.includes(id)
        );
        console.log("   intersecao (editais que permanecem):", intersecao);
        await Promise.all(
          intersecao.map((editalId) => {
            const atividadeId = mapaAtividexEdital[editalId];
            console.log(
              `      → updateAtividade para atividadeId=${atividadeId}, editalId=${editalId}`
            );
            return updateAtividade(tenantSlug, editalId, atividadeId, {
              titulo,
              descricao,
              obrigatoria,
              aberta,
              dataInicio,
              dataFinal,
              permitirEntregaForaPrazo,
              formularioId: formId,
            });
          })
        );

        // 2) Removidos → delete
        const removidos = idsAtuais.filter(
          (id) => !editaisSelecionados.includes(id)
        );
        console.log("   removidos (editais a deletar):", removidos);
        await Promise.all(
          removidos.map((editalId) => {
            const atividadeId = mapaAtividexEdital[editalId];
            console.log(
              `      → deleteAtividade para atividadeId=${atividadeId}, editalId=${editalId}`
            );
            return deleteAtividade(tenantSlug, editalId, atividadeId);
          })
        );

        // 3) Novos → create
        const novos = editaisSelecionados.filter(
          (id) => !idsAtuais.includes(id)
        );
        console.log("   novos (editais a criar):", novos);
        await Promise.all(
          novos.map((editalId) => {
            console.log(
              `      → createAtividade para novo editalId=${editalId}`
            );
            return createAtividade(tenantSlug, editalId, {
              titulo,
              descricao,
              obrigatoria,
              aberta,
              dataInicio,
              dataFinal,
              permitirEntregaForaPrazo,
              formularioId: formId,
            });
          })
        );
      }

      console.log("✅ onSubmit finalizado com sucesso");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("❌ Erro ao salvar atividade em lote:", err);
      setError(
        err.response?.data?.message ??
          err.message ??
          "Ocorreu um erro inesperado ao salvar as atividades."
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
            <label className="block mb-1 font-medium">
              <h6>Atividade está recebendo repostas?*</h6>
            </label>
            <Controller
              control={control}
              name="aberta"
              render={({ field }) => (
                <Dropdown
                  {...field}
                  options={[
                    { label: "Selecione", value: null },
                    { label: "Sim", value: true },
                    { label: "Não", value: false },
                  ]}
                  placeholder="Atividade está aberta?"
                  className="w-full mb-2"
                />
              )}
            />
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
              : grupoExistente
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

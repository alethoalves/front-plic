"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cargoSchema } from "@/lib/zodSchemas/cargoSchema";
import { createCargo, updateCargo } from "@/app/api/client/cargo";
import { getAreas } from "@/app/api/client/area"; // Importe a função para buscar áreas
import { MultiSelect } from "primereact/multiselect"; // Componente MultiSelect do PrimeReact
import Button from "@/components/Button";
import Select from "../Select";
import styles from "@/components/Formularios/Form.module.scss";
import Input from "../Input";

const NewCargo = ({
  tenantSlug,
  initialData,
  onSuccess,
  onClose,
  avaliador = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState([]); // Estado para armazenar as áreas disponíveis

  const { control, handleSubmit, setValue, watch, register } = useForm({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      cargo: initialData.cargo || "", // Preenche o cargo com o valor existente
      nivel: initialData.nivel?.toString() || "1", // Preenche o nível com o valor existente
      areas:
        initialData.user?.userArea?.map((ua) => ua.areaId.toString()) || [], // Preenche as áreas com os valores existentes
      email: initialData.user?.email || initialData.email || "", // Preenche o email com o valor existente
    },
  });

  // Carrega as áreas ao abrir o modal
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areasData = await getAreas(tenantSlug);

        // Ordena as áreas alfabeticamente pelo campo "label"
        const areasOrdenadas = areasData
          .map((area) => ({
            label: area.area, // Nome da área
            value: area.id.toString(), // ID da área como string
          }))
          .sort((a, b) => a.label.localeCompare(b.label)); // Ordena por label

        setAreas(areasOrdenadas); // Atualiza o estado com as áreas ordenadas
      } catch (error) {
        console.error("Erro ao buscar áreas:", error);
      }
    };

    if (avaliador) {
      fetchAreas();
    }
  }, [tenantSlug, avaliador]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    console.log(initialData);
    const newData = {
      id: initialData.id,
      cargo: data.cargo,
      nivel: data.cargo === "avaliador" ? parseInt(data.nivel) : null, // Define o nível apenas para avaliadores
      userId: initialData.user?.id
        ? `${initialData.user?.id}`
        : initialData.userId,
      areas: data.areas || [], // Inclui as áreas selecionadas
      email: data.email, // Inclui o email
    };

    try {
      if (initialData.user?.id) {
        // Se houver um ID, significa que devemos atualizar o cargo existente
        await updateCargo(tenantSlug, newData);
      } else {
        // Caso contrário, criamos um novo cargo
        await createCargo(tenantSlug, newData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
      setError(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={styles.formulario}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <p className={styles.infoLabel}>Nome</p>
      <div className={styles.info}>
        <p>{initialData.user?.nome || initialData.nome}</p>
      </div>

      {/* Campo de email */}
      <Input
        className="mb-2"
        control={control}
        name="email"
        label="Email"
        inputType="email"
        placeholder="Digite o email"
        disabled={loading}
      />

      {/* Select para o tipo de cargo */}
      <Select
        className="mb-2"
        control={control}
        name="cargo"
        label="Tipo de cargo"
        options={
          avaliador
            ? [
                { label: "Selecione uma opção", value: "" },
                { label: "Avaliador", value: "avaliador" },
              ]
            : [
                { label: "Selecione uma opção", value: "" },
                { label: "Gestor", value: "gestor" },
              ]
        }
        disabled={loading}
      />

      {/* Select para o nível (apenas se o cargo for "Avaliador") */}
      {avaliador && (
        <Select
          className="mb-2"
          control={control}
          name="nivel"
          label="Nível do Comitê"
          options={[
            { label: "Selecione uma opção", value: "" },
            { label: "Ad hoc", value: "0" },
            { label: "Comitê Institucional", value: "1" },
            { label: "Comitê Externo", value: "2" },
          ]}
          disabled={loading}
        />
      )}

      {/* MultiSelect para áreas (apenas se o cargo for "Avaliador") */}
      {avaliador && (
        <div className="mb-2">
          <label htmlFor="areas" className="block mb-2">
            Áreas de Atuação:
          </label>
          <MultiSelect
            id="areas"
            value={watch("areas") || []} // Valor atual do campo
            options={areas} // Opções carregadas da API
            onChange={(e) => setValue("areas", e.value)} // Atualiza o valor do campo
            placeholder="Selecione as áreas"
            display="chip"
            style={{ width: "100%" }}
            disabled={loading}
          />
        </div>
      )}

      <Button className="btn-primary" type="submit">
        {loading ? "Enviando..." : "Enviar"}
      </Button>

      {error && (
        <div className={`notification notification-error`}>
          <p className="p5">{error}</p>
        </div>
      )}
    </form>
  );
};

export default NewCargo;

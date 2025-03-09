//HOOKS
import { useState } from "react";
import { useForm } from "react-hook-form";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "../Select";
import { cargoSchema } from "@/lib/zodSchemas/cargoSchema";
import { createCargo } from "@/app/api/client/cargo";
import { zodResolver } from "@hookform/resolvers/zod";

const NewCargo = ({
  tenantSlug,
  initialData,
  onSuccess,
  onClose,
  avaliador = false,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { control, handleSubmit, setValue } = useForm({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      cargo: "",
      nivel: "", // Adicionado campo para o nível
    },
  });

  const handleFormSubmit = async (data) => {
    const newData = {
      cargo: data.cargo,
      nivel: data.cargo === "avaliador" ? parseInt(data.nivel) : null, // Define o nível apenas para avaliadores
      userId: initialData.userId,
    };
    console.log(newData);
    setLoading(true);
    setError("");
    try {
      await createCargo(tenantSlug, newData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error:", error);
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
        <p>{initialData.nome}</p>
      </div>

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
            { label: "Comitê Institucional", value: "1" },
            { label: "Comitê Externo", value: "2" },
          ]}
          disabled={loading}
        />
      )}

      <Button className="btn-primary" type="submit">
        Enviar
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

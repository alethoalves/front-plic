//HOOKS
import { useState } from "react";
import { useForm } from "react-hook-form";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "../Select";
import { formNewParticipacao } from "@/lib/zodSchemas/formNewParticipacao";
import { zodResolver } from "@hookform/resolvers/zod";
import { createParticipacao } from "@/app/api/client/participacao";
import { cargoSchema } from "@/lib/zodSchemas/cargoSchema";
import { createCargo } from "@/app/api/client/cargo";

const NewCargo = ({ tenantSlug, initialData, onSuccess, onClose }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { control, handleSubmit, setValue } = useForm({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      cargo: "",
    },
  });
  const handleFormSubmit = async (data) => {
    const newData = { cargo: data.cargo, userId: initialData.userId };
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
      <p className={styles.infoLabel}>Nome </p>
      <div className={styles.info}>
        <p>{initialData.nome}</p>
      </div>
      <Select
        className="mb-2"
        control={control}
        name="cargo"
        label="Tipo de cargo"
        options={[
          { label: "Selecione uma opção", value: "" },
          { label: "Gestor", value: "gestor" },
        ]}
        disabled={loading}
      />
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

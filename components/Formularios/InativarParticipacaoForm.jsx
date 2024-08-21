//HOOKS
import { useState } from "react";
import { useForm } from "react-hook-form";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { formInativarParticipacao } from "@/lib/zodSchemas/formInativarParticipacao";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createParticipacao,
  inativarParticipacao,
} from "@/app/api/client/participacao";

const InativarParticipacaoForm = ({
  tenantSlug,
  idParticipacao,
  onSuccess,
  onClose,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { control, handleSubmit, setValue } = useForm({
    resolver: zodResolver(formInativarParticipacao),
    defaultValues: {
      fim: "",
    },
  });
  const handleFormSubmit = async (data) => {
    const { fim } = data;
    setLoading(true);
    setError("");
    try {
      const response = await inativarParticipacao(
        tenantSlug,
        idParticipacao,
        fim
      );
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
      <Input
        className="mb-2"
        control={control}
        name="fim"
        label="Fim da participação"
        inputType="date"
        placeholder="DD/MM/AAAA"
        disabled={loading}
      />
      <Button className="btn-error" type="submit">
        Inativar
      </Button>
      {error && (
        <div className={`notification notification-error`}>
          <p className="p5">{error}</p>
        </div>
      )}
    </form>
  );
};

export default InativarParticipacaoForm;

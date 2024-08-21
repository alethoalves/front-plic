//HOOKS
import { useState } from "react";
import { useForm } from "react-hook-form";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { formNewParticipacao } from "@/lib/zodSchemas/formNewParticipacao";
import { zodResolver } from "@hookform/resolvers/zod";
import { createParticipacao } from "@/app/api/client/participacao";

const ParticipacaoForm = ({
  tenantSlug,
  initialData,
  inscricaoId,
  onSuccess,
  onClose,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { control, handleSubmit, setValue } = useForm({
    resolver: zodResolver(formNewParticipacao),
    defaultValues: {
      userId: "",
      nome: "",
      inicio: "",
      cpf: "",
      status: "",
      tipo: "",
      cvLattesId: "",
      ...initialData,
    },
  });
  const handleFormSubmit = async (data) => {
    const { tipo, inicio } = data;
    const status = "ativo";
    const cvLattesId = "";
    const newData = {
      ...initialData,
      tipo,
      inscricaoId,
      status,
      cvLattesId,
      inicio,
    };
    //inscricaoId, cpf, nome, status, tipo, planoDeTrabalhoId
    setLoading(true);
    setError("");
    try {
      await createParticipacao(tenantSlug, newData);
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
        name="tipo"
        label="Tipo de orientador"
        options={[
          { label: "Selecione uma opção", value: "" },
          { label: "Orientador", value: "orientador" },
          { label: "Coorientador", value: "coorientador" },
        ]}
        disabled={loading}
      />
      <Input
        className="mb-2"
        control={control}
        name="inicio"
        label="Início da participação"
        inputType="date"
        placeholder="DD/MM/AAAA"
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

export default ParticipacaoForm;

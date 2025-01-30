import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import styles from "@/components/Formularios/Form.module.scss";
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
  tipoParticipacao,
  showLabelInicio = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBolsaField, setShowBolsaField] = useState(false);

  const { control, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(formNewParticipacao),
    defaultValues: {
      userId: "",
      nome: "",
      inicio: "",
      cpf: "",
      tipo: "",
      cvLattesId: "",
      solicitarBolsa: false,
      ...initialData,
    },
  });

  const tipo = watch("tipo");

  useEffect(() => {
    setShowBolsaField(tipo === "aluno");
  }, [tipo]);

  const handleFormSubmit = async (data) => {
    const { tipo, inicio, solicitarBolsa } = data;
    const cvLattesId = "";
    const newData = {
      ...initialData,
      tipo,
      inscricaoId,
      cvLattesId,
      inicio,
      solicitarBolsa: tipo === "aluno" ? solicitarBolsa : false,
    };

    if (tipo === "aluno" && initialData.planoDeTrabalhoId) {
      newData.planoDeTrabalhoId = `${initialData.planoDeTrabalhoId}`;
    }

    setLoading(true);
    setError("");
    try {
      const response = await createParticipacao(tenantSlug, newData);
      onSuccess(response);
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
        label="Tipo de participação"
        options={[
          { label: "Selecione uma opção", value: "" },
          { label: `${tipoParticipacao}`, value: `${tipoParticipacao}` },
        ]}
        disabled={loading}
      />
      {showLabelInicio && (
        <Input
          className="mb-2"
          control={control}
          name="inicio"
          label="Início da participação"
          inputType="date"
          placeholder="DD/MM/AAAA"
          disabled={loading}
        />
      )}
      {showBolsaField && (
        <Input
          control={control}
          name="solicitarBolsa"
          label="Solicitar bolsa"
          inputType="checkbox"
          disabled={loading}
        />
      )}
      <Button className="btn-primary" type="submit">
        {loading ? "Aguarde..." : "Salvar"}
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

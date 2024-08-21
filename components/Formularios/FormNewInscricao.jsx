import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/Button";
import { RiSave2Line } from "@remixicon/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Select from "@/components/Select";
import styles from "@/components/Formularios/Form.module.scss";
import { formNewInscricao } from "@/lib/zodSchemas/formNewInscricao";
import { createInscricao } from "@/app/api/client/inscricao";
import { useRouter } from "next/navigation";

const FormNewInscricao = ({ data, tenant }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const editais = [
    { label: "Selecione uma opção", value: "" },
    ...data.editais.map((item) => ({
      label: `${item.titulo} - ${item.ano}`,
      value: item.id,
    })),
  ];

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await createInscricao(tenant, formData);
      if (response) {
        console.log("Inscrição criada com sucesso:", response);
        // Navega para a página de detalhes da inscrição
        router.push(`/${tenant}/gestor/inscricoes/${response.inscricao.id}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(formNewInscricao),
    defaultValues: {
      editalId: "",
      status: "incompleta",
    },
  });

  return (
    <form
      className={`${styles.formulario}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className={`${styles.input}`}>
        <Select
          control={control}
          name="editalId"
          label="Escolha o edital"
          options={editais}
          disabled={loading}
        />
      </div>
      <div className={`${styles.btnSubmit}`}>
        <Button
          icon={RiSave2Line}
          className="btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Iniciar inscrição"}
        </Button>
      </div>
      {errorMessage && <p className="error">{errorMessage}</p>}
    </form>
  );
};

export default FormNewInscricao;

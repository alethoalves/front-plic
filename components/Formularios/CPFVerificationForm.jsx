//HOOKS
import { useState } from "react";
import { useForm } from "react-hook-form";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";

//FUNÇÕES
import { getDataFromCPF } from "@/app/api/clientReq";
import { getUserByCpf, createUser } from "@/app/api/client/user";
import cpfValidator from "@/lib/cpfValidator";

const CPFVerificationForm = ({ tenantSlug, onCpfVerified }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [isCpfVerified, setIsCpfVerified] = useState(false);

  const { control, setValue, watch, reset, handleSubmit } = useForm({
    defaultValues: {
      cpf: "",
    },
  });

  const cpf = watch("cpf");

  const handleCPFCheck = async () => {
    setLoading(true);
    setCpfError("");
    try {
      // Verifica se o CPF é válido
      const cpfIsValid = cpfValidator(cpf);
      if (!cpfIsValid) {
        setCpfError("CPF inválido");
        setLoading(false);
        return;
      }
      // Verifica se o usuário já está cadastrado
      const response = await getUserByCpf(tenantSlug, cpf);
      const user = response;

      if (user) {
        setIsCpfVerified(true);
        onCpfVerified({
          userId: user.id.toString(),
          nome: user.nome,
          cpf: user.cpf,
        });
      } else {
        // Se o usuário não estiver cadastrado, faz a consulta ao serviço externo
        const response = await getDataFromCPF(tenantSlug, cpf);
        const newUser = await createUser(tenantSlug, {
          nome: response.nome,
          cpf,
          dtNascimento: response.data_de_nascimento,
        });
        setIsCpfVerified(true);
        onCpfVerified({
          userId: newUser.user.id.toString(),
          nome: newUser.user.nome,
          cpf: cpf,
        });
      }
    } catch (error) {
      setIsCpfVerified(false);
      const errorMessage =
        error.response?.data?.error?.details?.message ||
        error.message ||
        "Erro na conexão com o servidor.";
      setCpfError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCPFReset = () => {
    reset({ cpf: "" });
    setIsCpfVerified(false);
    setCpfError("");
    onCpfVerified(null);
  };

  return (
    <form className={styles.formulario}>
      <div className={styles.input}>
        <Input
          className="cpf-input mb-2"
          control={control}
          name="cpf"
          label="Digite o CPF"
          inputType="text"
          placeholder="Digite aqui o CPF"
          disabled={loading || isCpfVerified}
        />
        {!isCpfVerified ? (
          <Button
            className="btn-secondary mb-2"
            type="button"
            onClick={handleCPFCheck}
            disabled={loading}
          >
            {loading ? "Carregando..." : "Verificar CPF"}
          </Button>
        ) : (
          <Button
            className="btn-secondary mb-2"
            type="button"
            onClick={handleCPFReset}
            disabled={loading}
          >
            Resetar CPF
          </Button>
        )}
        {cpfError && (
          <div className="notification notification-error">
            <p className="p5">{cpfError}</p>
          </div>
        )}
      </div>
    </form>
  );
};

export default CPFVerificationForm;

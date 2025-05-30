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
import {
  getUserByCpf,
  createUser,
  cpfVerification,
} from "@/app/api/client/user";
import cpfValidator from "@/lib/cpfValidator";

const CPFVerificationForm = ({ tenantSlug, onCpfVerified }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [cpfNotFound, setCpfNotFound] = useState(false);
  const [isCpfVerified, setIsCpfVerified] = useState(false);
  const [step, setStep] = useState(0);

  const { control, setValue, watch, reset, handleSubmit } = useForm({
    defaultValues: {
      cpf: "",
      //dtNascimento: "",
    },
  });

  const cpf = watch("cpf");
  //const dtNascimento = watch("dtNascimento");

  // Função para validar se a data está no formato correto e é válida
  // Tive que parar de usar essa função, pq estava impedindo de cadastrar datas com o mes 11 e 12
  const isValidDate = (dateStr) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateStr)) {
      return false;
    }

    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(`${year}-${month}-${day}`);

    // Verifica se a data existe e se o dia, mês e ano são coerentes
    return (
      date.getDate() === day &&
      date.getMonth() + 1 === month &&
      date.getFullYear() === year
    );
  };

  const handleCPFCheck = async () => {
    setLoading(true);
    setCpfError("");
    if (step === 0) {
      // Verifica se o CPF é válido
      const cpfIsValid = cpfValidator(cpf);
      if (!cpfIsValid) {
        setCpfError("CPF inválido");
        setLoading(false);
        return;
      }
      const response = await cpfVerification(tenantSlug, { cpf });
      if (response === 2) {
        setCpfNotFound(true);
        setLoading(false);
        setCpfError("Informe a data de nascimento.");
        setStep(2);
        return;
      }
      if (response) {
        const user = response;
        setIsCpfVerified(true);
        onCpfVerified({
          userId: user.id.toString(),
          nome: user.nome,
          cpf: user.cpf,
          email: user.email,
        });
        setLoading(false);
        return;
      }
    }
    if (step === 2) {
      // Verifica se o CPF é válido
      if (cpf) {
        const cpfIsValid = cpfValidator(cpf);
        if (!cpfIsValid) {
          setCpfError("CPF inválido");
          setLoading(false);
          return;
        }
      }
      //if (!dtNascimento) {
      //  setCpfError("Informe uma data de nascimento.");
      //  setLoading(false);
      //  return;
      //}
      //Veja o comentário na outra ocorrencia de isValidDate
      //if (!isValidDate(dtNascimento)) {
      //  setCpfError("Informe uma data de nascimento válida.");
      //  setLoading(false);
      //  return;
      //}
      const response = await cpfVerification(tenantSlug, {
        cpf,
        //dtNascimento
      });
      if (!response) {
        setCpfError("Erro na consulta do CPF.");
        setLoading(false);
      }
      if (response) {
        const user = response;
        setIsCpfVerified(true);
        onCpfVerified({
          userId: user.id.toString(),
          nome: user.nome,
          cpf: user.cpf,
          email: user.email,
        });
        setLoading(false);
        return;
      }

      return;
    }
  };

  const handleCPFReset = () => {
    reset({
      cpf: "",
      //dtNascimento: ""
    });
    setCpfNotFound(false);
    setStep(0);
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

        {cpfNotFound && false && (
          <Input
            className="mb-2"
            control={control}
            name="dtNascimento"
            label="Data de nascimento"
            inputType="date"
            placeholder="DD/MM/AAAA"
            disabled={loading || isCpfVerified}
          />
        )}
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

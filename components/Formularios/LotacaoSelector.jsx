"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import styles from "@/components/Formularios/Form.module.scss";
import Button from "@/components/Button";
import Select from "@/components/Select";
import { Notification } from "@/components/Notification";
import {
  getOpcoesLotacao,
  upsertUserTenantLotacao,
} from "@/app/api/client/userTenant";

const LotacaoSelector = ({ tenant, userId, ano, onSaved }) => {
  const [opcoes, setOpcoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { control, handleSubmit } = useForm({
    defaultValues: { lotacaoId: "" },
  });

  useEffect(() => {
    const fetchOpcoes = async () => {
      try {
        const lotacoes = await getOpcoesLotacao(tenant);
        setOpcoes(lotacoes || []);
      } catch (error) {
        setErrorMessage("Não foi possível carregar as lotações.");
      }
    };
    fetchOpcoes();
  }, [tenant]);

  const onSubmit = async (data) => {
    if (!data.lotacaoId) {
      setErrorMessage("Selecione sua lotação.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      await upsertUserTenantLotacao(tenant, userId, ano, data.lotacaoId);
      onSaved?.();
    } catch (error) {
      console.error("Erro ao salvar lotação:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro ao salvar a lotação."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      <h6 className="mb-2">Antes de continuar, informe sua lotação</h6>
      <div className={styles.input}>
        <Select
          control={control}
          name="lotacaoId"
          label="Lotação"
          options={opcoes}
          placeholder="Selecione sua lotação"
        />
      </div>
      {errorMessage && (
        <Notification className="notification-error">
          {errorMessage}
        </Notification>
      )}
      <Button className="btn-primary mt-2" type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Confirmar"}
      </Button>
    </form>
  );
};

export default LotacaoSelector;

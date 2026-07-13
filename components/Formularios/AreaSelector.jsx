"use client";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { MultiSelect } from "primereact/multiselect";
import styles from "@/components/Formularios/Form.module.scss";
import Button from "@/components/Button";
import { Notification } from "@/components/Notification";
import { getAreas } from "@/app/api/client/area";
import { upsertUserAreas } from "@/app/api/client/userTenant";

// Referência estável: um array `[]` literal como valor padrão de parâmetro é
// recriado a cada render, o que fazia o useEffect abaixo (que depende dessa
// referência) disparar `reset` a cada render — inclusive logo depois do
// usuário marcar uma área, desfazendo a seleção imediatamente.
const AREA_IDS_VAZIO = [];

const AreaSelector = ({ tenant, userId, onSaved, initialAreaIds = AREA_IDS_VAZIO }) => {
  const [opcoes, setOpcoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { areaIds: initialAreaIds },
  });

  useEffect(() => {
    reset({ areaIds: initialAreaIds });
  }, [initialAreaIds, reset]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const areas = await getAreas();
        setOpcoes(
          (areas || [])
            .slice()
            .sort((a, b) => a.area.localeCompare(b.area))
            .map((area) => ({ label: area.area, value: area.id }))
        );
      } catch (error) {
        setErrorMessage("Não foi possível carregar as áreas.");
      }
    };
    fetchAreas();
  }, []);

  const onSubmit = async (data) => {
    if (!data.areaIds?.length) {
      setErrorMessage("Selecione ao menos uma área de interesse.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      await upsertUserAreas(tenant, userId, data.areaIds);
      onSaved?.(data.areaIds);
    } catch (error) {
      console.error("Erro ao salvar áreas:", error);
      setErrorMessage(
        error.response?.data?.message ?? "Erro ao salvar as áreas."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formulario} onSubmit={handleSubmit(onSubmit)}>
      <h6 className="mb-2">Quais áreas você tem interesse em avaliar?</h6>
      <div className={styles.input}>
        <Controller
          name="areaIds"
          control={control}
          render={({ field }) => (
            <MultiSelect
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              options={opcoes}
              placeholder="Selecione as áreas"
              display="chip"
              filter
              style={{ width: "100%" }}
            />
          )}
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

export default AreaSelector;

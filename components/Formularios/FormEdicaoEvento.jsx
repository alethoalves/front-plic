"use client";

//HOOKS
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formEdicaoEvento } from "@/lib/zodSchemas/formEdicaoEvento";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { createEdicaoEvento } from "@/app/api/client/eventos";

const FormEdicaoEvento = ({ tenantSlug, eventoRoots = [], anoAtual, onClose, onSuccess }) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const temSeriesExistentes = eventoRoots.length > 0;
  const [modo, setModo] = useState(temSeriesExistentes ? "existente" : "nova");

  const { control, handleSubmit, setValue, watch } = useForm({
    resolver: zodResolver(formEdicaoEvento),
    defaultValues: {
      modo,
      eventoRootId: "",
      nomeEventoRoot: "",
      nomeEvento: "",
      // O edital do ciclo exibido como "ano X" no dashboard fecha com o
      // congresso no ano seguinte, daí a edição registrada como X+1 (ver Eventos.jsx).
      edicaoEvento: anoAtual ? String(Number(anoAtual) + 1) : "",
    },
  });

  const eventoRootIdSelecionado = watch("eventoRootId");

  useEffect(() => {
    setValue("modo", modo);
  }, [modo, setValue]);

  useEffect(() => {
    if (modo !== "existente" || !eventoRootIdSelecionado) return;
    const root = eventoRoots.find((r) => String(r.id) === String(eventoRootIdSelecionado));
    if (root) {
      setValue("nomeEvento", root.nome);
    }
  }, [eventoRootIdSelecionado, modo, eventoRoots, setValue]);

  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        modo: data.modo,
        nomeEvento: data.nomeEvento,
        edicaoEvento: data.edicaoEvento,
      };
      if (data.modo === "existente") {
        payload.eventoRootId = data.eventoRootId;
      } else {
        payload.nomeEventoRoot = data.nomeEventoRoot;
      }

      const evento = await createEdicaoEvento(tenantSlug, payload);
      onSuccess(evento);
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

  const opcoesEventoRoot = eventoRoots.map((root) => ({
    value: root.id,
    label: root.nome,
  }));

  return (
    <form
      className={`${styles.formulario}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      {temSeriesExistentes && (
        <div className={styles.abas}>
          <button
            type="button"
            className={`${styles.aba} ${modo === "existente" ? styles.abaAtiva : ""}`}
            onClick={() => setModo("existente")}
          >
            Nova edição
          </button>
          <button
            type="button"
            className={`${styles.aba} ${modo === "nova" ? styles.abaAtiva : ""}`}
            onClick={() => setModo("nova")}
          >
            Nova série
          </button>
        </div>
      )}

      <div className={`${styles.input} mt-2`}>
        {modo === "existente" ? (
          <Select
            className="mb-2"
            control={control}
            name="eventoRootId"
            label="Evento"
            placeholder="Selecione o evento"
            options={opcoesEventoRoot}
            disabled={loading}
          />
        ) : (
          <Input
            className="mb-2"
            control={control}
            name="nomeEventoRoot"
            label="Nome da nova série de evento"
            inputType="text"
            placeholder="Ex: Congresso de Iniciação Científica"
            disabled={loading}
          />
        )}
        <Input
          className="mb-2"
          control={control}
          name="nomeEvento"
          label="Nome da edição"
          inputType="text"
          placeholder="Digite aqui o nome da edição"
          disabled={loading}
        />
        <Input
          className="mb-2"
          control={control}
          name="edicaoEvento"
          label="Ano da edição"
          inputType="number"
          placeholder="Digite aqui o ano da edição"
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
          {loading ? "Carregando..." : "Criar edição"}
        </Button>
      </div>
      {error && (
        <div className={`notification notification-error`}>
          <p className="p5">{error}</p>
        </div>
      )}
    </form>
  );
};

export default FormEdicaoEvento;

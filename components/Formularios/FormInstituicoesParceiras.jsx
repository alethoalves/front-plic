"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import styles from "@/components/Formularios/Form.module.scss";
import Button from "@/components/Button";
import Input from "@/components/Input";
import {
  RiBuildingLine,
  RiToggleLine,
  RiToggleFill,
  RiAddCircleLine,
} from "@remixicon/react";
import {
  criarInstituicaoParceira,
  atualizarInstituicaoParceira,
} from "@/app/api/client/eventos";

// Instituições que só participam do congresso enviando resumos, sem virar um
// Tenant completo (sem editais, formulários, cargos etc.). Não existe
// hard-delete aqui de propósito: uma parceira desativada (`ativo: false`)
// some do picker de inscrição, mas submissões antigas continuam mostrando o
// nome dela normalmente (o snapshot já foi salvo na hora da inscrição).
const FormInstituicoesParceiras = ({ eventoSlug, initialParceiras }) => {
  const [parceiras, setParceiras] = useState(initialParceiras || []);
  const [salvando, setSalvando] = useState(false);
  const [alternandoId, setAlternandoId] = useState(null);
  const [erro, setErro] = useState("");

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { nome: "", sigla: "" },
  });

  const onCriar = async (data) => {
    setSalvando(true);
    setErro("");
    try {
      const resposta = await criarInstituicaoParceira(eventoSlug, data);
      setParceiras((prev) => [...prev, resposta.instituicaoParceira]);
      reset();
    } catch (error) {
      setErro(
        error.response?.data?.message ??
          "Erro ao criar instituição parceira."
      );
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (parceira) => {
    setAlternandoId(parceira.id);
    setErro("");
    try {
      const resposta = await atualizarInstituicaoParceira(
        eventoSlug,
        parceira.id,
        { ativo: !parceira.ativo }
      );
      setParceiras((prev) =>
        prev.map((p) =>
          p.id === parceira.id ? resposta.instituicaoParceira : p
        )
      );
    } catch (error) {
      setErro(
        error.response?.data?.message ??
          "Erro ao atualizar instituição parceira."
      );
    } finally {
      setAlternandoId(null);
    }
  };

  return (
    <div className={styles.secao}>
      <div className={styles.secaoHead}>
        <div className={styles.secaoIcon}>
          <RiBuildingLine />
        </div>
        <h6>Instituições parceiras</h6>
      </div>
      <div className={styles.secaoContent}>
        <p className={styles.dica}>
          Instituições que só participam deste congresso enviando resumos, sem
          cadastro completo no plic. Aparecem junto com as instituições
          cadastradas na etapa de inscrição do evento.
        </p>

        {parceiras.length > 0 && (
          <div className={styles.lista}>
            {parceiras.map((parceira) => (
              <div key={parceira.id} className={styles.listaItem}>
                <div
                  className={styles.icon}
                  onClick={() => toggleAtivo(parceira)}
                  title={parceira.ativo ? "Desativar" : "Reativar"}
                >
                  {alternandoId === parceira.id ? (
                    "..."
                  ) : parceira.ativo ? (
                    <RiToggleFill />
                  ) : (
                    <RiToggleLine />
                  )}
                </div>
                <div className={`${styles.content} ${styles.withIcon}`}>
                  <p>
                    <strong>{parceira.sigla}</strong> - {parceira.nome}
                    {!parceira.ativo && " (inativa)"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onCriar)}
          className={`${styles.secaoGrid} mt-2`}
        >
          <Input
            control={control}
            name="nome"
            label="Nome da instituição"
            inputType="text"
          />
          <Input control={control} name="sigla" label="Sigla" inputType="text" />
          <Button
            icon={RiAddCircleLine}
            className="btn-secondary"
            type="submit"
            disabled={salvando}
          >
            {salvando ? "Adicionando..." : "Adicionar"}
          </Button>
        </form>
        {erro && <p className={styles.statusErro}>{erro}</p>}
      </div>
    </div>
  );
};

export default FormInstituicoesParceiras;

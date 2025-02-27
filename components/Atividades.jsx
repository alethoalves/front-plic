// Atividades.js
"use client";

import React, { useState } from "react";
import Input from "@/components/Input";
import Button from "@/components/Button";
import GanttChart from "./GanttChart";
import { RiDeleteBinLine } from "@remixicon/react";
import styles from "@/components/Formularios/Form.module.scss";
import { formatDateToISO } from "@/lib/formatarDatas";
import { useForm } from "react-hook-form";

const Atividades = ({ cronograma, setCronograma }) => {
  const [errorAddAtividade, setErrorAddAtividade] = useState("");
  const [loading, setLoading] = useState("");
  const [atividade, setAtividade] = useState({
    nome: "",
    inicio: "",
    fim: "",
    comentario: "",
  });
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    reset,
    getValues,
    resetField,
  } = useForm({});
  // Adicionar uma nova atividade ao cronograma
  const handleAddAtividade = () => {
    const nomeAtividade = getValues("nomeAtividade");
    const inicio = getValues("inicio");
    const fim = getValues("fim");

    if (!nomeAtividade || !inicio || !fim) {
      setErrorAddAtividade(
        "Preencha todos os campos obrigatórios da atividade!"
      );
      return;
    }

    // Verificar e formatar as datas para o formato ISO (YYYY-MM-DD)
    const dataInicio = new Date(formatDateToISO(inicio));
    const dataFim = new Date(formatDateToISO(fim));

    if (dataFim < dataInicio) {
      setErrorAddAtividade(
        "A data de fim não pode ser anterior à data de início."
      );
      return;
    }

    setCronograma((prev) => [...prev, { nome: nomeAtividade, inicio, fim }]);
    setErrorAddAtividade(""); // Limpa a mensagem de erro caso tenha sucesso

    resetField("nomeAtividade");
    resetField("inicio");
    resetField("fim");
  };

  // Remover uma atividade do cronograma
  const handleRemoveAtividade = (index) => {
    setCronograma((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.cronograma}>
      {/* Campo: Nome da Atividade */}
      <div className={`${styles.input} mb-2`}>
        <Input
          name="nomeAtividade"
          label="Nome da Atividade"
          value={atividade.nome}
          onChange={(e) =>
            setAtividade((prev) => ({ ...prev, nome: e.target.value }))
          }
          placeholder="Digite o nome da atividade"
          disabled={loading}
          control={control}
        />
      </div>

      {/* Campos: Data de Início e Fim */}
      <div className={`${styles.inputGroup} flex`}>
        <div className={`${styles.input} mr-2`}>
          <Input
            name="inicio"
            label="Data de Início"
            inputType="date"
            control={control}
            placeholder="Selecione a data de início"
            disabled={loading}
          />
        </div>
        <div className={styles.input}>
          <Input
            name="fim"
            label="Data de Fim"
            inputType="date"
            control={control}
            placeholder="Selecione a data de fim"
            disabled={loading}
          />
        </div>
      </div>

      {/* Botão: Adicionar Atividade */}
      <Button
        onClick={(e) => {
          e.preventDefault(); // Impede o envio do formulário
          handleAddAtividade();
        }}
        className="btn-secondary mt-2"
        disabled={loading}
      >
        Adicionar Atividade
      </Button>
      {errorAddAtividade && (
        <div className="notification notification-error">
          <p className="p5">{errorAddAtividade}</p>
        </div>
      )}

      {/* Exibição do Cronograma */}
      <GanttChart cronograma={cronograma} />

      <div className={styles.lista}>
        {cronograma
          .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
          .map((item, index) => (
            <div key={index} className={styles.listaItem}>
              <div
                className={styles.icon}
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveAtividade(index);
                }}
                disabled={loading}
              >
                <RiDeleteBinLine />
              </div>
              <div className={styles.content}>
                <h6>
                  {item.inicio} - {item.fim}
                </h6>
                <p>{item.nome}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Atividades;

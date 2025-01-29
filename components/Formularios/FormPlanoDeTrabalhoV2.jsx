"use client";

//HOOKS
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import {
  RiAddCircleLine,
  RiDeleteBinLine,
  RiSave2Line,
} from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";

//FUNÇÕES
import { createRegistroAtividade } from "@/app/api/client/registroAtividade";

import {
  createPlanoDeTrabalho,
  updatePlanoDeTrabalho,
} from "@/app/api/client/planoDeTrabalho";
import { getAreas } from "@/app/api/client/area";
import SearchableSelect from "../SearchableSelect";
import { z } from "zod";
import {
  createProjeto,
  createProjetoInscricao,
  updateProjetoById,
} from "@/app/api/client/planoDeTrabalho";
import Textarea from "../Textarea";
import { formatDateToISO } from "@/lib/formatarDatas";
import Link from "next/link";
import GanttChart from "../GanttChart";
// Função auxiliar para transformar datas no formato DD/MM/AAAA para Date
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day); // `month - 1` porque os meses no JS são baseados em 0
};

const planoDeTrabalhoSchema = z.object({
  // Validações para campos básicos
  titulo: z.string().min(1, "Campo obrigatório!"),
  areaId: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => !isNaN(val) && val > 0, "Campo obrigatório!"),

  conteudo: z.string().min(1, "Campo obrigatório!"),
  projetoId: z.number().int().positive("Projeto inválido!"),
  // Validação para o cronograma como um array de objetos
  cronograma: z
    .array(
      z
        .object({
          nome: z.string().min(1, "Nome da atividade é obrigatório!"),
          inicio: z.string().refine((date) => {
            const parsedDate = parseDate(date);
            return !isNaN(parsedDate);
          }, "Data de início inválida"),
          fim: z.string().refine((date) => {
            const parsedDate = parseDate(date);
            return !isNaN(parsedDate);
          }, "Data de fim inválida"),
        })
        .refine(
          (data) => {
            const inicioDate = parseDate(data.inicio);
            const fimDate = parseDate(data.fim);
            return fimDate >= inicioDate;
          },
          {
            message:
              "Data de fim deve ser igual ou posterior à data de início.",
            path: ["fim"], // Indica o campo com erro
          }
        )
    )
    .optional(),
});
const FormPlanoDeTrabalhoV2 = ({
  tenantSlug,
  initialData,
  idInscricao,
  idProjeto,
  onClose,
  onSuccess,
  onSubmit,
  onUpdatePlanoDeTrabalho,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState("");
  const [activeTab, setActiveTab] = useState("conteudo");
  const [cronograma, setCronograma] = useState([]);
  const [errorAddAtividade, setErrorAddAtividade] = useState("");
  const [uploading, setUploading] = useState(false); // Estado de carregamento de upload
  const [uploadError, setUploadError] = useState(""); // Estado de erro no upload
  useState(null); // Estado de erro no upload

  const [atividade, setAtividade] = useState({
    nome: "",
    inicio: "",
    fim: "",
    comentario: "",
  });
  const { control, handleSubmit, setValue, reset, getValues, resetField } =
    useForm({
      resolver: zodResolver(planoDeTrabalhoSchema),
      defaultValues: {
        titulo: "",
        areaId: "",
        conteudo: "",
        projetoId: idProjeto,
      },
    });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getAreas(tenantSlug);
        setAreas(transformedArray(response));
      } catch (error) {
        setErrorDelete(
          error.response?.data?.message ?? "Erro na conexão com o servidor."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    console.log(initialData);
    if (initialData) {
      setValue("titulo", initialData.titulo);
      setValue("areaId", initialData.areaId);
      setValue("conteudo", initialData.conteudo);

      // Popula cronograma
      if (initialData.CronogramaPlanoDeTrabalho) {
        const mappedCronograma = initialData.CronogramaPlanoDeTrabalho.map(
          (item) => ({
            nome: item.atividade,
            inicio: item.inicio,
            fim: item.fim,
          })
        );
        setCronograma(mappedCronograma);
      }
    } else {
      reset();
    }
  }, [initialData, setValue, reset, tenantSlug]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
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

  // Submete o formulário junto com os anexos
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      const payload = { ...data, cronograma };
      let planoDeTrabalho;

      if (initialData) {
        // Atualiza o plano de trabalho
        planoDeTrabalho = await updatePlanoDeTrabalho(
          tenantSlug,
          idInscricao,
          initialData.id,
          payload
        );
      } else {
        // Cria o plano de trabalho
        planoDeTrabalho = await createPlanoDeTrabalho(
          tenantSlug,
          idInscricao,
          payload
        );
        onClose();
      }

      if (!planoDeTrabalho || !planoDeTrabalho.id) {
        throw new Error("Erro ao salvar o plano de trabalho.");
      }

      // Atualiza a listagem no FluxoInscricaoEdital
      if (onUpdatePlanoDeTrabalho) {
        onUpdatePlanoDeTrabalho(planoDeTrabalho);
      }

      // Chama o callback de sucesso, se necessário
      if (onSuccess) {
        onSuccess(planoDeTrabalho);
      }
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      setError(error.message || "Erro ao enviar o formulário.");
    } finally {
      setLoading(false);
    }
  };

  const transformedArray = (items) => {
    const data = items?.flatMap((item) => {
      // Criar um array inicial com a área principal
      const result = [{ value: item.id, label: item.area }];

      // Adicionar subáreas, se houver
      const subareaResults = item.subareas.map((subarea) => ({
        value: item.id,
        label: `${item.area} - ${subarea.subarea}`,
      }));

      // Concatenar o array da área principal com as subáreas
      return result.concat(subareaResults);
    });

    // Organizar por `value` crescente e depois por `label`
    return data.sort((a, b) => {
      // Primeiro, organizar por `value` crescente
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;

      // Se os `values` forem iguais, organizar por `label`
      return a.label.localeCompare(b.label);
    });
  };

  return (
    <form
      className={`${styles.formulario}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className={`${styles.input}`}>
        <Input
          className="mb-2"
          control={control}
          name="titulo"
          label="Título do Plano de Trabalho"
          inputType="text"
          placeholder="Digite aqui o título do planoDeTrabalho"
          disabled={loading}
        />
      </div>
      <div className={`${styles.input}`}>
        <SearchableSelect
          className="mb-2"
          control={control}
          name="areaId"
          label="Área de Conhecimento do Plano de Trabalho"
          options={areas || []} // Garante que o options seja um array
          disabled={loading}
        />
      </div>

      <div className={`${styles.btnSubmit} mb-2`}>
        <Button
          icon={RiSave2Line}
          className="btn-secondary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Salvar Plano de Trabalho"}
        </Button>
      </div>

      {error && (
        <div className={`notification notification-error`}>
          <p className="p5">{error}</p>
        </div>
      )}
      <div className={`${styles.nav}`}>
        <div className={`${styles.menu}`}>
          <div
            className={`${styles.itemMenu} ${
              activeTab === "conteudo" ? styles.itemMenuSelected : ""
            }`}
            onClick={() => handleTabChange("conteudo")}
          >
            <p>Conteúdo</p>
          </div>
          <div
            className={`${styles.itemMenu} ${
              activeTab === "cronograma" ? styles.itemMenuSelected : ""
            }`}
            onClick={() => handleTabChange("cronograma")}
          >
            <p>Cronograma</p>
          </div>
        </div>
      </div>

      {activeTab === "conteudo" && (
        <div className={`${styles.conteudo}`}>
          <div className={`${styles.input}`}>
            <Textarea
              className=""
              maxLength="300"
              control={control}
              name="conteudo"
              label="Conteúdo do Plano de Trabalho"
              placeholder="Digite o conteúdo do plano de trabalho"
              disabled={loading}
            />
          </div>
        </div>
      )}
      {activeTab === "cronograma" && (
        <div className={`${styles.cronograma}`}>
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
            <div className={`${styles.input}`}>
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
            className="btn-primary mt-2"
            disabled={loading}
          >
            Adicionar Atividade
          </Button>
          {errorAddAtividade && (
            <div className={`notification notification-error`}>
              <p className="p5">{errorAddAtividade}</p>
            </div>
          )}

          {/* Lista de Atividades */}
          <GanttChart cronograma={cronograma} />
          <div className={`${styles.lista}`}>
            {cronograma
              .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
              .map((item, index) => (
                <div key={index} className={`${styles.listaItem}`}>
                  <div
                    className={`${styles.icon}`}
                    onClick={(e) => {
                      e.preventDefault(); // Evitar comportamento padrão
                      handleRemoveAtividade(index);
                    }}
                    disabled={loading}
                  >
                    <RiDeleteBinLine />
                  </div>
                  <div className={`${styles.content}`}>
                    <h6>
                      {item.inicio} - {item.fim}
                    </h6>
                    <p>{item.nome}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </form>
  );
};

export default FormPlanoDeTrabalhoV2;

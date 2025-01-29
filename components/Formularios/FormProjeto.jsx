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
import { planoDeTrabalhoSchema } from "@/lib/zodSchemas/planoDeTrabalhoSchema";
import { getAreas } from "@/app/api/client/area";
import SearchableSelect from "../SearchableSelect";
import { z } from "zod";
import {
  createProjeto,
  createProjetoInscricao,
  updateProjetoById,
} from "@/app/api/client/projeto";
import Textarea from "../Textarea";
import { formatDateToISO } from "@/lib/formatarDatas";
import Link from "next/link";
import { uploadFile, uploadFileProjeto } from "@/app/api/clientReq";
import GanttChart from "../GanttChart";
// Função auxiliar para transformar datas no formato DD/MM/AAAA para Date
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day); // `month - 1` porque os meses no JS são baseados em 0
};

const projetoSchema = z.object({
  // Validações para campos básicos
  titulo: z.string().min(1, "Campo obrigatório!"),
  areaId: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .refine((val) => !isNaN(val) && val > 0, "Campo obrigatório!"),

  introducao: z.string().min(1, "Campo obrigatório!"),
  justificativa: z.string().min(1, "Campo obrigatório!"),
  objetivos: z.string().min(1, "Campo obrigatório!"),
  fundamentacao: z.string().min(1, "Campo obrigatório!"),
  metodologia: z.string().min(1, "Campo obrigatório!"),
  resultados: z.string().min(1, "Campo obrigatório!"),
  referencias: z.string().min(1, "Campo obrigatório!"),
  envolveHumanos: z.boolean().optional(),
  envolveAnimais: z.boolean().optional(),

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

  // Validação para anexos como um array de objetos
  anexos: z
    .array(
      z.object({
        name: z.string().min(1, "Nome do arquivo é obrigatório!"),
        file: z.any(), // Validação básica para o arquivo
        previewUrl: z.string().url("URL de visualização inválida"),
      })
    )
    .optional(), // Pode ser omitido se não houver anexos
});
const FormProjeto = ({
  tenantSlug,
  initialData,
  idInscricao,
  onClose,
  onSuccess,
  onSubmit,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState("");
  const [activeTab, setActiveTab] = useState("conteudo");
  const [cronograma, setCronograma] = useState([]);
  const [errorAddAtividade, setErrorAddAtividade] = useState("");
  const [anexos, setAnexos] = useState([]); // Estado para os anexos
  const [uploading, setUploading] = useState(false); // Estado de carregamento de upload
  const [uploadError, setUploadError] = useState(""); // Estado de erro no upload

  const [atividade, setAtividade] = useState({
    nome: "",
    inicio: "",
    fim: "",
    comentario: "",
  });
  const { control, handleSubmit, setValue, reset, getValues, resetField } =
    useForm({
      resolver: zodResolver(projetoSchema),
      defaultValues: {
        titulo: "",
        areaId: "",
        introducao: "",
        justificativa: "",
        objetivos: "",
        fundamentacao: "",
        metodologia: "",
        resultados: "",
        referencias: "",
        envolveHumanos: false,
        envolveAnimais: false,
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
      setValue("introducao", initialData.introducao);
      setValue("justificativa", initialData.justificativa);
      setValue("objetivos", initialData.objetivos);
      setValue("fundamentacao", initialData.fundamentacao);
      setValue("metodologia", initialData.metodologia);
      setValue("resultados", initialData.resultados);
      setValue("referencias", initialData.referencias);
      setValue("envolveHumanos", initialData.envolveHumanos);
      setValue("envolveAnimais", initialData.envolveAnimais);

      // Popula cronograma
      if (initialData.CronogramaProjeto) {
        const mappedCronograma = initialData.CronogramaProjeto.map((item) => ({
          nome: item.atividade,
          inicio: item.inicio,
          fim: item.fim,
        }));
        setCronograma(mappedCronograma);
      }

      // Popula anexos
      if (initialData.AnexoProjeto) {
        const mappedAnexos = initialData.AnexoProjeto.map((anexo) => ({
          name: anexo.nomeAnexo,
          file: null, // Arquivo real não está disponível, mas podemos usar a URL para exibição
          previewUrl: anexo.link,
        }));
        setAnexos(mappedAnexos);
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
  // Lida com a seleção de arquivos
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (!files || files.length === 0) return;

    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      const isPdfOrImage =
        file.type === "application/pdf" || file.type.startsWith("image/");
      const isBelowMaxSize = file.size <= 15 * 1024 * 1024; // 15 MB em bytes

      if (!isPdfOrImage) {
        errors.push(`Arquivo "${file.name}" não é PDF nem imagem.`);
      } else if (!isBelowMaxSize) {
        errors.push(`Arquivo "${file.name}" excede o tamanho máximo de 15 MB.`);
      } else {
        validFiles.push({
          name: file.name,
          file,
          previewUrl: URL.createObjectURL(file), // Cria a URL temporária
        });
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join(" "));
    } else {
      setUploadError("");
    }

    // Adiciona os arquivos válidos à lista de anexos
    setAnexos((prev) => [...prev, ...validFiles]);
  };

  // Remove um anexo da lista
  const handleRemoveAnexo = (index) => {
    // Revoga a URL do arquivo para liberar memória
    URL.revokeObjectURL(anexos[index].previewUrl);

    // Remove o anexo do estado
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };
  // Submete o formulário junto com os anexos
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");

    try {
      // Prepara os dados do formulário, incluindo o cronograma
      const payload = { ...data, cronograma };

      if (initialData) {
        // Se há dados iniciais, o formulário está em modo de edição
        const projetoId = initialData.id;

        // Atualiza o projeto
        const projetoAtualizado = await updateProjetoById(
          tenantSlug,
          projetoId,
          payload
        );

        if (!projetoAtualizado || !projetoAtualizado.id) {
          throw new Error("Erro ao atualizar o projeto. ID não retornado.");
        }
        // Realiza o upload dos anexos vinculados ao projeto, se houver novos anexos
        if (anexos.length > 0) {
          const uploadedAnexos = [];

          for (const anexo of anexos) {
            // Verifica se o anexo é novo (tem `file` preenchido e `previewUrl` começa com "blob:")
            if (anexo.file && anexo.previewUrl.startsWith("blob:")) {
              try {
                const response = await uploadFileProjeto(
                  anexo.file,
                  tenantSlug,
                  projetoAtualizado.id
                );
                uploadedAnexos.push(response);
              } catch (error) {
                console.error(
                  `Erro ao fazer upload do anexo ${anexo.name}:`,
                  error
                );
              }
            } else {
              console.log(
                `Anexo já existente, não será reenviado: ${anexo.name}`
              );
            }
          }

          console.log("Novos anexos enviados com sucesso:", uploadedAnexos);
        }

        // Atualiza a interface com o projeto editado
        if (onSuccess) onSuccess(projetoAtualizado);

        console.log("Projeto atualizado com sucesso.");
      } else {
        // Se não há dados iniciais, o formulário está em modo de criação

        // Cria o projeto
        const projetoCriado = await createProjeto(tenantSlug, payload);

        if (!projetoCriado || !projetoCriado.id) {
          throw new Error("Erro ao criar o projeto. ID não retornado.");
        }

        const projetoId = projetoCriado.id;

        // Realiza o upload dos anexos vinculados ao projeto
        if (anexos.length > 0) {
          const uploadedAnexos = [];
          for (const anexo of anexos) {
            try {
              const response = await uploadFileProjeto(
                anexo.file,
                tenantSlug,
                projetoId
              );
              uploadedAnexos.push(response);
            } catch (error) {
              console.error(
                `Erro ao fazer upload do anexo ${anexo.name}:`,
                error
              );
            }
          }
          console.log("Anexos enviados com sucesso:", uploadedAnexos);
        }

        // Atualiza a interface com o projeto criado
        if (onSuccess) onSuccess(projetoCriado);

        console.log("Projeto e anexos enviados com sucesso.");
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
          label="Título do projeto"
          inputType="text"
          placeholder="Digite aqui o título do projeto"
          disabled={loading}
        />
      </div>
      <div className={`${styles.input}`}>
        <SearchableSelect
          className="mb-2"
          control={control}
          name="areaId"
          label="Área de Conhecimento do projeto"
          options={areas || []} // Garante que o options seja um array
          disabled={loading}
        />
      </div>
      {/* Checkbox: Envolve Humanos */}
      <div className={`${styles.input} mb-2`}>
        <label className="flex">
          <input
            type="checkbox"
            {...control.register("envolveHumanos")}
            disabled={loading}
          />
          <p className="ml-1">A pesquisa envolve seres humanos?</p>
        </label>
      </div>

      {/* Checkbox: Envolve Animais */}
      <div className={`${styles.input} mb-2`}>
        <label className="flex">
          <input
            type="checkbox"
            {...control.register("envolveAnimais")}
            disabled={loading}
          />
          <p className="ml-1">A pesquisa envolve animais?</p>
        </label>
      </div>
      <div className={`${styles.btnSubmit} mb-2`}>
        <Button
          icon={RiSave2Line}
          className="btn-secondary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Carregando..." : "Salvar Projeto"}
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
          <div
            className={`${styles.itemMenu} ${
              activeTab === "anexos" ? styles.itemMenuSelected : ""
            }`}
            onClick={() => handleTabChange("anexos")}
          >
            <p>Anexos</p>
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
              name="introducao"
              label="Introdução"
              placeholder="Digite a introdução"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input}`}>
            <Textarea
              className=""
              maxLength="300"
              control={control}
              name="justificativa"
              label="Justificativa"
              placeholder="Digite a justificativa"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input}`}>
            <Textarea
              className=""
              maxLength="300"
              control={control}
              name="objetivos"
              label="Objetivos"
              placeholder="Digite os objetivos"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input}`}>
            <Textarea
              className=""
              maxLength="300"
              control={control}
              name="fundamentacao"
              label="Revisão bibliográfica/Fundamentação teórica"
              placeholder="Digite a fundamentação teórica"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input}`}>
            <Textarea
              className=""
              maxLength="300"
              control={control}
              name="metodologia"
              label="Metodologia"
              placeholder="Digite a metodologia"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input}`}>
            <Textarea
              className=""
              maxLength="300"
              control={control}
              name="resultados"
              label="Resultados esperados"
              placeholder="Digite os resultados esperados"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input}`}>
            <Textarea
              className=""
              maxLength="300"
              control={control}
              name="referencias"
              label="Referências"
              placeholder="Digite as referências"
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
      {activeTab === "anexos" && (
        <div className={`${styles.anexos}`}>
          {/* Campo de upload */}
          <div className={styles.addItem}>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={loading}
            />
          </div>
          {uploadError && (
            <div className={`notification notification-error ${styles.error}`}>
              <p>{uploadError}</p>
            </div>
          )}

          {/* Lista de anexos */}
          <div className={`${styles.lista}`}>
            {anexos.map((anexo, index) => (
              <div key={index} className={`${styles.listaItem} `}>
                {!initialData && (
                  <div
                    className={`${styles.icon}`}
                    onClick={() => handleRemoveAnexo(index)}
                  >
                    <RiDeleteBinLine />
                  </div>
                )}
                <div
                  className={`${styles.content} ${
                    !initialData ? styles.withIcon : ""
                  }`}
                >
                  {/* Link para visualização em nova aba */}
                  <a
                    href={anexo.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {anexo.name}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
};

export default FormProjeto;

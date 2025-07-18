"use client";

//HOOKS
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line } from "@remixicon/react";
import { RiDeleteBinLine } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import SearchableSelect from "../SearchableSelect";
import Atividades from "../Atividades";
import { Dialog } from "primereact/dialog";
import { Button as PrimeButton } from "primereact/button";
//FUNÇÕES
import {
  createPlanoDeTrabalho,
  deletePlanoDeTrabalho,
  updatePlanoDeTrabalho,
} from "@/app/api/client/planoDeTrabalho";
import { getAreas } from "@/app/api/client/area";
import { getFormulario } from "@/app/api/client/formulario";
import { createDynamicSchema } from "@/lib/createDynamicSchema";
import { renderDynamicFields } from "@/lib/renderDynamicFields";
import { transformedArray } from "@/lib/transformedArray";

const FormGestorPlanoDeTrabalhoCreateOrEdit = ({
  tenantSlug,
  initialData,
  idInscricao,
  idProjeto,
  onClose,
  onSuccess,
  onUpdatePlanoDeTrabalho,
  idFormularioEdital,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState("");
  const [activeTab, setActiveTab] = useState("conteudo");
  const [cronograma, setCronograma] = useState([]);
  const [formularioEdital, setFormularioEdital] = useState(null);
  const [errorDelete, setErrorDelete] = useState();
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayDeleteDialog, setDisplayDeleteDialog] = useState(false);

  // Função para mostrar o dialog de confirmação
  const confirmDelete = () => {
    setDisplayDeleteDialog(true);
  };

  // Função para esconder o dialog
  const hideDeleteDialog = () => {
    setDisplayDeleteDialog(false);
  };

  // Função para deletar o plano de trabalho
  const handleDelete = async () => {
    if (!initialData?.id) return;

    setIsDeleting(true);
    setError("");

    try {
      await deletePlanoDeTrabalho(tenantSlug, idInscricao, initialData.id);

      if (onSuccess) {
        onSuccess({ action: "delete" });
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Erro ao deletar plano de trabalho:", error);
      setError(error.message || "Erro ao deletar o plano de trabalho.");
    } finally {
      setIsDeleting(false);
      setDisplayDeleteDialog(false);
    }
  };

  // Footer do Dialog
  const deleteDialogFooter = (
    <>
      <PrimeButton
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={hideDeleteDialog}
        disabled={isDeleting}
      />
      <PrimeButton
        label="Excluir"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={handleDelete}
        loading={isDeleting}
      />
    </>
  );

  //DEFINE O SCHEMA DO PLANO DE TRABALHO
  // 1) dados vindos do backend
  const campos = formularioEdital?.campos ?? [];

  // 2) gera o schema para os campos dinâmicos
  const dynamicSchemaBase = createDynamicSchema(campos); // ← sua função

  // 3) se o array estiver vazio, torna-o opcional
  const dynamicSchema =
    campos.length === 0 ? dynamicSchemaBase.optional() : dynamicSchemaBase;

  const planoDeTrabalhoSchema = z.object({
    titulo: z.string().min(1, "Campo obrigatório!"),
    areaId: z.number().int().positive("Campo obrigatório!"),
    projetoId: z.number().int().positive("Projeto inválido!"),
    cronograma: z
      .array(
        z.object({
          nome: z.string().min(1, "Nome da atividade é obrigatório!"),
          inicio: z.string(),
          fim: z.string(),
        })
      )
      .optional(),
    camposDinamicos: dynamicSchema, // Adiciona campos dinâmicos ao schema
  });

  //CONTROLA O FORMULARIO
  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(planoDeTrabalhoSchema),
    defaultValues: {
      titulo: "",
      areaId: 0,
      projetoId: idProjeto,
      camposDinamicos: {},
    },
  });

  //RENDERIZACAO INICIAL
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
    if (initialData) {
      setValue("titulo", initialData.titulo);
      setValue("areaId", initialData.areaId);

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

  //BUSCA OS DADOS DO FORMULARIO DE PLANO DE TRABALHO
  useEffect(() => {
    const fetchFormularioEdital = async () => {
      try {
        const formulario = await getFormulario(tenantSlug, idFormularioEdital);
        if (formulario) {
          setFormularioEdital(formulario);
        }
      } catch (error) {
        console.error("Erro ao buscar formulário do edital:", error);
      }
    };

    if (idFormularioEdital) {
      fetchFormularioEdital();
    }
  }, [tenantSlug, idFormularioEdital]);
  useEffect(() => {
    if (initialData && formularioEdital) {
      // Cria um objeto para os valores dos campos dinâmicos
      const dynamicValues = { camposDinamicos: {} };
      if (initialData.Resposta && Array.isArray(initialData.Resposta)) {
        initialData.Resposta.forEach((resposta) => {
          // Usa a mesma chave definida nos inputs: "camposDinamicos.campo_{campoId}"
          dynamicValues[`camposDinamicos.campo_${resposta.campoId}`] =
            resposta.value;
        });
      }

      // Cria o objeto com todos os valores iniciais
      const formValues = {
        titulo: initialData.titulo,
        areaId: initialData.areaId,
        projetoId: idProjeto,
        ...dynamicValues,
      };

      reset(formValues);
    }
  }, [initialData, formularioEdital, idProjeto, reset]);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Submete o formulário
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    console.log("TESTE");
    try {
      const payload = { ...data, cronograma };
      let planoDeTrabalho;

      if (initialData) {
        planoDeTrabalho = await updatePlanoDeTrabalho(
          tenantSlug,
          idInscricao,
          initialData.id,
          payload
        );
      } else {
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

      if (onUpdatePlanoDeTrabalho) {
        onUpdatePlanoDeTrabalho(planoDeTrabalho);
      }

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

  return (
    <>
      <form
        className={`${styles.formulario}`}
        onSubmit={handleSubmit(handleFormSubmit)}
      >
        {false && (
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
        )}
        {activeTab === "conteudo" && (
          <div className={`${styles.conteudo}`}>
            <div className={`${styles.input}`}>
              <Input
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
                control={control}
                name="areaId"
                label="Área de Conhecimento do Plano de Trabalho"
                options={areas || []} // Garante que o options seja um array
                disabled={loading}
              />
            </div>
            <div className={`${styles.camposDinamicos}`}>
              {renderDynamicFields(
                formularioEdital,
                control,
                loading,
                register,
                errors,
                watch
              )}
            </div>
          </div>
        )}
        {activeTab === "conteudo" && (
          <div className={styles.divCronograma}>
            <h6 className="mb-2">Cronograma de Atividades</h6>
            <Atividades cronograma={cronograma} setCronograma={setCronograma} />
          </div>
        )}
        <div className={`${styles.btnSubmit} mt-2`}>
          <Button
            icon={RiSave2Line}
            className="btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Carregando..." : "Salvar"}
          </Button>
          {initialData?.id && (
            <Button
              icon={RiDeleteBinLine}
              className="btn-error mr-2"
              type="button"
              disabled={loading || isDeleting}
              onClick={confirmDelete}
            >
              Excluir
            </Button>
          )}
          {error && (
            <div className={`notification notification-error`}>
              <p className="p5">{error}</p>
            </div>
          )}
        </div>
      </form>
      {/* Dialog de confirmação de exclusão */}
      <Dialog
        visible={displayDeleteDialog}
        style={{ width: "450px" }}
        header="Confirmar Exclusão"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteDialog}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          <span>
            Tem certeza que deseja excluir este plano de trabalho? Esta ação não
            pode ser desfeita.
          </span>
        </div>
      </Dialog>
    </>
  );
};

export default FormGestorPlanoDeTrabalhoCreateOrEdit;

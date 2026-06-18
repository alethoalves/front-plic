"use client";

//HOOKS
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import { RiSave2Line, RiFilePdfLine, RiDeleteBinLine } from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Input from "@/components/Input";
import SearchableSelect from "../SearchableSelect";
import Atividades from "../Atividades";

//FUNÇÕES
import {
  createPlanoDeTrabalho,
  updatePlanoDeTrabalho,
} from "@/app/api/client/planoDeTrabalho";
import { getAreas } from "@/app/api/client/area";
import {
  getFormulario,
  getFormularioProjeto,
} from "@/app/api/client/formulario";
import { createDynamicSchema } from "@/lib/createDynamicSchema";
import { renderDynamicFields } from "@/lib/renderDynamicFields";
import { transformedArray } from "@/lib/transformedArray";
import { createProjeto, updateProjetoById } from "@/app/api/client/projeto";
import { uploadFileProjeto } from "@/app/api/clientReq";
import { Checkbox } from "primereact/checkbox";

const FormProjetoCreateOrEdit = ({
  tenantSlug,
  initialData,
  idInscricao,
  onClose,
  onSuccess,
  onUpdateProjeto,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState("");
  const [activeTab, setActiveTab] = useState("conteudo");
  const [cronograma, setCronograma] = useState([]);
  const [formularioEdital, setFormularioEdital] = useState(null);
  const [errorDelete, setErrorDelete] = useState();
  const [uploadError, setUploadError] = useState("");
  // Novos documentos selecionados pelo usuário (ainda não enviados)
  const [docCEPCONEP, setDocCEPCONEP] = useState(null);
  const [docOGM, setDocOGM] = useState(null);
  const [docComiteEtica, setDocComiteEtica] = useState(null);
  // Documentos já existentes no servidor
  const [existingDocCEPCONEP, setExistingDocCEPCONEP] = useState(null);
  const [existingDocOGM, setExistingDocOGM] = useState(null);
  const [existingDocComiteEtica, setExistingDocComiteEtica] = useState(null);

  //DEFINE O SCHEMA DO PLANO DE TRABALHO
  const planoDeTrabalhoSchema = z.object({
    titulo: z.string().min(1, "Campo obrigatório!"),
    areaId: z.number().int().positive("Campo obrigatório!"),
    envolveHumanos: z.boolean().optional(),
    envolveAnimais: z.boolean().optional(),
    envolveOGM: z.boolean().optional(),
    envolvePatrimonioGenetico: z.boolean().optional(),
    submetidoComiteEtica: z.boolean().optional(),
    numeroCEPCONEP: z.string().optional(),
    numeroSISGEN: z.string().optional(),
    numeroProtocoloEtica: z.string().optional(),
    cronograma: z
      .array(
        z.object({
          nome: z.string().min(1, "Nome da atividade é obrigatório!"),
          inicio: z.string(),
          fim: z.string(),
        }),
      )
      .optional(),
    camposDinamicos: createDynamicSchema(formularioEdital?.campos || []), // Adiciona campos dinâmicos ao schema
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
      envolveAnimais: false,
      envolveHumanos: false,
      envolveOGM: false,
      envolvePatrimonioGenetico: false,
      submetidoComiteEtica: false,
      numeroCEPCONEP: "",
      numeroSISGEN: "",
      numeroProtocoloEtica: "",
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
          error.response?.data?.message ?? "Erro na conexão com o servidor.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    if (initialData) {
      setValue("titulo", initialData.titulo);
      setValue("areaId", initialData.areaId);
      setValue("envolveAnimais", initialData.envolveAnimais);
      setValue("envolveHumanos", initialData.envolveHumanos);
      setValue("envolveOGM", initialData.envolveOGM ?? false);
      setValue("envolvePatrimonioGenetico", initialData.envolvePatrimonioGenetico ?? false);
      setValue("submetidoComiteEtica", initialData.submetidoComiteEtica ?? false);
      setValue("numeroCEPCONEP", initialData.numeroCEPCONEP ?? "");
      setValue("numeroSISGEN", initialData.numeroSISGEN ?? "");
      setValue("numeroProtocoloEtica", initialData.numeroProtocoloEtica ?? "");
      // Popula cronograma
      if (initialData.CronogramaProjeto) {
        const mappedCronograma = initialData.CronogramaProjeto.map((item) => ({
          nome: item.atividade,
          inicio: item.inicio,
          fim: item.fim,
        }));
        setCronograma(mappedCronograma);
      }
      // Carrega documentos já enviados anteriormente
      if (initialData.AnexoProjeto) {
        const cep = initialData.AnexoProjeto.find((a) => a.tipo === "CEP_CONEP");
        const ogm = initialData.AnexoProjeto.find((a) => a.tipo === "OGM");
        const etica = initialData.AnexoProjeto.find((a) => a.tipo === "COMITE_ETICA");
        if (cep) setExistingDocCEPCONEP(cep);
        if (ogm) setExistingDocOGM(ogm);
        if (etica) setExistingDocComiteEtica(etica);
      }
    } else {
      reset();
    }
  }, [initialData, setValue, reset, tenantSlug]);

  //BUSCA OS DADOS DO FORMULARIO DE PLANO DE TRABALHO
  useEffect(() => {
    const fetchFormularioEdital = async () => {
      try {
        const formulario = await getFormularioProjeto(tenantSlug);
        if (formulario) {
          setFormularioEdital(formulario);
        }
      } catch (error) {
        console.error("Erro ao buscar formulário do edital:", error);
      }
    };

    fetchFormularioEdital();
  }, [tenantSlug]);
  useEffect(() => {
    if (initialData && formularioEdital) {
      // Cria um objeto para os valores dos campos dinâmicos
      const dynamicValues = {};
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
        envolveAnimais: initialData.envolveAnimais,
        envolveHumanos: initialData.envolveHumanos,
        envolveOGM: initialData.envolveOGM ?? false,
        envolvePatrimonioGenetico: initialData.envolvePatrimonioGenetico ?? false,
        submetidoComiteEtica: initialData.submetidoComiteEtica ?? false,
        numeroCEPCONEP: initialData.numeroCEPCONEP ?? "",
        numeroSISGEN: initialData.numeroSISGEN ?? "",
        numeroProtocoloEtica: initialData.numeroProtocoloEtica ?? "",
        ...dynamicValues,
      };

      reset(formValues);
    }
  }, [initialData, formularioEdital, reset]);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Lida com a seleção de um arquivo PDF para um campo de documento específico
  const handleDocSelect = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Arquivo excede o limite de 15 MB.");
      return;
    }
    setUploadError("");
    setter({ file, name: file.name, previewUrl: URL.createObjectURL(file) });
  };

  // Submete o formulário
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...data, cronograma };
      let projeto;

      if (initialData) {
        projeto = await updateProjetoById(tenantSlug, initialData.id, payload);
      } else {
        projeto = await createProjeto(tenantSlug, payload);
      }

      if (!projeto || !projeto.id) {
        throw new Error("Erro ao salvar o projeto.");
      }

      // Upload dos documentos regulatórios com tipo identificado
      const uploads = [
        docCEPCONEP && { doc: docCEPCONEP, tipo: "CEP_CONEP" },
        docOGM && { doc: docOGM, tipo: "OGM" },
        docComiteEtica && { doc: docComiteEtica, tipo: "COMITE_ETICA" },
      ].filter(Boolean);

      for (const { doc, tipo } of uploads) {
        await uploadFileProjeto(doc.file, tenantSlug, projeto.id, tipo);
      }

      // Callbacks chamados após todos os uploads concluírem
      if (initialData) {
        if (onUpdateProjeto) onUpdateProjeto(projeto);
      } else {
        onSuccess(projeto);
      }
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      setError(error.response?.data?.message || error.message || "Erro ao enviar o formulário.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
              label="Título do Projeto"
              inputType="text"
              placeholder="Digite aqui o título do Projeto"
              disabled={loading}
            />
          </div>
          <div className={`${styles.input}`}>
            <SearchableSelect
              control={control}
              name="areaId"
              label="Área de Conhecimento do Projeto"
              options={areas || []} // Garante que o options seja um array
              disabled={loading}
            />
          </div>
          <div className="flex align-items-center mb-1">
            <Checkbox
              inputId="envolveHumanos"
              name="envolveHumanos"
              checked={watch("envolveHumanos") || false}
              onChange={(e) => setValue("envolveHumanos", e.checked)}
            />
            <label
              htmlFor="envolveHumanos"
              className="flex align-items-center ml-1"
            >
              <h6>Envolve Humanos</h6>
            </label>
          </div>
          <div className="flex align-items-center mb-2">
            <Checkbox
              inputId="envolveAnimais"
              name="envolveAnimais"
              checked={watch("envolveAnimais") || false}
              onChange={(e) => setValue("envolveAnimais", e.checked)}
            />
            <label
              htmlFor="envolveAnimais"
              className="flex align-items-center ml-1"
            >
              <h6>Envolve Animais</h6>
            </label>
          </div>

          {(watch("envolveHumanos") || watch("envolveAnimais")) && (
            <div className={`${styles.input} mb-2`}>
              <p className={styles.pdfUploadLabel}>
                Documento de aprovação CEP/CONEP (PDF)
              </p>
              {existingDocCEPCONEP && (
                <div className={styles.pdfDoc}>
                  <span className={styles.pdfIcon}><RiFilePdfLine size={16} /></span>
                  <a className={styles.pdfName} href={existingDocCEPCONEP.link} target="_blank" rel="noopener noreferrer">
                    {existingDocCEPCONEP.nomeAnexo}
                  </a>
                </div>
              )}
              {docCEPCONEP ? (
                <div className={styles.pdfDoc}>
                  <span className={styles.pdfIcon}><RiFilePdfLine size={16} /></span>
                  <span className={styles.pdfName}>{docCEPCONEP.name}</span>
                  <span className={styles.pdfDelete} onClick={() => setDocCEPCONEP(null)}>
                    <RiDeleteBinLine size={14} />
                  </span>
                </div>
              ) : (
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={loading}
                  onChange={(e) => handleDocSelect(e, setDocCEPCONEP)}
                />
              )}
              <Input
                control={control}
                name="numeroCEPCONEP"
                label="Número do protocolo CEP/CONEP (se o parecer não estiver homologado)"
                inputType="text"
                placeholder="Digite o número do protocolo"
                disabled={loading}
              />
            </div>
          )}

          <div className="flex align-items-center mb-1">
            <Checkbox
              inputId="envolveOGM"
              name="envolveOGM"
              checked={watch("envolveOGM") || false}
              onChange={(e) => setValue("envolveOGM", e.checked)}
            />
            <label
              htmlFor="envolveOGM"
              className="flex align-items-center ml-1"
            >
              <h6>Envolve Organismo Geneticamente Modificado (OGM)</h6>
            </label>
          </div>

          {watch("envolveOGM") && (
            <div className={`${styles.input} mb-2`}>
              <p className={styles.pdfUploadLabel}>
                Carta de aprovação da comissão interna de biossegurança (PDF)
              </p>
              {existingDocOGM && (
                <div className={styles.pdfDoc}>
                  <span className={styles.pdfIcon}><RiFilePdfLine size={16} /></span>
                  <a className={styles.pdfName} href={existingDocOGM.link} target="_blank" rel="noopener noreferrer">
                    {existingDocOGM.nomeAnexo}
                  </a>
                </div>
              )}
              {docOGM ? (
                <div className={styles.pdfDoc}>
                  <span className={styles.pdfIcon}><RiFilePdfLine size={16} /></span>
                  <span className={styles.pdfName}>{docOGM.name}</span>
                  <span className={styles.pdfDelete} onClick={() => setDocOGM(null)}>
                    <RiDeleteBinLine size={14} />
                  </span>
                </div>
              ) : (
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={loading}
                  onChange={(e) => handleDocSelect(e, setDocOGM)}
                />
              )}
            </div>
          )}

          <div className="flex align-items-center mb-1">
            <Checkbox
              inputId="envolvePatrimonioGenetico"
              name="envolvePatrimonioGenetico"
              checked={watch("envolvePatrimonioGenetico") || false}
              onChange={(e) => setValue("envolvePatrimonioGenetico", e.checked)}
            />
            <label
              htmlFor="envolvePatrimonioGenetico"
              className="flex align-items-center ml-1"
            >
              <h6>Envolve Patrimônio Genético ou Conhecimento Tradicional Associado</h6>
            </label>
          </div>

          {watch("envolvePatrimonioGenetico") && (
            <div className={`${styles.input} mb-2`}>
              <Input
                control={control}
                name="numeroSISGEN"
                label="Número de registro no SISGEN"
                inputType="text"
                placeholder="Digite o número de registro"
                disabled={loading}
              />
            </div>
          )}

          <div className="flex align-items-center mb-1">
            <Checkbox
              inputId="submetidoComiteEtica"
              name="submetidoComiteEtica"
              checked={watch("submetidoComiteEtica") || false}
              onChange={(e) => setValue("submetidoComiteEtica", e.checked)}
            />
            <label
              htmlFor="submetidoComiteEtica"
              className="flex align-items-center ml-1"
            >
              <h6>Projeto submetido a comitê de ética da área?</h6>
            </label>
          </div>

          {watch("submetidoComiteEtica") && (
            <div className={`${styles.input} mb-2`}>
              <p className={styles.pdfUploadLabel}>
                Parecer do comitê de ética (PDF)
              </p>
              {existingDocComiteEtica && (
                <div className={styles.pdfDoc}>
                  <span className={styles.pdfIcon}><RiFilePdfLine size={16} /></span>
                  <a className={styles.pdfName} href={existingDocComiteEtica.link} target="_blank" rel="noopener noreferrer">
                    {existingDocComiteEtica.nomeAnexo}
                  </a>
                </div>
              )}
              {docComiteEtica ? (
                <div className={styles.pdfDoc}>
                  <span className={styles.pdfIcon}><RiFilePdfLine size={16} /></span>
                  <span className={styles.pdfName}>{docComiteEtica.name}</span>
                  <span className={styles.pdfDelete} onClick={() => setDocComiteEtica(null)}>
                    <RiDeleteBinLine size={14} />
                  </span>
                </div>
              ) : (
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={loading}
                  onChange={(e) => handleDocSelect(e, setDocComiteEtica)}
                />
              )}
              <Input
                control={control}
                name="numeroProtocoloEtica"
                label="Número do protocolo do comitê de ética (se o resultado não estiver homologado)"
                inputType="text"
                placeholder="Digite o número do protocolo"
                disabled={loading}
              />
            </div>
          )}

          <div className={`${styles.camposDinamicos}`}>
            {renderDynamicFields(
              formularioEdital,
              control,
              loading,
              register,
              errors,
              watch,
            )}
          </div>
        </div>
      )}
      {false && activeTab === "conteudo" && (
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
        {uploadError && (
          <div className={`notification notification-error`}>
            <p className="p5">{uploadError}</p>
          </div>
        )}
        {error && (
          <div className={`notification notification-error`}>
            <p className="p5">{error}</p>
          </div>
        )}
      </div>
    </form>
  );
};

export default FormProjetoCreateOrEdit;

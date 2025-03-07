"use client";

//HOOKS
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//ESTILOS E ÍCONES
import styles from "@/components/Formularios/Form.module.scss";
import {
  RiAddCircleLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiEyeOffLine,
  RiGroupLine,
  RiInformationLine,
  RiQuillPenLine,
  RiSave2Line,
} from "@remixicon/react";

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
import {
  createProjeto,
  getInscricaoProjetoById,
  getProjetoById,
  isProjetoLinkedToInscricao,
  linkProjetoToInscricao,
  updateInscricaoProjeto,
  updateProjetoById,
} from "@/app/api/client/projeto";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { DataView } from "primereact/dataview";
import CPFVerificationForm from "./CPFVerificationForm";
import NewCargo from "./NewCargo";
import Modal from "../Modal";

const FormGestorProjetoCreateOrEdit = ({
  tenantSlug,
  projetoId,
  idInscricao,
  onClose,
  onSuccess,
  onUpdateProjeto,
}) => {
  //ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState("");
  const [activeTab, setActiveTab] = useState("inscricaoProjeto");
  const [cronograma, setCronograma] = useState([]);
  const [projetoDetalhes, setProjetoDetalhes] = useState(null);
  const [inscricaoProjeto, setInscricaoProjeto] = useState(null);
  const [formularioEdital, setFormularioEdital] = useState(null);
  const [errorDelete, setErrorDelete] = useState();
  const [verifiedData, setVerifiedData] = useState(null);
  const [isModalOpenNovoAvaliador, setIsModalOpenNovoAvaliador] =
    useState(false);

  const toast = useRef(null);
  //DEFINE O SCHEMA DO PLANO DE TRABALHO
  const schema = z.object({
    titulo: z.string().min(1, "Campo obrigatório!"),
    areaId: z.number().int().positive("Campo obrigatório!"),
    cronograma: z
      .array(
        z.object({
          nome: z.string().min(1, "Nome da atividade é obrigatório!"),
          inicio: z.string(),
          fim: z.string(),
        })
      )
      .optional(),
    camposDinamicos: createDynamicSchema(formularioEdital?.campos || [], false), // Adiciona campos dinâmicos ao schema
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
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: "",
      areaId: 0,
    },
  });

  //RENDERIZACAO INICIAL
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (projetoId) {
          const inscricaoProjeto = await getInscricaoProjetoById(
            tenantSlug,
            idInscricao,
            projetoId
          );
          console.log(inscricaoProjeto);
          setProjetoDetalhes(inscricaoProjeto.projeto);
          setInscricaoProjeto(inscricaoProjeto);
        }
        const areas = await getAreas(tenantSlug);
        setAreas(transformedArray(areas));
      } catch (error) {
        setErrorDelete(
          error.response?.data?.message ?? "Erro na conexão com o servidor."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    if (projetoDetalhes) {
      setValue("titulo", projetoDetalhes.titulo);
      setValue("areaId", projetoDetalhes.areaId);

      // Popula cronograma
      if (projetoDetalhes.CronogramaProjeto) {
        const mappedCronograma = projetoDetalhes.CronogramaProjeto.map(
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
  }, [setValue, reset, tenantSlug]);

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
    if (projetoDetalhes && formularioEdital) {
      // Cria um objeto para os valores dos campos dinâmicos
      const dynamicValues = {};
      if (projetoDetalhes.Resposta && Array.isArray(projetoDetalhes.Resposta)) {
        projetoDetalhes.Resposta.forEach((resposta) => {
          // Usa a mesma chave definida nos inputs: "camposDinamicos.campo_{campoId}"
          dynamicValues[`camposDinamicos.campo_${resposta.campoId}`] =
            resposta.value;
        });
      }

      // Cria o objeto com todos os valores iniciais
      const formValues = {
        titulo: projetoDetalhes.titulo,
        areaId: projetoDetalhes.areaId,
        ...dynamicValues,
      };

      reset(formValues);
    }
  }, [projetoDetalhes, formularioEdital, reset]);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Submete o formulário
  const handleFormSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const payload = { ...data, cronograma };
      let planoDeTrabalho;

      if (projetoDetalhes) {
        planoDeTrabalho = await updateProjetoById(
          tenantSlug,
          projetoDetalhes.id,
          payload
        );
        setInscricaoProjeto((prevState) => ({
          ...prevState, // Mantém o restante do estado inalterado
          projeto: {
            ...prevState.projeto, // Mantém o restante do objeto `projeto` inalterado
            ...planoDeTrabalho, // Atualiza o objeto `projeto` com a resposta da API
          },
        }));
        onSuccess();
        if (onUpdateProjeto) {
          onUpdateProjeto(planoDeTrabalho);
        }
      } else {
        planoDeTrabalho = await createProjeto(tenantSlug, payload);
        await linkProjetoToInscricao(
          tenantSlug,
          idInscricao,
          planoDeTrabalho.id
        );
        onSuccess();
        onClose();
      }

      if (!planoDeTrabalho || !planoDeTrabalho.id) {
        throw new Error("Erro ao salvar o plano de trabalho.");
      }
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      setError(error.message || "Erro ao enviar o formulário.");
    } finally {
      setLoading(false);
    }
  };
  const statusOptions = [
    { value: "", label: "null" },
    { value: "AGUARDANDO_AVALIACAO", label: "Aguardando avaliação" },
    { value: "EM_AVALIACAO", label: "em Avaliação" },
    { value: "AVALIADA", label: "Avaliada" },
  ];
  const handleUpdateInscricaoProjeto = async (body) => {
    try {
      const response = await updateInscricaoProjeto(
        tenantSlug,
        inscricaoProjeto.id,
        body
      );
      setInscricaoProjeto(response);
      await onSuccess();

      // Exibe uma notificação de sucesso
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Atualizado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);

      // Exibe uma notificação de erro
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Ocorreu um erro ao atualizar o status.",
        life: 3000,
      });
    }
  };
  const handleUpdateProjeto = async (body) => {
    try {
      const response = await updateProjetoById(
        tenantSlug,
        inscricaoProjeto.projeto.id,
        body
      );
      setInscricaoProjeto((prevState) => ({
        ...prevState, // Mantém o restante do estado inalterado
        projeto: {
          ...prevState.projeto, // Mantém o restante do objeto `projeto` inalterado
          ...response, // Atualiza o objeto `projeto` com a resposta da API
        },
      }));
      await onSuccess();

      // Exibe uma notificação de sucesso
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Atualizado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);

      // Exibe uma notificação de erro
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Ocorreu um erro ao atualizar o status.",
        life: 3000,
      });
    }
  };
  const listTemplateAvaliadores = (avaliadores) => {
    return (
      <div className={styles.list}>
        {avaliadores.map((avaliador) => (
          <div
            key={avaliador.id}
            className={styles.itemList}
            onClick={() => {
              setParticipacaoSelected(participante);
              setIsModalParticipacaoOpen(true);
            }}
          >
            <div className={styles.content1}>
              <p>{avaliador.avaliador?.nome}</p>
            </div>
            <div className={styles.content2}>
              <RiDeleteBinLine />
            </div>
          </div>
        ))}
      </div>
    );
  };
  const listTemplateFichas = (fichas) => {
    const [mostrarNotas, setMostrarNotas] = useState({});

    const toggleNotas = (id) => {
      setMostrarNotas((prevState) => ({
        ...prevState,
        [id]: !prevState[id], // Alterna entre true e false para o id da ficha
      }));
    };

    return (
      <div className={styles.list}>
        {fichas.map((ficha) => (
          <div
            key={ficha.id}
            className={`${styles.fichas}`}
            onClick={() => toggleNotas(ficha.id)} // Chama a função ao clicar na ficha
          >
            <div className={styles.headerFicha}>
              <div className={styles.content1}>
                <p>
                  Avaliador:
                  <br />
                  <strong>{ficha.avaliador?.nome}</strong>
                </p>
              </div>
              <div className={styles.content2}>
                <p>
                  Total: <strong>{ficha.notaTotal}</strong>
                </p>
                {mostrarNotas[ficha.id] ? <RiEyeOffLine /> : <RiEyeLine />}{" "}
                {/* Alterna o ícone */}
              </div>
            </div>

            {mostrarNotas[ficha.id] && ( // Renderiza as notas se mostrarNotas[ficha.id] for true
              <div className={styles.quesitos}>
                {ficha.RegistroFichaAvaliacao?.map((registro) => (
                  <div key={registro.id} className={styles.quesito}>
                    <p className={styles.label}>{registro.label}</p>
                    <p className={styles.nota}>
                      Peso: {registro.peso} | Nota: {registro.nota}
                      <strong>
                        {" "}
                        | Nota final: {registro.nota * registro.peso}
                      </strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  const renderModalContentNovoAvaliador = () => (
    <Modal
      isOpen={isModalOpenNovoAvaliador}
      onClose={() => {
        setIsModalOpenNovoAvaliador(false);
      }}
    >
      <h4>Incluir Avaliador</h4>
      <p>Preencha os dados abaixo para incluir um avaliador.</p>
      <CPFVerificationForm
        tenantSlug={tenantSlug}
        onCpfVerified={setVerifiedData}
      />
      {verifiedData && (
        <NewCargo
          tenantSlug={tenantSlug}
          initialData={verifiedData}
          //onClose={closeModalAndResetData}
          //onSuccess={handleCreateOrEditSuccess}
        />
      )}
    </Modal>
  );
  return (
    <>
      {renderModalContentNovoAvaliador()}
      <div className={styles.toast}>
        <Toast ref={toast} />
      </div>
      <div className={`${styles.nav}`}>
        <div className={`${styles.menu}`}>
          <div
            className={`${styles.itemMenu} ${
              activeTab === "inscricaoProjeto" ? styles.itemMenuSelected : ""
            }`}
            onClick={() => handleTabChange("inscricaoProjeto")}
          >
            <p>Informações</p>
          </div>
          <div
            className={`${styles.itemMenu} ${
              activeTab === "conteudo" ? styles.itemMenuSelected : ""
            }`}
            onClick={() => handleTabChange("conteudo")}
          >
            <p>Conteúdo</p>
          </div>
        </div>
      </div>
      {activeTab === "inscricaoProjeto" && (
        <div className={styles.content}>
          <div className={styles.mainContent}>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiInformationLine />
                </div>
                <h6>Dados gerais</h6>
              </div>
              <div className="pl-2 pr-2 pb-2">
                <p className="mb-1">
                  <strong>Título do projeto: </strong>
                  {inscricaoProjeto?.projeto.titulo}
                </p>
                <p className="mb-1">
                  <strong>Área: </strong>
                  {inscricaoProjeto?.projeto.area.area}
                </p>

                <div className={styles.statusField}>
                  <p>
                    <strong>Status da Avaliação: </strong>
                  </p>

                  <Dropdown
                    value={inscricaoProjeto?.statusAvaliacao}
                    options={statusOptions}
                    onChange={(e) =>
                      handleUpdateInscricaoProjeto({
                        statusAvaliacao: e.value,
                      })
                    }
                    placeholder="Selecione o status"
                    className={styles.statusDropdown}
                    optionLabel="label"
                    optionValue="value"
                  />
                </div>
                <div className={`mt-1 ${styles.statusField}`}>
                  <p>
                    <strong>Envole humanos: </strong>
                  </p>

                  <Dropdown
                    value={inscricaoProjeto?.projeto.envolveHumanos}
                    options={[
                      { label: "Sim", value: true },
                      { label: "Não", value: false },
                    ]}
                    onChange={(e) => {
                      handleUpdateProjeto({
                        areaId: inscricaoProjeto.projeto.areaId,
                        titulo: inscricaoProjeto.projeto.titulo,
                        envolveHumanos: e.value, // Envia o novo valor de `envolveHumanos`
                      });
                    }}
                    placeholder="Selecione o status"
                    className={styles.statusDropdown}
                    optionLabel="label"
                    optionValue="value"
                  />
                </div>
              </div>
            </div>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiGroupLine />
                </div>
                <h6>Avaliadores</h6>
                {false && (
                  <div
                    onClick={() => {
                      setIsModalOpenNovoAvaliador(true);
                    }}
                    className={`ml-1 ${styles.icon} ${styles.iconClick}`}
                  >
                    <RiAddCircleLine />
                  </div>
                )}
              </div>
              {inscricaoProjeto?.InscricaoProjetoAvaliador && (
                <DataView
                  value={inscricaoProjeto?.InscricaoProjetoAvaliador}
                  listTemplate={listTemplateAvaliadores}
                  layout="list" // Define o layout como lista
                  emptyMessage="Nada encontrado :/"
                />
              )}
            </div>
            <div className={styles.box}>
              <div className={styles.header}>
                <div className={styles.icon}>
                  <RiQuillPenLine />
                </div>
                <h6>Fichas de Avaliação</h6>
              </div>
              {inscricaoProjeto?.FichaAvaliacao && (
                <DataView
                  value={inscricaoProjeto?.FichaAvaliacao}
                  listTemplate={listTemplateFichas}
                  layout="list" // Define o layout como lista
                  emptyMessage="Nada encontrado :/"
                />
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === "conteudo" && (
        <form
          className={`${styles.formulario}`}
          onSubmit={handleSubmit(handleFormSubmit)}
        >
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

          <div className={styles.divCronograma}>
            <h6 className="mb-2">Cronograma de Atividades</h6>
            <Atividades cronograma={cronograma} setCronograma={setCronograma} />
          </div>

          <div className={`${styles.btnSubmit} mt-2`}>
            <Button
              icon={RiSave2Line}
              className="btn-primary"
              type="submit"
              disabled={loading}
            >
              {loading ? "Carregando..." : "Salvar"}
            </Button>
            {error && (
              <div className={`notification notification-error`}>
                <p className="p5">{error}</p>
              </div>
            )}
          </div>
        </form>
      )}
    </>
  );
};

export default FormGestorProjetoCreateOrEdit;

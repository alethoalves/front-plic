"use client";
import { Button } from "primereact/button";
import {
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiSave2Line,
} from "@remixicon/react";
import styles from "./EditarParticipacao.module.scss";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createDynamicSchema } from "@/lib/createDynamicSchema";
import { renderDynamicFields } from "@/lib/renderDynamicFields";
import generateLattesText from "@/lib/generateLattesText";
import FileInput from "../FileInput";
import { deleteParticipacao } from "@/app/api/client/participacao";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import { getFormulario } from "@/app/api/client/formulario";
import { xmlLattes } from "@/app/api/clientReq";
import { Stepper } from "primereact/stepper";
import { StepperPanel } from "primereact/stepperpanel";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import Image from "next/image";

const EditarParticipacao = ({
  participacaoInfo,
  setParticipacaoInfo,
  tenant,
  inscricaoSelected,
  setInscricao,
  closeModalAndResetData,
  handleValidateParticipacao,
  tipoParticipacao,
}) => {
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileInputErrors, setFileInputErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [errorMessages, setErrorMessages] = useState({});
  const [editalInfo, setEditalInfo] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const toast = useRef(null);

  const showError = (message) => {
    toast.current.show({
      severity: "error",
      summary: "Erro",
      detail: message,
      life: 5000,
    });
  };

  const showSuccess = (message) => {
    toast.current.show({
      severity: "success",
      summary: "Sucesso",
      detail: message,
      life: 5000,
    });
  };

  const getCamposByTipoParticipacao = () => {
    switch (tipoParticipacao) {
      case "orientador":
        return camposFormOrientador;
      case "coorientador":
        return camposFormCoorientador;
      case "aluno":
        return camposFormAluno;
      default:
        return [];
    }
  };

  const campos = getCamposByTipoParticipacao();

  const participacaoSchema = useMemo(
    () =>
      z.object({
        camposDinamicos: createDynamicSchema(campos || []),
      }),
    [campos],
  );

  const {
    register,
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(participacaoSchema),
    defaultValues: {},
  });

  const handleFormSubmit = async (data) => {
    setLoadingForm(true);
    setErrorForm("");
    try {
      console.log("Dados do formulário:", data);
      alert("Formulário enviado com sucesso (fake)!");
      showSuccess("Formulário salvo com sucesso!");
      setActiveStep((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      setErrorForm(error.message || "Erro ao enviar o formulário.");
      showError(error.message || "Erro ao enviar o formulário.");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleNextStep = () => {
    if (!participacaoInfo?.user?.cvLattes?.length) {
      showError("Por favor, envie um currículo antes de prosseguir.");
      return;
    }
    setActiveStep(1);
  };

  const handleFileUpload = async (file, userId) => {
    if (!file) {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Nenhum arquivo selecionado.",
      }));
      return;
    }

    if (file.type !== "text/xml" && file.type !== "application/zip") {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Por favor, selecione um arquivo XML ou ZIP válido.",
      }));
      return;
    }

    setFileInputErrors((prev) => ({ ...prev, [userId]: "" }));
    setLoading(true);

    try {
      const response = await xmlLattes(file, tenant, userId);
      if (response && response.fileUrl) {
        const updatedParticipacao = {
          ...participacaoInfo,
          user: {
            ...participacaoInfo.user,
            cvLattes: [
              ...participacaoInfo.user.cvLattes,
              { id: Date.now(), url: response.fileUrl, userId },
            ],
          },
        };

        setInscricao((prevState) => ({
          ...prevState,
          participacoes: prevState.participacoes.map((participacao) =>
            participacao.id === updatedParticipacao.id
              ? { ...participacao, ...updatedParticipacao }
              : participacao,
          ),
        }));

        setParticipacaoInfo((prev) => {
          const updated = { ...prev, ...updatedParticipacao };
          return updated;
        });

        try {
          await handleValidateParticipacao(tenant, updatedParticipacao);
        } catch (error) {
          console.error("Erro ao validar participação:", error);
        }
        showSuccess("Arquivo enviado e URL do Lattes atualizada com sucesso!");
        setActiveStep((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao enviar o arquivo.";
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: errorMessage,
      }));
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipacao = async (idParticipacao) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta participação?",
    );
    if (!confirmed) return;

    setDeletingId(idParticipacao);
    setErrorMessages((prev) => ({ ...prev, [idParticipacao]: "" }));

    try {
      await deleteParticipacao(tenant, idParticipacao);
      setInscricao((prevState) => ({
        ...prevState,
        participacoes: prevState.participacoes.filter(
          (participacao) => participacao?.id !== idParticipacao,
        ),
      }));
      showSuccess("Participação excluída com sucesso!");
      closeModalAndResetData();
    } catch (error) {
      console.error("Erro ao excluir participação:", error);
      setErrorMessages((prev) => ({
        ...prev,
        [idParticipacao]:
          error.response?.data?.message || "Erro ao excluir participação.",
      }));
      showError(
        error.response?.data?.message || "Erro ao excluir participação.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateOrEditSuccess = useCallback(
    async (updatedParticipacao) => {
      setInscricao((prevState) => {
        return {
          ...prevState,
          participacoes: prevState.participacoes.map((participacao) =>
            participacao.id === updatedParticipacao.id
              ? { ...participacao, ...updatedParticipacao }
              : participacao,
          ),
        };
      });

      setParticipacaoInfo((prev) => ({
        ...prev,
        ...updatedParticipacao,
      }));

      try {
        await handleValidateParticipacao(tenant, updatedParticipacao);
      } catch (error) {
        console.error("Erro ao validar participação:", error);
      }
    },
    [setInscricao, tenant],
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await getInscricaoUserById(tenant, inscricaoSelected);
        setInscricao(response);
        setEditalInfo(response.edital);
        if (response.edital.formOrientadorId) {
          const responseFormOrientador = await getFormulario(
            tenant,
            response.edital.formOrientadorId,
          );
          setCamposFormOrientador(
            responseFormOrientador.campos.sort((a, b) => a.ordem - b.ordem),
          );
        }
        if (response.edital.formCoorientadorId) {
          const responseFormCoorientador = await getFormulario(
            tenant,
            response.edital.formCoorientadorId,
          );
          setCamposFormCoorientador(
            responseFormCoorientador.campos.sort((a, b) => a.ordem - b.ordem),
          );
        }
        if (response.edital.formAlunoId) {
          const responseFormAluno = await getFormulario(
            tenant,
            response.edital.formAlunoId,
          );
          setCamposFormAluno(
            responseFormAluno.campos.sort((a, b) => a.ordem - b.ordem),
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, participacaoInfo, inscricaoSelected]);

  return (
    <>
      <Toast ref={toast} position="top-right" />
      {!loading ? (
        <div className={styles.editarParticipacao}>
          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            style={{ flexBasis: "50rem" }}
          >
            <StepperPanel header="Currículo">
              <div className={styles.curriculoStep}>
                {/* Card de informações do CV */}
                <Card className={styles.cvCard}>
                  <div className={styles.cvHeader}>
                    <div className={styles.cvIcon}>
                      <RiEyeLine size={24} />
                    </div>
                    <div className={styles.cvInfo}>
                      <h3>Currículo Lattes</h3>
                      {participacaoInfo?.user?.cvLattes?.length > 0 ? (
                        <a
                          href={
                            participacaoInfo.user.cvLattes[
                              participacaoInfo.user.cvLattes?.length - 1
                            ]?.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.cvLink}
                        >
                          Clique para visualizar{" "}
                          <RiExternalLinkLine size={16} />
                        </a>
                      ) : (
                        <p className={styles.noCvText}>
                          Nenhum CV enviado ainda
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {participacaoInfo?.user?.cvLattes?.length > 0 && !loading && (
                  <div className={styles.updateInfo}>
                    <RiSave2Line size={16} />
                    <span>
                      Última atualização:{" "}
                      {
                        generateLattesText(
                          participacaoInfo.user.cvLattes[
                            participacaoInfo.user.cvLattes?.length - 1
                          ]?.url,
                        ).formattedDate
                      }{" "}
                      às{" "}
                      {
                        generateLattesText(
                          participacaoInfo.user.cvLattes[
                            participacaoInfo.user.cvLattes?.length - 1
                          ]?.url,
                        ).formattedTime
                      }
                    </span>
                  </div>
                )}
                {/* Área de upload */}
                <Card className={styles.uploadCard}>
                  <div className={styles.uploadArea}>
                    <FileInput
                      onFileSelect={(file) =>
                        handleFileUpload(file, participacaoInfo.user.id)
                      }
                      label={
                        participacaoInfo?.user?.cvLattes?.length > 0
                          ? "Atualizar Currículo Lattes"
                          : "Enviar pasta .ZIP do Currículo Lattes"
                      }
                      disabled={loading}
                      errorMessage={
                        fileInputErrors[participacaoInfo?.user?.id] || ""
                      }
                    />

                    {loading && (
                      <div className={styles.loadingWrapper}>
                        <ProgressSpinner
                          style={{ width: "30px", height: "30px" }}
                        />
                        <span>Enviando arquivo...</span>
                      </div>
                    )}
                  </div>
                </Card>
                {/* Guia passo a passo */}
                <Card className={styles.guideCard}>
                  <div className={styles.guideHeader}>
                    <h4>Como enviar ou atualizar seu Currículo Lattes</h4>
                    <p className={styles.guideSubtitle}>
                      Siga os passos abaixo para exportar e enviar seu CV Lattes
                      em formato XML/ZIP
                    </p>
                  </div>

                  <div className={styles.stepsList}>
                    {/* Passo 1 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>1</div>
                      <div className={styles.stepContent}>
                        <p>Acesse a plataforma Lattes</p>
                        <a
                          href="https://lattes.cnpq.br/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.stepLink}
                        >
                          <div className={styles.stepLogo}>
                            <Image
                              fill
                              src="/image/cnpqLogoMini.png"
                              alt="CNPq Logo"
                              sizes="24 24 700"
                            />
                          </div>
                          lattes.cnpq.br
                          <RiExternalLinkLine size={14} />
                        </a>
                      </div>
                    </div>

                    {/* Passo 2 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>2</div>
                      <div className={styles.stepContent}>
                        <p>Cadastre ou atualize seu currículo</p>
                        <div className={styles.stepActions}>
                          <a
                            href="https://wwws.cnpq.br/cvlattesweb/pkg_cv_estr.inicio"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.stepLink}
                          >
                            Cadastrar novo currículo
                          </a>
                          <span className={styles.stepSeparator}>ou</span>
                          <a
                            href="https://lattes.cnpq.br/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.stepLink}
                          >
                            Atualizar currículo existente
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Passo 3 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>3</div>
                      <div className={styles.stepContent}>
                        <p>
                          Na página do seu currículo Lattes, clique em
                          "Exportar"
                        </p>
                        <div className={styles.stepImage}>
                          <Image
                            fill
                            src="/image/printLattesExportar.png"
                            alt="Botão exportar no Lattes"
                            sizes="100 100 700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Passo 4 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>4</div>
                      <div className={styles.stepContent}>
                        <p>
                          Selecione o formato <strong>XML</strong> e faça o
                          download
                        </p>
                        <div className={styles.fileFormatBadge}>
                          Será feito o download de uma pasta com o formato: .ZIP
                        </div>
                      </div>
                    </div>

                    {/* Passo 5 */}
                    <div className={styles.stepItem}>
                      <div className={styles.stepNumber}>5</div>
                      <div className={styles.stepContent}>
                        <p>Faça o upload da pasta .ZIP </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className={styles.stepFooter}>
                <Button
                  className="btn-primary"
                  label="Próximo"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  onClick={handleNextStep}
                />
              </div>
            </StepperPanel>
            <StepperPanel header={`Avaliação do ${tipoParticipacao}`}>
              <div className={styles.fichaAvaliacao}>
                <Card className={styles.avaliacaoCard}>
                  {/* Cabeçalho com ícone e título */}
                  <div className={styles.avaliacaoHeader}>
                    <div className={styles.avaliacaoIcon}>
                      <RiSave2Line size={24} />
                    </div>
                    <div>
                      <h4>Gerar Ficha de Avaliação</h4>
                      <p className={styles.avaliacaoSubtitle}>
                        {tipoParticipacao.charAt(0).toUpperCase() +
                          tipoParticipacao.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* Conteúdo Principal */}
                  <div className={styles.avaliacaoContent}>
                    <p className={styles.avaliacaoDescription}>
                      Com base nos dados extraídos do Currículo Lattes, o
                      sistema irá pré-preencher e gerar a ficha de avaliação
                      para a categoria de <strong>{tipoParticipacao}</strong>.
                    </p>

                    <div className={styles.avaliacaoInfoBox}>
                      <span className={styles.infoIcon}>ℹ️</span>
                      <span>
                        Após gerar a ficha, você poderá revisar as informações
                        no próximo passo.
                      </span>
                    </div>

                    <Button
                      icon={
                        loadingForm
                          ? "pi pi-spin pi-spinner"
                          : "pi pi-file-edit"
                      }
                      className={styles.btnGerarFicha}
                      label={
                        loadingForm
                          ? "Processando Currículo..."
                          : "Gerar Ficha de Avaliação"
                      }
                      onClick={handleFormSubmit} // Certifique-se de que a ação de gerar está vinculada corretamente
                      disabled={loadingForm}
                      loading={loadingForm} // PrimeReact Button suporta prop "loading"
                    />
                  </div>

                  {/* Rodapé com Ações Secundárias */}
                  <div className={styles.avaliacaoFooter}>
                    <Button
                      label="Voltar para Currículo"
                      icon="pi pi-arrow-left"
                      className="p-button-text p-button-plain"
                      onClick={() => setActiveStep(0)}
                    />
                  </div>
                </Card>
              </div>
            </StepperPanel>
            {/* Step: Campos Dinâmicos (Formulário) */}
            {campos.length > 0 && (
              <StepperPanel
                header={`Formulário - ${tipoParticipacao.toUpperCase()}`}
              >
                <Card>
                  <div className={styles.label}>
                    <h6>
                      Preencha os campos abaixo para o tipo:{" "}
                      {tipoParticipacao.toUpperCase()}
                    </h6>
                    <form onSubmit={handleSubmit(handleFormSubmit)}>
                      <div className={`${styles.camposDinamicos} mt-2`}>
                        {renderDynamicFields(
                          { campos: campos },
                          control,
                          loadingForm,
                          register,
                          errors,
                          watch,
                        )}
                      </div>
                      <div className={`${styles.btnSubmit} mt-2`}>
                        <Button
                          icon={RiSave2Line}
                          className="btn-primary"
                          type="submit"
                          disabled={loadingForm}
                        >
                          {loadingForm ? "Carregando..." : "Salvar"}
                        </Button>
                        {errorForm && (
                          <div
                            className={`notification notification-error mt-2`}
                          >
                            <p className="p5">{errorForm}</p>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                  <div className="flex pt-3 gap-1">
                    <Button
                      label="Voltar"
                      severity="secondary"
                      icon="pi pi-arrow-left"
                      onClick={() => setActiveStep(0)}
                    />
                  </div>
                </Card>
              </StepperPanel>
            )}
          </Stepper>

          {/* Botão de excluir fora do Stepper */}
          {!loading ||
            (false && (
              <div className={styles.excluirParticipacao}>
                <Button
                  className="btn-secondary"
                  type="button"
                  disabled={deletingId === participacaoInfo.id}
                  icon={RiDeleteBinLine}
                  onClick={() => handleDeleteParticipacao(participacaoInfo.id)}
                >
                  {deletingId === participacaoInfo.id
                    ? "Excluindo..."
                    : "Excluir participação"}
                </Button>
                {errorMessages[participacaoInfo.id] && (
                  <div className={`${styles.errorMsg}`}>
                    <p>{errorMessages[participacaoInfo.id]}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="p-4">Carregando...</div>
      )}
    </>
  );
};

export default EditarParticipacao;

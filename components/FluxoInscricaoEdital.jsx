"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./FluxoInscricaoEdital.module.scss";
import {
  RiAddCircleLine,
  RiAlertLine,
  RiDeleteBinLine,
  RiEditLine,
  RiExternalLinkLine,
} from "@remixicon/react";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import FileInput from "@/components/FileInput";
import Campo from "@/components/Campo";

import { uploadFile, xmlLattes } from "@/app/api/clientReq";
import generateLattesText from "@/lib/generateLattesText";
import { getFormulario } from "@/app/api/client/formulario";
import ParticipacaoForm from "@/components/Formularios/ParticipacaoForm";
import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import Modal from "@/components/Modal";
import { deleteParticipacao } from "@/app/api/client/participacao";
import Button from "./Button";

const FluxoInscricaoEdital = ({ tenant, inscricaoSelected }) => {
  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inscricao, setInscricao] = useState([]);
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);
  const [activeStep, setActiveStep] = useState("orientador"); // Estado para a etapa ativa
  const [errorDelete, setErrorDelete] = useState(null);
  const [errorMessages, setErrorMessages] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenInativar, setIsModalOpenInativar] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itens, setItens] = useState([]);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // ID da participação sendo deletada

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getInscricaoUserById(tenant, inscricaoSelected);
        setInscricao(response);

        if (response.edital.formOrientadorId) {
          const responseFormOrientador = await getFormulario(
            tenant,
            response.edital.formOrientadorId
          );
          setCamposFormOrientador(
            responseFormOrientador.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
        if (response.edital.formCoorientadorId) {
          const responseFormCoorientador = await getFormulario(
            tenant,
            response.edital.formCoorientadorId
          );
          setCamposFormCoorientador(
            responseFormCoorientador.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, inscricaoSelected]);

  const handleFileUpload = async (file, userId) => {
    if (!file) {
      setError("Nenhum arquivo selecionado.");
      return;
    }

    if (file.type !== "text/xml") {
      setError("Por favor, selecione um arquivo XML válido.");
      return;
    }

    setError(""); // Limpa qualquer erro anterior
    setLoading(true); // Inicia o estado de carregamento
    try {
      const response = await xmlLattes(file, tenant, userId); // Chama a função para upload
      console.log("Upload concluído:", response);
      alert("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage =
        error.response?.data?.message || // Mensagem do backend, se disponível
        "Erro ao enviar o arquivo."; // Mensagem genérica
      setError(errorMessage); // Exibe a mensagem de erro ao usuário
    } finally {
      setLoading(false); // Finaliza o estado de carregamento
    }
  };

  const handleCreateOrEditSuccess = useCallback((newParticipacao) => {
    setInscricao((prevState) => ({
      ...prevState,
      participacoes: [...prevState.participacoes, newParticipacao],
    }));
    closeModalAndResetData();
  }, []);
  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setItemToEdit(data);
    setVerifiedData(false);
  };
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setVerifiedData(false);
    setDeleteModalOpen(false);
    setErrorDelete("");
    setIsModalOpenInativar(false);
  };
  const renderModalParticipacao = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>{itemToEdit ? "Editar participação" : "Nova participação"}</h4>
      <p>
        {itemToEdit
          ? "Edite os dados abaixo."
          : "Preencha os dados abaixo para adicionar uma nova participação."}
      </p>

      <CPFVerificationForm
        tenantSlug={tenant}
        onCpfVerified={setVerifiedData}
      />
      {verifiedData && (
        <ParticipacaoForm
          tenantSlug={tenant}
          inscricaoId={inscricaoSelected}
          initialData={verifiedData}
          onClose={closeModalAndResetData}
          onSuccess={handleCreateOrEditSuccess}
          showLabelInicio={false}
          options={
            activeStep === "orientador"
              ? [
                  { label: "Selecione uma opção", value: "" },
                  { label: "Orientador", value: "orientador" },
                ]
              : [
                  { label: "Selecione uma opção", value: "" },
                  { label: "Coorientador", value: "coorientador" },
                ]
          }
        />
      )}
    </Modal>
  );
  const handleDeleteParticipacao = async (idParticipacao) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta participação?"
    );
    if (!confirmed) return;

    setDeletingId(idParticipacao); // Ativa o loading para a participação específica
    setErrorMessages((prev) => ({ ...prev, [idParticipacao]: "" })); // Limpa erros anteriores

    try {
      await deleteParticipacao(tenant, idParticipacao);
      // Remove a participação do estado local
      setInscricao((prevState) => ({
        ...prevState,
        participacoes: prevState.participacoes.filter(
          (participacao) => participacao.id !== idParticipacao
        ),
      }));
    } catch (error) {
      console.error("Erro ao excluir participação:", error);
      // Atualiza a mensagem de erro específica para a participação
      setErrorMessages((prev) => ({
        ...prev,
        [idParticipacao]:
          error.response?.data?.message || "Erro ao excluir participação.",
      }));
    } finally {
      setDeletingId(null); // Desativa o loading
    }
  };

  return (
    <>
      {renderModalParticipacao()}
      <div className={styles.inscricao}>
        <div className={styles.header}>
          <h4>Formulário de Inscrição</h4>
          <div className={styles.info}>
            <p>
              EDITAL: <strong>{inscricao.edital?.titulo}</strong>
            </p>
            <p>
              ANO: <strong>{inscricao.edital?.ano}</strong>
            </p>
            <p>
              TERMO:{" "}
              <strong>
                Ao fazer a inscrição neste edital, você concorda com os termos
                estabelecidos no edital.
              </strong>
            </p>
          </div>
          <div className={styles.pendente}>
            <RiAlertLine />
            <p>
              Preencha todos os campos para concluir sua inscrição e gerar o
              comprovante
            </p>
          </div>
          <div className={styles.stepsMenu}>
            <div
              className={`${styles.stepItemMenu} ${
                activeStep === "orientador" ? styles.selected : ""
              }`}
              onClick={() => setActiveStep("orientador")}
            >
              <div className={`${styles.icon} ${styles.statusWarning}`}>
                <RiAlertLine />
              </div>
              <p>Orientador</p>
            </div>
            <div
              className={`${styles.stepItemMenu} ${
                activeStep === "coorientador" ? styles.selected : ""
              }`}
              onClick={() => setActiveStep("coorientador")}
            >
              <div className={`${styles.icon} ${styles.statusWarning}`}>
                <RiAlertLine />
              </div>
              <p>Coorientador</p>
            </div>
            <div
              className={`${styles.stepItemMenu} ${
                activeStep === "projetos" ? styles.selected : ""
              }`}
              onClick={() => setActiveStep("projetos")}
            >
              <div className={`${styles.icon} ${styles.statusWarning}`}>
                <RiAlertLine />
              </div>
              <p>Projetos</p>
            </div>
            <div
              className={`${styles.stepItemMenu} ${
                activeStep === "planosDeTrabalho" ? styles.selected : ""
              }`}
              onClick={() => setActiveStep("planosDeTrabalho")}
            >
              <div className={`${styles.icon} ${styles.statusWarning}`}>
                <RiAlertLine />
              </div>
              <p>Planos de Trabalho</p>
            </div>
          </div>
          <div>
            {activeStep === "orientador" && (
              <>
                <div className={styles.orientadores}>
                  {inscricao.participacoes
                    ?.filter((item) => item.tipo === "orientador")
                    .map((item) => (
                      <div key={item.id} className={styles.orientador}>
                        <div className={styles.label}>
                          <h6>Nome</h6>
                          <p>{item.user.nome}</p>
                        </div>
                        <div className={styles.label}>
                          <h6>CPF</h6>
                          <p>{item.user.cpf}</p>
                        </div>
                        <div className={styles.label}>
                          <h6>CV Lattes</h6>
                          {item.user.cvLattes?.length > 0 && (
                            <div className={styles.urlCvLattes}>
                              <RiExternalLinkLine />
                              <a
                                href={
                                  item.user.cvLattes[
                                    item.user.cvLattes?.length - 1
                                  ]?.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {generateLattesText(
                                  item.user.cvLattes[
                                    item.user.cvLattes?.length - 1
                                  ]?.url
                                )}
                              </a>
                            </div>
                          )}
                          <div className="mt-2">
                            <FileInput
                              onFileSelect={(file) =>
                                handleFileUpload(file, item.user.id)
                              }
                              label={
                                item.user.cvLattes?.length > 0
                                  ? "Quer atualizar o Lattes?"
                                  : "Enviar CV Lattes"
                              }
                              disabled={loading}
                              errorMessage={error}
                            />
                          </div>
                        </div>
                        {item.tipo === "orientador" &&
                          camposFormOrientador.length > 0 && (
                            <div className={styles.label}>
                              <h6>Preencha os campos abaixo</h6>
                              <div className={`${styles.campos} mt-2`}>
                                {camposFormOrientador?.map((campo, index) => (
                                  <Campo
                                    perfil="participante"
                                    readOnly={false}
                                    key={campo.id}
                                    schema={
                                      camposFormOrientador &&
                                      camposFormOrientador[index]
                                    }
                                    camposForm={camposFormOrientador}
                                    respostas={item?.respostas}
                                    tenantSlug={tenant}
                                    participacaoId={item?.id}
                                    onSuccess={handleCreateOrEditSuccess}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        {item.tipo === "coorientador" &&
                          camposFormCoorientador.length > 0 && (
                            <div className={styles.label}>
                              <h6>Preencha os campos abaixo</h6>
                              <div className={`${styles.campos} mt-2`}>
                                {camposFormCoorientador?.map((campo, index) => (
                                  <Campo
                                    perfil="participante"
                                    readOnly={false}
                                    key={campo.id}
                                    schema={
                                      camposFormOrientador &&
                                      camposFormOrientador[index]
                                    }
                                    camposForm={camposFormOrientador}
                                    respostas={item?.respostas}
                                    tenantSlug={tenant}
                                    participacaoId={item?.id}
                                    onSuccess={handleCreateOrEditSuccess}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        <div className={styles.excluirParticipacao}>
                          <Button
                            className={"btn-secondary"}
                            type="button"
                            disabled={deletingId === item.id}
                            icon={RiDeleteBinLine}
                            onClick={() => handleDeleteParticipacao(item.id)}
                          >
                            {deletingId === item.id ? (
                              <p>Excluindo...</p> // Mostra o loading apenas no item sendo deletado
                            ) : (
                              <p>Excluir participação</p>
                            )}
                          </Button>
                          {errorMessages[item.id] && ( // Exibe a mensagem de erro específica se existir
                            <div className={`${styles.errorMsg}`}>
                              <p>{errorMessages[item.id]}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                <div
                  className={styles.addItem}
                  onClick={() => openModalAndSetData(null)}
                >
                  <div className={styles.icon}>
                    <RiAddCircleLine />
                  </div>
                  <p>Add orientador</p>
                </div>
              </>
            )}
            {activeStep === "coorientador" && (
              <>
                <div className={styles.orientadores}>
                  {inscricao.participacoes
                    ?.filter((item) => item.tipo === "coorientador")
                    .map((item) => (
                      <div key={item.id} className={styles.orientador}>
                        <div className={styles.label}>
                          <h6>Nome</h6>
                          <p>{item.user.nome}</p>
                        </div>
                        <div className={styles.label}>
                          <h6>CPF</h6>
                          <p>{item.user.cpf}</p>
                        </div>
                        <div className={styles.label}>
                          <h6>CV Lattes</h6>
                          {item.user.cvLattes?.length > 0 && (
                            <div className={styles.urlCvLattes}>
                              <RiExternalLinkLine />
                              <a
                                href={
                                  item.user.cvLattes[
                                    item.user.cvLattes?.length - 1
                                  ]?.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {generateLattesText(
                                  item.user.cvLattes[
                                    item.user.cvLattes?.length - 1
                                  ]?.url
                                )}
                              </a>
                            </div>
                          )}
                          <div className="mt-2">
                            <FileInput
                              onFileSelect={(file) =>
                                handleFileUpload(file, item.user.id)
                              }
                              label={
                                item.user.cvLattes?.length > 0
                                  ? "Quer atualizar o Lattes?"
                                  : "Enviar CV Lattes"
                              }
                              disabled={loading}
                              errorMessage={error}
                            />
                          </div>
                        </div>
                        {item.tipo === "orientador" &&
                          camposFormOrientador.length > 0 && (
                            <div className={styles.label}>
                              <h6>Preencha os campos abaixo</h6>
                              <div className={`${styles.campos} mt-2`}>
                                {camposFormOrientador?.map((campo, index) => (
                                  <Campo
                                    perfil="participante"
                                    readOnly={false}
                                    key={campo.id}
                                    schema={
                                      camposFormOrientador &&
                                      camposFormOrientador[index]
                                    }
                                    camposForm={camposFormOrientador}
                                    respostas={item?.respostas}
                                    tenantSlug={tenant}
                                    participacaoId={item?.id}
                                    onSuccess={handleCreateOrEditSuccess}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        {item.tipo === "coorientador" &&
                          camposFormCoorientador.length > 0 && (
                            <div className={styles.label}>
                              <h6>Preencha os campos abaixo</h6>
                              <div className={`${styles.campos} mt-2`}>
                                {camposFormCoorientador?.map((campo, index) => (
                                  <Campo
                                    perfil="participante"
                                    readOnly={false}
                                    key={campo.id}
                                    schema={
                                      camposFormOrientador &&
                                      camposFormOrientador[index]
                                    }
                                    camposForm={camposFormOrientador}
                                    respostas={item?.respostas}
                                    tenantSlug={tenant}
                                    participacaoId={item?.id}
                                    onSuccess={handleCreateOrEditSuccess}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        <div className={styles.excluirParticipacao}>
                          <Button
                            className={"btn-secondary"}
                            type="button"
                            disabled={deletingId === item.id}
                            icon={RiDeleteBinLine}
                            onClick={() => handleDeleteParticipacao(item.id)}
                          >
                            {deletingId === item.id ? (
                              <p>Excluindo...</p> // Mostra o loading apenas no item sendo deletado
                            ) : (
                              <p>Excluir participação</p>
                            )}
                          </Button>
                          {errorMessages[item.id] && ( // Exibe a mensagem de erro específica se existir
                            <div className={`${styles.errorMsg}`}>
                              <p>{errorMessages[item.id]}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                <div
                  className={styles.addItem}
                  onClick={() => openModalAndSetData(null)}
                >
                  <div className={styles.icon}>
                    <RiAddCircleLine />
                  </div>
                  <p>Add {activeStep}</p>
                </div>
              </>
            )}
            {activeStep === "projetos" && (
              <div className={styles.projetos}>
                {/* Conteúdo da seção Projetos */}
              </div>
            )}
            {activeStep === "planosDeTrabalho" && (
              <div className={styles.planosDeTrabalho}>
                {/* Conteúdo da seção Planos de Trabalho */}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FluxoInscricaoEdital;

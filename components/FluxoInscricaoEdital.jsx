"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./FluxoInscricaoEdital.module.scss";
import {
  RiAddCircleLine,
  RiAlertLine,
  RiArrowLeftCircleLine,
  RiArrowRightSLine,
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
import FormProjeto from "@/components/Formularios/FormProjeto";

import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import Modal from "@/components/Modal";
import { deleteParticipacao } from "@/app/api/client/participacao";
import Button from "./Button";
import NoData from "./NoData";
import { getProjetoById, getProjetosDoUsuario } from "@/app/api/client/projeto";
import Input from "./Input";

const FluxoInscricaoEdital = ({ tenant, inscricaoSelected }) => {
  // ESTADOS
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inscricao, setInscricao] = useState([]);
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);
  const [camposFormProjeto, setCamposFormProjeto] = useState([]);

  const [activeStep, setActiveStep] = useState("orientador"); // Estado para a etapa ativa
  const [errorDelete, setErrorDelete] = useState(null);
  const [errorMessages, setErrorMessages] = useState({});
  const [fileInputErrors, setFileInputErrors] = useState({}); // Estado para mensagens de erro por FileInput

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProjeto, setIsModalOpenProjeto] = useState(false);

  const [isModalOpenInativar, setIsModalOpenInativar] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itens, setItens] = useState([]);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // ID da participação sendo deletada
  const [modalView, setModalView] = useState("list"); // "list" | "view" | "create" | "edit"
  const [selectedProjeto, setSelectedProjeto] = useState(null); // Para o projeto selecionado
  const [meusProjetos, setMeusProjetos] = useState([]);
  const [projetoDetalhes, setProjetoDetalhes] = useState(null); // Detalhes do projeto no modo view
  const [activeTab, setActiveTab] = useState("conteudo");

  const fetchProjetosDoUsuario = async () => {
    try {
      setLoading(true); // Mostra o estado de carregamento
      const response = await getProjetosDoUsuario(tenant);

      // Ordena os projetos por ID decrescente
      const projetosOrdenados = response.sort((a, b) => b.id - a.id);

      setMeusProjetos(projetosOrdenados); // Atualiza os projetos no estado
    } catch (error) {
      console.error("Erro ao buscar projetos do usuário:", error);
    } finally {
      setLoading(false); // Remove o estado de carregamento
    }
  };
  useEffect(() => {
    if (isModalOpenProjeto) {
      fetchProjetosDoUsuario();
      setModalView("list");
      setSelectedProjeto(null);
    }
  }, [isModalOpenProjeto]);
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
        if (response.edital.formProjetoId) {
          const responseFormProjeto = await getFormulario(
            tenant,
            response.edital.formProjetoId
          );
          console.log(responseFormProjeto);
          setCamposFormProjeto(
            responseFormProjeto.campos.sort((a, b) => a.ordem - b.ordem)
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
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Nenhum arquivo selecionado.",
      }));
      return;
    }

    if (file.type !== "text/xml") {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Por favor, selecione um arquivo XML válido.",
      }));
      return;
    }

    setFileInputErrors((prev) => ({ ...prev, [userId]: "" })); // Limpa erros específicos
    setLoading(true); // Inicia o estado de carregamento
    try {
      const response = await xmlLattes(file, tenant, userId); // Chama a função para upload
      console.log("Upload concluído:", response);
      alert("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao enviar o arquivo.";
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: errorMessage,
      }));
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
    setIsModalOpenProjeto(false);
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

  const handleCreateOrEditProjetoSuccess = (projetoAtualizado) => {
    setMeusProjetos((prevProjetos) => {
      const index = prevProjetos.findIndex(
        (p) => p.id === projetoAtualizado.id
      );
      if (index !== -1) {
        // Atualizar projeto existente
        const novosProjetos = [...prevProjetos];
        novosProjetos[index] = projetoAtualizado;
        return novosProjetos.sort((a, b) => b.id - a.id);
      }
      // Adicionar novo projeto
      return [...prevProjetos, projetoAtualizado].sort((a, b) => b.id - a.id);
    });
    setModalView("list");
  };
  const fetchProjetoDetalhes = async (projetoId) => {
    try {
      setLoading(true);
      const detalhes = await getProjetoById(tenant, projetoId); // Chamada à API
      setProjetoDetalhes(detalhes); // Armazena os detalhes do projeto
    } catch (error) {
      console.error("Erro ao buscar detalhes do projeto:", error);
      setProjetoDetalhes(null); // Limpa os detalhes em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Quando o modo é "view" e há um projeto selecionado, busca os detalhes
  useEffect(() => {
    if (modalView === "view" && selectedProjeto) {
      fetchProjetoDetalhes(selectedProjeto.id);
    }
  }, [modalView, selectedProjeto]);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  const renderModalProjeto = () => (
    <Modal
      size={"large"}
      isOpen={isModalOpenProjeto}
      onClose={closeModalAndResetData}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>Projeto</h4>
      <div className="flex">
        {modalView !== "list" && (
          <Button
            className={`btn-secondary mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiArrowLeftCircleLine}
            onClick={() => {
              if (modalView === "edit") {
                setModalView("view");
              } else {
                setModalView("list");
                setSelectedProjeto(null);
                setProjetoDetalhes(null);
              }
            }}
          >
            {modalView === "edit" ? "Voltar para Visualização" : "Voltar"}
          </Button>
        )}
        {modalView === "view" && selectedProjeto && (
          <Button
            className={`btn-secondary ml-1 mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiEditLine}
            onClick={() => setModalView("edit")}
          >
            Editar
          </Button>
        )}
      </div>
      {modalView === "list" && (
        <>
          <Button
            className={`btn-secondary mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiAddCircleLine}
            onClick={() => setModalView("create")}
          >
            Novo Projeto
          </Button>
          <h6>Meus Projetos</h6>
          <div className={styles.projetos}>
            {meusProjetos.length > 0 ? (
              meusProjetos.map((projeto) => (
                <div
                  key={projeto.id}
                  onClick={() => {
                    setSelectedProjeto(projeto);
                    setModalView("view");
                  }}
                  className={styles.projeto}
                >
                  <h6>{projeto.titulo}</h6>
                  <div className={styles.actions}>
                    <div className={styles.action}>
                      <RiArrowRightSLine />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <NoData description="Não encontramos nenhum projeto. Crie um novo!" />
            )}
          </div>
        </>
      )}
      {modalView === "view" && projetoDetalhes && (
        <div className={styles.detalhesProjeto}>
          <h6>Detalhes do Projeto</h6>
          <div className={`${styles.card} ${styles.titulo} `}>
            <h6 className={`${styles.label} `}>
              Área: {projetoDetalhes.area.area}
            </h6>
            <div className={`${styles.value} `}>
              <p className="uppercase">
                <strong>{projetoDetalhes.titulo}</strong>
              </p>
              <form className={`${styles.formulario}`}>
                <div className={`${styles.input}`}></div>
              </form>
            </div>
          </div>
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
              <div className={`${styles.card} `}>
                <h6 className={`${styles.label} `}>Introdução</h6>
                <div className={`${styles.value} `}>
                  <p>{projetoDetalhes.introducao}</p>
                  <form className={`${styles.formulario}`}>
                    <div className={`${styles.input}`}></div>
                  </form>
                </div>
              </div>
              <div className={`${styles.card} `}>
                <h6 className={`${styles.label} `}>Justificativa</h6>
                <div className={`${styles.value} `}>
                  <p>{projetoDetalhes.justificativa}</p>
                  <form className={`${styles.formulario}`}>
                    <div className={`${styles.input}`}></div>
                  </form>
                </div>
              </div>
              <div className={`${styles.card} `}>
                <h6 className={`${styles.label} `}>Objetivos</h6>
                <div className={`${styles.value} `}>
                  <p>{projetoDetalhes.objetivos}</p>
                  <form className={`${styles.formulario}`}>
                    <div className={`${styles.input}`}></div>
                  </form>
                </div>
              </div>
              <div className={`${styles.card} `}>
                <h6 className={`${styles.label} `}>Revisão bibliográfica</h6>
                <div className={`${styles.value} `}>
                  <p>{projetoDetalhes.fundamentacao}</p>
                  <form className={`${styles.formulario}`}>
                    <div className={`${styles.input}`}></div>
                  </form>
                </div>
              </div>
              <div className={`${styles.card} `}>
                <h6 className={`${styles.label} `}>Metodologia</h6>
                <div className={`${styles.value} `}>
                  <p>{projetoDetalhes.metodologia}</p>
                  <form className={`${styles.formulario}`}>
                    <div className={`${styles.input}`}></div>
                  </form>
                </div>
              </div>
              <div className={`${styles.card} `}>
                <h6 className={`${styles.label} `}>Resultados</h6>
                <div className={`${styles.value} `}>
                  <p>{projetoDetalhes.resultados}</p>
                  <form className={`${styles.formulario}`}>
                    <div className={`${styles.input}`}></div>
                  </form>
                </div>
              </div>
              <div className={`${styles.card} `}>
                <h6 className={`${styles.label} `}>Referências</h6>
                <div className={`${styles.value} `}>
                  <p>{projetoDetalhes.referencias}</p>
                  <form className={`${styles.formulario}`}>
                    <div className={`${styles.input}`}></div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {activeTab === "cronograma" && (
            <div className={`${styles.cronograma}`}>
              {/* Campo: Nome da Atividade */}

              {/* Campos: Data de Início e Fim */}

              {/* Botão: Adicionar Atividade */}

              {/* Lista de Atividades */}
            </div>
          )}
          {activeTab === "anexos" && (
            <div className={`${styles.anexos}`}>
              {/* Campo de upload */}

              {/* Lista de anexos */}
            </div>
          )}
        </div>
      )}
      {modalView === "create" && (
        <FormProjeto
          tenantSlug={tenant}
          idInscricao={inscricaoSelected}
          onSuccess={handleCreateOrEditProjetoSuccess}
        />
      )}
      {modalView === "edit" && selectedProjeto && (
        <FormProjeto
          tenantSlug={tenant}
          idInscricao={inscricaoSelected}
          initialData={selectedProjeto}
          onSuccess={handleCreateOrEditProjetoSuccess}
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
      {renderModalProjeto()}
      <div className={styles.inscricao}>
        <div className={styles.header}>
          <h4>Formulário de Inscrição</h4>
          {/* INFORMAÇÕES */}
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
          {/* FLAG */}
          <div className={styles.pendente}>
            <RiAlertLine />
            <p>
              Preencha todos os campos para concluir sua inscrição e gerar o
              comprovante
            </p>
          </div>
          {/* ITENS DO MENU */}
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
          {/* CONTEUDO DINAMICO CORRESPONDENTE A CADA ITEM DO MENU */}
          <div>
            {/* ORIENTADORES */}
            {activeStep === "orientador" && (
              <>
                <div className={styles.orientadores}>
                  {inscricao.participacoes
                    ?.filter((item) => item?.tipo === "orientador")
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
                              errorMessage={fileInputErrors[item.user.id] || ""}
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
                        <div
                          className={styles.delete}
                          onClick={() => handleDeleteParticipacao(item.id)}
                        >
                          <RiDeleteBinLine />
                          {deletingId === item.id && <p>Excluindo...</p>}
                        </div>
                        <div className={styles.excluirParticipacao}>
                          {false && (
                            <Button
                              className={"btn-secondary"}
                              type="button"
                              disabled={deletingId === item.id}
                              icon={RiDeleteBinLine}
                              onClick={() => handleDeleteParticipacao(item.id)}
                            >
                              {deletingId === item.id
                                ? "Excluindo..." // Mostra o loading apenas no item sendo deletado
                                : "Excluir participação"}
                            </Button>
                          )}
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
            {/* COORIENTADORES */}
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
                              errorMessage={fileInputErrors[item.user.id] || ""}
                            />
                          </div>
                        </div>

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
                                      camposFormCoorientador &&
                                      camposFormCoorientador[index]
                                    }
                                    camposForm={camposFormCoorientador}
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
                          {false && (
                            <Button
                              className={"btn-secondary"}
                              type="button"
                              disabled={deletingId === item.id}
                              icon={RiDeleteBinLine}
                              onClick={() => handleDeleteParticipacao(item.id)}
                            >
                              {deletingId === item.id
                                ? "Excluindo..." // Mostra o loading apenas no item sendo deletado
                                : "Excluir participação"}
                            </Button>
                          )}
                          {errorMessages[item.id] && ( // Exibe a mensagem de erro específica se existir
                            <div className={`${styles.errorMsg}`}>
                              <p>{errorMessages[item.id]}</p>
                            </div>
                          )}
                        </div>
                        <div
                          className={styles.delete}
                          onClick={() => handleDeleteParticipacao(item.id)}
                        >
                          <RiDeleteBinLine />

                          {deletingId === item.id && <p>Excluindo...</p>}
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
            {/* PROJETOS */}
            {activeStep === "projetos" && (
              <>
                <div className={styles.projetos}>
                  {inscricao.InscricaoProjeto?.map((item) => (
                    <div key={item.id} className={styles.projeto}>
                      {/* FLAG */}
                      <div className={styles.pendente}>
                        <RiAlertLine />
                        <p>
                          Os projetos podem ser reutilizados em outras
                          inscrições, logo, as alterações feitas aqui em um
                          projeto impactam todas as outras inscrições que
                          utilizam este projeto. Caso queira um projeto
                          específico para esta inscrição, crie um novo.
                        </p>
                      </div>
                      <div className={styles.label}>
                        <h6 className="mt-2">Título do Projeto</h6>
                        <p>{item.projeto.titulo}</p>
                      </div>
                      <div className={styles.label}>
                        <h6>Área do Projeto</h6>
                        <p>{item.projeto.area.area}</p>
                      </div>
                      {camposFormProjeto.length > 0 && (
                        <div className={styles.label}>
                          <h6>Preencha os campos abaixo</h6>

                          <div className={`${styles.campos} mt-2`}>
                            {camposFormProjeto?.map((campo, index) => (
                              <Campo
                                perfil="participante"
                                readOnly={false}
                                key={campo.id}
                                schema={
                                  camposFormProjeto && camposFormProjeto[index]
                                }
                                camposForm={camposFormProjeto}
                                respostas={
                                  item?.projeto.respostas
                                    ? item?.projeto.respostas
                                    : []
                                }
                                tenantSlug={tenant}
                                projetoId={item?.projeto.id}
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
                          {deletingId === item.id
                            ? "Excluindo..." // Mostra o loading apenas no item sendo deletado
                            : "Excluir participação"}
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
                  onClick={() => setIsModalOpenProjeto(true)}
                >
                  <div className={styles.icon}>
                    <RiAddCircleLine />
                  </div>
                  <p>Add Projeto</p>
                </div>
              </>
            )}
            {/* PLANOS DE TRABALHO */}
            {activeStep === "planosDeTrabalho" && (
              <div className={styles.planosDeTrabalho}></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FluxoInscricaoEdital;

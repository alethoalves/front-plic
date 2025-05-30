"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./FluxoInscricaoEdital.module.scss";
import {
  RiAddCircleLine,
  RiAlertLine,
  RiArticleLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFolder5Line,
  RiLinkUnlink,
  RiSendPlaneLine,
  RiUserAddLine,
} from "@remixicon/react";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import Modal from "@/components/Modal";
import ProjetoController from "./projeto/ProjetoController";
import ParticipacaoController from "./participacao/ParticipacaoController";
import EditarParticipacao from "./participacao/EditarParticipacao";
import NoData from "./NoData";
import PlanoDeTrabalhoController from "./planoDeTrabalho/PlanoDeTrabalhoController";
import { unlinkProjetoFromInscricao } from "@/app/api/client/projeto";
import { deletePlanoDeTrabalho } from "@/app/api/client/planoDeTrabalho";
import Button from "./Button";
import VerInscricao from "./VerInscricao";
import { useRouter } from "next/navigation";

const FluxoInscricaoEdital = ({ tenant, inscricaoSelected }) => {
  // ESTADOS
  const [inscricao, setInscricao] = useState();
  const [activeStep, setActiveStep] = useState("orientador"); // Estado para a etapa ativa
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProjeto, setIsModalOpenProjeto] = useState(false);
  const [isModalOpenPlanoDeTrabalho, setIsModalOpenPlanoDeTrabalho] =
    useState(false);
  const [isModalOpenInscricao, setIsModalOpenInscricao] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);
  const [editalInfo, setEditalInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjetoId, setSelectedProjetoId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [planoDeTrabalhoSelected, setPlanoDeTrabalhoSelected] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const router = useRouter();

  const addProjetoVinculado = (projeto) => {
    setInscricao((prev) => ({
      ...prev,
      InscricaoProjeto: [
        ...prev.InscricaoProjeto,
        { id: projeto.id, projeto }, // Adiciona o novo projeto
      ],
    }));
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getInscricaoUserById(tenant, inscricaoSelected);
        setInscricao(response);
        setEditalInfo(response.edital);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, inscricaoSelected]);

  useEffect(() => {}, [inscricao]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setItemToEdit(data);
    setVerifiedData(data);
    setPlanoDeTrabalhoSelected(data);
    setErrors([]);
  };
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setVerifiedData(false);
    setDeleteModalOpen(false);
    setErrorDelete("");
    setIsModalOpenProjeto(false);
    setSelectedProjetoId(null);
    setIsModalOpenPlanoDeTrabalho(false);
    setPlanoDeTrabalhoSelected(null);
    setIsModalOpenInscricao(false);
  };
  const renderModalParticipacao = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <ParticipacaoController
        itemToEdit={itemToEdit} //é a participacao
        tenant={tenant}
        inscricaoSelected={inscricaoSelected} //é o id da inscrição
        setInscricao={setInscricao} //é a inscricao a ser atualizada
        closeModalAndResetData={closeModalAndResetData}
        planoDeTrabalhoDetalhes={planoDeTrabalhoSelected} //é objeto do plano de trabalho que deve ter o id do plano de trabalho
        tipoParticipacao={tipoParticipacao}
      />
    </Modal>
  );

  const openProjetoModal = (projetoId) => {
    setSelectedProjetoId(projetoId); // Define o ID do projeto
    setIsModalOpenProjeto(true); // Abre o modal
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
      <ProjetoController
        tenant={tenant}
        inscricaoSelected={inscricaoSelected}
        idProjeto={selectedProjetoId}
        closeModal={closeModalAndResetData}
        onProjetoVinculado={addProjetoVinculado} // Callback para atualizar a listagem
        editalFormularioId={editalInfo?.formProjetoId}
      />
    </Modal>
  );

  const renderModalPlanoDeTrabalho = () => (
    <Modal
      size={"large"}
      isOpen={isModalOpenPlanoDeTrabalho}
      onClose={closeModalAndResetData}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <PlanoDeTrabalhoController
        tenantSlug={tenant}
        idInscricao={inscricaoSelected}
        idProjeto={selectedProjetoId}
        onClose={closeModalAndResetData}
        planoDeTrabalhoDetalhes={planoDeTrabalhoSelected}
        onUpdatePlanoDeTrabalho={updatePlanoDeTrabalhoList}
        editalFormularioId={editalInfo?.formPlanoDeTrabalhoId}
      />
    </Modal>
  );
  const handleUnlinkProjeto = async (projetoId) => {
    // Remove o item da listagem localmente imediatamente
    const projetoRemovido = inscricao.InscricaoProjeto.find(
      (item) => item.projeto.id === projetoId
    );
    setInscricao((prev) => ({
      ...prev,
      InscricaoProjeto: prev.InscricaoProjeto.filter(
        (item) => item.projeto.id !== projetoId
      ),
    }));
    setErrorDelete(null);

    try {
      // Chamada para desvincular o projeto
      await unlinkProjetoFromInscricao(tenant, inscricaoSelected, projetoId);
    } catch (error) {
      console.error("Erro ao desvincular projeto:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao desvincular o projeto.";
      setErrorDelete(errorMessage);

      // Reverte a remoção local caso a API falhe
      setInscricao((prev) => ({
        ...prev,
        InscricaoProjeto: [...prev.InscricaoProjeto, projetoRemovido],
      }));
    }
  };

  const handleDeletePlanoDeTrabalho = async (planoId) => {
    // Remove o item da listagem localmente imediatamente
    const planoRemovido = inscricao.planosDeTrabalho.find(
      (item) => item.id === planoId
    );
    setInscricao((prev) => ({
      ...prev,
      planosDeTrabalho: prev.planosDeTrabalho.filter(
        (item) => item.id !== planoId
      ),
    }));
    setErrorDelete(null);

    try {
      // Chamada para excluir o plano de trabalho
      await deletePlanoDeTrabalho(tenant, inscricaoSelected, planoId);
    } catch (error) {
      console.error("Erro ao excluir Plano de Trabalho:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao excluir o Plano de Trabalho.";
      setErrorDelete(errorMessage);

      // Reverte a remoção local caso a API falhe
      setInscricao((prev) => ({
        ...prev,
        planosDeTrabalho: [...prev.planosDeTrabalho, planoRemovido],
      }));
    }
  };
  const updatePlanoDeTrabalhoList = (updatedPlano) => {
    setInscricao((prev) => {
      const existingPlanoIndex = prev.planosDeTrabalho.findIndex(
        (item) => item.id === updatedPlano.id
      );

      let updatedPlanosDeTrabalho;
      if (existingPlanoIndex !== -1) {
        // Atualiza o plano existente
        updatedPlanosDeTrabalho = [...prev.planosDeTrabalho];
        updatedPlanosDeTrabalho[existingPlanoIndex] = updatedPlano;
      } else {
        // Adiciona um novo plano
        updatedPlanosDeTrabalho = [...prev.planosDeTrabalho, updatedPlano];
      }

      return {
        ...prev,
        planosDeTrabalho: updatedPlanosDeTrabalho,
      };
    });
  };
  const renderModalInscricao = () => (
    <Modal
      size={"large"}
      isOpen={isModalOpenInscricao}
      onClose={closeModalAndResetData}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <VerInscricao
        inscricaoSelected={inscricaoSelected}
        tenant={tenant}
        setErrors={setErrors}
        onClose={closeModalAndResetData}
      />
    </Modal>
  );
  return (
    <>
      {renderModalParticipacao()}
      {renderModalProjeto()}
      {renderModalPlanoDeTrabalho()}
      {renderModalInscricao()}
      {loading && <p>Carregando...</p>}
      {!loading && inscricao && (
        <div className={styles.inscricao}>
          {notFound && <NoData description="Inscrição não encontrada :/" />}
          {!notFound && (
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
                    Ao fazer a inscrição neste edital, você concorda com os
                    termos estabelecidos no edital.
                  </strong>
                </p>
              </div>
              {/* FLAG */}
              {errors.map((error, index) => (
                <div key={index} className={`${styles.pendente} mb-1`}>
                  <RiAlertLine />
                  <p>{error}</p>
                </div>
              ))}
              <div>
                <Button
                  className={"btn-primary "}
                  type="button"
                  disabled={submitting}
                  icon={RiSendPlaneLine}
                  onClick={() => setIsModalOpenInscricao(true)}
                >
                  {submitting
                    ? "Enviando..." // Mostra o loading apenas no item sendo deletado
                    : "Finalizar e enviar inscrição"}
                </Button>
              </div>
              {/* ITENS DO MENU */}
              <div className={styles.stepsMenu}>
                <div
                  className={`${styles.stepItemMenu} ${
                    activeStep === "orientador" ? styles.selected : ""
                  }`}
                  onClick={() => setActiveStep("orientador")}
                >
                  {false && (
                    <div className={`${styles.icon} ${styles.statusWarning}`}>
                      <RiAlertLine />
                    </div>
                  )}
                  <p>Orientador</p>
                </div>
                {false && (
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
                )}
                <div
                  className={`${styles.stepItemMenu} ${
                    activeStep === "projetos" ? styles.selected : ""
                  }`}
                  onClick={() => setActiveStep("projetos")}
                >
                  {false && (
                    <div className={`${styles.icon} ${styles.statusWarning}`}>
                      <RiAlertLine />
                    </div>
                  )}
                  <p>Projetos</p>
                </div>
                {false && (
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
                )}
              </div>
              {/* CONTEUDO DINAMICO CORRESPONDENTE A CADA ITEM DO MENU */}
              <div>
                {/* ORIENTADORES */}
                {activeStep === "orientador" && (
                  <>
                    <div className={styles.lista}>
                      {inscricao.participacoes
                        ?.filter((item) => item?.tipo === "orientador")
                        .sort((a, b) => a.id - b.id)
                        .map((item) => (
                          <div
                            onClick={() => {
                              openModalAndSetData(item);
                              setTipoParticipacao("orientador");
                            }}
                            className={styles.itemLista}
                            key={item.id}
                          >
                            <div className={styles.infoLista}>
                              <div
                                className={`${styles.status} ${
                                  item.status === "incompleto"
                                    ? styles.pendente
                                    : styles.completo
                                }`}
                              >
                                {item.status === "incompleto" && (
                                  <RiAlertLine />
                                )}
                                {item.status === "completo" && (
                                  <RiCheckboxCircleLine />
                                )}
                                {item.status === "incompleto" && (
                                  <p>{item.status}</p>
                                )}
                              </div>
                              <div>
                                <h6>Orientador</h6>
                                <p>{item.user.nome.toUpperCase()}</p>
                              </div>
                            </div>

                            <div className={styles.actions}>
                              <div className={styles.action}>
                                <RiEyeLine />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {inscricao.participacoes?.filter(
                      (item) => item?.tipo === "orientador"
                    ).lenght === 0 && (
                      <div
                        className={styles.addItem}
                        onClick={() => {
                          setTipoParticipacao("orientador");
                          openModalAndSetData(null);
                        }}
                      >
                        <div className={styles.icon}>
                          <RiUserAddLine />
                        </div>
                        <p>Add orientador</p>
                      </div>
                    )}
                  </>
                )}
                {/* COORIENTADORES */}
                {false && activeStep === "coorientador" && (
                  <>
                    <div className={styles.orientadores}>
                      {inscricao.participacoes
                        ?.filter((item) => item.tipo === "coorientador")
                        .map((item) => (
                          <div key={item.id}>
                            <EditarParticipacao
                              participacaoInfo={item}
                              tenant={tenant}
                              inscricaoSelected={inscricaoSelected}
                              setInscricao={setInscricao}
                              editalInfo={editalInfo}
                            />
                          </div>
                        ))}
                    </div>
                    <div
                      className={styles.addItem}
                      onClick={() => {
                        setTipoParticipacao("coorientador");
                        openModalAndSetData(null);
                      }}
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
                      {inscricao.InscricaoProjeto?.map((item) => {
                        return (
                          <div key={item.id} className={styles.card}>
                            <div className={styles.label}>
                              <div>
                                <h6>Projeto:</h6>
                                <p>{item.projeto.titulo}</p>
                              </div>
                              <div className={styles.actions}>
                                <div
                                  className={styles.action}
                                  onClick={() =>
                                    openProjetoModal(item.projeto.id)
                                  }
                                >
                                  <RiEyeLine />
                                  <p>Ver Projeto</p>
                                </div>
                                {inscricao.planosDeTrabalho?.filter(
                                  (i) =>
                                    i.projetoId === item.projetoId ||
                                    i.projetoId === item.id
                                ).length === 0 && (
                                  <div
                                    className={styles.action}
                                    onClick={() =>
                                      handleUnlinkProjeto(item.projeto.id)
                                    }
                                  >
                                    <RiLinkUnlink />
                                    <p>Desvincular</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Renderizar Planos de Trabalho Vinculados */}
                            {inscricao.planosDeTrabalho
                              ?.filter(
                                (i) =>
                                  i.projetoId === item.projetoId ||
                                  i.projetoId === item.id
                              )
                              .sort((a, b) => a.id - b.id)
                              .map((element) => (
                                <div key={element.id} className={styles.card}>
                                  <div className={styles.label}>
                                    <div>
                                      <h6>Plano de Trabalho:</h6>
                                      <p>{element.titulo}</p>
                                    </div>
                                    <div className={styles.actions}>
                                      <div
                                        className={styles.action}
                                        onClick={() => {
                                          setSelectedProjetoId(item.projeto.id);
                                          setPlanoDeTrabalhoSelected(element);
                                          setIsModalOpenPlanoDeTrabalho(true);
                                        }}
                                      >
                                        <RiEyeLine />
                                        <p>Ver Plano</p>
                                      </div>
                                      {inscricao.participacoes?.filter(
                                        (item) =>
                                          item?.tipo === "aluno" &&
                                          item?.planoDeTrabalhoId === element.id
                                      ).length === 0 && (
                                        <div
                                          className={styles.action}
                                          onClick={() =>
                                            handleDeletePlanoDeTrabalho(
                                              element.id
                                            )
                                          }
                                        >
                                          <RiDeleteBinLine />
                                          <p>Excluir</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <>
                                    <div className={styles.lista}>
                                      {inscricao.participacoes
                                        ?.filter(
                                          (item) =>
                                            item?.tipo === "aluno" &&
                                            item?.planoDeTrabalhoId ===
                                              element.id
                                        )
                                        .sort((a, b) => a.id - b.id)
                                        .map((item) => (
                                          <div
                                            onClick={() => {
                                              openModalAndSetData(item);
                                              setTipoParticipacao("aluno");
                                            }}
                                            className={styles.itemLista}
                                            key={item.id}
                                          >
                                            <div className={styles.infoLista}>
                                              <div
                                                className={`${styles.status} ${
                                                  item.status === "incompleto"
                                                    ? styles.pendente
                                                    : styles.completo
                                                }`}
                                              >
                                                {item.status ===
                                                  "incompleto" && (
                                                  <RiAlertLine />
                                                )}
                                                {item.status === "completo" && (
                                                  <RiCheckboxCircleLine />
                                                )}
                                                {item.status ===
                                                  "incompleto" && (
                                                  <p>{item.status}</p>
                                                )}
                                              </div>
                                              <div>
                                                <h6>Aluno</h6>
                                                <p>
                                                  {item.user.nome.toUpperCase()}
                                                </p>
                                              </div>
                                            </div>

                                            <div className={styles.actions}>
                                              <div className={styles.action}>
                                                <RiEyeLine />
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>

                                    {inscricao.participacoes?.filter(
                                      (item) =>
                                        item?.tipo === "aluno" &&
                                        item?.planoDeTrabalhoId === element.id
                                    ).length <
                                      inscricao.edital.maxAlunosPorPlano && (
                                      <div
                                        className={styles.addItem}
                                        onClick={() => {
                                          setTipoParticipacao("aluno");
                                          openModalAndSetData(null);
                                          setPlanoDeTrabalhoSelected(element);
                                        }}
                                      >
                                        <div className={styles.icon}>
                                          <RiUserAddLine />
                                        </div>
                                        <p>Add aluno</p>
                                      </div>
                                    )}
                                  </>
                                </div>
                              ))}

                            {inscricao.planosDeTrabalho.length <
                              editalInfo.maxPlanos && (
                              <div
                                className={styles.addItem}
                                onClick={() => {
                                  setPlanoDeTrabalhoSelected(null);
                                  setSelectedProjetoId(item.projeto.id);
                                  setIsModalOpenPlanoDeTrabalho(true);
                                }}
                              >
                                <div className={styles.icon}>
                                  <RiArticleLine />
                                </div>
                                <p>Add Plano de Trabalho</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {inscricao.planosDeTrabalho.length <
                      editalInfo.maxPlanos && (
                      <div
                        className={styles.addItem}
                        onClick={() => setIsModalOpenProjeto(true)}
                      >
                        <div className={styles.icon}>
                          <RiFolder5Line />
                        </div>
                        <p>Add Projeto</p>
                      </div>
                    )}
                  </>
                )}
                {/* PLANOS DE TRABALHO */}
                {false && activeStep === "planosDeTrabalho" && (
                  <div className={styles.planosDeTrabalho}></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FluxoInscricaoEdital;

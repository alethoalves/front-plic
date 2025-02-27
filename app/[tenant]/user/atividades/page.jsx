"use client";
import {
  RiAlertLine,
  RiCalendarEventFill,
  RiCheckDoubleLine,
  RiDraftLine,
  RiEditLine,
  RiFolder2Line,
  RiFoldersLine,
  RiGroupLine,
  RiMenuLine,
  RiUser2Line,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import {
  getRegistroAtividadesByCPF,
  getRegistroAtividadesByCpfEditaisVigentes,
  updateRegistroAtividade,
} from "@/app/api/client/registroAtividade";
import Campo from "@/components/Campo";
import { startSubmission } from "@/app/api/client/resposta";
import FormArea from "@/components/Formularios/FormArea";
import NoData from "@/components/NoData";

const Page = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorToGetCamposForm, setErrorToGetCamposForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [camposForm, setCamposForm] = useState([]);
  const [
    registroAtividadesEditaisVigentes,
    setRegistrosAtividadesEditaisVigentes,
  ] = useState(null);
  const [code, setCode] = useState(null);
  const [tela, setTela] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getRegistroAtividadesByCpfEditaisVigentes(
          params.tenant
        );
        setRegistrosAtividadesEditaisVigentes(
          response.sort(
            (a, b) =>
              new Date(a.atividade.dataInicio) -
              new Date(b.atividade.dataInicio)
          )
        );
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, isModalOpen]);

  // Atualização do item e status após criar ou editar
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const response = await getRegistroAtividadesByCpfEditaisVigentes(
        params.tenant
      );

      const itens = response.filter(
        (item) => item.planoDeTrabalho.inscricao.edital.vigente === true
      );

      const updatedItem = itens.find((item) => item.id === itemToEdit?.id);

      setItemToEdit(updatedItem); // Atualiza o item

      if (updatedItem) {
        await checkFormStatus(
          updatedItem.atividade.formulario.campos,
          updatedItem.respostas
        );
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  }, [params.tenant, itemToEdit?.id]);

  // Observa mudanças no itemToEdit e verifica o status do formulário
  useEffect(() => {
    if (itemToEdit) {
      checkFormStatus(
        itemToEdit.atividade.formulario.campos,
        itemToEdit.respostas
      );
    }
  }, [itemToEdit]);

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setCamposForm([]);
    setTela(0);
  };

  const formatarData = (dataIso) => {
    const data = new Date(dataIso);
    const dia = data.getUTCDate().toString().padStart(2, "0");
    const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
    const ano = data.getUTCFullYear().toString();
    return `${dia}/${mes}/${ano}`;
  };

  const renderModalContent = () => {
    return (
      <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
        {code === 1 && (
          <>
            <h5>
              {`${itemToEdit?.planoDeTrabalho?.area ? "Altere" : "Informe"}`} a
              área do plano de trabalho
            </h5>
            <p>
              Identificamos que o cadastro do plano de trabalho está sem a
              indicação da área de conhecimento.
            </p>
            <FormArea
              perfil="aluno"
              tenantSlug={params.tenant}
              initialData={itemToEdit?.planoDeTrabalho}
              idInscricao={itemToEdit?.id}
              onClose={() => {
                setIsModalOpen(false);
                setCode(null);
              }}
              onSuccess={async () => {
                await handleCreateOrEditSuccess();
                setCode(2);
              }}
            />
          </>
        )}
        {code === 2 && !camposForm && (
          <>
            <div className={`${styles.icon} ${styles.iconAlert} mb-2`}>
              <RiAlertLine />
            </div>
            <h4>Ops :/ {code}</h4>
            <div className={`notification notification-error`}>
              <p className="p5">{errorToGetCamposForm}</p>
            </div>
          </>
        )}
        {code === 2 && camposForm && (
          <>
            <h4>{itemToEdit?.atividade?.titulo}</h4>
            <div className={styles.notification}>
              <h6
                className={`${
                  itemToEdit?.status === "naoEntregue"
                    ? styles.error
                    : styles.success
                } mb-2`}
              >{`${
                itemToEdit?.status === "naoEntregue"
                  ? "Atividade não entregue! Preecha os campos e salve-os."
                  : "Atividade entregue!"
              }`}</h6>
            </div>
            <p>
              Preencha cada campo e salve, ao finalizar, feche este modal e
              verifique o status da atividade!
            </p>
            <div className={`${styles.campos} mt-2`}>
              {camposForm?.map((item, index) => (
                // Exibe o campo somente se tela for igual ao índice
                // tela === index &&
                <Campo
                  perfil="participante"
                  readOnly={false}
                  key={item.id}
                  schema={camposForm && camposForm[index]}
                  camposForm={camposForm}
                  respostas={itemToEdit?.respostas}
                  tenantSlug={params.tenant}
                  registroAtividadeId={itemToEdit?.id}
                  onClose={closeModalAndResetData}
                  onSuccess={handleCreateOrEditSuccess}
                  setLoading={setLoading}
                />
              ))}
            </div>

            <div className={styles.notification}>
              <h6
                className={`${
                  itemToEdit?.status === "naoEntregue"
                    ? styles.error
                    : styles.success
                }`}
              >{`${
                itemToEdit?.status === "naoEntregue"
                  ? "Atividade não entregue! Preecha os campos e salve-os."
                  : "Atividade entregue!"
              }`}</h6>
            </div>

            {false && (
              <div className={styles.actionsTable}>
                {tela != 0 && (
                  <button
                    className="button btn-secondary"
                    onClick={() => setTela((prev) => Math.max(prev - 1, 0))}
                    disabled={tela === 0}
                  >
                    Anterior
                  </button>
                )}
                {tela != camposForm.length - 1 && (
                  <button
                    className="button btn-secondary"
                    onClick={() =>
                      setTela((prev) =>
                        Math.min(prev + 1, camposForm.length - 1)
                      )
                    }
                    disabled={tela === camposForm.length - 1}
                  >
                    Próximo
                  </button>
                )}
              </div>
            )}
            {itemToEdit?.status === "concluido" && (
              <Button
                className={"mt-3 btn-secondary"}
                type="button"
                disabled={loading}
                onClick={() => {
                  setCode(3);
                }}
              >
                Sair da edição
              </Button>
            )}
          </>
        )}

        {code === 3 && (
          <div className={styles.menu}>
            <h5>Resposta:</h5>
            <div className={`${styles.campos} mt-2 mb-2`}>
              {camposForm?.map((item, index) => (
                <Campo
                  perfil="participante"
                  readOnly={true}
                  key={item.id}
                  schema={camposForm && camposForm[index]}
                  camposForm={camposForm}
                  respostas={itemToEdit?.respostas}
                  tenantSlug={params.tenant}
                  registroAtividadeId={itemToEdit?.id}
                  onClose={closeModalAndResetData}
                  onSuccess={handleCreateOrEditSuccess}
                  setLoading={setLoading}
                />
              ))}
            </div>
            <Button
              className="btn-secondary"
              icon={RiEditLine}
              type="button"
              disabled={loading}
              onClick={() => {
                setCode(2);
              }}
            >
              Editar atividade
            </Button>

            {false && (
              <Button
                className="btn-secondary"
                icon={RiFolder2Line}
                type="button"
                disabled={loading}
                onClick={() => {
                  setCode(2);
                }}
              >
                Ver Plano de Trabalho
              </Button>
            )}
          </div>
        )}
      </Modal>
    );
  };

  const openModalAndSetData = async (data) => {
    setItemToEdit(data);

    const response = await startSubmission(data.id);
    if (response?.response?.status === "concluido") {
      setCode(3);
    } else {
      setCode(response.code);
    }

    setItemToEdit(data);
    setCamposForm(
      data.atividade.formulario.campos.sort((a, b) => a.ordem - b.ordem)
    );
    setIsModalOpen(true);
  };

  const getFormWithRespostas = async (campos, respostas) => {
    try {
      const formWithRespostas = campos.map((campo) => {
        const resposta = respostas.find((res) => res.campoId === campo.id);
        return {
          campoId: campo.id,
          obrigatorio: campo.obrigatorio,
          value: resposta ? resposta.value : "",
        };
      });

      const isComplete = formWithRespostas
        .filter((item) => item.obrigatorio)
        .every((item) => item.value.trim() !== "");

      return {
        status: isComplete ? "completo" : "incompleto",
        data: formWithRespostas,
      };
    } catch (error) {
      console.error("Erro ao buscar campos e respostas:", error);
      return {
        status: "incompleto",
        data: [],
      };
    }
  };

  const checkFormStatus = async (campos, respostas) => {
    const result = await getFormWithRespostas(campos, respostas);
    if (result.status === "completo") {
      handleFormComplete();
    }
  };

  const handleFormComplete = useCallback(async () => {
    try {
      await updateRegistroAtividade(
        params.tenant,
        itemToEdit.atividadeId,
        itemToEdit.id,
        { status: "concluido" }
      );
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
    }
  }, [params.tenant, itemToEdit?.atividadeId, itemToEdit?.id]);

  return (
    <>
      {renderModalContent()}
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h4>Cronograma de atividades:</h4>
            <p className="mt-1">
              As atividades abaixo são obrigatórias para conclusão do programa
              de iniciação científica.
            </p>
          </div>
          {registroAtividadesEditaisVigentes?.length > 0 ? (
            <>
              <div className={styles.mainContent}>
                <div className={styles.tela1}>
                  {registroAtividadesEditaisVigentes?.map((registro) => (
                    <div
                      key={registro.id}
                      className={styles.boxButton}
                      onClick={async () => {
                        await openModalAndSetData(registro);
                      }}
                    >
                      <div className={styles.labelWithIcon}>
                        <RiCheckDoubleLine />
                        <div className={styles.label}>
                          <p>
                            <RiCheckDoubleLine />
                            Status da atividade:
                          </p>
                          <div className={styles.description}>
                            <div
                              className={`${styles.status} ${
                                registro.status === "naoEntregue" &&
                                styles.error
                              } ${
                                registro.status === "concluido" &&
                                styles.success
                              }`}
                            >
                              <p>
                                {registro.status === "naoEntregue" &&
                                  "Não entregue"}
                                {registro.status === "concluido" && "Entregue"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={styles.labelWithIcon}>
                        <RiDraftLine />
                        <div className={styles.label}>
                          <p>
                            <RiDraftLine />
                            Nome da atividade:
                          </p>
                          <div className={styles.description}>
                            <p className={styles.destaque}>
                              {registro.atividade.titulo}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className={styles.labelWithIcon}>
                        <RiCalendarEventFill />
                        <div className={styles.label}>
                          <p>
                            <RiCalendarEventFill />
                            Período para entrega:
                          </p>
                          <div className={styles.description}>
                            <p>
                              {formatarData(registro.atividade.dataInicio)} a{" "}
                              {formatarData(registro.atividade.dataFinal)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={styles.labelWithIcon}>
                        <RiFoldersLine />
                        <div className={styles.label}>
                          <p>
                            <RiFoldersLine />
                            Atividade referente ao plano de trabalho:
                          </p>
                          <div className={styles.description}>
                            <p>{registro.planoDeTrabalho.titulo}</p>
                          </div>
                        </div>
                      </div>
                      <div className={styles.labelWithIcon}>
                        <RiUser2Line />
                        <div className={styles.label}>
                          <p>
                            <RiUser2Line />
                            Orientador(es):
                          </p>
                          <div className={styles.description}>
                            {registro.planoDeTrabalho.inscricao.participacoes
                              .filter(
                                (item) =>
                                  item.tipo === "orientador" ||
                                  item.tipo === "coorientador"
                              )
                              .map((item, index) => (
                                <p className={styles.person} key={index}>
                                  {item.user.nome} ({item.status})
                                </p>
                              ))}
                          </div>
                        </div>
                      </div>
                      <div className={styles.labelWithIcon}>
                        <RiGroupLine />
                        <div className={styles.label}>
                          <p>
                            <RiGroupLine />
                            Aluno(s):
                          </p>
                          <div className={styles.description}>
                            {registro.planoDeTrabalho.participacoes.map(
                              (item, index) => (
                                <p className={styles.person} key={index}>
                                  {item.user.nome} ({item.status})
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <NoData description="Não há atividades cadastradas para o seu perfil nesta instituição." />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;

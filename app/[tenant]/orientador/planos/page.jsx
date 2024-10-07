"use client";
import {
  RiAlertLine,
  RiCheckDoubleLine,
  RiEditLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFoldersLine,
  RiInformationLine,
  RiSave2Line,
} from "@remixicon/react";
import styles from "./page.module.scss";
import { useCallback, useEffect, useState } from "react";
import { getInscricao } from "@/app/api/client/inscricao";
import Table from "@/components/Table";
import { useRouter } from "next/navigation";
import Item from "@/components/Item";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import {
  getRegistroAtividadesOrientador,
  updateRegistroAtividade,
} from "@/app/api/client/registroAtividade";
import Campo from "@/components/Campo";
import { getCampos } from "@/app/api/client/campo";

const Page = ({ params }) => {
  // Estados para gerenciamento do componente
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggleBox, setToggleBox] = useState(true);
  const [errorToGetCamposForm, setErrorToGetCamposForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [flatItens, setFlatItens] = useState([]); // Novo estado para flatItens
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [idFormAtividade, setIdFormAtividade] = useState(null);
  const [camposForm, setCamposForm] = useState([]);
  const [formStatus, setFormStatus] = useState(null);
  const [apiError, setApiError] = useState(null);
  // ROTEAMENTO
  const router = useRouter();
  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const itens = await getRegistroAtividadesOrientador(params.tenant);
        setItens(itens);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);
  // Função para buscar os campos do formulário
  const handleGetCamposForm = useCallback(
    async (idFormAtividade) => {
      try {
        const data = await getCampos(params.tenant, idFormAtividade);
        setCamposForm(data);
      } catch (error) {
        setErrorToGetCamposForm("Formulário vazio!");
        console.error("Erro ao buscar editais:", error);
      }
    },
    [params.tenant]
  );
  // Função para atualizar os itens após criar ou editar
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const itens = await getRegistroAtividadesOrientador(params.tenant);
      setItens(itens);
      console.log("ITENS");
      console.log(itens);
      console.log("ITENS TO EDIT BEFORE");
      console.log(itemToEdit);

      const updatedItemToEdit = itens
        .flatMap(
          (item) =>
            item.planosDeTrabalho?.flatMap(
              (plano) => plano.registroAtividades
            ) || []
        ) // Combina todos os arrays de registroAtividades de todos os itens
        .find((registro) => registro.id === itemToEdit.id);
      console.log("item to edit");
      console.log();

      setItemToEdit(updatedItemToEdit);
    } catch (error) {
      console.error("Erro:", error);
    }
  }, [params.tenant, itemToEdit?.id, itemToEdit]); //ALTEREI AQUI
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setCamposForm([]);
    setFormStatus(null);
    setApiError(null);
  };

  const formatarData = (dataIso) => {
    const meses = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];

    const data = new Date(dataIso);
    const dia = data.getUTCDate();
    const mes = meses[data.getUTCMonth()];
    const ano = data.getUTCFullYear().toString().slice(-2);

    return `${dia} de ${mes} de ${ano}`;
  };
  // Renderiza o conteúdo do modal
  const renderModalContent = () => {
    return (
      <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
        {errorToGetCamposForm ? (
          <>
            <div className={`${styles.icon} ${styles.iconAlert} mb-2`}>
              <RiAlertLine />
            </div>
            <h4>Ops :/</h4>
            <div className={`notification notification-error`}>
              <p className="p5">{errorToGetCamposForm}</p>
            </div>
          </>
        ) : (
          <>
            <div className={`${styles.icon} mb-2`}>
              <RiEditLine />
            </div>
            <h4>{itemToEdit?.atividade?.titulo}</h4>
            <p>{itemToEdit?.atividade?.descricao}</p>
            <div className={styles.campos}>
              {camposForm?.map((item, index) => (
                <Campo
                  key={item.id}
                  schema={camposForm && camposForm[index]}
                  camposForm={camposForm}
                  respostas={itemToEdit?.respostas}
                  tenantSlug={params.tenant}
                  registroAtividadeId={itemToEdit?.id}
                  onClose={closeModalAndResetData}
                  onSuccess={handleCreateOrEditSuccess}
                />
              ))}
            </div>
            {itemToEdit?.status === "naoEntregue" && (
              <Button
                className="btn-primary mt-4"
                onClick={() => checkFormStatus(itemToEdit)}
              >
                Finalizar e enviar
              </Button>
            )}

            {formStatus === "incompleto" && (
              <div className={`notification notification-error mt-2`}>
                <p className="p5">Existem campos não preenchidos</p>
              </div>
            )}
            {apiError && (
              <div className={`notification notification-error mt-2`}>
                <p className="p5">{apiError}</p>
              </div>
            )}
          </>
        )}
      </Modal>
    );
  };

  const openModalAndSetData = async (data) => {
    console.log(data);
    setItemToEdit(data);
    setIsModalOpen(true);
    setIdFormAtividade(data.atividade.formularioId);
    await handleGetCamposForm(data.atividade.formularioId);
  };

  // Obtém o formulário com as respostas preenchidas
  const getFormWithRespostas = async (idFormAtividade) => {
    try {
      const campos = await getCampos(params.tenant, idFormAtividade);
      console.log(itemToEdit);
      const respostas = itemToEdit?.respostas || [];

      // Mapeia os campos e associa as respostas
      const formWithRespostas = campos.map((campo) => {
        const resposta = respostas.find((res) => res.campoId === campo.id);
        return {
          campoId: campo.id,
          obrigatorio: campo.obrigatorio, // Incluímos o campo obrigatorio para referência
          value: resposta ? resposta.value : "",
        };
      });

      // Filtra os campos obrigatórios e verifica se estão preenchidos
      const isComplete = formWithRespostas
        .filter((item) => item.obrigatorio) // Desconsidera campos não obrigatórios
        .every((item) => item.value.trim() !== "");

      return {
        status: isComplete ? "completo" : "incompleto",
        data: formWithRespostas,
      };
    } catch (error) {
      console.error("Erro ao buscar campos e respostas:", error);
      setApiError("Erro ao buscar campos e respostas.");
      return {
        status: "incompleto",
        data: [],
      };
    }
  };

  // Verifica o status do formulário
  const checkFormStatus = async () => {
    const result = await getFormWithRespostas(idFormAtividade);
    console.log(idFormAtividade);
    setFormStatus(result.status);
    if (result.status === "completo") {
      handleFormComplete();
    }
  };

  // Função chamada quando o formulário está completo
  const handleFormComplete = useCallback(async () => {
    try {
      console.log("OLHA AQUI");
      console.log(itemToEdit);
      await updateRegistroAtividade(
        params.tenant,
        itemToEdit.atividadeId,
        itemToEdit.id,
        { status: "concluido" }
      );
      await handleCreateOrEditSuccess();
      closeModalAndResetData();
    } catch (error) {
      setApiError("Erro ao atualizar o registro de atividade.");
    }
  }, [
    params.tenant,
    itemToEdit?.atividadeId,
    itemToEdit?.id,
    itemToEdit?.formulario?.onSubmitStatus,
    handleCreateOrEditSuccess,
    itemToEdit, //ALTEREI AQUI
  ]);
  return (
    <>
      {renderModalContent()}
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiFoldersLine />
            </div>
            <div className={styles.div}>
              <h5>Planos de Trabalho</h5>
              <div
                className={styles.toogle}
                onClick={() => {
                  setToggleBox(!toggleBox);
                }}
              >
                {!toggleBox && (
                  <>
                    <p>Ver mais</p>
                    <RiEyeOffLine />
                  </>
                )}
                {toggleBox && (
                  <>
                    <p>Ver menos</p> <RiEyeLine />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={styles.mainContent}>
            {itens?.map((inscricao) => {
              const editalTitulo = inscricao?.edital?.titulo;
              const orientadores = inscricao?.participacoes
                ?.filter(
                  (item) =>
                    item.tipo === "orientador" || item.tipo === "coorientador"
                )
                .sort((a, b) => a.status.localeCompare(b.status));

              return inscricao?.planosDeTrabalho.map((plano) => {
                const grandeArea = plano?.area?.grandeArea?.grandeArea;
                const area = plano?.area?.area;
                const alunos = plano?.participacoes
                  ?.filter((item) => item.tipo === "aluno")
                  .sort((a, b) => a.status.localeCompare(b.status));
                const registroAtividades = plano?.registroAtividades;
                return (
                  <div key={plano.id} className={`${styles.box}`}>
                    <h6>Título:</h6>
                    <div
                      className={`${styles.innerBox} ${styles.innerBoxGray}`}
                    >
                      <p>{plano.titulo}</p>
                      <div className={styles.menuActions}>
                        <div className={styles.circle}></div>
                        <div className={styles.circle}></div>
                        <div className={styles.circle}></div>
                      </div>
                    </div>
                    <div className={styles.flags}>
                      <div className={styles.flag}>
                        <p>{editalTitulo}</p>
                      </div>
                      {grandeArea && (
                        <div className={styles.flag}>
                          <p>{grandeArea}</p>
                        </div>
                      )}
                      {area && (
                        <div className={styles.flag}>
                          <p>{area}</p>
                        </div>
                      )}
                    </div>
                    {false && (
                      <Modal
                        isOpen={isModalOpen}
                        onClose={closeModalAndResetData}
                      >
                        <div className={`${styles.icon} mb-2`}>
                          <RiEditLine />
                        </div>
                        <h4>Escolha uma opção:</h4>
                        <div className={`${styles.menuItens}`}>
                          <div className={`${styles.menuItem}`}>
                            <p>Solicitar alteração do Título</p>
                            <p>Solicitar alteração do Título2</p>
                          </div>
                        </div>
                      </Modal>
                    )}
                    {toggleBox && (
                      <>
                        <h6>Orientadores:</h6>
                        <div className={styles.participacoes}>
                          {orientadores.map((orientador) => (
                            <div
                              key={orientador.id}
                              className={`${styles.innerBox} ${
                                styles.innerBoxWhite
                              } ${
                                orientador.status === "inativo" &&
                                styles.statusInativo
                              }`}
                            >
                              <p>
                                {orientador.user.nome}

                                {orientador.status === "inativo" && (
                                  <>
                                    <br></br>
                                    <span>(inativo)</span>
                                  </>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                        <h6>Alunos: </h6>
                        {!alunos[0] && (
                          <p className="mb-3">Não há alunos vinculados.</p>
                        )}
                        <div className={styles.participacoes}>
                          {alunos.map((aluno) => (
                            <div
                              key={aluno.id}
                              className={`${styles.innerBox} ${
                                styles.innerBoxWhite
                              } ${
                                aluno.status === "inativo" &&
                                styles.statusInativo
                              }`}
                            >
                              <p>
                                {aluno.user.nome}

                                {aluno.status === "inativo" && (
                                  <>
                                    <br></br>
                                    <span>(inativo)</span>
                                  </>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                        <h6>Atividades obrigatórias:</h6>
                        {!registroAtividades[0] && (
                          <p className="mb-3">
                            Não há atividades até o momento.
                          </p>
                        )}
                        {registroAtividades[0] && (
                          <div className={styles.list}>
                            {registroAtividades.map((registro) => {
                              return (
                                <div
                                  key={registro.id}
                                  className={styles.itemList}
                                >
                                  <div className={styles.headItemList}>
                                    <div className={styles.info}>
                                      <div className={styles.head}>
                                        <div
                                          className={`${styles.status} ${
                                            registro.status === "naoEntregue" &&
                                            styles.error
                                          }
                                          ${
                                            registro.status === "concluido" &&
                                            styles.success
                                          }
                                          `}
                                        >
                                          <p>
                                            {registro.status ===
                                              "naoEntregue" && "não entregue"}
                                            {registro.status === "concluido" &&
                                              "entregue"}
                                          </p>
                                        </div>
                                        <p className={styles.titulo}>
                                          {registro?.atividade?.titulo}
                                        </p>
                                        <p className={styles.subtitulo}>
                                          <strong>Período de entrega:</strong>{" "}
                                          {`Início: ${formatarData(
                                            registro.atividade.dataInicio
                                          )}`}
                                          <br></br>
                                          {`Fim: ${formatarData(
                                            registro.atividade.dataFinal
                                          )}`}
                                        </p>
                                      </div>
                                    </div>
                                    <div className={styles.actions}>
                                      <Button
                                        icon={RiSave2Line}
                                        className="btn-secondary"
                                        type="button"
                                        disabled={loading}
                                        onClick={() => {
                                          openModalAndSetData(registro);
                                        }}
                                      >
                                        Enviar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;

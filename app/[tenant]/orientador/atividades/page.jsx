"use client";
import {
  RiAlertLine,
  RiCalendarEventFill,
  RiCheckDoubleLine,
  RiDraftLine,
  RiEditLine,
  RiFolder2Line,
  RiFoldersLine,
  RiMenuLine,
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

const Page = ({ params }) => {
  // Estados para gerenciamento do componente
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

  // ROTEAMENTO
  const router = useRouter();
  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
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

  // Função para atualizar os itens após criar ou editar
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const response = await getRegistroAtividadesByCpfEditaisVigentes(
        params.tenant
      );

      setRegistrosAtividadesEditaisVigentes(
        response
          .filter(
            (item) => item.planoDeTrabalho.inscricao.edital.vigente === true
          )
          .sort(
            (a, b) =>
              new Date(a.atividade.dataInicio) -
              new Date(b.atividade.dataInicio)
          )
      );
      const itens = response;

      const updatedItem = itens.find((item) => item.id === itemToEdit?.id);

      setItemToEdit(updatedItem);
      await checkFormStatus(
        updatedItem.atividade.formulario.campos,
        updatedItem.respostas
      );
      setTela((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  }, [params.tenant, itemToEdit?.id, checkFormStatus]); //ALTEREI AQUI

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
  // Renderiza o conteúdo do modal
  const renderModalContent = () => {
    return (
      <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
        {/* Exibe conteúdo baseado no valor do code */}
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
                // Correção: async adicionado corretamente
                await handleCreateOrEditSuccess(); // Correção: await adicionado para esperar a função
                setCode(2); // Altera o code após o sucesso
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
            {/* Conteúdo comum para qualquer valor de code */}
            <h4>{itemToEdit?.atividade?.titulo}</h4>
            <p>
              Preencha todos os campos e salve, aguarde a confirmação de
              entrega!
            </p>
            <div className={`${styles.campos} mt-2`}>
              {camposForm?.map(
                (item, index) =>
                  tela === index && ( // Exibe o campo somente se tela for igual ao índice
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
                    />
                  )
              )}
            </div>
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
                    setTela((prev) => Math.min(prev + 1, camposForm.length - 1))
                  }
                  disabled={tela === camposForm.length - 1}
                >
                  Próximo
                </button>
              )}
            </div>
            {itemToEdit?.status === "concluido" && (
              <Button
                className="btn-primary"
                icon={RiMenuLine}
                type="button" // submit, reset, button
                disabled={loading}
                onClick={() => {
                  setCode(3);
                }}
              >
                Voltar para o menu
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
                />
              ))}
            </div>
            <Button
              className="btn-secondary"
              icon={RiEditLine}
              type="button" // submit, reset, button
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
                type="button" // submit, reset, button
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

    // Inicia a submissão e aguarda o response
    const response = await startSubmission(data.id);
    // Atualiza o código sem reabrir o modal
    if (response?.response?.status === "concluido") {
      setCode(3);
    } else {
      setCode(response.code);
    }

    setItemToEdit(data);
    // Pega os campos do formulário relacionados
    setCamposForm(
      data.atividade.formulario.campos.sort((a, b) => a.ordem - b.ordem)
    );
    // Abre o modal uma vez
    setIsModalOpen(true);
  };

  // Obtém o formulário com as respostas preenchidas
  const getFormWithRespostas = async (campos, respostas) => {
    try {
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
      return {
        status: "incompleto",
        data: [],
      };
    }
  };

  // Verifica o status do formulário
  const checkFormStatus = async (campos, respostas) => {
    const result = await getFormWithRespostas(campos, respostas);
    if (result.status === "completo") {
      handleFormComplete();
    }
  };

  // Função chamada quando o formulário está completo
  const handleFormComplete = useCallback(async () => {
    try {
      await updateRegistroAtividade(
        params.tenant,
        itemToEdit.atividadeId,
        itemToEdit.id,
        { status: "concluido" }
      );
    } catch (error) {}
  }, [
    params.tenant,
    itemToEdit?.atividadeId,
    itemToEdit?.id,
    //itemToEdit?.formulario?.onSubmitStatus, ALTEREI AQUI
    //handleCreateOrEditSuccess, ALTEREI AQUI
  ]);

  return (
    <>
      {renderModalContent()}
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            {registroAtividadesEditaisVigentes?.length > 0 && (
              <>
                <h4>Cronograma de atividades:</h4>
                <p className="mt-1">
                  As atividades abaixo são obrigatórias para conclusão do
                  programa de iniciação científica.
                </p>
              </>
            )}
          </div>
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
                            registro.status === "naoEntregue" && styles.error
                          } ${
                            registro.status === "concluido" && styles.success
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;

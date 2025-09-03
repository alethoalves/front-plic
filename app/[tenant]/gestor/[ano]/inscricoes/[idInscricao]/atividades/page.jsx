"use client"; // Indica que este código é para ser executado no cliente (navegador)

// Importação de Hooks do React
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// Importação de estilos e ícones
import styles from "./page.module.scss";
import {
  RiAlertLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFoldersLine,
} from "@remixicon/react";

// Importação de componentes
import Button from "@/components/Button";
import Modal from "@/components/Modal";

// Importação de funções de requisição para a API
import { deleteParticipacao } from "@/app/api/client/participacao";
import { getInscricao } from "@/app/api/client/inscricao";
import { updateRegistroAtividade } from "@/app/api/client/registroAtividade";
import { getCampos } from "@/app/api/client/campo";
import Item from "@/components/Item";
import Campo from "@/components/Campo";
import ModalDelete from "@/components/ModalDelete";

const Page = ({ params }) => {
  // Estados para gerenciamento do componente
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itens, setItens] = useState([]);
  const [flatItens, setFlatItens] = useState([]); // Novo estado para flatItens
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [idFormAtividade, setIdFormAtividade] = useState(null);
  const [camposForm, setCamposForm] = useState([]);
  const [errorToGetCamposForm, setErrorToGetCamposForm] = useState(null);
  const [formStatus, setFormStatus] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Hook para navegação
  const router = useRouter();

  // Busca de dados ao renderizar o componente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const itens = await getInscricao(params.tenant, params.idInscricao);
        setItens(itens);
        const flatItens = flattenItems(itens); // Mover a transformação aqui
        setFlatItens(flatItens); // Salvar o resultado no estado
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idInscricao]);

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
      const itens = await getInscricao(params.tenant, params.idInscricao);
      setItens(itens);
      const flatItens = flattenItems(itens); // Mover a transformação aqui
      setFlatItens(flatItens); // Salvar o resultado no estado
      const updatedItemToEdit = flatItens.find(
        (atividade) => atividade.id === itemToEdit.id
      );
      setItemToEdit(updatedItemToEdit);
    } catch (error) {
      console.error("Erro ao buscar editais:", error);
    }
  }, [params.tenant, params.idInscricao, itemToEdit?.id]);

  // Função para deletar um item

  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    try {
      await deleteParticipacao(params.tenant, itemToDelete.id);
      const updatedItens = itens.filter((p) => p.id !== itemToDelete.id);
      setItens(updatedItens);
      const flatItens = flattenItems(updatedItens); // Mover a transformação aqui
      setFlatItens(flatItens); // Salvar o resultado no estado
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    }
  }, [params.tenant, itemToDelete, itens]);

  // Abre o modal e define os dados do item a ser editado
  const openModalAndSetData = async (data) => {
    setItemToEdit(data);
    setIsModalOpen(true);
    setIdFormAtividade(data.idFormAtividade);
    await handleGetCamposForm(data.idFormAtividade);
  };

  // Fecha o modal e reseta os dados
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setCamposForm([]);
    setFormStatus(null);
    setApiError(null);
  };

  // Obtém o formulário com as respostas preenchidas
  const getFormWithRespostas = async (idFormAtividade) => {
    try {
      const campos = await getCampos(params.tenant, idFormAtividade);
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
    const result = await getFormWithRespostas(itemToEdit.idFormAtividade);

    setFormStatus(result.status);
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
        { status: itemToEdit.onSubmitStatus }
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
    itemToEdit?.onSubmitStatus,
    handleCreateOrEditSuccess,
  ]);

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
            <h4>{itemToEdit?.tituloAtividade}</h4>
            <p>{itemToEdit?.descricaoAtividade}</p>
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

  // Renderiza o conteúdo do modal de exclusão
  //Modal de exclusão
  const renderDeleteModalContent = () => (
    <ModalDelete
      isOpen={deleteModalOpen}
      title="Confirmar Exclusão"
      onClose={closeModalAndResetData}
      confirmationText={`Tem certeza que deseja excluir ${itemToDelete?.nome}`}
      errorDelete={errorDelete}
      handleDelete={handleDelete}
    />
  );

  // Função para achatar os itens (transformar em um array plano)
  const flattenItems = (itens) =>
    itens?.planosDeTrabalho?.flatMap((plano) =>
      plano.registroAtividades.map((atividade) => ({
        id: atividade.id,
        status: atividade.status,
        tituloAtividade: atividade.atividade.titulo,
        atividadeId: atividade.atividade.id,
        onSubmitStatus: atividade.atividade.formulario.onSubmitStatus,
        tituloPlanoDeTrabalho: plano.titulo,
        descricaoAtividade: atividade.atividade.descricao,
        idFormAtividade: atividade.atividade.formulario.id,
        respostas: atividade.respostas,
      }))
    );

  // Renderização do componente principal
  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiFoldersLine />
            </div>
            <h5>Atividades</h5>
          </div>
          <div className={styles.mainContent}>
            <div className={styles.list}>
              {loading && <p>Carregando...</p>}
              {error && <p>{error}</p>}
              {!loading &&
                !error &&
                flatItens
                  ?.sort((a, b) => a.id - b.id)
                  .map((item, index) => {
                    const status = {
                      label:
                        item.status === "naoEntregue"
                          ? "Não entregue"
                          : item.status === "aguardandoAvaliacao"
                          ? "Aguardando Avaliação"
                          : item.status === "concluido"
                          ? "Concluído"
                          : "",
                      tipo:
                        item.status === "naoEntregue"
                          ? "error"
                          : item.status === "aguardandoAvaliacao"
                          ? "warning"
                          : item.status === "concluido"
                          ? "success"
                          : "",
                    };
                    return (
                      <Item
                        key={item.id}
                        titulo={item.tituloAtividade}
                        labelSubtitulo={"Plano de Trabalho"}
                        subtitulo={item.tituloPlanoDeTrabalho}
                        descricao={item.descricaoAtividade}
                        status={status}
                        handleEdit={() => {
                          openModalAndSetData(item);
                        }}
                        //navigateTo={`/`}
                      />
                    );
                  })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;

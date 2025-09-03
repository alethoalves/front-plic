"use client";

//HOOKS
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

//ESTILO E ÍCONES
import styles from "./page.module.scss";
import {
  RiAddCircleLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiGroupLine,
  RiShutDownLine,
} from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";

//FUNÇÕES
import {
  createPlanoDeTrabalho,
  getPlanoDeTrabalhos,
  getPlanoDeTrabalho,
  updatePlanoDeTrabalho,
  deletePlanoDeTrabalho,
} from "@/app/api/client/planoDeTrabalho";
import FormPlanoDeTrabalho from "@/components/Formularios/FormPlanoDeTrabalho";
import ParticipacaoForm from "@/components/Formularios/ParticipacaoForm";
import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";
import ParticipacaoFormAluno from "@/components/Formularios/ParticipacaoFormAluno";
import InativarParticipacaoForm from "@/components/Formularios/InativarParticipacaoForm";

const Page = ({ params }) => {
  //ESTADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenAluno, setIsModalOpenAluno] = useState(false);
  const [isModalOpenInativar, setIsModalOpenInativar] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itens, setItens] = useState([]);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);

  //ROTEAMENTO
  const router = useRouter();

  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const itens = await getPlanoDeTrabalhos(
          params.tenant,
          params.idInscricao
        );
        setItens(itens);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idInscricao]);

  //FUNÇÕES PARA MANIPULAÇÃO DAS AÇÕES DE CRIAR|EDITAR|DELETAR
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getPlanoDeTrabalhos(params.tenant, params.idInscricao);

      setItens(data);
    } catch (error) {
      console.error("Erro ao buscar Planos de Trabalho:", error);
    }
  }, [params.tenant, params.idInscricao]);

  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    try {
      await deletePlanoDeTrabalho(
        params.tenant,
        params.idInscricao,
        itemToDelete.id
      );
      setItens(itens.filter((p) => p.id !== itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    }
  }, [params.tenant, params.idInscricao, itemToDelete, itens]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setItemToEdit(data);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setIsModalOpenAluno(false);
    setVerifiedData(false);
    setIsModalOpenInativar(false);
  };

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>
        {itemToEdit ? "Editar Plano de Trabalho" : "Novo Plano de Trabalho"}
      </h4>
      <p>
        {itemToEdit
          ? "Edite os dados abaixo."
          : "Preencha os dados abaixo para adicionar um novo Plano de Trabalho."}
      </p>
      <FormPlanoDeTrabalho
        tenantSlug={params.tenant}
        idInscricao={params.idInscricao}
        initialData={itemToEdit}
        onSuccess={handleCreateOrEditSuccess}
        onClose={closeModalAndResetData}
      />
    </Modal>
  );
  const renderModalAluno = () => (
    <Modal isOpen={isModalOpenAluno} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>Adicionar Aluno</h4>
      <p>
        {itemToEdit
          ? "Edite os dados abaixo."
          : "Preencha os dados abaixo para adicionar um novo aluno."}
      </p>

      <CPFVerificationForm
        tenantSlug={params.tenant}
        onCpfVerified={setVerifiedData}
      />
      {verifiedData && (
        <ParticipacaoFormAluno
          tenantSlug={params.tenant}
          inscricaoId={params.idInscricao}
          planoDeTrabalhoId={itemToEdit.id}
          initialData={verifiedData}
          onClose={closeModalAndResetData}
          onSuccess={handleCreateOrEditSuccess}
        />
      )}
    </Modal>
  );
  const renderModalInativar = () => (
    <Modal isOpen={isModalOpenInativar} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4 className="mb-1">Confirmar Inativação</h4>
      <p>{`Tem certeza que deseja inativar:`}</p>
      <p className="mt-1">{`${itemToDelete?.user?.nome}`}</p>

      <InativarParticipacaoForm
        tenantSlug={params.tenant}
        idParticipacao={itemToDelete?.id}
        onClose={closeModalAndResetData}
        onSuccess={handleCreateOrEditSuccess}
      />
    </Modal>
  );
  const renderDeleteModalContent = () => (
    <ModalDelete
      isOpen={deleteModalOpen}
      title="Confirmar Exclusão"
      onClose={() => {
        setDeleteModalOpen(false);
        setErrorDelete("");
      }}
      confirmationText={`Tem certeza que deseja excluir o Plano de Trabalho`}
      errorDelete={errorDelete}
      handleDelete={handleDelete}
    />
  );

  return (
    <>
      {renderModalContent()}
      {renderModalAluno()}
      {renderModalInativar()}
      {renderDeleteModalContent()}
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiGroupLine />
            </div>
            <h5>Planos de Trabalho</h5>
          </div>
          <div className={styles.mainContent}>
            <div className={styles.list}>
              <div
                className={styles.addItem}
                onClick={() => openModalAndSetData(null)}
              >
                <div className={styles.icon}>
                  <RiAddCircleLine />
                </div>
                <p>Adicionar Plano de Trabalho</p>
              </div>

              {loading && <p>Carregando...</p>}
              {error && <p>{error}</p>}

              {!loading &&
                !error &&
                itens?.map((planoDeTrabalho) => (
                  <div key={planoDeTrabalho.id} className={styles.itemList}>
                    <div className={styles.headItemList}>
                      <div className={styles.info}>
                        <p>
                          <strong>Plano de Trabalho: </strong>
                          {planoDeTrabalho.titulo}
                        </p>
                      </div>
                      <div className={styles.actions}>
                        <div
                          className={styles.edit}
                          onClick={() => openModalAndSetData(planoDeTrabalho)}
                        >
                          <RiEditLine />
                        </div>
                        <div
                          className={styles.delete}
                          onClick={() => {
                            setDeleteModalOpen(true);
                            setItemToDelete(planoDeTrabalho);
                          }}
                        >
                          <RiDeleteBinLine />
                        </div>
                        {false && (
                          <div
                            className={styles.navigate}
                            onClick={() => {
                              router.push(
                                `/${params.tenant}/gestor/inscricoes/${params.idInscricao}/planosDeTrabalho/${planoDeTrabalho.id}`
                              );
                            }}
                          >
                            <RiArrowRightSLine />
                          </div>
                        )}
                      </div>
                    </div>
                    {planoDeTrabalho.participacoes &&
                      planoDeTrabalho.participacoes.map((participacao) => (
                        <div key={participacao.id} className={styles.subitem}>
                          <div className={styles.info}>
                            <div
                              className={`${styles.status} 
                        ${
                          participacao.status === "incompleto" &&
                          styles.incompleto
                        }
                        ${
                          (participacao.status === "ativo" ||
                            participacao.status === "completo") &&
                          styles.ativo
                        }
                        ${participacao.status === "inativo" && styles.inativo}
                        `}
                            >
                              <p>
                                {participacao.status === "ativo" &&
                                  `${participacao.status} desde ${participacao.inicio}`}
                                {participacao.status != "ativo" &&
                                  ` participou de ${participacao.inicio} a ${participacao.fim}`}
                              </p>
                            </div>
                            <p>
                              <strong>Aluno: </strong>
                              {participacao.user.nome}
                            </p>
                            <p className="mt-1">
                              <strong>CPF: </strong>
                              {`${participacao.user.cpf}`}
                            </p>
                          </div>
                          <div className={styles.actions}>
                            {participacao.status === "ativo" && (
                              <div
                                className={styles.delete}
                                onClick={() => {
                                  setIsModalOpenInativar(true);
                                  setItemToDelete(participacao);
                                }}
                              >
                                <RiShutDownLine />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    <div
                      className={`${styles.addItem} ${styles.addItemAluno}`}
                      onClick={() => {
                        setIsModalOpenAluno(true);
                        setItemToEdit(planoDeTrabalho);
                      }}
                    >
                      <div className={styles.icon}>
                        <RiAddCircleLine />
                      </div>
                      <p>Adicionar Aluno</p>
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

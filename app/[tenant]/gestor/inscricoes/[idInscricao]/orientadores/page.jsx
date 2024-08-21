"use client";

//HOOKS
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

//ESTILO E ÍCONES
import styles from "./page.module.scss";
import {
  RiAddCircleLine,
  RiArrowLeftRightLine,
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

import CPFVerificationForm from "@/components/Formularios/CPFVerificationForm";

//FUNÇÕES
import {
  getParticipacoes,
  deleteParticipacao,
  inativarParticipacao,
} from "@/app/api/client/participacao";
import ParticipacaoForm from "@/components/Formularios/ParticipacaoForm";
import InativarParticipacaoForm from "@/components/Formularios/InativarParticipacaoForm";

const Page = ({ params }) => {
  //ESTADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        const tipos = ["orientador", "coorientador"]; // Defina os tipos que deseja filtrar
        const itens = await getParticipacoes(
          params.tenant,
          params.idInscricao,
          tipos
        );
        console.log(itens);
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
      const tipos = ["orientador", "coorientador"]; // Defina os tipos que deseja filtrar
      const itens = await getParticipacoes(
        params.tenant,
        params.idInscricao,
        tipos
      );
      setItens(itens);
    } catch (error) {
      console.error("Erro ao buscar editais:", error);
    }
  }, [params.tenant, params.idInscricao]);

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

  const renderModalContent = () => (
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
        tenantSlug={params.tenant}
        onCpfVerified={setVerifiedData}
      />
      {verifiedData && (
        <ParticipacaoForm
          tenantSlug={params.tenant}
          inscricaoId={params.idInscricao}
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
      <p className="mt-1">{`${itemToDelete?.user.nome}`}</p>

      <InativarParticipacaoForm
        tenantSlug={params.tenant}
        idParticipacao={itemToDelete?.id}
        onClose={closeModalAndResetData}
        onSuccess={handleCreateOrEditSuccess}
      />
    </Modal>
  );

  //Modal de exclusão
  const renderDeleteModalContent = () => (
    <ModalDelete
      isOpen={deleteModalOpen}
      title="Confirmar Inativação"
      onClose={closeModalAndResetData}
      confirmationText={`Tem certeza que deseja inativar ${itemToDelete?.user.nome}`}
      errorDelete={errorDelete}
      handleDelete={handleDelete}
      icon={RiShutDownLine}
      txtBtn="Inativar"
    />
  );
  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    try {
      const response = await inativarParticipacao(
        params.tenant,
        itemToDelete.id
      );
      console.log(response);
      if (response) {
        handleCreateOrEditSuccess();
        closeModalAndResetData();
      }
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    }
  }, [params.tenant, itemToDelete, itens]);
  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}
      {renderModalInativar()}
      <div className={styles.navContent}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.icon}>
              <RiGroupLine />
            </div>
            <h5>Orientadores</h5>
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
                <p>Add orientador</p>
              </div>

              {loading && <p>Carregando...</p>}
              {error && <p>{error}</p>}

              {!loading &&
                !error &&
                itens?.map((participacao) => (
                  <div key={participacao.id} className={styles.itemList}>
                    <div className={styles.headItemList}>
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
                          <p
                            className={
                              styles[participacao.status.toLowerCase()]
                            }
                          >
                            {participacao.status === "ativo" &&
                              `${participacao.status} desde ${participacao.inicio}`}
                            {participacao.status != "ativo" &&
                              ` participou de ${participacao.inicio} a ${participacao.fim}`}
                          </p>
                        </div>
                        <p>{participacao.user.nome}</p>
                        <p className="mt-1">{`CPF: ${participacao.user.cpf}`}</p>
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

                        <div
                          className={styles.navigate}
                          onClick={() => {
                            router.push(
                              `/${params.tenant}/gestor/inscricoes/${params.idInscricao}/orientadores/${participacao.id}`
                            );
                          }}
                        >
                          <RiArrowRightSLine />
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

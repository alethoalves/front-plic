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
} from "@remixicon/react";

//COMPONENTES
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import CPFVerificationForm from "@/components/CPFVerificationForm";
import DataSubmissionForm from "@/components/DataSubmissionForm";

//FUNÇÕES
import { getParticipacoes, deleteParticipacao } from "@/app/api/clientReq";

const Page = ({ params }) => {
  //ESTADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        const itens = await getParticipacoes(params.tenant, params.idInscricao);
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
      const data = await getParticipacoes(params.tenant, params.idInscricao);
      setItens(data);
    } catch (error) {
      console.error("Erro ao buscar editais:", error);
    }
  }, [params.tenant, params.idInscricao]);
  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    try {
      await deleteParticipacao(params.tenant, itemToDelete.id);
      setItens(itens.filter((p) => p.id !== itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.error?.message ??
          "Erro na conexão com o servidor."
      );
    }
  }, [params.tenant, itemToDelete, itens]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setItemToEdit(data);
  };
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
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
        <DataSubmissionForm
          tenantSlug={params.tenant}
          inscricaoId={params.idInscricao}
          initialData={verifiedData}
          onClose={closeModalAndResetData}
          onSuccess={handleCreateOrEditSuccess}
        />
      )}
    </Modal>
  );

  const renderDeleteModalContent = () => (
    <Modal
      isOpen={deleteModalOpen}
      onClose={() => {
        setDeleteModalOpen(false);
        setErrorDelete("");
      }}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiDeleteBinLine />
      </div>
      <h4>Confirmar Exclusão</h4>
      <p className="mt-1">{`Tem certeza que deseja excluir a participação de ${itemToDelete?.nome}`}</p>
      {errorDelete && (
        <div className={`notification notification-error`}>
          <p className="p5">{errorDelete}</p>
        </div>
      )}
      <div className={styles.btnSubmit}>
        <Button className="btn-error mt-4" onClick={handleDelete}>
          Excluir
        </Button>
      </div>
    </Modal>
  );

  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}
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
                        <p>{participacao.nome}</p>
                        <div
                          className={`${styles.status} 
                        ${
                          participacao.status === "incompleto" &&
                          styles.incompleto
                        }
                        ${participacao.status === "ativo" && styles.ativo}
                        ${participacao.status === "inativo" && styles.ativo}
                        `}
                        >
                          <p
                            className={
                              styles[participacao.status.toLowerCase()]
                            }
                          >
                            {participacao.status}
                          </p>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <div
                          className={styles.delete}
                          onClick={() => {
                            setDeleteModalOpen(true);
                            setItemToDelete(participacao);
                          }}
                        >
                          <RiDeleteBinLine />
                        </div>
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

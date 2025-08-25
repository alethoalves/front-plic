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
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
    setCamposForm([]);
    setFormStatus(null);
    setApiError(null);
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
              <h5>Documentos</h5>
            </div>
          </div>
          <div className={styles.mainContent}></div>
        </div>
      </div>
    </>
  );
};

export default Page;

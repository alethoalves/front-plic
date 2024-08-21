"use client";

//HOOKS
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

//ESTILO E ÍCONES
import styles from "./EditalAtividades.module.scss";
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
import Item from "@/components/Item";

//FUNÇÕES

import { getFormularios } from "@/app/api/client/formulario";
import EditalFormularios from "./EditalFormularios";
import FormNewAtividade from "./Formularios/FormNewAtividade";
import { deleteAtividade, getAtividades } from "@/app/api/client/atividade";
import { formatDateForDisplay } from "@/lib/formatDateForDisplay";

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
  const [formularios, setFormularios] = useState([]);
  //ROTEAMENTO
  const router = useRouter();

  //EFETUAR BUSCAS DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const itens = await getAtividades(params.tenant, params.idEdital);
        setItens(itens);
        const formularios = await getFormularios(params.tenant);
        setFormularios(formularios);
        console.log(formularios);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idInscricao, params.idEdital]);

  //FUNÇÕES PARA MANIPULAÇÃO DAS AÇÕES DE CRIAR|EDITAR|DELETAR
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await await getAtividades(params.tenant, params.idEdital);
      setItens(data);
    } catch (error) {
      console.error("Erro ao buscar atividades:", error);
    }
  }, [params.tenant, params.idEdital]);
  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    console.log(itemToDelete);
    try {
      await deleteAtividade(params.tenant, params.idEdital, itemToDelete.id);
      setItens(itens.filter((p) => p.id !== itemToDelete.id));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    }
  }, [itemToDelete, params.tenant, params.idEdital, itens]);

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
      <h4>Nova atividade</h4>
      <p>
        {itemToEdit
          ? "Edite os dados abaixo."
          : "Preencha os dados abaixo para adicionar uma nova atividade."}
      </p>
      <FormNewAtividade
        tenantSlug={params.tenant}
        editalId={params.idEdital}
        initialData={itemToEdit}
        formularios={formularios}
        onClose={closeModalAndResetData}
        onSuccess={handleCreateOrEditSuccess}
      />
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
      <p className="mt-1">{`Tem certeza que deseja excluir a atividade de ${itemToDelete?.titulo}`}</p>
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
          <div className={styles.mainContent}>
            <div className={styles.list}>
              <div
                className={styles.addItem}
                onClick={() => openModalAndSetData(null)}
              >
                <div className={styles.icon}>
                  <RiAddCircleLine />
                </div>
                <p>Add atividade</p>
              </div>

              {loading && <p>Carregando...</p>}
              {error && <p>{error}</p>}

              {!loading &&
                !error &&
                itens?.map((atividade, index) => {
                  const status = {
                    label: `de ${formatDateForDisplay(
                      atividade.dataInicio
                    )} a ${formatDateForDisplay(atividade.dataFinal)}`,
                    tipo: "success",
                  }; // Ajuste conforme necessário
                  return (
                    <Item
                      key={atividade.id}
                      titulo={atividade.titulo}
                      status={status}
                      handleEdit={() => openModalAndSetData(atividade)}
                      handleDelete={() => {
                        setDeleteModalOpen(true);
                        setItemToDelete(atividade);
                      }}
                      //navigateTo={``}
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

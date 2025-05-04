"use client";
//HOOKS
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

//ESTILO E ÍCONES
import styles from "./page.module.scss";
import { RiAddCircleLine } from "@remixicon/react";

//COMPONENTES
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import ModalDelete from "@/components/ModalDelete";
import FormEdital from "@/components/Formularios/FormEdital";
import BuscadorFront from "@/components/BuscadorFront";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";

//FUNÇÕES
import { getEditais, deleteEdital } from "@/app/api/client/edital";
import NoData from "@/components/NoData";

const Page = ({ params }) => {
  //ESTADOS
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [editalToEdit, setEditalToEdit] = useState(null);
  const [editalToDelete, setEditalToDelete] = useState(null);

  //ROTEAMENTO
  const router = useRouter();

  //BUSCA DE DADOS AO RENDERIZAR A PÁGINA
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const editais = await getEditais(params.tenant);
        setEditais(editais);
      } catch (error) {
        console.error("Erro ao buscar editais:", error);
        setError("Erro ao buscar editais.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);
  //Modal controllers
  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setEditalToEdit(data);
  };
  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setEditalToEdit(null);
    setDeleteModalOpen(false);
    setErrorDelete("");
  };

  //CREATE OR EDIT
  //Função chamada após o submit do formulário de edição/criação
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getEditais(params.tenant);
      setEditais(data);
    } catch (error) {
      console.error("Erro ao buscar editais:", error);
    }
  }, [params.tenant]);
  //Modal de criação/deleção
  const renderModalContent = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModalAndResetData}
      edit={true}
      itemName={"Edital"}
    >
      <FormEdital
        tenantSlug={params.tenant}
        initialData={editalToEdit}
        onClose={closeModalAndResetData}
        onSuccess={handleCreateOrEditSuccess}
      />
    </Modal>
  );
  //DELETE
  //Função chamada para escluir um item
  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    try {
      await deleteEdital(params.tenant, editalToDelete.id);
      setEditais(editais.filter((e) => e.id !== editalToDelete.id));
      setDeleteModalOpen(false);
      setEditalToDelete(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    }
  }, [params.tenant, editalToDelete, editais]);
  //Modal de exclusão
  const renderDeleteModalContent = () => (
    <ModalDelete
      isOpen={deleteModalOpen}
      title="Excluir edital"
      onClose={closeModalAndResetData}
      confirmationText={`Tem certeza que deseja excluir o edital ${editalToDelete?.titulo}`}
      errorDelete={errorDelete}
      handleDelete={handleDelete}
    />
  );
  //SEARCH FILTER
  const filteredEditais = searchTerm
    ? editais.filter((edital) =>
        edital.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : editais;

  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}
      {editais.length > 0 ? (
        <main>
          <Header
            className="mb-3"
            titulo="Editais"
            subtitulo="Edite e crie os editais da sua instituição"
            descricao="Aqui você gerencia os editais usados nas diversas etapas da iniciação científica."
          />
          {/**** BUSCADOR ****/}
          <div>
            <BuscadorFront setSearchTerm={setSearchTerm} />
          </div>
          {/**** FIM BUSCADOR ****/}
          {/**** BTN NOVO ITEM ****/}
          <div className={`${styles.content}`}>
            <div
              onClick={() => openModalAndSetData(null)}
              className={`${styles.btnNewItem}`}
            >
              <div className={`${styles.icon}`}>
                <RiAddCircleLine />
              </div>
              <p>Criar novo</p>
            </div>
            {/**** FIM BTN NOVO ITEM ****/}
            {/**** ITENS ****/}
            {loading ? (
              <>
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </>
            ) : error ? (
              <p>{error}</p>
            ) : filteredEditais?.length > 0 ? (
              filteredEditais.map((edital) => (
                <div className={styles.card} key={edital.id}>
                  <Card
                    title={edital.titulo}
                    subtitle={edital.ano}
                    onEdit={() => openModalAndSetData(edital)}
                    onDelete={() => {
                      setDeleteModalOpen(true);
                      setEditalToDelete(edital);
                    }}
                    onView={() => {
                      router.push(
                        `/${params.tenant}/configuracoes/gestor/editais/${edital.id}`
                      );
                    }}
                  />
                </div>
              ))
            ) : (
              <div className={`${styles.card}`}>
                <NoData />
              </div>
            )}
            {/**** FIM ITENS ****/}
          </div>
        </main>
      ) : (
        <main>
          <NoData description="Crie um Edital!"></NoData>
        </main>
      )}
    </>
  );
};

export default Page;

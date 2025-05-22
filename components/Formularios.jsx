"use client";
//HOOKS
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

//ESTILO E ÍCONES
import styles from "./Formularios.module.scss";
import { RiAddCircleLine, RiEditLine } from "@remixicon/react";

//COMPONENTES
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import BuscadorFront from "@/components/BuscadorFront";
import Card from "@/components/Card";
import ModalDelete from "@/components/ModalDelete";
import Skeleton from "@/components/Skeleton";

//FORMULÁRIOS
import FormNewFormulario from "@/components/Formularios/FormNewFormulario";

//FUNÇÕES
import NoData from "@/components/NoData";
import { deleteFormulario, getFormularios } from "@/app/api/client/formulario";
import { getEditais, updateEdital } from "@/app/api/client/edital";
import Formulario from "./Formulario";

const Formularios = ({ params }) => {
  //ESTADOS
  //de busca,loading ou erro
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  //do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  //de armazenamento de dados
  const [formularios, setFormularios] = useState([]);
  const [formularioToEdit, setFormularioToEdit] = useState(null);
  const [formularioToDelete, setFormularioToDelete] = useState(null);
  const [editaisAno, setEditaisAno] = useState([]);
  const [formularioEmFoco, setFormularioEmFoco] = useState(null); // objeto {id, …}
  const [showFormularioModal, setShowFormularioModal] = useState(false);
  //ROTEAMENTO
  const router = useRouter();
  const abrirFormulario = (formulario) => {
    setFormularioEmFoco(formulario);
    setShowFormularioModal(true);
  };
  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const formularios = await getFormularios(params.tenant);
        setFormularios(formularios);
        /* carrega editais do ano informado */
        const editais = await getEditais(params.tenant, params.ano);
        setEditaisAno(editais || []);
      } catch (error) {
        console.error("Erro ao buscar formulários:", error);
        setError("Erro ao buscar formulários.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  //FUNÇÕES PARA MANIPULAÇÃO DAS AÇÕES DE CRIAR|EDITAR|DELETAR|RESETAR
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getFormularios(params.tenant);
      setFormularios(data);
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
    }
  }, [params.tenant]);

  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    try {
      await deleteFormulario(params.tenant, formularioToDelete.id);
      setFormularios(formularios.filter((f) => f.id !== formularioToDelete.id));
      setDeleteModalOpen(false);
      setFormularioToDelete(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    }
  }, [params.tenant, formularioToDelete, formularios]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setFormularioToEdit(data);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setFormularioToEdit(null);
    setDeleteModalOpen(false);
    setErrorDelete(null);
  };

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>{formularioToEdit ? "Editar formulário" : "Novo formulário"}</h4>
      <p>
        {formularioToEdit
          ? "Edite os dados do formulário."
          : "Preencha os dados abaixo para criar um novo formulário."}
      </p>
      <FormNewFormulario
        tenantSlug={params.tenant}
        initialData={formularioToEdit}
        onClose={closeModalAndResetData}
        onSuccess={handleCreateOrEditSuccess}
      />
    </Modal>
  );
  //Modal de exclusão
  const renderDeleteModalContent = () => (
    <ModalDelete
      isOpen={deleteModalOpen}
      title="Excluir formulário"
      onClose={closeModalAndResetData}
      confirmationText={`Tem certeza que deseja excluir o formulário ${formularioToDelete?.titulo}`}
      errorDelete={errorDelete}
      handleDelete={handleDelete}
    />
  );

  // Função para filtrar os formulários
  const filteredFormularios = searchTerm
    ? formularios.filter((formulario) =>
        formulario.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : formularios;
  const handleLinkChange = async (tenantSlug, editalId, body) => {
    try {
      await updateEdital(tenantSlug, editalId, body); // 1. grava no backend
      const fresh = await getEditais(tenantSlug, params.ano); // 2. baixa lista atual
      setEditaisAno(fresh || []); // 3. atualiza estado → todos os cards renderizam
    } catch (e) {
      console.error("Erro ao atualizar edital:", e);
    }
  };

  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}
      <Modal
        isOpen={showFormularioModal}
        onClose={() => {
          setShowFormularioModal(false);
          setFormularioEmFoco(null);
        }}
        //size="large" /* opcional: largura maior */
        //noPadding /* se preferir que Formulario use toda a área */
      >
        {/* só renderiza quando houver algo selecionado */}
        {formularioEmFoco && (
          <Formulario
            params={{
              tenant: params.tenant,
              idFormulario: formularioEmFoco.id,
            }}
          />
        )}
      </Modal>
      <main>
        <Header
          className="mb-3"
          subtitulo="Formulários"
          descricao="Crie, edite e vincule formulários aos seus editais."
        />

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

          {loading ? (
            <div className="mt-2">
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ) : error ? (
            <p>{error}</p>
          ) : (
            filteredFormularios.map((formulario) => (
              <div className={`${styles.card} mt-2`} key={formulario.id}>
                <Card
                  title={
                    formulario.tipo === "planoDeTrabalho"
                      ? "Plano de Trabalho"
                      : formulario.tipo
                  }
                  subtitle={formulario.titulo}
                  onEdit={() => openModalAndSetData(formulario)}
                  onDelete={() => {
                    setDeleteModalOpen(true);
                    setFormularioToDelete(formulario);
                  }}
                  editais={editaisAno}
                  tenantSlug={params.tenant}
                  onLinkChange={handleLinkChange} // função da API
                  formulario={formulario}
                  onView={() => abrirFormulario(formulario)}
                />
              </div>
            ))
          )}
          {!filteredFormularios[0] && (
            <div className={styles.card}>
              <NoData />
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Formularios;

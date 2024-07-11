'use client'
//HOOKS
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";

//ESTILO E ÍCONES
import styles from "./page.module.scss";
import { RiAddCircleLine, RiDeleteBinLine, RiEditLine } from '@remixicon/react';

//COMPONENTES
import Header from "@/components/Header";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import FormNewFormulario from "@/components/FormNewFormulario";
import BuscadorFront from '@/components/BuscadorFront';
import Card from "@/components/Card";

//FUNÇÕES 
import { getFormularios, deleteFormulario } from '@/app/api/clientReq';

const Page = ({ params }) => {
  //ESTADOS
  //de busca,loading ou erro
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  //do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  //de armazenamento de dados
  const [formularios, setFormularios] = useState([]);
  const [formularioToEdit, setFormularioToEdit] = useState(null);
  const [formularioToDelete, setFormularioToDelete] = useState(null);

  //ROTEAMENTO
  const router = useRouter();

  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const formularios = await getFormularios(params.tenant);
        setFormularios(formularios);
      } catch (error) {
        console.error('Erro ao buscar formulários:', error);
        setError('Erro ao buscar formulários.');
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
      console.error('Erro ao buscar formulários:', error);
    }
  }, [params.tenant]);

  const handleDelete = useCallback(async () => {
    setErrorDelete('');
    try {
      await deleteFormulario(params.tenant, formularioToDelete.id);
      setFormularios(formularios.filter(f => f.id !== formularioToDelete.id));
      setDeleteModalOpen(false);
      setFormularioToDelete(null);
    } catch (error) {
      setErrorDelete(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.")
    }
  }, [params.tenant, formularioToDelete, formularios]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setFormularioToEdit(data);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setFormularioToEdit(null);
  };

  const renderModalContent = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModalAndResetData}
    >
      <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
      <h4>{formularioToEdit ? 'Editar formulário' : 'Novo formulário'}</h4>
      <p>{formularioToEdit ? 'Edite os dados do formulário.' : 'Preencha os dados abaixo para criar um novo formulário.'}</p>
      <FormNewFormulario
        tenantSlug={params.tenant}
        initialData={formularioToEdit}
        onClose={closeModalAndResetData}
        onSuccess={handleCreateOrEditSuccess}
      />
    </Modal>
  );

  const renderDeleteModalContent = () => (
    <Modal
      isOpen={deleteModalOpen}
      onClose={() => {setDeleteModalOpen(false);setErrorDelete('')}}
    >
      <div className={`${styles.icon} mb-2`}><RiDeleteBinLine /></div>
      <h4>Excluir formulário</h4>
      <p className='mt-1'>{`Tem certeza que deseja excluir o formulário ${formularioToDelete?.titulo}`}</p>
      {errorDelete && <div className={`notification notification-error`}><p className='p5'>{errorDelete}</p></div> }
      <div className={styles.btnSubmit}>
        <Button
          className="btn-error mt-4"
          onClick={handleDelete}
        >
          Excluir
        </Button>
      </div>
    </Modal>
  );

  // Função para filtrar os formulários
  const filteredFormularios = searchTerm 
    ? formularios.filter(formulario =>
        formulario.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : formularios;

  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}
      <main>
        <Header
          className="mb-3"
          titulo="Formulários"
          subtitulo="Edite e crie os formulários da sua instituição"
          descricao="Aqui você gerencia os formulários usados nas diversas etapas da iniciação científica."
        />

        <div><BuscadorFront setSearchTerm={setSearchTerm} /></div>

        <div className={`${styles.content}`}>
          <div onClick={() => openModalAndSetData(null)} className={`${styles.btnNewItem}`}>
            <div className={`${styles.icon}`}>
              <RiAddCircleLine />
            </div>
            <p>Criar novo</p>
          </div>
          
          {loading && <p>Carregando...</p>}

          {error && <p>{error}</p>}

          {!loading && !error && filteredFormularios.map((formulario) => (
            <div className={styles.card} key={formulario.id}>
              <Card
                title={formulario.tipo === "planoDeTrabalho" ? "Plano de Trabalho" : formulario.tipo}
                subtitle={formulario.titulo}
                onEdit={() => openModalAndSetData(formulario)}
                onDelete={() => { setDeleteModalOpen(true); setFormularioToDelete(formulario); }}
                onView={() => { router.push(`/${params.tenant}/gestor/formularios/${formulario.id}`) }}
              />
            </div>
          ))}
          
        </div>

      </main>
    </>
  );
}

export default Page;

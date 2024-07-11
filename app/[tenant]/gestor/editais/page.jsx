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
import FormEdital from "@/components/FormEdital";
import BuscadorFront from '@/components/BuscadorFront';
import Card from "@/components/Card";

//FUNÇÕES 
import { getEditais, deleteEdital } from '@/app/api/clientReq';

const Page = ({ params }) => {
  //ESTADOS
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [editalToEdit, setEditalToEdit] = useState(null);
  const [editalToDelete, setEditalToDelete] = useState(null);

  //ROTEAMENTO
  const router = useRouter();

  //BUSCA DE DADOS AO RENDERIZAR O COMPONENTE
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const editais = await getEditais(params.tenant);
        setEditais(editais);
      } catch (error) {
        console.error('Erro ao buscar editais:', error);
        setError('Erro ao buscar editais.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  //FUNÇÕES PARA MANIPULAÇÃO DAS AÇÕES DE CRIAR|EDITAR|DELETAR|RESETAR
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getEditais(params.tenant);
      setEditais(data);
    } catch (error) {
      console.error('Erro ao buscar editais:', error);
    }
  }, [params.tenant]);

  const handleDelete = useCallback(async () => {
    setErrorDelete('');
    try {
      await deleteEdital(params.tenant, editalToDelete.id);
      setEditais(editais.filter(e => e.id !== editalToDelete.id));
      setDeleteModalOpen(false);
      setEditalToDelete(null);
    } catch (error) {
      setErrorDelete(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.")
    }
  }, [params.tenant, editalToDelete, editais]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setEditalToEdit(data);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setEditalToEdit(null);
  };

  const renderModalContent = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModalAndResetData}
    >
      <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
      <h4>{editalToEdit ? 'Editar edital' : 'Novo edital'}</h4>
      <p>{editalToEdit ? 'Edite os dados do edital.' : 'Preencha os dados abaixo para criar um novo edital.'}</p>
      <FormEdital
        tenantSlug={params.tenant}
        initialData={editalToEdit}
        onClose={closeModalAndResetData}
        onSuccess={handleCreateOrEditSuccess}
      />
    </Modal>
  );

  const renderDeleteModalContent = () => (
    <Modal
      isOpen={deleteModalOpen}
      onClose={() => { setDeleteModalOpen(false); setErrorDelete('') }}
    >
      <div className={`${styles.icon} mb-2`}><RiDeleteBinLine /></div>
      <h4>Excluir edital</h4>
      <p className='mt-1'>{`Tem certeza que deseja excluir o edital ${editalToDelete?.titulo}`}</p>
      {errorDelete && <div className={`notification notification-error`}><p className='p5'>{errorDelete}</p></div>}
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

  // Função para filtrar os editais
  const filteredEditais = searchTerm
    ? editais.filter(edital =>
      edital.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : editais;

  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}
      <main>
        <Header
          className="mb-3"
          titulo="Editais"
          subtitulo="Edite e crie os editais da sua instituição"
          descricao="Aqui você gerencia os editais usados nas diversas etapas da iniciação científica."
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

          {!loading && !error && filteredEditais.map((edital) => (
            <div className={styles.card} key={edital.id}>
              <Card
                title={edital.titulo}
                subtitle={edital.ano}
                onEdit={() => openModalAndSetData(edital)}
                onDelete={() => { setDeleteModalOpen(true); setEditalToDelete(edital); }}
                onView={() => { router.push(`/${params.tenant}/gestor/editais/${edital.id}`) }}
              />
            </div>
          ))}

        </div>

      </main>
    </>
  );
}

export default Page;

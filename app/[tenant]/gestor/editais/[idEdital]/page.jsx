'use client';
//HOOKS
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

//ESTILOS E ÍCONES
import styles from "./page.module.scss";
import {  RiEditLine, RiSurveyLine } from '@remixicon/react';

//COMPONENTES
import Header from "@/components/Header";
import Modal from '@/components/Modal';

//FUNÇÕES
import {  getEdital, getFormularios } from '@/app/api/clientReq';
import ItemForm from '@/components/ItemForm';
import FormEditalSelectForm from '@/components/FormEditalSelectForm';


const Page = ({ params }) => {
  //ESTADOS
  //de busca,loading ou erro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  //do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campoToEditFormulario, setCampoToEditFormulario] = useState(null);
  //de armazenamento de dados
  const [edital, setEdital] = useState({});
  const [formularios, setFormularios] = useState([]);
  const [campoToEdit, setCampoToEdit] = useState(null);
  
  //ROTEAMENTO
  const router = useRouter();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const edital = await getEdital(params.tenant, params.idEdital);
        setEdital(edital);
        const formularios = await getFormularios(params.tenant);
        setFormularios(formularios);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError('Ocorreu um erro ao buscar os dados. Tente novamente.');
      }finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idEdital]);

  //FUNÇÕES PARA MANIPULAÇÃO DAS AÇÕES DE CRIAR|EDITAR|DELETAR|RESETAR
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getEdital(params.tenant, params.idEdital);
      setEdital(data);
    } catch (error) {
      console.error('Erro ao buscar formulários:', error);
    }
  }, [params.tenant, params.idEdital]);
  


  const openModalAndSetData = useCallback((formulario, campo) => {
    setIsModalOpen(true);
    setCampoToEdit(campo);
    setCampoToEditFormulario(formulario);
  }, []);
  
  const closeModalAndResetData = useCallback(() => {
    setIsModalOpen(false);
    setCampoToEdit(null);
  }, []);

  const renderModalContent = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModalAndResetData}
    >
      <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
      <h4>{`Definir formulário de ${campoToEdit === 'PlanoDeTrabalho'&&'Plano de Trabalho'}`}</h4>
      <p>{`O formulário selecionado servirá para o cadastro do ${campoToEdit === 'PlanoDeTrabalho'&&'Plano de Trabalho'}`}</p>
      <FormEditalSelectForm
        editalId={edital.id}
        tenantSlug={params.tenant}
        initialData={campoToEditFormulario}
        arraySelect={formularios}
        keyFormulario={`form${campoToEdit}Id`}
        onSuccess={handleCreateOrEditSuccess}
        onClose={closeModalAndResetData}
      />
    </Modal>
  );
  const renderItemForm = (tipo, formId) => (
    <ItemForm
      tipoFormulario={tipo}
      formulario={formId}
      nomeFormulario={getNomeFormulario(formId)}
      onEdit={() => openModalAndSetData(formId, tipo)}
      onView={() => { router.push(`/${params.tenant}/gestor/formularios/${formId}`) }}
    />
  );
  
  
  if (loading) {
    return <p>Carregando...</p>;
  }

  const getNomeFormulario = (id) => {
    const formulario = formularios.find(form => form.id === id);
    return formulario ? formulario.titulo : 'Não encontrado';
  };
  return (
    <>
      {renderModalContent()}

      <main className={styles.main}>
        <Header
          className="mb-3"
          titulo="Edital"
          subtitulo={`${edital.titulo} - ${edital.ano}`}
        />
        <div className={styles.content}>
          <div className={styles.head}>
            <div className={styles.headIcon}>
              <RiSurveyLine/>
            </div>
            <div className={styles.item}>
              <h5>Formulários</h5>
              <p>Aqui você gerencia quais formulários serão utilizados neste edital.</p>
              {renderItemForm("Orientador", edital.formOrientadorId)}
              {renderItemForm("Coorientador", edital.formCoorientadorId)}
              {renderItemForm("Aluno", edital.formAlunoId)}
              {renderItemForm("Projeto", edital.formProjetoId)}
              {renderItemForm("PlanoDeTrabalho", edital.formPlanoDeTrabalhoId)}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;

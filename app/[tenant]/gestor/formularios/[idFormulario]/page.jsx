'use client';
//HOOKS
import { useEffect, useState, useCallback } from 'react';

//ESTILOS E ÍCONES
import styles from "./page.module.scss";
import { RiAddCircleLine, RiDeleteBin6Line, RiDeleteBinLine, RiEditLine } from '@remixicon/react';

//COMPONENTES
import Header from "@/components/Header";
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import FormCampo from '@/components/FormCampo';

//FUNÇÕES
import { getCampos, deleteCampo, getFormulario } from '@/app/api/clientReq';


const Page = ({ params }) => {
  //ESTADOS
  //de busca,loading ou erro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDelete, setErrorDelete] = useState(null);
  //do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  //de armazenamento de dados
  const [formulario, setFormulario] = useState({});
  const [campos, setCampos] = useState([]);
  const [campoToEdit, setCampoToEdit] = useState(null);
  const [campoToDelete, setCampoToDelete] = useState(null);
  
  const camposObrigatorios = [{label:'CPF'},{label:'Nome'},{label:'Data de nascimento'}]
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const formulario = await getFormulario(params.tenant, params.idFormulario);
        setFormulario(formulario);
        const campos = await getCampos(params.tenant, params.idFormulario);
        setCampos(campos);
      } catch (error) {
        console.error('Erro ao buscar campos:', error);
      }finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idFormulario]);

  //FUNÇÕES PARA MANIPULAÇÃO DAS AÇÕES DE CRIAR|EDITAR|DELETAR|RESETAR
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getCampos(params.tenant, params.idFormulario);
      setCampos(data);
    } catch (error) {
      console.error('Erro ao buscar formulários:', error);
    }
  }, [params.tenant,params.idFormulario]);
  
  const handleDelete = useCallback(async () => {
    setErrorDelete('');
    try {
      await deleteCampo(params.tenant, params.idFormulario, campoToDelete.id);
      setCampos(campos.filter(c => c.id !== campoToDelete.id));
      setDeleteModalOpen(false);
      setCampoToDelete(null);
    } catch (error) {
      setErrorDelete(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.")
    }
  }, [params.tenant, params.idFormulario, campoToDelete, campos]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setCampoToEdit(data);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setCampoToEdit(null);
  };

  const renderModalContent = () => (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModalAndResetData}
    >
      <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
      <h4>{campoToEdit ? 'Editar campo' : 'Novo campo'}</h4>
      <p>{campoToEdit ? 'Edite os dados do campo.' : 'Preencha os dados abaixo para criar um novo campo.'}</p>
      <FormCampo
        tenantSlug={params.tenant}
        formularioId={params.idFormulario}
        initialData={campoToEdit}
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
      <h4>Excluir campo</h4>
        <p>Tem certeza que deseja excluir este campo?</p>
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
  
  if (loading) {
    return <p>Carregando...</p>;
  }

  
  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}

      <main className={styles.main}>
        <Header
          className="mb-3"
          titulo={`Formulário de ${formulario.tipo === 'planoDeTrabalho' ? 'plano de trabalho' : formulario.tipo}`}
          subtitulo={formulario.titulo}
          descricao={formulario.descricao}
        />
        <div className={styles.content}>
          <h5>Campos</h5>
          
          <div className={styles.campos}>
          {(formulario.tipo ==='aluno' || formulario.tipo ==='orientador') && 
          camposObrigatorios.map((campo,i) => (
              <div className={styles.campo} key={i}>
              <div className={styles.left}>
                <div className={styles.label}>
                  <h6>{campo.label}</h6>
                </div>
                <div className={styles.required}>
                    <p>obrigatório</p>
                </div>
              </div>
            </div>
            ))}
            {campos.map((campo) => (
              <div className={styles.campo} key={campo.id}>
                <div className={styles.left}>
                  <div className={styles.label}>
                    <h6>{campo.label}</h6>
                  </div>
                  {campo.obrigatorio && (
                    <div className={styles.required}>
                      <p>obrigatório</p>
                    </div>
                  )}
                </div>
                <div className={styles.actions}>
                  <div className={styles.btn1}>
                    <Button 
                      onClick={() => openModalAndSetData(campo)}
                      icon={RiEditLine}
                      className="btn-secondary"
                      type="button"
                    />
                  </div>
                  <div className={styles.btn2}>
                    <Button
                      onClick={() => { setDeleteModalOpen(true); setCampoToDelete(campo); }}
                      icon={RiDeleteBin6Line}
                      className="btn-error"
                      type="button"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className={styles.addItem} onClick={() => openModalAndSetData(null)}>
              <div className={styles.icon}>
                <RiAddCircleLine />
              </div>
              <p>Criar novo</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;

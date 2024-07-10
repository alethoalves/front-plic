'use client';
import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import { RiAddCircleLine, RiDeleteBin6Line, RiDeleteBinLine, RiEditLine } from '@remixicon/react';
import styles from "./page.module.scss";
import { getCampos, deleteCampo, getCampo, getFormulario } from '@/app/api/clientReq';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import FormCampo from '@/components/FormCampo';
import { useRouter } from 'next/navigation';

const Page = ({ params }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campoToEdit, setCampoToEdit] = useState(null);
  const [campos, setCampos] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [campoToDelete, setCampoToDelete] = useState(null);
  const [formulario, setFormulario] = useState({});
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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

  const handleCreateOrEditSuccess = async () => {
    try {
      const data = await getCampos(params.tenant, params.idFormulario);
      setCampos(data);
    } catch (error) {
      console.error('Erro ao buscar campos:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCampo(params.tenant, params.idFormulario, campoToDelete.id);
      setCampos(campos.filter(c => c.id !== campoToDelete.id));
      setDeleteModalOpen(false);
      setCampoToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar campo:', error);
    }
  };
  if (loading) {
    return <p>Carregando...</p>;
  }

  
  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCampoToEdit(null); }}
      >
        <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
        <h4>{campoToEdit ? 'Editar campo' : 'Novo campo'}</h4>
        <p>{campoToEdit ? 'Edite os dados do campo.' : 'Preencha os dados abaixo para criar um novo campo.'}</p>
        <FormCampo
          tenantSlug={params.tenant}
          formularioId={params.idFormulario}
          initialData={campoToEdit}
          onClose={() => { setIsModalOpen(false); setCampoToEdit(null); }}
          onSuccess={handleCreateOrEditSuccess}
        />
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      >
        <div className={`${styles.icon} mb-2`}><RiDeleteBinLine /></div>
        <h4>Excluir campo</h4>
        <p>Tem certeza que deseja excluir este campo?</p>
        <div className={styles.btnSubmit}>
          <Button
            className="btn-error mt-4"
            onClick={handleDelete}
          >
            Excluir
          </Button>
        </div>
      </Modal>

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
                      onClick={() => { setIsModalOpen(true); setCampoToEdit(campo); }}
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
            <div className={styles.addItem} onClick={() => { setIsModalOpen(true); setCampoToEdit(null); }}>
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

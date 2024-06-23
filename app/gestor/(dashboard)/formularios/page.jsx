'use client'
import Header from "@/components/Header";
import { RiAddCircleLine,RiEditLine,RiSearchLine } from '@remixicon/react';
import Input from "@/components/Input";
import Button from "@/components/Button";
import styles from "./page.module.scss";
import { useState } from 'react';
import { buscador } from '@/lib/zodSchemas/buscador';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
const Page = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false)
    // Formulário
    const handleFormSubmit = async (data) => {
      
      setLoading(true);
      setErrorMessage('');
      
      try {
        const response = await signin(data);
        if(response.success){
          console.log('sucesso')
        }
      } catch (error) {
        console.error('Error:', error);
        setErrorMessage(error.response?.data?.error?.message ?? "Erro na conexão com o servidor.")
      } finally {
        setLoading(false);
      }
    };
   
    const { control, handleSubmit} = useForm({
      resolver: zodResolver(buscador),
      defaultValues: {
        value: ''
      },
    });
  return (
    <>
    <Modal 
      isOpen={isModalOpen}
      onClose={()=>{setIsModalOpen(false)}}
    >
      <div className={styles.icon}><RiEditLine/></div>
      <h4>Novo formulário</h4>
    </Modal>
    <main>
    
    <Header 
    className="mb-3"
    titulo="Formulários"
    subtitulo="Edite e crie os formulários da sua instituição"
    descricao="Aqui você gerencia os formulários usados nas diversas etapas da iniciação científica."
    />
    <div >
        <form className={`${styles.buscador}`} onSubmit={handleSubmit(handleFormSubmit)}>
            <div className={`${styles.input}`}>
              <Input
                control={control}
                name="value"
                label='Buscar'
                inputType="text" // text, password
                placeholder='Pesquise aqui'
                //autoFocus
                disabled={loading}
              />
            </div>
            <div className={`${styles.btnBuscador}`}>
              <Button
                  icon={RiSearchLine}
                  className="btn-primary"
                  type="submit" // submit, reset, button
                  disabled={loading}
                >{loading ? 'Carregando...' : 'Pesquisar'}
              </Button>
            </div>
            
        </form>
    </div>
    <div className={`${styles.content}`}>
      <div onClick={()=>{setIsModalOpen(true)}} className={`${styles.btnNewItem}`}>
        <div className={`${styles.icon}`}>
          <RiAddCircleLine/>
        </div>
        <p>Criar novo</p> 
      </div>
      
      <div className={styles.card}>
        <Card 
        loading={loading}
        tipoForm="atividade"
        tituloForm="Resumo"
        />
      </div>
      <div className={styles.card}>
        <Card 
        loading={loading}
        tipoForm="atividade"
        tituloForm="Resumo"
        />
      </div>
      <div className={styles.card}>
        <Card 
        loading={loading}
        tipoForm="atividade"
        tituloForm="Resumo"
        />
      </div>
      <div className={styles.card}>
        <Card 
        loading={loading}
        tipoForm="atividade"
        tituloForm="Resumo"
        />
      </div>
      <div className={styles.card}>
        <Card 
        loading={loading}
        tipoForm="atividade"
        tituloForm="Resumo"
        />
      </div>
      
    </div>
  </main>
    </>
    
  
  );
}

export default Page;
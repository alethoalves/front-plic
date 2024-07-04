'use client'
import Header from "@/components/Header";
import { RiAddCircleLine,RiEditLine,RiSearchLine } from '@remixicon/react';
import styles from "./page.module.scss";
import { useState } from 'react';
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import BuscadorFormularios from "@/components/BuscadorFormularios";
import FormNewFormulario from "@/components/FormNewFormulario";
const Page = ({params}) => {
  
  const [isModalOpen, setIsModalOpen] = useState(false)
    
  return (
    <>
    <Modal 
      isOpen={isModalOpen}
      onClose={()=>{setIsModalOpen(false)}}
    >
      <div className={`${styles.icon} mb-2`}><RiEditLine/></div>
      <h4>Novo formulário </h4>
      <p>Preencha os dados abaixo para criar um novo formulário.</p>
      <FormNewFormulario/>
    </Modal>
    <main>
    
    <Header 
    className="mb-3"
    titulo="Formulários"
    subtitulo="Edite e crie os formulários da sua instituição"
    descricao="Aqui você gerencia os formulários usados nas diversas etapas da iniciação científica."
    />
    <div >
        <BuscadorFormularios/>
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
        title="atividade"
        subtitle="Resumo"
        />
      </div>
      
      
    </div>
  </main>
    </>
    
  
  );
}

export default Page;
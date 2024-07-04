'use client'
import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import { RiAddCircleLine, RiAddLine, RiEditLine, RiFileExcelLine, RiSearchLine } from '@remixicon/react';
import styles from "./page.module.scss";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import BuscadorFormularios from "@/components/BuscadorFormularios";
import { getEditais } from '@/app/api/clientReq';
import Button from '@/components/Button';
import Actions from '@/components/Actions';
import FormNewInscricao from '@/components/FormNewInscricao';
import Table from '@/components/Table';

const Page = ({ params }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEditais = async () => {
      try {
        console.log(params.tenant)
        const fetchedEditais = await getEditais(params.tenant);
        fetchedEditais.sort((a, b) => b.ano - a.ano);
        setEditais(fetchedEditais || []);
        console.log(fetchedEditais)
      } catch (error) {
        console.error("Erro ao buscar editais:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEditais();
  }, [params.tenant]);

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false) }}
      >
        <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
        <h4>Nova Inscrição</h4>
        <p>Preencha os dados abaixo para iniciar o processo de inscrição.</p>
        <FormNewInscricao data={{editais}}/>
      </Modal>
      
      <main className={styles.main}>
      <Actions onClickPlus={() => { setIsModalOpen(true) }}/>
        
        <Header
          className="mb-3"
          titulo="Inscrições"
          subtitulo="Inscrições da Iniciação Científica"
          descricao="Aqui você gerencia as inscrições nos editais da Iniciação Científica."
        />
        
        <div>
          <BuscadorFormularios />
        </div>
        
        <div className={`${styles.content}`}>
       
          <Table/>

         
        </div>
      </main>
    </>
  );
}

export default Page;

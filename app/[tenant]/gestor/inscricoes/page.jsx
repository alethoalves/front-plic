// page.jsx

'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { RiEditLine } from '@remixicon/react';
import styles from "./page.module.scss";
import Modal from "@/components/Modal";
import { getEditais, getInscricoes } from '@/app/api/clientReq';
import Actions from '@/components/Actions';
import FormNewInscricao from '@/components/FormNewInscricao';
import Table from '@/components/Table';

const Page = ({ params }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editais, setEditais] = useState([]);
  const [inscricoes, setInscricoes] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => { 
      setLoading(true);
      try {
        const fetchedEditais = await getEditais(params.tenant);
        const fetchedInscricoes = await getInscricoes(params.tenant, pageInfo.page, pageInfo.limit);
        if (fetchedEditais) {
          fetchedEditais.sort((a, b) => b.ano - a.ano);
          setEditais(fetchedEditais);
        }
        if (fetchedInscricoes) {
          setInscricoes(fetchedInscricoes.inscricoes);
          setPageInfo(prev => ({ ...prev, total: fetchedInscricoes.total }));
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [params.tenant, pageInfo.page, pageInfo.limit]); 
  const handleRowClick = (id) => {
    // Navega para a página de detalhes da inscrição
    router.push(`/${params.tenant}/gestor/inscricoes/${id}`);
  };


  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false) }}
      >
        <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
        <h4>Nova Inscrição</h4>
        <p>Preencha os dados abaixo para iniciar o processo de inscrição.</p>
        <FormNewInscricao data={{ editais }} tenant={params.tenant} />
      </Modal>
      
      <main className={styles.main}>
        <Actions onClickPlus={() => { setIsModalOpen(true) }}/>
        
        <Header
          className="mb-3"
          titulo="Inscrições"
          subtitulo="Inscrições da Iniciação Científica"
          descricao="Aqui você gerencia as inscrições nos editais da Iniciação Científica."
        />
      
        
        <div className={`${styles.content}`}>
        {loading&&<p>Carregadno...</p>}
        {!loading&&
          <Table data={inscricoes} pageInfo={pageInfo} setPageInfo={setPageInfo} onRowClick={handleRowClick} />
        }
        
        </div>
      </main>
    </>
  );
}

export default Page;

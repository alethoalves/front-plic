'use client'
import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import { RiAddCircleLine, RiEditLine, RiSearchLine } from '@remixicon/react';
import styles from "./page.module.scss";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import BuscadorFormularios from "@/components/BuscadorFormularios";
import FormNewFormulario from "@/components/FormNewFormulario";
import { getEditais } from '@/app/api/clientReq';

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
        <h4>Novo Edital </h4>
        <p>Preencha os dados abaixo para criar um novo edital.</p>
        <FormNewFormulario />
      </Modal>
      <main>
        <Header
          className="mb-3"
          titulo="Editais"
          subtitulo="Crie e edite os editais de Iniciação Científica"
          descricao="Aqui você gerencia os editais do seu programa de iniciação científica."
        />
        <div>
          <BuscadorFormularios />
        </div>
        <div className={`${styles.content}`}>
          <div onClick={() => { setIsModalOpen(true) }} className={`${styles.btnNewItem}`}>
            <div className={`${styles.icon}`}>
              <RiAddCircleLine />
            </div>
            <p>Criar novo</p>
          </div>

          {loading ? (
            <p>Carregando...</p>
          ) : (
            < >
              {editais.length > 0 ? (
                editais.map(edital => (
                  <div className={styles.card} key={edital.id}>
                    <Card
                      title={edital.titulo}
                      subtitle={edital.ano.toString()}
                    />
                  </div>
                ))
              ) : (
                <p>Nenhum edital encontrado</p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default Page;

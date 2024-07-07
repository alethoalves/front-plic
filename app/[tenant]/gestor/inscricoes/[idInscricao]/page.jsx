'use client';
import { useEffect, useState } from 'react';
import Header from "@/components/Header";
import { RiAddCircleLine, RiArrowDownSLine, RiArrowUpSLine, RiDeleteBin6Line, RiEditLine, RiFolderUserLine, RiGraduationCapLine, RiGroupLine, RiInformationLine } from '@remixicon/react';
import styles from "./page.module.scss";
import NavButton from '@/components/NavButton';
import { getInscricao, getParticipacoes, createParticipacao, deleteParticipacao } from '@/app/api/clientReq';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
//import FormNewParticipacao from '@/components/FormNewParticipacao'; // Assumindo que você tem este componente

const Page = ({ params }) => {
  const [activeContent, setActiveContent] = useState(0);
  const [inscricao, setInscricao] = useState(null);
  const [participacoes, setParticipacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedParticipacao, setSelectedParticipacao] = useState(null);

  useEffect(() => {
    const fetchInscricao = async () => {
      setLoading(true);
      try {
        const fetchedInscricao = await getInscricao(params.tenant, params.idInscricao);
        setInscricao(fetchedInscricao);
        const fetchedParticipacoes = await getParticipacoes(params.tenant, params.idInscricao);
        setParticipacoes(fetchedParticipacoes);
      } catch (error) {
        console.error("Erro ao buscar inscrição:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInscricao();
  }, [params.tenant, params.idInscricao]);

  const handleContentChange = (index) => {
    setActiveContent(index);
  };

  const handleAddParticipacao = async (data) => {
    try {
      const newParticipacao = await createParticipacao(params.tenant, params.idInscricao, data);
      setParticipacoes([...participacoes, newParticipacao]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar participação:", error);
    }
  };

  const handleDeleteParticipacao = async () => {
    try {
      await deleteParticipacao(params.tenant, params.idInscricao, selectedParticipacao.id);
      setParticipacoes(participacoes.filter(p => p.id !== selectedParticipacao.id));
      setIsModalOpen(false);
      setSelectedParticipacao(null);
    } catch (error) {
      console.error("Erro ao deletar participação:", error);
    }
  };

  const toggleBodyItemList = (id) => {
    setParticipacoes(participacoes.map(p => 
      p.id === id ? { ...p, isOpen: !p.isOpen } : p
    ));
  };

  const openAddModal = () => {
    setModalType('add');
    setSelectedParticipacao(null);
    setIsModalOpen(true);
  };

  const openEditModal = (participacao) => {
    setModalType('edit');
    setSelectedParticipacao(participacao);
    setIsModalOpen(true);
  };

  const openDeleteModal = (participacao) => {
    setModalType('delete');
    setSelectedParticipacao(participacao);
    setIsModalOpen(true);
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (!inscricao) {
    return <p>Inscrição não encontrada</p>;
  }

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false) }}
      >
        {modalType === 'add' && (
          <>
            <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
            <h4>Nova Participação</h4>
            {/*
            <FormNewParticipacao onSubmit={handleAddParticipacao} />
            */}
          </>
        )}
        {modalType === 'edit' && (
          <>
            <div className={`${styles.icon} mb-2`}><RiEditLine /></div>
            <h4>Editar Participação</h4>
            {/*
            <FormNewParticipacao participacao={selectedParticipacao} onSubmit={handleAddParticipacao} />
            */}
          </>
        )}
        {modalType === 'delete' && (
          <>
            <h4>Confirmar Exclusão</h4>
            <p>Você tem certeza que deseja excluir esta participação?</p>
            <Button onClick={handleDeleteParticipacao} className="btn-primary">Confirmar</Button>
            <Button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</Button>
          </>
        )}
      </Modal>
      <main className={styles.main}>
        <Header
          className="mb-3"
          titulo={`Inscrição nº ${inscricao.id}`}
          subtitulo={`Edital ${inscricao.edital.titulo} - ${inscricao.edital.ano}`}
          descricao={<><strong>Proponente: </strong>{inscricao.proponente.nome}</>}
        />
        <div className={styles.content}>
          <div className={styles.nav}>
            <NavButton
              icon={RiInformationLine}
              label="Dados gerais"
              isActive={activeContent === 0}
              onClick={() => handleContentChange(0)}
            />
            <NavButton
              icon={RiGroupLine}
              label="Orientadores"
              isActive={activeContent === 1}
              onClick={() => handleContentChange(1)}
            />
            <NavButton
              icon={RiGraduationCapLine}
              label="Alunos"
              isActive={activeContent === 2}
              onClick={() => handleContentChange(2)}
            />
            <NavButton
              icon={RiFolderUserLine}
              label="Planos de Trabalho"
              isActive={activeContent === 3}
              onClick={() => handleContentChange(3)}
            />
            <NavButton
              icon={RiInformationLine}
              label="Avaliações"
              isActive={activeContent === 4}
              onClick={() => handleContentChange(4)}
            />
          </div>
          <div className={styles.navContent}>
            {activeContent === 0 && <div className={styles.content}><h4>Conteúdo 1</h4></div>}
            {activeContent === 1 && 
              <div className={styles.content}>
                <div className={styles.header}>
                  <div className={styles.icon}><RiGroupLine/></div>
                  <h5>Orientadores</h5>
                </div>
                <div className={styles.mainContent}>
                  <div className={styles.list}>
                    <div className={styles.addItem} onClick={openAddModal}>
                      <div className={styles.icon}>
                        <RiAddCircleLine />
                      </div>
                      <p>Add orientador</p>
                    </div>
                    {participacoes?.map(participacao => (
                      <div key={participacao.id} className={styles.itemList}>
                        <div className={styles.headItemList} onClick={() => toggleBodyItemList(participacao.id)}>
                          <div className={styles.info}>
                            <p>{participacao.nome}</p>
                            <div className={styles.status}>
                              <p className={styles[participacao.status.toLowerCase()]}>{participacao.status}</p>
                            </div>
                          </div>
                          <div className={styles.viewInfo} >
                            <div className={styles.btn}>
                              {participacao.isOpen ? <RiArrowUpSLine/> : <RiArrowDownSLine/>}
                            </div>
                          </div>
                        </div>
                        {participacao.isOpen && (
                          <div className={styles.bodyItemList}>
                            <div className={styles.actions}>
                              <div className={styles.btn1}>
                                <Button
                                  onClick={() => openEditModal(participacao)}
                                  icon={RiEditLine}
                                  className="btn-primary"
                                  type="button"
                                >
                                  Editar
                                </Button>
                              </div>
                              <div className={styles.btn2}>
                                <Button
                                  onClick={() => openDeleteModal(participacao)}
                                  icon={RiDeleteBin6Line}
                                  className="btn-secondary"
                                  type="button"
                                >
                                  Excluir
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            }
            {activeContent === 2 && <div className={styles.content}><h4>Conteúdo 3</h4></div>}
            {activeContent === 3 && <div className={styles.content}><h4>Conteúdo 4</h4></div>}
            {activeContent === 4 && <div className={styles.content}><h4>Conteúdo 5</h4></div>}
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;

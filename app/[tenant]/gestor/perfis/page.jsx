"use client";
//HOOKS
import { useEffect, useState, useCallback } from "react";

//ESTILOS E ÍCONES
import styles from "./page.module.scss";
import {
  RiAddCircleLine,
  RiDeleteBin6Line,
  RiDeleteBinLine,
  RiEditLine,
} from "@remixicon/react";

//COMPONENTES
import Header from "@/components/Header";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import FormCampo from "@/components/FormCampo";

//FUNÇÕES
import { getCampos, deleteCampo, getFormulario } from "@/app/api/clientReq";
import { deleteCargo, getCargos } from "@/app/api/client/cargo";
import CPFVerificationForm from "@/components/CPFVerificationForm";
import NewCargo from "@/components/NewCargo";

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
  const [cargos, setCargos] = useState({});
  const [campos, setCampos] = useState([]);
  const [cargoToEdit, setCargoToEdit] = useState(null);
  const [cargoToDelete, setCargoToDelete] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);

  const camposObrigatorios = [
    { label: "CPF" },
    { label: "Nome" },
    { label: "Data de nascimento" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cargos = await getCargos(params.tenant);
        setCargos(cargos);
      } catch (error) {
        console.error("Erro ao buscar campos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant]);

  //FUNÇÕES PARA MANIPULAÇÃO DAS AÇÕES DE CRIAR|EDITAR|DELETAR|RESETAR
  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getCargos(params.tenant);
      setCargos(data);
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
    }
  }, [params.tenant]);

  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    try {
      await deleteCargo(params.tenant, cargoToDelete.id);
      setCargos(cargos.filter((c) => c.id !== cargoToDelete.id));
      setDeleteModalOpen(false);
      setCargoToDelete(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
    }
  }, [params.tenant, cargoToDelete, cargos]);

  const openModalAndSetData = (data) => {
    setIsModalOpen(true);
    setCargoToEdit(data);
    setVerifiedData(null);
  };

  const closeModalAndResetData = () => {
    setIsModalOpen(false);
    setCargoToEdit(null);
  };

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>Novo administrador</h4>
      <p>Preencha os dados abaixo para criar um novo administrador.</p>
      <CPFVerificationForm
        tenantSlug={params.tenant}
        onCpfVerified={setVerifiedData}
      />
      {verifiedData && (
        <NewCargo
          tenantSlug={params.tenant}
          inscricaoId={params.idInscricao}
          initialData={verifiedData}
          onClose={closeModalAndResetData}
          onSuccess={handleCreateOrEditSuccess}
        />
      )}
    </Modal>
  );

  const renderDeleteModalContent = () => (
    <Modal
      isOpen={deleteModalOpen}
      edit={false}
      onClose={() => {
        setDeleteModalOpen(false);
        setErrorDelete("");
      }}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiDeleteBinLine />
      </div>
      <h4>Excluir Administrador</h4>
      <p>Tem certeza que deseja excluir este administrador?</p>
      {errorDelete && (
        <div className={`notification notification-error`}>
          <p className="p5">{errorDelete}</p>
        </div>
      )}
      <div className={styles.btnSubmit}>
        <Button className="btn-error mt-4" onClick={handleDelete}>
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
          titulo="Administradores"
          descricao="Gerencie os administradores do Programa de Iniciação Científica"
        />
        <div className={styles.content}>
          <div className={styles.campos}>
            <div
              className={styles.addItem}
              onClick={() => openModalAndSetData(null)}
            >
              <div className={styles.icon}>
                <RiAddCircleLine />
              </div>
              <p>Criar novo</p>
            </div>
            {cargos.map((item) => (
              <div className={styles.campo} key={item.id}>
                <div className={styles.left}>
                  <div className={styles.label}>
                    <h6>{item.user.nome}</h6>
                  </div>
                  {item.cargo && (
                    <div className={styles.required}>
                      <p>{item.cargo}</p>
                    </div>
                  )}
                </div>
                <div className={styles.actions}>
                  <div className={styles.btn2}>
                    <Button
                      onClick={() => {
                        setDeleteModalOpen(true);
                        setCargoToDelete(item);
                      }}
                      icon={RiDeleteBin6Line}
                      className="btn-error"
                      type="button"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default Page;

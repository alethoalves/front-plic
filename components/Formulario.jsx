"use client";
//HOOKS
import { useEffect, useState, useCallback } from "react";

//ESTILOS E ÍCONES
import styles from "./Formulario.module.scss";
import {
  RiAddCircleLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiDeleteBin6Line,
  RiDeleteBinLine,
  RiEditLine,
} from "@remixicon/react";

//COMPONENTES
import Header from "@/components/Header";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import FormCampo from "@/components/Formularios/FormCampo";

//FUNÇÕES
import { getFormulario } from "@/app/api/client/formulario";
import { getCampos, deleteCampo, updateCampo } from "@/app/api/client/campo";

const Formulario = ({ params }) => {
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

  const camposObrigatoriosAlunoEorientador = [
    { label: "CPF" },
    { label: "Nome" },
    { label: "Data de nascimento" },
  ];
  const camposObrigatoriosProjetoEplanoDeTrabalho = [
    { label: "Título" },
    { label: "Área do conhecimento" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const formulario = await getFormulario(
          params.tenant,
          params.idFormulario
        );
        setFormulario(formulario);
        const campos = await getCampos(params.tenant, params.idFormulario);
        // Ordene os campos pela propriedade ordem
        const sortedCampos = campos.sort((a, b) => a.ordem - b.ordem);
        setCampos(sortedCampos);
      } catch (error) {
        console.error("Erro ao buscar campos:", error);
      } finally {
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
      console.error("Erro ao buscar formulários:", error);
    }
  }, [params.tenant, params.idFormulario]);

  const handleDelete = useCallback(async () => {
    setErrorDelete("");
    try {
      await deleteCampo(params.tenant, params.idFormulario, campoToDelete.id);
      setCampos(campos.filter((c) => c.id !== campoToDelete.id));
      setDeleteModalOpen(false);
      setCampoToDelete(null);
    } catch (error) {
      setErrorDelete(
        error.response?.data?.message ?? "Erro na conexão com o servidor."
      );
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
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>{campoToEdit ? "Editar campo" : "Novo campo"}</h4>
      <p>
        {campoToEdit
          ? "Edite os dados do campo."
          : "Preencha os dados abaixo para criar um novo campo."}
      </p>
      <FormCampo
        tenantSlug={params.tenant}
        formularioId={params.idFormulario}
        initialData={campoToEdit}
        onClose={closeModalAndResetData}
        onSuccess={handleCreateOrEditSuccess}
        campos={campos}
      />
    </Modal>
  );

  const renderDeleteModalContent = () => (
    <Modal
      isOpen={deleteModalOpen}
      onClose={() => {
        setDeleteModalOpen(false);
        setErrorDelete("");
      }}
    >
      <div className={`${styles.icon} mb-2`}>
        <RiDeleteBinLine />
      </div>
      <h4>Excluir campo</h4>
      <p>Tem certeza que deseja excluir este campo?</p>
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
  const swapCampoOrdem = async (indexA, indexB) => {
    const prev = [...campos];
    const campoA = { ...campos[indexA] };
    const campoB = { ...campos[indexB] };
    const ordemA = campoA.ordem;
    const ordemB = campoB.ordem;

    campoA.ordem = ordemB;
    campoB.ordem = ordemA;

    const updated = [...campos];
    updated[indexA] = campoA;
    updated[indexB] = campoB;
    setCampos(updated.sort((a, b) => a.ordem - b.ordem));

    try {
      await updateCampo(params.tenant, params.idFormulario, campoA.id, { ordem: campoA.ordem.toString() });
      await updateCampo(params.tenant, params.idFormulario, campoB.id, { ordem: campoB.ordem.toString() });
    } catch (error) {
      console.error("Erro ao reordenar campo:", error);
      setCampos(prev);
    }
  };

  const moveCampoUp = (campo) => {
    const index = campos.findIndex((c) => c.id === campo.id);
    if (index === 0) return;
    swapCampoOrdem(index, index - 1);
  };

  const moveCampoDown = (campo) => {
    const index = campos.findIndex((c) => c.id === campo.id);
    if (index === campos.length - 1) return;
    swapCampoOrdem(index, index + 1);
  };

  if (loading) {
    return <p className="mt-2">Carregando...</p>;
  }
  return (
    <>
      {renderModalContent()}
      {renderDeleteModalContent()}

      <main className={styles.main}>
        <div className={styles.content}>
          <h5>
            {`Formulário de ${
              formulario?.tipo === "planoDeTrabalho"
                ? "plano de trabalho"
                : formulario?.tipo
            }`}
          </h5>
          {loading && <p className="mt-2">Carregando...</p>}

          {error && <p>{error}</p>}
          <div className={styles.campos}>
            {(formulario?.tipo === "aluno" ||
              formulario?.tipo === "orientador") &&
              camposObrigatoriosAlunoEorientador.map((campo, i) => (
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
            {(formulario?.tipo === "projeto" ||
              formulario?.tipo === "planoDeTrabalho") &&
              camposObrigatoriosProjetoEplanoDeTrabalho.map((campo, i) => (
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
            {campos.map((campo, index) => (
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
                      onClick={() => {
                        setDeleteModalOpen(true);
                        setCampoToDelete(campo);
                      }}
                      icon={RiDeleteBin6Line}
                      className="btn-error"
                      type="button"
                    />
                  </div>
                  <div className={styles.upDown}>
                    <div
                      className={styles.up}
                      onClick={() => moveCampoUp(campo)}
                    >
                      <RiArrowUpLine />
                    </div>
                    <div
                      className={styles.down}
                      onClick={() => moveCampoDown(campo)}
                    >
                      <RiArrowDownLine />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div
              className={styles.addItem}
              onClick={() => openModalAndSetData(null)}
            >
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

export default Formulario;

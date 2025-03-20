import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./EditalFormularios.module.scss";
import { RiEditLine, RiSurveyLine } from "@remixicon/react";
import Modal from "@/components/Modal";
import ItemForm from "@/components/ItemForm";
import FormEditalSelectForm from "@/components/Formularios/FormEditalSelectForm";
import { getEdital } from "@/app/api/client/edital";
import { getFormularios } from "@/app/api/client/formulario";

const EditalFormularios = ({ params }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campoToEditFormulario, setCampoToEditFormulario] = useState(null);
  const [edital, setEdital] = useState({});
  const [formularios, setFormularios] = useState([]);
  const [campoToEdit, setCampoToEdit] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const edital = await getEdital(params.tenant, params.idEdital);
        setEdital(edital);
        const formularios = await getFormularios(params.tenant);
        setFormularios(formularios);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setError("Ocorreu um erro ao buscar os dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.tenant, params.idEdital]);

  const handleCreateOrEditSuccess = useCallback(async () => {
    try {
      const data = await getEdital(params.tenant, params.idEdital);
      setEdital(data);
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
    }
  }, [params.tenant, params.idEdital]);

  const openModalAndSetData = useCallback((formulario, campo) => {
    setIsModalOpen(true);
    setCampoToEdit(campo);
    setCampoToEditFormulario(formulario);
  }, []);

  const closeModalAndResetData = useCallback(() => {
    setIsModalOpen(false);
    setCampoToEdit(null);
  }, []);

  const renderModalContent = () => (
    <Modal isOpen={isModalOpen} onClose={closeModalAndResetData}>
      <div className={`${styles.icon} mb-2`}>
        <RiEditLine />
      </div>
      <h4>{`Formulário de ${
        campoToEdit === "PlanoDeTrabalho" ? "Plano de Trabalho" : campoToEdit
      }`}</h4>
      <p>{`O formulário selecionado servirá para o cadastro do ${
        campoToEdit === "PlanoDeTrabalho" ? "Plano de Trabalho" : campoToEdit
      }`}</p>
      <FormEditalSelectForm
        editalId={edital.id}
        tenantSlug={params.tenant}
        initialData={campoToEditFormulario}
        arraySelect={formularios}
        keyFormulario={`form${campoToEdit}Id`}
        onSuccess={handleCreateOrEditSuccess}
        onClose={closeModalAndResetData}
      />
    </Modal>
  );

  const renderItemForm = (tipo, formId) => (
    <ItemForm
      tipoFormulario={tipo}
      formulario={formId}
      nomeFormulario={getNomeFormulario(formId)}
      onEdit={() => openModalAndSetData(formId, tipo)}
      onView={() => {
        router.push(`/${params.tenant}/gestor/formularios/${formId}`);
      }}
    />
  );

  const getNomeFormulario = (id) => {
    const formulario = formularios.find((form) => form.id === id);
    return formulario ? formulario.titulo : "Não encontrado";
  };

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      {renderModalContent()}
      {renderItemForm("Orientador", edital.formOrientadorId)}
      {
        //renderItemForm("Coorientador", edital.formCoorientadorId)
      }
      {renderItemForm("Aluno", edital.formAlunoId)}
      {
        //renderItemForm("Projeto", edital.formProjetoId)
      }
      {renderItemForm("PlanoDeTrabalho", edital.formPlanoDeTrabalhoId)}
    </>
  );
};

export default EditalFormularios;

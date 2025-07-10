"use client";
import Button from "@/components/Button";

import {
  RiAddCircleLine,
  RiArrowLeftCircleLine,
  RiEditLine,
} from "@remixicon/react";
import styles from "./ProjetoController.module.scss";
import { useEffect, useState } from "react";
import FormProjeto from "../Formularios/FormProjeto";
import VerProjeto from "./VerProjeto";
import ListaProjetos from "./ListaProjetos";
import {
  getProjetoById,
  getProjetosDoUsuario,
  isProjetoLinkedToInscricao,
  updateProjetoById,
} from "@/app/api/client/projeto";
import FormProjetoCreateOrEdit from "../Formularios/FormProjetoCreateOrEdit";

const ProjetoController = ({
  tenant,
  inscricaoSelected,
  idProjeto,
  onProjetoVinculado,
  closeModal,
  inscricao,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalView, setModalView] = useState(idProjeto ? "view" : "list"); // "list" | "view" | "create" | "edit"
  const [selectedProjeto, setSelectedProjeto] = useState(null); // Para o projeto selecionado
  const [meusProjetos, setMeusProjetos] = useState([]);
  const [projetoDetalhes, setProjetoDetalhes] = useState(null); // Detalhes do projeto no modo view
  const [activeTab, setActiveTab] = useState("conteudo");

  const fetchProjetosDoUsuario = async () => {
    try {
      setLoading(true); // Mostra o estado de carregamento
      const response = await getProjetosDoUsuario(
        tenant,
        inscricao.proponenteId
      );

      // Ordena os projetos por ID decrescente
      const projetosOrdenados = response.sort((a, b) => b.id - a.id);

      setMeusProjetos(projetosOrdenados); // Atualiza os projetos no estado
    } catch (error) {
      console.error("Erro ao buscar projetos do usuário:", error);
    } finally {
      setLoading(false); // Remove o estado de carregamento
    }
  };
  useEffect(() => {
    if (idProjeto) {
      fetchProjetoDetalhes(idProjeto); // Busca os detalhes do projeto específico
    } else {
      fetchProjetosDoUsuario(); // Caso não tenha idProjeto, busca a lista de projetos
    }
  }, [idProjeto, tenant]);

  const handleCreateOrEditProjetoSuccess = (projetoAtualizado) => {
    console.log("projetoAtualizado");
    console.log(projetoAtualizado);
    setMeusProjetos((prevProjetos) => {
      const index = prevProjetos.findIndex(
        (p) => p.id === projetoAtualizado.id
      );
      if (index !== -1) {
        // Atualizar projeto existente
        const novosProjetos = [...prevProjetos];
        novosProjetos[index] = projetoAtualizado;
        return novosProjetos.sort((a, b) => b.id - a.id);
      }
      // Adicionar novo projeto
      return [...prevProjetos, projetoAtualizado].sort((a, b) => b.id - a.id);
    });
    // Atualiza o modal para visualização do projeto criado/atualizado
    setSelectedProjeto(projetoAtualizado);
    setProjetoDetalhes(projetoAtualizado);
    setModalView("view");
  };
  useEffect(() => {
    if (
      modalView === "view" &&
      selectedProjeto &&
      (!projetoDetalhes || projetoDetalhes.id !== selectedProjeto.id)
    ) {
      fetchProjetoDetalhes(selectedProjeto.id);
    }
  }, [modalView, selectedProjeto, projetoDetalhes]);

  const fetchProjetoDetalhes = async (projetoId) => {
    if (projetoDetalhes && projetoDetalhes.id === projetoId) return; // Evita chamada redundante
    try {
      setLoading(true);
      const detalhes = await getProjetoById(tenant, projetoId);
      setProjetoDetalhes(detalhes);
      if (!selectedProjeto || selectedProjeto.id !== detalhes.id) {
        setSelectedProjeto(detalhes); // Apenas atualiza se necessário
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do projeto:", error);
      setProjetoDetalhes(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProjeto = async (projetoId, projetoData) => {
    try {
      setLoading(true); // Ativa o estado de carregamento
      const projetoAtualizado = await updateProjetoById(
        tenant,
        projetoId,
        projetoData
      );
      handleCreateOrEditProjetoSuccess(projetoAtualizado); // Atualiza o estado local
      setModalView("view"); // Retorna para a visualização
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      setError("Erro ao atualizar o projeto. Tente novamente mais tarde.");
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };

  // Função para lidar com a edição do projeto
  const handleEditProjeto = async () => {
    try {
      setLoading(true); // Ativa o estado de carregamento
      const isLinked = await isProjetoLinkedToInscricao(
        tenant,
        idProjeto || selectedProjeto.id
      );

      if (isLinked) {
        setError(
          "Este projeto foi adicionado a alguma inscrição, só é possível editá-lo desvinculando-o de todoas as incrições. Caso isso não seja viável, crie um novo projeto."
        );
        return; // Impede a mudança para o modo de edição
      }

      setModalView("edit"); // Muda para o modo de edição se não estiver vinculado
    } catch (error) {
      console.error("Erro ao verificar vínculo do projeto:", error);
      setError(
        "Erro ao verificar vínculo do projeto. Tente novamente mais tarde."
      );
    } finally {
      setLoading(false); // Desativa o estado de carregamento
    }
  };
  return (
    <>
      <h4>Projeto</h4>
      <div className="flex">
        {(modalView === "edit" || (!idProjeto && modalView !== "list")) && (
          <Button
            className={`btn-secondary mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiArrowLeftCircleLine}
            onClick={() => {
              setError();
              if (idProjeto) {
                // Quando idProjeto está presente, volta para visualização
                setModalView("view");
              } else if (modalView === "edit") {
                // No modo "edit", volta para visualização
                setModalView("view");
              } else {
                // Volta para a lista no caso padrão
                setModalView("list");
                setSelectedProjeto(null);
                setProjetoDetalhes(null);
              }
            }}
          >
            {modalView === "edit" ? "Voltar para Visualização" : "Voltar"}
          </Button>
        )}
        {modalView === "view" && selectedProjeto && (
          <Button
            className={`btn-secondary ml-1 mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiEditLine}
            onClick={handleEditProjeto}
          >
            Editar
          </Button>
        )}
      </div>
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
      {modalView === "list" && (
        <>
          <Button
            className={`btn-secondary mt-2 mb-2 ${styles.button}`}
            type="button"
            icon={RiAddCircleLine}
            onClick={() => {
              setModalView("create");
              setError();
            }}
          >
            Novo Projeto
          </Button>
          <ListaProjetos
            projetos={meusProjetos}
            title={"Meus Projetos"}
            setSelectedProjeto={setSelectedProjeto}
            setModalView={setModalView}
          />
        </>
      )}
      {modalView === "view" && projetoDetalhes && (
        <VerProjeto
          projetoDetalhes={projetoDetalhes}
          tenant={tenant}
          inscricaoSelected={inscricaoSelected}
          loading={loading}
          onProjetoVinculado={onProjetoVinculado}
          closeModal={closeModal}
        />
      )}
      {modalView === "create" && (
        <>
          {/** 
          <FormProjeto
            tenantSlug={tenant}
            idInscricao={inscricaoSelected}
            onSuccess={handleCreateOrEditProjetoSuccess}
          />
          */}
          <FormProjetoCreateOrEdit
            initialData={projetoDetalhes}
            tenantSlug={tenant}
            idInscricao={inscricaoSelected}
            onSuccess={handleCreateOrEditProjetoSuccess}
            onUpdateProjeto={(projetoData) =>
              handleUpdateProjeto(selectedProjeto.id, projetoData)
            }
          />
        </>
      )}
      {modalView === "edit" && selectedProjeto && (
        <>
          {/**
           * <FormProjeto
            tenantSlug={tenant}
            idInscricao={inscricaoSelected}
            initialData={projetoDetalhes} // Dados do projeto para edição
            onSuccess={handleCreateOrEditProjetoSuccess} // Atualização do estado após sucesso
            onSubmit={(projetoData) =>
              handleUpdateProjeto(selectedProjeto.id, projetoData)
            }
          />
           */}
          <FormProjetoCreateOrEdit
            initialData={projetoDetalhes}
            tenantSlug={tenant}
            idInscricao={inscricaoSelected}
            onSuccess={handleCreateOrEditProjetoSuccess}
            onUpdateProjeto={(projetoData) =>
              handleUpdateProjeto(selectedProjeto.id, projetoData)
            }
          />
        </>
      )}
    </>
  );
};

export default ProjetoController;

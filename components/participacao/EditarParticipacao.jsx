"use client";
import Button from "@/components/Button";

import {
  RiAddLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiFileExcelLine,
} from "@remixicon/react";
import styles from "./EditarParticipacao.module.scss";
import NoData from "../NoData";
import ParticipacaoForm from "../Formularios/ParticipacaoForm";
import CPFVerificationForm from "../Formularios/CPFVerificationForm";
import { useCallback, useEffect, useState } from "react";
import generateLattesText from "@/lib/generateLattesText";
import FileInput from "../FileInput";
import { deleteParticipacao } from "@/app/api/client/participacao";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import { getFormulario } from "@/app/api/client/formulario";
import Campo from "../Campo";
import { xmlLattes } from "@/app/api/clientReq";

const EditarParticipacao = ({
  participacaoInfo,
  setParticipacaoInfo,
  tenant,
  inscricaoSelected,
  setInscricao,
  closeModalAndResetData,
  handleValidateParticipacao,
  tipoParticipacao,
}) => {
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileInputErrors, setFileInputErrors] = useState({}); // Estado para mensagens de erro por FileInput
  const [deletingId, setDeletingId] = useState(null); // ID da participação sendo deletada
  const [errorMessages, setErrorMessages] = useState({});
  const [editalInfo, setEditalInfo] = useState(null);
  const handleFileUpload = async (file, userId) => {
    if (!file) {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Nenhum arquivo selecionado.",
      }));
      return;
    }

    if (file.type !== "text/xml" && file.type !== "application/zip") {
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: "Por favor, selecione um arquivo XML ou ZIP válido.",
      }));
      return;
    }

    setFileInputErrors((prev) => ({ ...prev, [userId]: "" })); // Limpa erros específicos
    setLoading(true); // Inicia o estado de carregamento

    try {
      const response = await xmlLattes(file, tenant, userId);
      console.log(response);
      if (response && response.fileUrl) {
        // Cria o objeto atualizado da participação com a nova URL do CV Lattes
        const updatedParticipacao = {
          ...participacaoInfo,
          user: {
            ...participacaoInfo.user,
            cvLattes: [
              ...participacaoInfo.user.cvLattes,
              { id: Date.now(), url: response.fileUrl, userId },
            ],
          },
        };

        // Atualiza o estado geral da inscrição
        setInscricao((prevState) => ({
          ...prevState,
          participacoes: prevState.participacoes.map((participacao) =>
            participacao.id === updatedParticipacao.id
              ? { ...participacao, ...updatedParticipacao }
              : participacao
          ),
        }));

        // Atualiza o estado do item no modal
        setParticipacaoInfo((prev) => {
          const updated = { ...prev, ...updatedParticipacao };
          console.log("Updated ParticipacaoInfo:", updated);
          return updated;
        });
        // Chamar a validação após edição bem-sucedida
        try {
          await handleValidateParticipacao(tenant, updatedParticipacao);
        } catch (error) {
          console.error("Erro ao validar participação:", error);
        }
        alert("Arquivo enviado e URL do Lattes atualizada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      const errorMessage =
        error.response?.data?.message || "Erro ao enviar o arquivo.";
      setFileInputErrors((prev) => ({
        ...prev,
        [userId]: errorMessage,
      }));
    } finally {
      setLoading(false); // Finaliza o estado de carregamento
    }
  };

  const handleDeleteParticipacao = async (idParticipacao) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta participação?"
    );
    if (!confirmed) return;

    setDeletingId(idParticipacao); // Ativa o loading para a participação específica
    setErrorMessages((prev) => ({ ...prev, [idParticipacao]: "" })); // Limpa erros anteriores

    try {
      await deleteParticipacao(tenant, idParticipacao);
      // Remove a participação do estado local
      setInscricao((prevState) => ({
        ...prevState,
        participacoes: prevState.participacoes.filter(
          (participacao) => participacao?.id !== idParticipacao
        ),
      }));
    } catch (error) {
      console.error("Erro ao excluir participação:", error);
      // Atualiza a mensagem de erro específica para a participação
      setErrorMessages((prev) => ({
        ...prev,
        [idParticipacao]:
          error.response?.data?.message || "Erro ao excluir participação.",
      }));
    } finally {
      setDeletingId(null); // Desativa o loading
      closeModalAndResetData();
    }
  };
  const handleCreateOrEditSuccess = useCallback(
    async (updatedParticipacao) => {
      // Atualiza o estado de inscrição com base no tipo de participação
      setInscricao((prevState) => {
        return {
          ...prevState,
          participacoes: prevState.participacoes.map((participacao) =>
            participacao.id === updatedParticipacao.id
              ? { ...participacao, ...updatedParticipacao }
              : participacao
          ),
        };
      });

      // Atualiza o estado do item no modal
      setParticipacaoInfo((prev) => ({
        ...prev,
        ...updatedParticipacao,
      }));

      // Chamar a validação após edição bem-sucedida
      try {
        await handleValidateParticipacao(tenant, updatedParticipacao);
      } catch (error) {
        console.error("Erro ao validar participação:", error);
      }
    },
    [setInscricao, tenant]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await getInscricaoUserById(tenant, inscricaoSelected);
        setInscricao(response);
        setEditalInfo(response.edital);
        if (response.edital.formOrientadorId) {
          const responseFormOrientador = await getFormulario(
            tenant,
            response.edital.formOrientadorId
          );
          setCamposFormOrientador(
            responseFormOrientador.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
        if (response.edital.formCoorientadorId) {
          const responseFormCoorientador = await getFormulario(
            tenant,
            response.edital.formCoorientadorId
          );
          setCamposFormCoorientador(
            responseFormCoorientador.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
        if (response.edital.formAlunoId) {
          const responseFormAluno = await getFormulario(
            tenant,
            response.edital.formAlunoId
          );
          setCamposFormAluno(
            responseFormAluno.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenant, participacaoInfo, inscricaoSelected]);
  // Define os campos a serem exibidos com base no tipo de participação
  const getCamposByTipoParticipacao = () => {
    switch (tipoParticipacao) {
      case "orientador":
        return camposFormOrientador;
      case "coorientador":
        return camposFormCoorientador;
      case "aluno":
        return camposFormAluno;
      default:
        return [];
    }
  };

  const campos = getCamposByTipoParticipacao();
  return (
    <div className={styles.orientador}>
      <div className={styles.label}>
        <h6>Nome</h6>
        <p>{participacaoInfo?.user?.nome}</p>
      </div>
      <div className={styles.label}>
        <h6>CPF</h6>
        <p>{participacaoInfo?.user?.cpf}</p>
      </div>
      {tipoParticipacao === "aluno" && (
        <div className={styles.label}>
          <h6>Tipo de participação?</h6>
          <p>
            {participacaoInfo?.solicitarBolsa
              ? "Remunerada (a depender da disponibilidade de bolsas e dos critérios do edital)"
              : "Voluntária"}
          </p>
        </div>
      )}
      <div className={styles.label}>
        <h6>CV Lattes</h6>
        {participacaoInfo?.user?.cvLattes?.length > 0 && (
          <div className={styles.urlCvLattes}>
            <RiExternalLinkLine />
            <a
              href={
                participacaoInfo.user.cvLattes[
                  participacaoInfo.user.cvLattes?.length - 1
                ]?.url
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              {generateLattesText(
                participacaoInfo.user.cvLattes[
                  participacaoInfo.user.cvLattes?.length - 1
                ]?.url
              )}
            </a>
          </div>
        )}
        <div className="mt-2">
          <FileInput
            onFileSelect={(file) =>
              handleFileUpload(file, participacaoInfo.user.id)
            }
            label={
              participacaoInfo?.user?.cvLattes?.length > 0
                ? "Quer atualizar o Lattes?"
                : "Enviar CV Lattes"
            }
            disabled={loading}
            errorMessage={fileInputErrors[participacaoInfo?.user?.id] || ""}
          />
        </div>
      </div>
      {campos.length > 0 && (
        <div className={styles.label}>
          <h6>
            Preencha os campos abaixo para o tipo:{" "}
            {tipoParticipacao.toUpperCase()}
          </h6>
          <div className={`${styles.campos} mt-2`}>
            {campos?.map((campo, index) => (
              <Campo
                perfil="participante"
                readOnly={false}
                key={campo.id}
                schema={campo}
                camposForm={campos}
                respostas={participacaoInfo?.respostas}
                tenantSlug={tenant}
                participacaoId={participacaoInfo?.id}
                onSuccess={handleCreateOrEditSuccess}
                loading={loading}
                setLoading={setLoading}
              />
            ))}
          </div>
        </div>
      )}
      {!loading && (
        <div
          className={styles.delete}
          onClick={() => handleDeleteParticipacao(participacaoInfo.id)}
        >
          <RiDeleteBinLine />
          {deletingId === participacaoInfo.id && <p>Excluindo...</p>}
        </div>
      )}
      <div className={styles.excluirParticipacao}>
        {false && (
          <Button
            className={"btn-secondary"}
            type="button"
            disabled={deletingId === participacaoInfo.id}
            icon={RiDeleteBinLine}
            onClick={() => handleDeleteParticipacao(participacaoInfo.id)}
          >
            {deletingId === participacaoInfo.id
              ? "Excluindo..." // Mostra o loading apenas no item sendo deletado
              : "Excluir participação"}
          </Button>
        )}
        {errorMessages[participacaoInfo.id] && ( // Exibe a mensagem de erro específica se existir
          <div className={`${styles.errorMsg}`}>
            <p>{errorMessages[participacaoInfo.id]}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditarParticipacao;

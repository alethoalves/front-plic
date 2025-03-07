"use client";

import ParticipacaoForm from "../Formularios/ParticipacaoForm";
import CPFVerificationForm from "../Formularios/CPFVerificationForm";
import { useCallback, useEffect, useRef, useState } from "react";
import EditarParticipacao from "./EditarParticipacao";
import styles from "./ParticipacaoGestorController.module.scss";

import {
  deleteParticipacao,
  getParticipacao,
  updateParticipacao,
  validarParticipacao,
} from "@/app/api/client/participacao";
import ParticipacaoFormAluno from "../Formularios/ParticipacaoFormAluno";
import generateLattesText from "@/lib/generateLattesText";
import Campo from "../Campo";
import FileInput from "../FileInput";
import { RiDeleteBinLine, RiExternalLinkLine } from "@remixicon/react";
import Button from "../Button";
import { getFormulario } from "@/app/api/client/formulario";
import { xmlLattes } from "@/app/api/clientReq";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";

const ParticipacaoGestorController = ({
  tenant,
  participacaoId,
  onSuccess,
  onClose,
}) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [camposFormOrientador, setCamposFormOrientador] = useState([]);
  const [camposFormCoorientador, setCamposFormCoorientador] = useState([]);
  const [camposFormAluno, setCamposFormAluno] = useState([]);
  const [fileInputErrors, setFileInputErrors] = useState({}); // Estado para mensagens de erro por FileInput
  const [deletingId, setDeletingId] = useState(null); // ID da participação sendo deletada
  const [errorMessages, setErrorMessages] = useState({});
  const [editalInfo, setEditalInfo] = useState(null);
  const [tipoParticipacao, setTipoParticipacao] = useState(null);
  const toast = useRef(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const item = await getParticipacao(tenant, participacaoId);
        setItem(item);
        setEditalInfo(item.inscricao.edital);
        setTipoParticipacao(item.tipo);
        if (
          item.tipo === "orientador" &&
          item.inscricao.edital.formOrientadorId
        ) {
          const responseFormOrientador = await getFormulario(
            tenant,
            item.inscricao.edital.formOrientadorId
          );
          setCamposFormOrientador(
            responseFormOrientador.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
        if (
          item.tipo === "coorientador" &&
          item.inscricao.edital.formCoorientadorId
        ) {
          const responseFormCoorientador = await getFormulario(
            tenant,
            item.inscricao.edital.formCoorientadorId
          );
          setCamposFormCoorientador(
            responseFormCoorientador.campos.sort((a, b) => a.ordem - b.ordem)
          );
        }
        if (item.tipo === "aluno" && item.inscricao.edital.formAlunoId) {
          const responseFormAluno = await getFormulario(
            tenant,
            item.inscricao.edital.formAlunoId
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
  }, [tenant, participacaoId]);
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
      await handleCreateOrEditSuccess();
      await onSuccess();
      alert("Arquivo enviado e URL do Lattes atualizada com sucesso!");
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
  const handleCreateOrEditSuccess = async () => {
    setLoading(true);
    await onSuccess();
    const item = await getParticipacao(tenant, participacaoId);
    setItem(item);

    setLoading(false);
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
      await onSuccess();
      onClose();
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
    }
  };
  const handleStatusChange = async (e) => {
    const newStatus = e.value;
    try {
      await updateParticipacao(tenant, participacaoId, {
        status: newStatus,
      });
      await handleCreateOrEditSuccess();

      // Exibe uma notificação de sucesso
      toast.current?.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Status da inscrição atualizado com sucesso!",
        life: 3000,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);

      // Exibe uma notificação de erro
      toast.current?.show({
        severity: "error",
        summary: "Erro",
        detail: "Ocorreu um erro ao atualizar o status da inscrição.",
        life: 3000,
      });
    }
  };
  return (
    <>
      {loading && <p>Carregando...</p>}
      {item && (
        <div className={styles.participacao}>
          <div className={styles.toast}>
            <Toast ref={toast} />
          </div>
          <div className={styles.label}>
            <h6>Nome</h6>
            <p>{item?.user?.nome}</p>
          </div>
          <div className={styles.label}>
            <h6>CPF</h6>
            <p>{item?.user?.cpf}</p>
          </div>
          {tipoParticipacao === "aluno" && (
            <div className={styles.label}>
              <h6>Solicitou bolsa?</h6>
              <p>{item?.solicitarBolsa ? "Sim" : "Não"}</p>
            </div>
          )}
          <div className={`${styles.statusField} ${styles.label}`}>
            <p>Status da Participação:</p>
            <Dropdown
              value={item?.status}
              options={[
                { label: "completo", value: "completo" },
                { label: "incompleto", value: "incompleto" },
              ]}
              onChange={handleStatusChange}
              placeholder="Selecione o status"
              className={styles.statusDropdown}
              optionLabel="label"
              optionValue="value"
            />
          </div>
          <div className={styles.label}>
            <h6>CV Lattes</h6>
            {item?.user?.cvLattes?.length > 0 && (
              <div className={styles.urlCvLattes}>
                <RiExternalLinkLine />
                <a
                  href={item.user.cvLattes[item.user.cvLattes?.length - 1]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {generateLattesText(
                    item.user.cvLattes[item.user.cvLattes?.length - 1]?.url
                  )}
                </a>
              </div>
            )}
            <div className="mt-2">
              <FileInput
                onFileSelect={(file) => handleFileUpload(file, item.user.id)}
                label={
                  item?.user?.cvLattes?.length > 0
                    ? "Quer atualizar o Lattes?"
                    : "Enviar CV Lattes"
                }
                disabled={loading}
                errorMessage={fileInputErrors[item?.user?.id] || ""}
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
                    respostas={item?.respostas}
                    tenantSlug={tenant}
                    participacaoId={item?.id}
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
              onClick={() => handleDeleteParticipacao(item.id)}
            >
              <RiDeleteBinLine />
              {deletingId === item.id && <p>Excluindo...</p>}
            </div>
          )}
          <div className={styles.excluirParticipacao}>
            {false && (
              <Button
                className={"btn-secondary"}
                type="button"
                disabled={deletingId === item.id}
                icon={RiDeleteBinLine}
                onClick={() => handleDeleteParticipacao(item.id)}
              >
                {deletingId === item.id
                  ? "Excluindo..." // Mostra o loading apenas no item sendo deletado
                  : "Excluir participação"}
              </Button>
            )}
            {errorMessages[item.id] && ( // Exibe a mensagem de erro específica se existir
              <div className={`${styles.errorMsg}`}>
                <p>{errorMessages[item.id]}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ParticipacaoGestorController;

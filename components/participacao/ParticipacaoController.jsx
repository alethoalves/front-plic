"use client";

import ParticipacaoForm from "../Formularios/ParticipacaoForm";
import CPFVerificationForm from "../Formularios/CPFVerificationForm";
import { useCallback, useState } from "react";
import EditarParticipacao from "./EditarParticipacao";
import { validarParticipacao } from "@/app/api/client/participacao";
import ParticipacaoFormAluno from "../Formularios/ParticipacaoFormAluno";
import { getInscricaoUserById } from "@/app/api/client/inscricao";

const ParticipacaoController = ({
  itemToEdit,
  tenant,
  inscricaoSelected,
  setInscricao,
  options,
  closeModalAndResetData,
  tipoParticipacao,
  planoDeTrabalhoDetalhes,
}) => {
  const [participacaoInfo, setParticipacaoInfo] = useState(itemToEdit || null); // Inicializa com itemToEdit
  const [verifiedData, setVerifiedData] = useState(null);

  const handleCreateOrEditSuccess = useCallback(
    async (newParticipacao) => {
      setParticipacaoInfo(newParticipacao);
      setInscricao((prevState) => ({
        ...prevState,
        participacoes: [...prevState.participacoes, newParticipacao],
      }));
      // Chamar a função para validar a participação
      await handleValidateParticipacao(tenant, newParticipacao);
    },
    [setInscricao]
  );
  const handleValidateParticipacao = async (tenantSlug, newParticipacao) => {
    try {
      const validatedParticipacao = await validarParticipacao(
        tenantSlug,
        newParticipacao?.id
      );
      if (validatedParticipacao) {
        console.log(
          "Participação validada com sucesso:",
          validatedParticipacao
        );
        const response = await getInscricaoUserById(tenant, inscricaoSelected);
        setInscricao(response);
      } else {
        console.warn("Validação da participação não foi concluída.");
      }
    } catch (error) {
      console.error("Erro ao validar a participação:", error);
    }
  };

  return (
    <>
      {participacaoInfo && (
        <>
          <h4>Detalhes da participação</h4>
          <div className="mt-2">
            <p>Verifique se todos os campos estão preenchidos!</p>
          </div>
          <EditarParticipacao
            participacaoInfo={participacaoInfo}
            tenant={tenant}
            inscricaoSelected={inscricaoSelected}
            setInscricao={setInscricao}
            closeModalAndResetData={closeModalAndResetData}
            handleValidateParticipacao={handleValidateParticipacao}
            setParticipacaoInfo={setParticipacaoInfo}
            tipoParticipacao={tipoParticipacao}
          />
        </>
      )}
      {!participacaoInfo && (
        <>
          <h4>{itemToEdit ? "Editar participação" : "Nova participação"}</h4>
          <p>
            {itemToEdit
              ? "Edite os dados abaixo."
              : "Preencha os dados abaixo para adicionar uma nova participação."}
          </p>
          <CPFVerificationForm
            tenantSlug={tenant}
            onCpfVerified={(data) => {
              setParticipacaoInfo(null);
              setVerifiedData(data); // Atualiza corretamente verifiedData
            }}
          />
        </>
      )}
      {!participacaoInfo && verifiedData?.cpf && (
        <ParticipacaoForm
          tenantSlug={tenant}
          inscricaoId={inscricaoSelected}
          initialData={
            {
              ...verifiedData,
              planoDeTrabalhoId: planoDeTrabalhoDetalhes?.id,
            } || {}
          }
          onClose={() => {}}
          onSuccess={handleCreateOrEditSuccess}
          showLabelInicio={false}
          tipoParticipacao={tipoParticipacao}
        />
      )}
    </>
  );
};

export default ParticipacaoController;

"use client";

import ParticipacaoForm from "../Formularios/ParticipacaoForm";
import CPFVerificationForm from "../Formularios/CPFVerificationForm";
import { useCallback, useState } from "react";
import EditarParticipacao from "./EditarParticipacao";
import { validarParticipacao } from "@/app/api/client/participacao";
import ParticipacaoFormAluno from "../Formularios/ParticipacaoFormAluno";
import { getInscricaoUserById } from "@/app/api/client/inscricao";
import styles from "./ParticipacaoController.module.scss";
import {
  RiUserLine,
  RiUserStarLine,
  RiUserSharedLine,
  RiGraduationCapLine,
} from "@remixicon/react";
const ParticipacaoController = ({
  itemToEdit,
  tenant,
  inscricaoSelected,
  setInscricao,
  options,
  closeModalAndResetData,
  tipoParticipacao,
  planoDeTrabalhoDetalhes,
  atingiuLimiteBolsa,
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
    [setInscricao],
  );
  const handleValidateParticipacao = async (tenantSlug, newParticipacao) => {
    try {
      const validatedParticipacao = await validarParticipacao(
        tenantSlug,
        newParticipacao?.id,
      );
      if (validatedParticipacao) {
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
          <div className={styles.participacaoInfo} data-tipo={tipoParticipacao}>
            <div className={styles.icon}>
              <RiUserLine />
            </div>

            <div className={styles.content}>
              <h4>{participacaoInfo?.user?.nome}</h4>

              <p className={styles.cpf}>
                CPF:{" "}
                {participacaoInfo?.user?.cpf?.replace(
                  /(\d{3})(\d{3})(\d{3})(\d{2})/,
                  "$1.$2.$3-$4",
                )}
              </p>

              <div className={styles.tipoBadge}>
                {tipoParticipacao === "orientador" && <RiUserStarLine />}
                {tipoParticipacao === "coorientador" && <RiUserSharedLine />}
                {tipoParticipacao === "aluno" && <RiGraduationCapLine />}
                <span>
                  {tipoParticipacao === "orientador" && "Orientador"}
                  {tipoParticipacao === "coorientador" && "Coorientador"}
                  {tipoParticipacao === "aluno" && "Aluno"}
                </span>
              </div>
            </div>
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
          atingiuLimiteBolsa={atingiuLimiteBolsa}
        />
      )}
    </>
  );
};

export default ParticipacaoController;

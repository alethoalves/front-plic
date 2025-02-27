"use client";

import { useCallback, useEffect, useState } from "react";
import FormPlanoDeTrabalhoCreateOrEdit from "../Formularios/FormPlanoDeTrabalhoCreateOrEdit";
import VerPlanoDeTrabalho from "./VerPlanoDeTrabalho";
import Button from "../Button";
import { RiArrowLeftLine, RiEditLine } from "@remixicon/react";

const PlanoDeTrabalhoController = ({
  tenantSlug,
  idInscricao,
  idProjeto,
  planoDeTrabalhoDetalhes,
  onClose,
  onUpdatePlanoDeTrabalho,
  editalFormularioId,
}) => {
  const [currentPlanoDeTrabalho, setCurrentPlanoDeTrabalho] = useState(
    planoDeTrabalhoDetalhes
  );
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    // Sincroniza o estado local com os dados atualizados
    setCurrentPlanoDeTrabalho(planoDeTrabalhoDetalhes);
  }, [planoDeTrabalhoDetalhes]);

  return (
    <>
      <h4>Plano de Trabalho</h4>
      {currentPlanoDeTrabalho && (
        <Button
          className={`btn-secondary mt-2 mb-2`}
          type="button"
          icon={edit ? RiArrowLeftLine : RiEditLine}
          onClick={() => setEdit(!edit)}
        >
          {edit ? "Voltar" : "Editar"}
        </Button>
      )}

      {(!currentPlanoDeTrabalho || edit) && (
        <FormPlanoDeTrabalhoCreateOrEdit
          initialData={currentPlanoDeTrabalho}
          tenantSlug={tenantSlug}
          idInscricao={idInscricao}
          idProjeto={idProjeto}
          onClose={onClose}
          onUpdatePlanoDeTrabalho={(updatedPlano) => {
            setCurrentPlanoDeTrabalho(updatedPlano); // Atualiza o estado local
            onUpdatePlanoDeTrabalho(updatedPlano); // Atualiza no Fluxo
          }}
          idFormularioEdital={editalFormularioId}
        />
      )}
      {currentPlanoDeTrabalho && !edit && (
        <VerPlanoDeTrabalho planoDeTrabalhoDetalhes={currentPlanoDeTrabalho} />
      )}
    </>
  );
};

export default PlanoDeTrabalhoController;

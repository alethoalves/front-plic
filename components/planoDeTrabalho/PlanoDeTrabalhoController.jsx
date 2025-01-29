"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./PlanoDeTrabalhoController.module.scss";
import FormPlanoDeTrabalho from "../Formularios/FormPlanoDeTrabalho";
import FormPlanoDeTrabalhoV2 from "../Formularios/FormPlanoDeTrabalhoV2";
import VerPlanoDeTrabalho from "./VerPlanoDeTrabalho";
import Button from "../Button";
import { RiEditLine } from "@remixicon/react";

const PlanoDeTrabalhoController = ({
  tenantSlug,
  idInscricao,
  idProjeto,
  planoDeTrabalhoDetalhes,
  onClose,
  onUpdatePlanoDeTrabalho,
}) => {
  const [currentPlanoDeTrabalho, setCurrentPlanoDeTrabalho] = useState(
    planoDeTrabalhoDetalhes
  );

  useEffect(() => {
    // Sincroniza o estado local com os dados atualizados
    setCurrentPlanoDeTrabalho(planoDeTrabalhoDetalhes);
  }, [planoDeTrabalhoDetalhes]);

  const [edit, setEdit] = useState(false);

  return (
    <>
      <h4>Plano de Trabalho</h4>
      {currentPlanoDeTrabalho && (
        <Button
          className={`btn-secondary mt-2 mb-2`}
          type="button"
          icon={RiEditLine}
          onClick={() => setEdit(!edit)}
        >
          Editar
        </Button>
      )}
      {(!currentPlanoDeTrabalho || edit) && (
        <FormPlanoDeTrabalhoV2
          initialData={currentPlanoDeTrabalho}
          tenantSlug={tenantSlug}
          idInscricao={idInscricao}
          idProjeto={idProjeto}
          onClose={onClose}
          onUpdatePlanoDeTrabalho={(updatedPlano) => {
            setCurrentPlanoDeTrabalho(updatedPlano); // Atualiza o estado local
            onUpdatePlanoDeTrabalho(updatedPlano); // Atualiza no Fluxo
          }}
        />
      )}
      {currentPlanoDeTrabalho && !edit && (
        <VerPlanoDeTrabalho planoDeTrabalhoDetalhes={currentPlanoDeTrabalho} />
      )}
    </>
  );
};

export default PlanoDeTrabalhoController;

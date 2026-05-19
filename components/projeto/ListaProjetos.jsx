"use client";
import Button from "@/components/Button";

import {
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiLoaderLine,
} from "@remixicon/react";
import styles from "./ListaProjetos.module.scss";
import NoData from "../NoData";

const ListaProjetos = ({
  projetos,
  title,
  setSelectedProjeto,
  setModalView,
  onDeleteProjeto,
  deletingId,
}) => {
  return (
    <>
      <h6>{title}</h6>
      <div className={styles.projetos}>
        {projetos.length > 0 ? (
          projetos.map((projeto) => (
            <div
              key={projeto.id}
              onClick={() => {
                if (deletingId === projeto.id) return;
                setSelectedProjeto(projeto);
                setModalView("view");
              }}
              className={styles.projeto}
            >
              <h6>
                {projeto.id} - {projeto.titulo}
              </h6>
              <div className={styles.actions}>
                {onDeleteProjeto && !projeto.inscricaoProjeto?.length && (
                  <div
                    className={`${styles.action} ${deletingId === projeto.id ? styles.deleting : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (deletingId) return;
                      onDeleteProjeto(projeto);
                    }}
                    title="Excluir projeto"
                  >
                    {deletingId === projeto.id ? <RiLoaderLine className={styles.spinner} /> : <RiDeleteBinLine />}
                  </div>
                )}
                <div className={styles.action}>
                  <RiArrowRightSLine />
                </div>
              </div>
            </div>
          ))
        ) : (
          <NoData description="Não encontramos projetos. Crie um novo!" />
        )}
      </div>
    </>
  );
};

export default ListaProjetos;
